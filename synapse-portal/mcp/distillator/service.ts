import * as fs from "fs";
import * as path from "path";

const INCLUDE_EXTENSIONS = new Set([
  ".md",
  ".txt",
  ".yaml",
  ".yml",
  ".json",
]);
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "__pycache__",
  ".venv",
  "venv",
  ".agent",
  ".agents",
  "_synapse-output",
  ".cursor",
  ".vscode",
  ".next",
]);

const DOC_TYPE_PATTERNS: Array<[RegExp, string]> = [
  [/discovery[_-]notes/i, "discovery-notes"],
  [/product[_-]brief/i, "product-brief"],
  [/research[_-]report/i, "research-report"],
  [/architecture/i, "architecture-doc"],
  [/prd/i, "prd"],
  [/distillate/i, "distillate"],
  [/changelog/i, "changelog"],
  [/readme/i, "readme"],
  [/spec/i, "specification"],
  [/requirements/i, "requirements"],
  [/design[_-]doc/i, "design-doc"],
  [/meeting[_-]notes/i, "meeting-notes"],
  [/brainstorm/i, "brainstorming"],
  [/interview/i, "interview-notes"],
];

function detectDocType(filename: string): string {
  for (const [pattern, docType] of DOC_TYPE_PATTERNS) {
    if (pattern.test(filename)) {
      return docType;
    }
  }
  return "unknown";
}

function resolveInputs(inputs: string[]): string[] {
  const files: string[] = [];

  for (const inp of inputs) {
    const resolved = path.resolve(inp);
    if (fs.existsSync(resolved)) {
      const stat = fs.statSync(resolved);
      if (stat.isFile()) {
        files.push(resolved);
      } else if (stat.isDirectory()) {
        const walk = (dir: string) => {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            if (entry.isDirectory()) {
              if (!SKIP_DIRS.has(entry.name)) {
                walk(path.join(dir, entry.name));
              }
            } else if (entry.isFile()) {
              const ext = path.extname(entry.name).toLowerCase();
              if (INCLUDE_EXTENSIONS.has(ext)) {
                files.push(path.join(dir, entry.name));
              }
            }
          }
        };
        walk(resolved);
      }
    }
  }

  return Array.from(new Set(files));
}

export function analyzeDistillationSources(sources: string[]): string {
  if (!sources || sources.length === 0) {
    return JSON.stringify(
      {
        status: "error",
        error: "No source paths provided.",
      },
      null,
      2,
    );
  }

  try {
    const resolvedFiles = resolveInputs(sources);
    if (resolvedFiles.length === 0) {
      return JSON.stringify(
        {
          status: "error",
          error: "No matching text/markdown files found in the provided paths.",
        },
        null,
        2,
      );
    }

    let totalSizeBytes = 0;
    let totalEstimatedTokens = 0;

    const fileDetails = resolvedFiles.map((fp) => {
      const stats = fs.statSync(fp);
      const filename = path.basename(fp);
      const docType = detectDocType(filename);
      const estTokens = Math.floor(stats.size / 4);

      totalSizeBytes += stats.size;
      totalEstimatedTokens += estTokens;

      return {
        path: fp,
        filename,
        size_bytes: stats.size,
        estimated_tokens: estTokens,
        doc_type: docType,
      };
    });

    const isSingle =
      resolvedFiles.length <= 3 && totalEstimatedTokens <= 15000;
    const routing = {
      recommendation: isSingle ? "single" : "fan-out",
      reason: isSingle
        ? "Small source size (≤3 files and ≤15k tokens); single pass distillation recommended."
        : "Large source size (>3 files or >15k tokens); distributed fan-out subagent distillation recommended.",
    };

    const estDistillateTokens = Math.floor(totalEstimatedTokens / 3);
    const splitPrediction = {
      prediction: estDistillateTokens > 5000 ? "likely" : "unlikely",
      estimated_distillate_tokens: estDistillateTokens,
      reason:
        estDistillateTokens > 5000
          ? "Distillate expected to exceed 5k tokens. Splitting into domain sections recommended."
          : "Distillate expected to fit within single document.",
    };

    const result = {
      status: "ok",
      files: fileDetails,
      summary: {
        total_files: resolvedFiles.length,
        total_size_bytes: totalSizeBytes,
        total_estimated_tokens: totalEstimatedTokens,
      },
      routing,
      split_prediction: splitPrediction,
    };

    return JSON.stringify(result, null, 2);
  } catch (error) {
    return JSON.stringify(
      {
        status: "error",
        error: `Exception analyzing sources: ${error instanceof Error ? error.message : String(error)}`,
      },
      null,
      2,
    );
  }
}
