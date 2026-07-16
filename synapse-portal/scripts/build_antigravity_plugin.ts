import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

function linkPlugin(buildDir: string) {
    const home = process.env.HOME || process.env.USERPROFILE || '';
    if (!home) {
        console.error("Error: Could not determine user home directory.");
        return;
    }
    const globalPluginsDir = path.join(home, '.gemini', 'config', 'plugins');
    const destLink = path.join(globalPluginsDir, 'synapse-plugin');

    console.log(`Linking built plugin to Antigravity global plugins at: ${destLink}`);

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

    // Create symlink or copy as fallback
    try {
        if (process.platform === 'win32') {
            try {
                fs.symlinkSync(buildDir, destLink, 'junction');
                console.log(`Successfully created directory junction on Windows to ${destLink}`);
            } catch {
                console.warn(`Windows junction creation failed. Copying build folder as fallback...`);
                fs.cpSync(buildDir, destLink, { recursive: true });
                console.log(`Successfully copied build to ${destLink}`);
            }
        } else {
            fs.symlinkSync(buildDir, destLink);
            console.log(`Successfully created symlink to ${destLink}`);
        }
    } catch (e) {
        console.error(`Error linking plugin:`, e);
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
    const shouldLink = args.includes('--link');

    const currentDir = __dirname;
    const workspaceRoot = path.resolve(currentDir, '..', '..');

    const srcPluginDir = path.join(workspaceRoot, 'synapse-plugin');
    const srcAgentsDir = path.join(srcPluginDir, '.agents');
    const srcMcpDir = path.join(workspaceRoot, 'synapse-mcp');
    const envPath = path.join(workspaceRoot, '.env');

    const buildDir = path.join(workspaceRoot, 'build', 'antigravity');

    console.log(`Building plugin from ${srcPluginDir} to ${buildDir}...`);

    // 1. Clean build directory
    if (fs.existsSync(buildDir)) {
        console.log(`Cleaning existing build directory: ${buildDir}`);
        fs.rmSync(buildDir, { recursive: true, force: true });
    }
    fs.mkdirSync(buildDir, { recursive: true });

    // 2. Generate detailed plugin.json
    const pluginManifestPath = path.join(buildDir, 'plugin.json');
    const pluginManifest = {
        name: "synapse-plugin",
        version: "1.0.0",
        description: "Agent skills, rules, and Model Context Protocol (MCP) integrations for the Synapse Knowledge Portal.",
        author: {
            name: "Synapse Team"
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
            "rules"
        ]
    };
    fs.writeFileSync(pluginManifestPath, JSON.stringify(pluginManifest, null, 2), 'utf-8');
    console.log(`Created detailed ${pluginManifestPath}`);

    // 3. Copy synapse-mcp folder (excluding idea, pycache)
    const destMcpDir = path.join(buildDir, 'synapse-mcp');
    if (fs.existsSync(srcMcpDir)) {
        const srcVenv = path.join(srcMcpDir, '.venv');
        if (!fs.existsSync(srcVenv)) {
            console.log(`Virtual environment not found at ${srcVenv}. Creating it...`);
            try {
                let pythonCmd = 'python3';
                try {
                    const versionOutput = execSync('python3 --version', { encoding: 'utf-8' });
                    const match = versionOutput.match(/Python (\d+)\.(\d+)/);
                    if (match && (parseInt(match[1]) < 3 || (parseInt(match[1]) === 3 && parseInt(match[2]) < 10))) {
                        for (const ver of ['3.12', '3.11', '3.10']) {
                            try {
                                execSync(`python${ver} --version`, { stdio: 'ignore' });
                                pythonCmd = `python${ver}`;
                                break;
                            } catch {}
                        }
                    }
                } catch {}
                console.log(`Using ${pythonCmd} to create virtual environment...`);
                execSync(`${pythonCmd} -m venv .venv`, { stdio: 'inherit', cwd: srcMcpDir });
                const pipPath = process.platform === 'win32'
                    ? path.join(srcVenv, 'Scripts', 'pip.exe')
                    : path.join(srcVenv, 'bin', 'pip');
                console.log(`Installing dependencies from requirements.txt...`);
                execSync(`"${pipPath}" install -r requirements.txt`, { stdio: 'inherit', cwd: srcMcpDir });
            } catch (error) {
                console.error("Failed to automatically initialize virtual environment:", error);
            }
        }
        console.log(`Copying MCP server from ${srcMcpDir} to ${destMcpDir}...`);
        fs.cpSync(srcMcpDir, destMcpDir, {
            recursive: true,
            filter: (src) => {
                const basename = path.basename(src);
                return ![
                    '.idea',
                    '__pycache__',
                    '.gitignore',
                    '.pyc'
                ].includes(basename) && !basename.endsWith('.pyc');
            }
        });
    }

    // 4. Parse .env to extract keys for MCP
    const envVars: { [key: string]: string } = {};
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        for (let line of envContent.split('\n')) {
            line = line.trim();
            if (!line || line.startsWith('#')) {
                continue;
            }
            if (line.includes('=')) {
                const index = line.indexOf('=');
                const key = line.substring(0, index).trim();
                let val = line.substring(index + 1).trim();
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.substring(1, val.length - 1);
                }
                envVars[key] = val;
            }
        }
    }

    const portalHost = envVars['SYNAPSE_PORTAL_HOST'] || 'http://localhost:3100';
    const context7Key = envVars['CONTEXT7_API_KEY'] || '';
    const stitchKey = envVars['STITCH_API_KEY'] || '';

    const pythonExe = process.platform === 'win32'
        ? 'synapse-mcp/.venv/Scripts/python.exe'
        : 'synapse-mcp/.venv/bin/python';
    const serverScript = 'synapse-mcp/synapse_mcp_server.py';

    // 5. Generate mcp_config.json pointing to the copied synapse-mcp and configuring StitchMCP
    const mcpConfigPath = path.join(buildDir, 'mcp_config.json');
    const mcpServers: Record<string, Record<string, unknown>> = {
        "synapse-portal": {
            "command": pythonExe,
            "args": [
                serverScript
            ],
            "env": {
                "SYNAPSE_PORTAL_HOST": portalHost
            }
        }
    };

    if (context7Key) {
        const portalEnv = mcpServers["synapse-portal"]["env"] as Record<string, string>;
        portalEnv["CONTEXT7_API_KEY"] = context7Key;
    }

    if (stitchKey) {
        mcpServers["StitchMCP"] = {
            "command": "npx",
            "args": [
                "-y",
                "mcp-remote",
                "https://stitch.googleapis.com/mcp",
                "--header",
                `X-Goog-Api-Key: ${stitchKey}`
            ]
        };
    }

    const mcpConfig = { mcpServers };
    fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2), 'utf-8');
    console.log(`Generated ${mcpConfigPath} with configured servers: ${Object.keys(mcpServers)}`);

    // 6. Copy rules
    const srcRules = path.join(srcAgentsDir, 'rules');
    const destRules = path.join(buildDir, 'rules');
    if (fs.existsSync(srcRules)) {
        fs.cpSync(srcRules, destRules, { recursive: true });
        console.log(`Copied rules to ${destRules}`);
    }

    // 7. Copy skills (both from .agents/skills and .agents/agents since agent personas are skills with SKILL.md)
    const destSkills = path.join(buildDir, 'skills');
    fs.mkdirSync(destSkills, { recursive: true });

    // Copy from .agents/skills
    const srcSkills = path.join(srcAgentsDir, 'skills');
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
    const srcAgentsSkills = path.join(srcAgentsDir, 'agents');
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
    const srcConfigToml = path.join(srcAgentsDir, 'config.toml');
    if (fs.existsSync(srcConfigToml)) {
        fs.copyFileSync(srcConfigToml, path.join(buildDir, 'config.toml'));
        console.log("Copied config.toml to build/config.toml");
    }

    // 9. Copy optional hooks.json if it exists
    const srcHooks = path.join(srcAgentsDir, 'hooks.json');
    if (fs.existsSync(srcHooks)) {
        fs.copyFileSync(srcHooks, path.join(buildDir, 'hooks.json'));
        console.log("Copied hooks.json to build directory");
    }

    console.log(`Copied all skills and agent personas to ${destSkills}`);

    // 9.5. Generate portal manifests (agent-manifest.csv, skill-manifest.csv, tool-manifest.csv)
    try {
        console.log("Generating portal manifests...");
        execSync(`npx tsx "${path.join(workspaceRoot, 'synapse-portal', 'scripts', 'generate_manifests.ts')}"`, {
            stdio: 'inherit',
            cwd: workspaceRoot
        });

        // Copy generated manifests to build directory for relative links inside rules/skills to resolve
        const srcManifests = path.join(workspaceRoot, 'synapse-portal', 'manifests');
        const destManifests = path.join(buildDir, 'manifests');
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
