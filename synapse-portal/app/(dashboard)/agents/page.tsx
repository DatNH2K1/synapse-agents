import fs from "fs";
import path from "path";
import { manifestService } from "@/lib/services/manifest-service";
import AgentsPageContent from "./page_content";

export const dynamic = "force-dynamic";

interface Agent {
  name: string;
  displayName: string;
  title: string;
  icon: string;
  capabilities: string;
  role: string;
  identity?: string;
  communicationStyle?: string;
  principles?: string;
  module?: string;
  path?: string;
  complianceChecklist?: string[];
  capabilitiesList?: { code: string; description: string; skill: string }[];
  principlesList?: string[];
  protocols?: {
    contextLoad?: string;
    gatekeeper?: string;
  };
}

interface Skill {
  canonicalId: string;
  name: string;
  description: string;
  module: string;
  path: string;
}

interface Tool {
  name: string;
  description: string;
  module: string;
  path: string;
}

interface Personal {
  id: string;
  displayName: string;
  region: string;
  description: string;
  cultural_traits: string;
  tech_literacy: string;
  pain_points: string;
}

function parseSkillMd(skillPath: string) {
  try {
    const possiblePaths = [
      path.join(process.cwd(), "..", ".agent", skillPath),
      path.join(process.cwd(), ".agent", skillPath),
      path.join("/app/data", ".agent", skillPath),
    ];

    let filePath = "";
    for (const p of possiblePaths) {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        filePath = p;
        break;
      }
    }

    if (!filePath) return null;

    const content = fs.readFileSync(filePath, "utf-8");
    const complianceChecklist: string[] = [];
    const capabilitiesList: {
      code: string;
      description: string;
      skill: string;
    }[] = [];
    const principlesList: string[] = [];
    let contextLoad = "";
    let gatekeeper = "";

    const lines = content.split("\n");
    let currentSection = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith("# ")) {
        currentSection = line.replace("# ", "").trim().toUpperCase();
        continue;
      } else if (line.startsWith("## ")) {
        currentSection = line.replace("## ", "").trim().toUpperCase();
        continue;
      }

      // 1. Compliance Checklist
      if (currentSection.includes("COMPLIANCE CHECKLIST")) {
        if (line.startsWith("- [ ]") || line.startsWith("- [x]")) {
          const item = line
            .replace(/^-\s*\[[ x]\]\s*/i, "")
            .trim()
            .replace(/\*\*/g, "");
          complianceChecklist.push(item);
        }
      }

      // 2. Principles
      if (currentSection.includes("PRINCIPLES")) {
        if (line.startsWith("- ")) {
          principlesList.push(line.replace(/^-\s*/, "").trim());
        }
      }

      // 3. Capabilities Table
      if (currentSection.includes("CAPABILITIES")) {
        if (line.startsWith("|")) {
          if (line.includes("---")) continue;
          const parts = line
            .split("|")
            .map((p) => p.trim())
            .filter((p) => p !== "");
          if (parts.length >= 3) {
            const code = parts[0];
            if (code.toLowerCase() === "code") continue;
            capabilitiesList.push({
              code,
              description: parts[1],
              skill: parts[2],
            });
          }
        }
      }

      // 4. Context Load
      if (currentSection.includes("CONTEXT LOAD")) {
        if (!line.startsWith("##") && !line.startsWith("#")) {
          contextLoad += line + "\n";
        }
      }

      // 5. Gatekeeper
      if (currentSection.includes("GATEKEEPER")) {
        if (!line.startsWith("##") && !line.startsWith("#")) {
          gatekeeper += line + "\n";
        }
      }
    }

    return {
      complianceChecklist,
      capabilitiesList,
      principlesList: principlesList
        .map((p) => p.trim())
        .filter((p) => p !== ""),
      protocols: {
        contextLoad: contextLoad.trim(),
        gatekeeper: gatekeeper.trim(),
      },
    };
  } catch (e) {
    console.error("Error parsing SKILL.md", e);
    return null;
  }
}

export default function AgentsPage() {
  let agents: Agent[] = [];
  let skills: Skill[] = [];

  // Parse Agents
  try {
    const rawAgents = manifestService.getAgents();
    agents = rawAgents.map((agentObj) => {
      const cleanAgent: Agent = {
        name: agentObj.name,
        displayName: agentObj.displayName,
        title: agentObj.title,
        icon: agentObj.icon,
        capabilities: agentObj.capabilities,
        role: agentObj.role,
        identity: agentObj.identity,
        communicationStyle: agentObj.communicationStyle,
        principles: agentObj.principles,
        module: agentObj.module,
        path: agentObj.path,
      };

      if (cleanAgent.path) {
        const parsed = parseSkillMd(cleanAgent.path);
        if (parsed) {
          cleanAgent.complianceChecklist = parsed.complianceChecklist;
          cleanAgent.capabilitiesList = parsed.capabilitiesList;
          if (parsed.principlesList && parsed.principlesList.length > 0) {
            cleanAgent.principlesList = parsed.principlesList;
          }
          cleanAgent.protocols = parsed.protocols;
        }
      }

      return cleanAgent;
    });
  } catch (e) {
    console.error("Failed to load agents", e);
  }

  // Parse Skills
  try {
    skills = manifestService.getSkills();
  } catch (e) {
    console.error("Failed to load skills", e);
  }

  // Parse Tools
  let tools: Tool[] = [];
  try {
    const rawTools = manifestService.getTools();
    tools = rawTools.map((t) => ({
      name: t.name,
      description: t.description,
      module: t.module,
      path: t.path,
    }));
  } catch (e) {
    console.error("Failed to load tools", e);
  }

  // Parse Personals
  let personals: Personal[] = [];
  try {
    const rawPersonals = manifestService.getPersonals();
    personals = rawPersonals.map((p) => ({
      id: p.id,
      displayName: p.displayName,
      region: p.region,
      description: p.description,
      cultural_traits: p.cultural_traits,
      tech_literacy: p.tech_literacy,
      pain_points: p.pain_points,
    }));
  } catch (e) {
    console.error("Failed to load personals", e);
  }

  return (
    <AgentsPageContent
      agents={JSON.parse(JSON.stringify(agents))}
      skills={JSON.parse(JSON.stringify(skills))}
      tools={JSON.parse(JSON.stringify(tools))}
      personals={JSON.parse(JSON.stringify(personals))}
    />
  );
}
