import * as fs from "fs";
import * as path from "path";

export interface ParseResult {
  exports: Array<{ name: string; kind: string; range?: [number, number] }>;
  imports: Array<{ name: string; from: string }>;
}

function parseJsTs(content: string): ParseResult {
  const exports: Array<{ name: string; kind: string; range?: [number, number] }> = [];
  const imports: Array<{ name: string; from: string }> = [];

  // Functions
  const fnRegex = /export\s+(?:async\s+)?function\s+([a-zA-Z0-9_$]+)/g;
  let match;
  while ((match = fnRegex.exec(content)) !== null) {
    exports.push({ name: match[1], kind: "function" });
  }

  // Classes (named and default)
  const classRegex = /export\s+(?:default\s+)?class\s+([a-zA-Z0-9_$]+)/g;
  while ((match = classRegex.exec(content)) !== null) {
    exports.push({ name: match[1], kind: "class" });
  }

  // Interfaces
  const interfaceRegex = /export\s+interface\s+([a-zA-Z0-9_$]+)/g;
  while ((match = interfaceRegex.exec(content)) !== null) {
    exports.push({ name: match[1], kind: "interface" });
  }

  // Types
  const typeRegex = /export\s+type\s+([a-zA-Z0-9_$]+)/g;
  while ((match = typeRegex.exec(content)) !== null) {
    exports.push({ name: match[1], kind: "type" });
  }

  // Variables / Constants
  const varRegex = /export\s+(?:const|let|var)\s+([a-zA-Z0-9_$]+)/g;
  while ((match = varRegex.exec(content)) !== null) {
    exports.push({ name: match[1], kind: "variable" });
  }

  // Named imports: import { a, b as c } from "..."
  const namedImportRegex = /import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g;
  while ((match = namedImportRegex.exec(content)) !== null) {
    const rawNames = match[1].split(",");
    const fromPath = match[2];
    for (const rawName of rawNames) {
      const trimmed = rawName.trim();
      if (!trimmed) continue;
      const parts = trimmed.split(/\s+as\s+/);
      const name = parts[parts.length - 1].trim();
      if (name) {
        imports.push({ name, from: fromPath });
      }
    }
  }

  // Default / namespace imports: import foo from "..." or import * as foo from "..."
  const defaultImportRegex = /import\s+(?:\*\s+as\s+)?([a-zA-Z0-9_$]+)\s+from\s*['"]([^'"]+)['"]/g;
  while ((match = defaultImportRegex.exec(content)) !== null) {
    imports.push({ name: match[1], from: match[2] });
  }

  return { exports, imports };
}

function parsePython(content: string): ParseResult {
  const exports: Array<{ name: string; kind: string; range?: [number, number] }> = [];
  const imports: Array<{ name: string; from: string }> = [];

  // Functions
  const fnRegex = /^\s*(?:async\s+)?def\s+([a-zA-Z0-9_]+)/gm;
  let match;
  while ((match = fnRegex.exec(content)) !== null) {
    exports.push({ name: match[1], kind: "function" });
  }

  // Classes
  const classRegex = /^\s*class\s+([a-zA-Z0-9_]+)/gm;
  while ((match = classRegex.exec(content)) !== null) {
    exports.push({ name: match[1], kind: "class" });
  }

  // from module import a, b
  const fromImportRegex = /^\s*from\s+([a-zA-Z0-9_.]+)\s+import\s+([^#\n]+)/gm;
  while ((match = fromImportRegex.exec(content)) !== null) {
    const fromMod = match[1];
    const rawNames = match[2].split(",");
    for (const rawName of rawNames) {
      const trimmed = rawName.trim().split(/\s+as\s+/)[0].trim();
      if (trimmed && trimmed !== "(" && trimmed !== ")") {
        imports.push({ name: trimmed, from: fromMod });
      }
    }
  }

  // import module
  const importRegex = /^\s*import\s+([a-zA-Z0-9_.]+)/gm;
  while ((match = importRegex.exec(content)) !== null) {
    const mod = match[1].trim();
    imports.push({ name: mod, from: mod });
  }

  return { exports, imports };
}

function parsePhp(content: string): ParseResult {
  const exports: Array<{ name: string; kind: string; range?: [number, number] }> = [];
  const imports: Array<{ name: string; from: string }> = [];

  let namespace = "";
  const nsMatch = /namespace\s+([^;\s]+)/.exec(content);
  if (nsMatch) {
    namespace = nsMatch[1].trim();
  }

  const prefix = namespace ? namespace + "\\" : "";

  // Classes
  const classRegex = /class\s+([a-zA-Z0-9_]+)/g;
  let match;
  while ((match = classRegex.exec(content)) !== null) {
    exports.push({ name: prefix + match[1], kind: "class" });
  }

  // Functions
  const fnRegex = /function\s+([a-zA-Z0-9_]+)/g;
  while ((match = fnRegex.exec(content)) !== null) {
    exports.push({ name: prefix + match[1], kind: "function" });
  }

  // use Namespace\Class;
  const useRegex = /use\s+([^;]+);/g;
  while ((match = useRegex.exec(content)) !== null) {
    const fullUse = match[1].trim();
    const parts = fullUse.split("\\");
    const name = parts[parts.length - 1].trim();
    imports.push({ name, from: fullUse });
  }

  return { exports, imports };
}

function parseCss(content: string): ParseResult {
  const imports: Array<{ name: string; from: string }> = [];
  const importRegex = /@import\s+(?:url\()?['"]([^'"]+)['"]\)?\s*;/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    const name = path.basename(importPath);
    imports.push({ name, from: importPath });
  }
  return { exports: [], imports };
}

function parseGo(content: string): ParseResult {
  const exports: Array<{ name: string; kind: string; range?: [number, number] }> = [];
  const imports: Array<{ name: string; from: string }> = [];

  const fnRegex = /func\s+(?:\([^)]+\)\s+)?([a-zA-Z0-9_]+)/g;
  let match;
  while ((match = fnRegex.exec(content)) !== null) {
    exports.push({ name: match[1], kind: "function" });
  }

  const structRegex = /type\s+([a-zA-Z0-9_]+)\s+struct/g;
  while ((match = structRegex.exec(content)) !== null) {
    exports.push({ name: match[1], kind: "struct" });
  }

  const importRegex = /import\s*\(\s*([\s\S]*?)\s*\)|import\s+['"]([^'"]+)['"]/g;
  while ((match = importRegex.exec(content)) !== null) {
    if (match[1]) {
      const lines = match[1].split("\n");
      for (const line of lines) {
        const clean = line.replace(/['"\s]/g, "");
        if (clean) {
          imports.push({ name: path.basename(clean), from: clean });
        }
      }
    } else if (match[2]) {
      imports.push({ name: path.basename(match[2]), from: match[2] });
    }
  }

  return { exports, imports };
}

export function parseSourceFile(filePath: string): ParseResult {
  if (!fs.existsSync(filePath)) {
    return { exports: [], imports: [] };
  }
  const content = fs.readFileSync(filePath, "utf-8");
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case ".ts":
    case ".tsx":
    case ".js":
    case ".jsx":
    case ".mjs":
    case ".cjs":
    case ".vue":
      return parseJsTs(content);
    case ".py":
      return parsePython(content);
    case ".php":
      return parsePhp(content);
    case ".css":
      return parseCss(content);
    case ".go":
      return parseGo(content);
    default:
      return { exports: [], imports: [] };
  }
}
