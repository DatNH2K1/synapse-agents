import * as fs from "fs";
import * as path from "path";

function parseCsv(content: string): Array<Record<string, string>> {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  // Parse header
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
    path.resolve(process.cwd(), "lib", "mcp", "data", "design_suite"),
    path.resolve(__dirname, "data"),
    path.resolve(__dirname, "data", "design_suite"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
      return p;
    }
  }
  return path.resolve(process.cwd(), "lib", "mcp", "data", "design_suite");
}

function searchCsv(
  data: Array<Record<string, string>>,
  queryTerms: string[],
  searchCols: string[],
  maxResults: number = 3,
): Array<Record<string, string>> {
  const scored = data.map((row) => {
    let score = 0;
    const combinedText = searchCols
      .map((col) => row[col] || "")
      .join(" ")
      .toLowerCase();

    for (const term of queryTerms) {
      if (combinedText.includes(term)) {
        score += 1;
      }
    }
    return { row, score };
  });

  return scored
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map((item) => item.row);
}

export function generateDesignSystemRecommendation(
  query: string,
  projectName: string = "",
  formatType: string = "markdown",
): string {
  const dataDir = getDataDir();
  if (!fs.existsSync(dataDir)) {
    return `❌ Error: Design system data directory not found at ${dataDir}`;
  }

  const reasoningFile = path.join(dataDir, "ui-reasoning.csv");
  const stylesFile = path.join(dataDir, "styles.csv");
  const colorsFile = path.join(dataDir, "colors.csv");
  const typographyFile = path.join(dataDir, "typography.csv");

  try {
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 1);

    // 1. Reasoning
    let reasoningMatch: Record<string, string> | null = null;
    if (fs.existsSync(reasoningFile)) {
      const reasoningData = parseCsv(fs.readFileSync(reasoningFile, "utf-8"));
      for (const rule of reasoningData) {
        const cat = (rule["UI_Category"] || "").toLowerCase();
        if (terms.some((t) => cat.includes(t))) {
          reasoningMatch = rule;
          break;
        }
      }
    }

    // 2. Styles
    let styleMatches: Array<Record<string, string>> = [];
    if (fs.existsSync(stylesFile)) {
      const stylesData = parseCsv(fs.readFileSync(stylesFile, "utf-8"));
      styleMatches = searchCsv(
        stylesData,
        terms,
        ["Style Category", "Keywords", "Best For", "AI Prompt Keywords"],
        2,
      );
      if (styleMatches.length === 0 && stylesData.length > 0) {
        styleMatches = [stylesData[0]];
      }
    }

    // 3. Colors
    let colorMatches: Array<Record<string, string>> = [];
    if (fs.existsSync(colorsFile)) {
      const colorsData = parseCsv(fs.readFileSync(colorsFile, "utf-8"));
      colorMatches = searchCsv(
        colorsData,
        terms,
        ["Product Type", "Notes"],
        1,
      );
      if (colorMatches.length === 0 && colorsData.length > 0) {
        colorMatches = [colorsData[0]];
      }
    }

    // 4. Typography
    let typographyMatches: Array<Record<string, string>> = [];
    if (fs.existsSync(typographyFile)) {
      const typoData = parseCsv(fs.readFileSync(typographyFile, "utf-8"));
      typographyMatches = searchCsv(
        typoData,
        terms,
        ["Mood / Genre", "Best For", "Font Pairing"],
        1,
      );
      if (typographyMatches.length === 0 && typoData.length > 0) {
        typographyMatches = [typoData[0]];
      }
    }

    const title = projectName ? `Design System for ${projectName}` : `Design System Recommendation for "${query}"`;
    const style = styleMatches[0] || {};
    const color = colorMatches[0] || {};
    const typo = typographyMatches[0] || {};

    if (formatType === "json") {
      return JSON.stringify(
        {
          title,
          query,
          reasoning: reasoningMatch,
          style,
          color,
          typography: typo,
        },
        null,
        2,
      );
    }

    return (
      `# 🎨 ${title}\n\n` +
      `### 1. Visual Style & Aesthetic\n` +
      `- **Category**: ${style["Style Category"] || "Modern Minimalist"}\n` +
      `- **Key Effects**: ${style["Effects & Animation"] || "Clean micro-interactions, smooth hover states"}\n` +
      `- **Best For**: ${style["Best For"] || "General applications"}\n` +
      `- **Complexity**: ${style["Complexity"] || "Medium"}\n\n` +
      `### 2. Color Palette\n` +
      `- **Primary**: \`${color["Primary"] || "#3B82F6"}\` (Foreground: \`${color["On Primary"] || "#FFFFFF"}\`)\n` +
      `- **Secondary**: \`${color["Secondary"] || "#64748B"}\`\n` +
      `- **Accent**: \`${color["Accent"] || "#F59E0B"}\`\n` +
      `- **Background**: \`${color["Background"] || "#0F172A"}\` | **Card**: \`${color["Card"] || "#1E293B"}\`\n` +
      `- **Notes**: ${color["Notes"] || "High contrast, accessible dark/light mode"}\n\n` +
      `### 3. Typography\n` +
      `- **Heading / Primary Font**: ${typo["Heading Font"] || typo["Font Pairing"] || "Inter / system-ui"}\n` +
      `- **Body Font**: ${typo["Body Font"] || "Inter / -apple-system"}\n` +
      `- **Mood**: ${typo["Mood / Genre"] || "Clean, modern, highly readable"}\n\n` +
      (reasoningMatch
        ? `### 4. UI Architecture & Patterns\n- **Recommended Layout**: ${reasoningMatch["Recommended_Layout"] || "Sidebar + Content Header + Card Grid"}\n- **Anti-patterns to Avoid**: ${reasoningMatch["Anti_Patterns"] || "Avoid low contrast text and clutter"}\n`
        : "")
    );
  } catch (error) {
    return `❌ Error generating design system: ${error instanceof Error ? error.message : String(error)}`;
  }
}
