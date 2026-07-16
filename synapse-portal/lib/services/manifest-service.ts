import fs from "fs";
import path from "path";
import { MANIFEST_PATH } from "../config";

const AGENT_MANIFEST_PATH = path.join(MANIFEST_PATH, "agent-manifest.csv");
const SKILL_MANIFEST_PATH = path.join(MANIFEST_PATH, "skill-manifest.csv");

export interface AgentManifestRecord {
  name: string;
  displayName: string;
  title: string;
  icon: string;
  capabilities: string;
  role: string;
  identity: string;
  communicationStyle: string;
  principles: string;
  module: string;
  path: string;
  canonicalId: string;
}

export interface SkillManifestRecord {
  canonicalId: string;
  name: string;
  description: string;
  module: string;
  path: string;
}

export interface ToolManifestRecord {
  name: string;
  description: string;
  module: string;
  path: string;
}

export interface PersonalManifestRecord {
  id: string;
  displayName: string;
  region: string;
  description: string;
  cultural_traits: string;
  tech_literacy: string;
  pain_points: string;
}

/**
 * Generic CSV Parser that handles double-quoted strings
 */
function parseCsv<T>(filePath: string): T[] {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }

    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n").filter((line) => line.trim().length > 0);

    if (lines.length <= 1) return [];

    const headers = lines[0].split(",").map((h) => h.trim());
    const results: T[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const row: string[] = [];
      let cur = "";
      let inQuote = false;

      for (let j = 0; j < line.length; j++) {
        if (line[j] === '"') {
          if (inQuote && j + 1 < line.length && line[j + 1] === '"') {
            cur += '"';
            j++;
          } else {
            inQuote = !inQuote;
          }
        } else if (line[j] === "," && !inQuote) {
          row.push(cur.trim());
          cur = "";
        } else {
          cur += line[j];
        }
      }
      row.push(cur.trim());

      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h] = row[idx] || "";
      });

      results.push(obj as T);
    }

    return results;
  } catch (error) {
    console.error(`Error parsing manifest at ${filePath}:`, error);
    return [];
  }
}

export const manifestService = {
  /**
   * Retrieves all agents from the agent-manifest.csv
   */
  getAgents: (): AgentManifestRecord[] => {
    return parseCsv<AgentManifestRecord>(AGENT_MANIFEST_PATH);
  },

  /**
   * Retrieves all skills from the skill-manifest.csv
   */
  getSkills: (): SkillManifestRecord[] => {
    return parseCsv<SkillManifestRecord>(SKILL_MANIFEST_PATH);
  },

  /**
   * Retrieves all tools from the tool-manifest.csv
   */
  getTools: (): ToolManifestRecord[] => {
    return parseCsv<ToolManifestRecord>(path.join(MANIFEST_PATH, "tool-manifest.csv"));
  },

  /**
   * Retrieves all personals from the personal-manifest.csv
   */
  getPersonals: (): PersonalManifestRecord[] => {
    return parseCsv<PersonalManifestRecord>(path.join(MANIFEST_PATH, "personal-manifest.csv"));
  },
};
