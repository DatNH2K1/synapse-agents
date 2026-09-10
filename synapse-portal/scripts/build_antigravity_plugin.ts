import * as fs from "fs";
import * as path from "path";
import { generateManifests } from "./generate_manifests";

function linkPlugin(buildDir: string) {
  const home = process.env.HOME || process.env.USERPROFILE || "";
  if (!home) {
    console.error("Error: Could not determine user home directory.");
    return;
  }

  const globalPluginsDir = path.join(home, ".gemini", "config", "plugins");
  const destLink = path.join(globalPluginsDir, "synapse-plugin");

  console.log(
    `Linking built plugin to Antigravity global plugins at: ${destLink}`,
  );

  // Ensure parent directory exists
  if (!fs.existsSync(globalPluginsDir)) {
    fs.mkdirSync(globalPluginsDir, { recursive: true });
  }

  // Clean up existing link or folder
  if (fs.existsSync(destLink) || isSymlink(destLink)) {
    console.log(`Removing existing link/directory at ${destLink}`);
    try {
      const stats = fs.lstatSync(destLink);
      if (stats.isSymbolicLink()) {
        fs.unlinkSync(destLink);
      } else if (stats.isDirectory()) {
        fs.rmSync(destLink, { recursive: true, force: true });
      } else {
        fs.unlinkSync(destLink);
      }
    } catch {
      fs.rmSync(destLink, { recursive: true, force: true });
    }
  }

  // Copy build folder directly as a real folder instead of creating a symlink
  try {
    fs.cpSync(buildDir, destLink, { recursive: true });
    console.log(`Successfully copied build folder to ${destLink}`);
  } catch (e) {
    console.error(`Error copying plugin to destination:`, e);
    return;
  }

  // Generate global config/AGENTS.md
  try {
    const destAgentsMd = path.join(home, ".gemini", "config", "AGENTS.md");
    // Ensure target directory exists
    const destDir = path.dirname(destAgentsMd);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    const targetPluginAgentsMd = path
      .join(destLink, "AGENTS.md")
      .replace(/\\/g, "/");
    const agentsMdContent = `# AGENTS

## Rules
- MANDATORY: In the first turn of any conversation or session, you must view/read \`${targetPluginAgentsMd}\` and check the rules listed there (e.g. under \`synapse-plugin/rules/\`) to ensure you always follow the latest rules and formatting requirements dynamically.
`;

    fs.writeFileSync(destAgentsMd, agentsMdContent, "utf-8");
    console.log(
      `Successfully created global config/AGENTS.md with absolute path at: ${destAgentsMd}`,
    );
  } catch (e) {
    console.error(`Error generating global config/AGENTS.md:`, e);
  }

  // Update global mcp_config.json files
  try {
    const globalMcpConfigPaths = [
      path.join(home, ".gemini", "config", "mcp_config.json"),
      path.join(home, ".gemini", "antigravity", "mcp_config.json"),
      path.join(home, ".gemini", "antigravity-ide", "mcp_config.json"),
    ];

    interface McpServerDef {
      command?: string;
      args?: string[];
      env?: Record<string, string>;
      serverUrl?: string;
      [key: string]: unknown;
    }
    interface McpConfig {
      mcpServers: Record<string, McpServerDef>;
    }

    // Read the built mcp_config.json to extract synapse-portal and StitchMCP config
    const localMcpConfigPath = path.join(buildDir, "mcp_config.json");
    if (fs.existsSync(localMcpConfigPath)) {
      const localConfig = JSON.parse(
        fs.readFileSync(localMcpConfigPath, "utf-8"),
      );
      if (localConfig.mcpServers) {
        for (const globalMcpConfigPath of globalMcpConfigPaths) {
          const configDir = path.dirname(globalMcpConfigPath);
          if (!fs.existsSync(configDir)) {
            continue;
          }
          let globalConfig: McpConfig = { mcpServers: {} };
          if (fs.existsSync(globalMcpConfigPath)) {
            try {
              globalConfig = JSON.parse(
                fs.readFileSync(globalMcpConfigPath, "utf-8"),
              ) as McpConfig;
              if (!globalConfig.mcpServers) {
                globalConfig.mcpServers = {};
              }
            } catch (_err) {
              console.warn(
                `Warning: Could not parse existing config at ${globalMcpConfigPath}. Re-creating...`,
              );
            }
          }

          for (const serverName of Object.keys(localConfig.mcpServers)) {
            globalConfig.mcpServers[serverName] =
              localConfig.mcpServers[serverName];
          }

          fs.writeFileSync(
            globalMcpConfigPath,
            JSON.stringify(globalConfig, null, 2),
            "utf-8",
          );
          console.log(
            `Successfully merged MCP servers into global config at: ${globalMcpConfigPath}`,
          );
        }
      }
    }

    // Clean up local mcp_config.json from both build and linked directories to prevent relative-path loading errors
    const buildMcpConfig = path.join(buildDir, "mcp_config.json");
    if (fs.existsSync(buildMcpConfig)) {
      fs.unlinkSync(buildMcpConfig);
    }
    const destMcpConfig = path.join(destLink, "mcp_config.json");
    if (fs.existsSync(destMcpConfig)) {
      fs.unlinkSync(destMcpConfig);
    }
    console.log(
      `Cleaned up plugin-level mcp_config.json from build and destination directories.`,
    );
  } catch (err) {
    console.error(`Error updating global mcp_config.json:`, err);
  }
}

function isSymlink(filePath: string): boolean {
  try {
    return fs.lstatSync(filePath).isSymbolicLink();
  } catch {
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);
  const shouldLink = args.includes("--link");

  const currentDir = __dirname;
  const workspaceRoot = path.resolve(currentDir, "..", "..");

  const srcPluginDir = path.join(workspaceRoot, "synapse-plugin");
  const srcAgentsDir = path.join(srcPluginDir, ".agents");
  let envPath = path.join(workspaceRoot, ".env");
  if (!fs.existsSync(envPath)) {
    const fallbackPath = path.join(workspaceRoot, "synapse-portal", ".env");
    if (fs.existsSync(fallbackPath)) {
      envPath = fallbackPath;
    }
  }

  const buildDir = path.join(workspaceRoot, "build", "antigravity");

  console.log(`Building plugin from ${srcPluginDir} to ${buildDir}...`);

  // 1. Clean build directory
  if (fs.existsSync(buildDir)) {
    console.log(`Cleaning existing build directory: ${buildDir}`);
    fs.rmSync(buildDir, { recursive: true, force: true });
  }
  fs.mkdirSync(buildDir, { recursive: true });

  // 2. Generate detailed plugin.json
  const pluginManifestPath = path.join(buildDir, "plugin.json");
  const pluginManifest = {
    name: "synapse-plugin",
    version: "1.0.0",
    description:
      "Agent skills, rules, and Model Context Protocol (MCP) integrations for the Synapse Knowledge Portal.",
    autoLoad: true,
    author: {
      name: "Synapse Team",
    },
    license: "MIT",
    keywords: [
      "synapse",
      "agents",
      "mcp",
      "stitch",
      "design-system",
      "knowledge-portal",
      "skills",
      "rules",
    ],
  };
  fs.writeFileSync(
    pluginManifestPath,
    JSON.stringify(pluginManifest, null, 2),
    "utf-8",
  );
  console.log(`Created detailed ${pluginManifestPath}`);

  // 3. MCP server is natively integrated into synapse-portal (TypeScript)
  console.log(`Configuring native TypeScript MCP Server from synapse-portal...`);

  // 4. Parse .env to extract keys for MCP
  const envVars: { [key: string]: string } = {};
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (let line of envContent.split("\n")) {
      line = line.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }
      if (line.includes("=")) {
        const index = line.indexOf("=");
        const key = line.substring(0, index).trim();
        let val = line.substring(index + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.substring(1, val.length - 1);
        }
        envVars[key] = val;
      }
    }
  }

  const stitchKey = envVars["STITCH_API_KEY"] || "";

  const mcpConfigPath = path.join(buildDir, "mcp_config.json");

  let portalHost = envVars["SYNAPSE_PORTAL_HOST"];
  if (!portalHost) {
    const port = envVars["SYNAPSE_PORTAL_PORT"] || "3100";
    portalHost = `http://localhost:${port}`;
  }
  const portalServerUrl = `${portalHost.replace(/\/+$/, "")}/api/mcp/sse`;

  const mcpServers: Record<string, Record<string, unknown>> = {
    "synapse-portal": {
      serverUrl: portalServerUrl,
    },
  };

  if (stitchKey) {
    mcpServers["StitchMCP"] = {
      command: "npx",
      args: [
        "-y",
        "mcp-remote",
        "https://stitch.googleapis.com/mcp",
        "--header",
        `X-Goog-Api-Key: ${stitchKey}`,
      ],
    };
  }

  const mcpConfig = { mcpServers };
  fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2), "utf-8");
  console.log(
    `Generated ${mcpConfigPath} with configured servers: ${Object.keys(mcpServers)}`,
  );

  // 6. Copy rules
  const srcRules = path.join(srcAgentsDir, "rules");
  const destRules = path.join(buildDir, "rules");
  if (fs.existsSync(srcRules)) {
    fs.cpSync(srcRules, destRules, { recursive: true });
    console.log(`Copied rules to ${destRules}`);

    // Generate AGENTS.md as a master index of all individual rule files
    const srcRulesMdPath = path.join(srcAgentsDir, "AGENTS.md");
    const buildRulesMdPath = path.join(buildDir, "AGENTS.md");

    // Clean up legacy rules.md files if they exist
    const legacyRulesMd = path.join(srcPluginDir, "rules.md");
    const legacyAgentsRulesMd = path.join(srcAgentsDir, "rules.md");
    if (fs.existsSync(legacyRulesMd)) {
      fs.unlinkSync(legacyRulesMd);
    }
    if (fs.existsSync(legacyAgentsRulesMd)) {
      fs.unlinkSync(legacyAgentsRulesMd);
    }

    // Copy AGENTS.md from source to build folder if it exists
    if (fs.existsSync(srcRulesMdPath)) {
      fs.copyFileSync(srcRulesMdPath, buildRulesMdPath);
      console.log(`Copied static AGENTS.md to ${buildRulesMdPath}`);
    } else {
      console.warn(`Warning: Static AGENTS.md not found at ${srcRulesMdPath}`);
    }
  }

  // 7. Copy skills (both from .agents/skills and .agents/agents since agent personas are skills with SKILL.md)
  const destSkills = path.join(buildDir, "skills");
  fs.mkdirSync(destSkills, { recursive: true });

  // Copy from .agents/skills
  const srcSkills = path.join(srcAgentsDir, "skills");
  if (fs.existsSync(srcSkills)) {
    for (const skillName of fs.readdirSync(srcSkills)) {
      const srcSkillDir = path.join(srcSkills, skillName);
      if (fs.statSync(srcSkillDir).isDirectory()) {
        const destSkillDir = path.join(destSkills, skillName);
        fs.cpSync(srcSkillDir, destSkillDir, { recursive: true });
      }
    }
  }

  // Copy from .agents/agents
  const srcAgentsSkills = path.join(srcAgentsDir, "agents");
  if (fs.existsSync(srcAgentsSkills)) {
    for (const agentName of fs.readdirSync(srcAgentsSkills)) {
      const srcAgentDir = path.join(srcAgentsSkills, agentName);
      if (fs.statSync(srcAgentDir).isDirectory()) {
        const destAgentDir = path.join(destSkills, agentName);
        if (fs.existsSync(destAgentDir)) {
          fs.rmSync(destAgentDir, { recursive: true, force: true });
        }
        fs.cpSync(srcAgentDir, destAgentDir, { recursive: true });
      }
    }
  }

  // 8. Copy config.toml directly to the root of the build directory
  const srcConfigToml = path.join(srcAgentsDir, "config.toml");
  if (fs.existsSync(srcConfigToml)) {
    fs.copyFileSync(srcConfigToml, path.join(buildDir, "config.toml"));
    console.log("Copied config.toml to build/config.toml");
  }

  // 9. Copy optional hooks.json if it exists
  const srcHooks = path.join(srcAgentsDir, "hooks.json");
  if (fs.existsSync(srcHooks)) {
    fs.copyFileSync(srcHooks, path.join(buildDir, "hooks.json"));
    console.log("Copied hooks.json to build directory");
  }

  console.log(`Copied all skills and agent personas to ${destSkills}`);

  // 9.5. Generate portal manifests (agent-manifest.csv, skill-manifest.csv, tool-manifest.csv)
  try {
    console.log("Generating portal manifests...");
    generateManifests();

    // Copy generated manifests to build directory for relative links inside rules/skills to resolve
    const srcManifests = path.join(
      workspaceRoot,
      "synapse-portal",
      "manifests",
    );
    const destManifests = path.join(buildDir, "manifests");
    if (fs.existsSync(srcManifests)) {
      fs.cpSync(srcManifests, destManifests, { recursive: true });
      console.log(`Copied manifests to ${destManifests}`);
    }
  } catch (e) {
    console.error("Error generating portal manifests:", e);
  }

  console.log("Build completed successfully!");

  // 10. Link to Antigravity global plugins folder if requested
  if (shouldLink) {
    linkPlugin(buildDir);
  }
}

main();
