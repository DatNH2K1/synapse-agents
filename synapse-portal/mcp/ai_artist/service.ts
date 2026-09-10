import * as fs from "fs";
import * as path from "path";

function parseCsv(content: string): Array<Record<string, string>> {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]);
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || "";
    }
    rows.push(row);
  }
  return rows;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function getDataDir(): string {
  const possiblePaths = [
    path.resolve(process.cwd(), "lib", "mcp", "data", "ai_artist"),
    path.resolve(__dirname, "data"),
    path.resolve(__dirname, "data", "ai_artist"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
      return p;
    }
  }
  return path.resolve(process.cwd(), "lib", "mcp", "data", "ai_artist");
}

export function searchAiArtPrompts(
  query: string,
  category: string = "all",
  limit: number = 5,
): string {
  const dataDir = getDataDir();
  if (!fs.existsSync(dataDir)) {
    return `❌ Error: AI artist data directory not found at ${dataDir}`;
  }

  const promptFile = path.join(dataDir, "awesome-prompts.csv");
  if (!fs.existsSync(promptFile)) {
    return "ℹ️ No prompt templates database found.";
  }

  try {
    const rows = parseCsv(fs.readFileSync(promptFile, "utf-8"));
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 1);

    const scored = rows.map((r) => {
      let score = 0;
      const text = Object.values(r).join(" ").toLowerCase();
      for (const t of terms) {
        if (text.includes(t)) score += 1;
      }
      return { row: r, score };
    });

    const matches = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.row);

    if (matches.length === 0) {
      return `ℹ️ No AI art prompt templates found matching query '${query}'.`;
    }

    const output = [
      `### Matching AI Art Prompt Templates for "${query}" (Category: ${category}):`,
    ];
    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const title = m["title"] || m["name"] || m["Prompt Name"] || `Template #${i + 1}`;
      const prompt = m["prompt"] || m["Prompt"] || m["template"] || Object.values(m)[0];
      output.push(`#### ${i + 1}. ${title}\n\`\`\`text\n${prompt}\n\`\`\``);
    }

    return output.join("\n\n");
  } catch (error) {
    return `❌ Error searching AI art prompts: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export function generateAiArt(
  concept: string,
  mode: string = "search",
  aspectRatio: string = "16:9",
): string {
  const dataDir = getDataDir();
  const promptFile = path.join(dataDir, "awesome-prompts.csv");
  const stylesFile = path.join(dataDir, "styles.csv");

  let baseTemplate =
    "Cinematic hyper-detailed render of {concept}, volumetric lighting, 8k resolution, octane render style";

  if (fs.existsSync(promptFile)) {
    const rows = parseCsv(fs.readFileSync(promptFile, "utf-8"));
    const terms = concept.toLowerCase().split(/\s+/);
    for (const r of rows) {
      const text = Object.values(r).join(" ").toLowerCase();
      if (terms.some((t) => text.includes(t))) {
        baseTemplate = r["prompt"] || r["Prompt"] || Object.values(r)[0] || baseTemplate;
        break;
      }
    }
  }

  let styleModifier = "photorealistic, studio lighting";
  if (fs.existsSync(stylesFile)) {
    const styles = parseCsv(fs.readFileSync(stylesFile, "utf-8"));
    if (styles.length > 0) {
      styleModifier = styles[0]["Style"] || styles[0]["name"] || styleModifier;
    }
  }

  const generatedPrompt = baseTemplate.replace(
    /\{concept\}|\[subject\]|\{argument name=[^}]+\}/gi,
    concept,
  );

  return (
    `### 🎨 AI Art Generation Prompt for "${concept}" (Mode: ${mode})\n\n` +
    `**Optimized Prompt:**\n` +
    `\`\`\`text\n` +
    `${generatedPrompt}, ${styleModifier}, aspect ratio --ar ${aspectRatio}\n` +
    `\`\`\`\n\n` +
    `**Parameters:**\n` +
    `- **Aspect Ratio**: \`${aspectRatio}\`\n` +
    `- **Recommended Engine**: Midjourney v6 / Gemini Nano Banana Pro / DALL-E 3\n` +
    `- **Negative Prompts**: \`blurry, distorted, low quality, watermarks, bad anatomy\``
  );
}
