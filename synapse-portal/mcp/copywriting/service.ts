import * as fs from "fs";
import * as path from "path";

function findStylesDir(): string | null {
  const possiblePaths = [
    path.resolve(process.cwd(), "assets", "writing-styles"),
    path.resolve(process.cwd(), "..", "assets", "writing-styles"),
    path.resolve(process.cwd(), "..", "..", "assets", "writing-styles"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) {
      return p;
    }
  }
  return null;
}

export function listWritingStyles(): string {
  const stylesDir = findStylesDir();
  if (!stylesDir) {
    return "ℹ️ No writing style templates found in assets/writing-styles/.";
  }

  try {
    const files = fs.readdirSync(stylesDir);
    const validFiles = files.filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return [".md", ".txt", ".json", ".pdf", ".docx"].includes(ext);
    });

    if (validFiles.length === 0) {
      return "ℹ️ No writing style template files found in assets/writing-styles/.";
    }

    const rows = [
      "| Style Name | Filename | Size |",
      "| :--- | :--- | :--- |",
    ];

    for (const f of validFiles) {
      const fullPath = path.join(stylesDir, f);
      const stats = fs.statSync(fullPath);
      const styleName = path.basename(f, path.extname(f));
      rows.push(`| **${styleName}** | \`${f}\` | ${(stats.size / 1024).toFixed(1)} KB |`);
    }

    return `### Available Writing Styles in assets/writing-styles/:\n\n${rows.join("\n")}`;
  } catch (error) {
    return `❌ Error listing writing styles: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export function extractWritingStyle(
  styleName: string,
  outputJson: boolean = false,
): string {
  const stylesDir = findStylesDir();
  if (!stylesDir) {
    return "❌ Error: assets/writing-styles/ directory not found.";
  }

  try {
    const files = fs.readdirSync(stylesDir);
    const matched = files.find(
      (f) =>
        f.toLowerCase() === styleName.toLowerCase() ||
        path.basename(f, path.extname(f)).toLowerCase() ===
          styleName.toLowerCase(),
    );

    if (!matched) {
      return `❌ Error: Style '${styleName}' not found in ${stylesDir}.`;
    }

    const fullPath = path.join(stylesDir, matched);
    const content = fs.readFileSync(fullPath, "utf-8");

    // Simple analysis of content: tone, vocabulary density, formatting patterns
    const words = content.split(/\s+/).filter(Boolean);
    const sentences = content.split(/[.!?]+/).filter(Boolean);
    const avgWordsPerSentence =
      sentences.length > 0 ? (words.length / sentences.length).toFixed(1) : "0";

    const hasBulletPoints = content.includes("- ") || content.includes("* ");
    const hasNumberedLists = /\d+\.\s/.test(content);
    const hasHeadings = content.includes("#");

    const analysis = {
      style_name: styleName,
      file: matched,
      word_count: words.length,
      sentence_count: sentences.length,
      average_sentence_length: avgWordsPerSentence,
      formatting: {
        headings: hasHeadings,
        bullet_points: hasBulletPoints,
        numbered_lists: hasNumberedLists,
      },
      sample_preview: content.slice(0, 300) + (content.length > 300 ? "..." : ""),
    };

    if (outputJson) {
      return JSON.stringify(analysis, null, 2);
    }

    return (
      `### Writing Style Analysis: ${styleName}\n\n` +
      `- **File**: \`${matched}\`\n` +
      `- **Word Count**: ${words.length} words (~${sentences.length} sentences)\n` +
      `- **Avg Sentence Length**: ${avgWordsPerSentence} words/sentence\n` +
      `- **Formatting Elements**: Headings: ${hasHeadings ? "Yes" : "No"}, Bullets: ${hasBulletPoints ? "Yes" : "No"}\n\n` +
      `**Preview:**\n\`\`\`\n${analysis.sample_preview}\n\`\`\``
    );
  } catch (error) {
    return `❌ Error extracting writing style: ${error instanceof Error ? error.message : String(error)}`;
  }
}
