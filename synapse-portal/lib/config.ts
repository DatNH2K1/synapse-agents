import path from "path";
import fs from "fs";

/**
 * Aggressive path detection for Synapse system manifests and configurations.
 * Supports both Local development and Docker container environments.
 */
const getEffectivePath = (envVar: string, defaultRelPath: string) => {
  if (process.env[envVar]) return process.env[envVar] as string;

  const possiblePaths = [
    // 1. Nested in synapse-agents (Migrated Local dev structure)
    path.join(process.cwd(), "..", "..", "synapse", defaultRelPath),
    // 2. Sibling directory synapse
    path.join(process.cwd(), "..", "synapse", defaultRelPath),
    // 3. Parent directory (Legacy Local dev structure)
    path.join(process.cwd(), "..", defaultRelPath),
    // 4. Current directory
    path.join(process.cwd(), defaultRelPath),
    // 5. Docker fixed data path
    path.join("/app/data", path.basename(defaultRelPath)),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
  }

  // Fallback to local dev path
  return possiblePaths[0];
};

export const AGENT_MANIFEST_PATH = getEffectivePath(
  "AGENT_MANIFEST_PATH",
  ".agent/manifests/agent-manifest.csv",
);
export const SKILL_MANIFEST_PATH = getEffectivePath(
  "SKILL_MANIFEST_PATH",
  ".agent/manifests/skill-manifest.csv",
);
export const ADDITIONAL_SKILL_MANIFEST_PATH = getEffectivePath(
  "ADDITIONAL_SKILL_MANIFEST_PATH",
  ".agent/manifests/addition-skill-manifest.csv",
);

export const DB_CONFIG = {
  host: process.env.POSTGRES_HOST || "db",
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  database: process.env.POSTGRES_DB || "synapse",
  user: process.env.POSTGRES_USER || "synapse",
  password: process.env.POSTGRES_PASSWORD || "synapse",
  url: process.env.DATABASE_URL,
};

export function getAIConfig() {
  return {
    gemini: {
      model: process.env.GEMINI_MODEL || "",
      embedding_model: process.env.GEMINI_EMBEDDING_MODEL || "",
      is_active: !!process.env.GEMINI_API_KEY,
    },
    stitch: {
      is_set: !!process.env.STITCH_API_KEY,
    },
    context7: {
      is_set: !!process.env.CONTEXT7_API_KEY,
    },
  };
}
