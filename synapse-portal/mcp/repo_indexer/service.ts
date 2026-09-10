import { prisma } from "@/lib/db";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { parseSourceFile } from "./parser";

export async function queryRepositoryIndex(
  repoName: string,
  filePath?: string,
): Promise<string> {
  try {
    const targetRepo = repoName || "synapse";

    if (filePath) {
      const fileNode = await prisma.indexerFile.findFirst({
        where: {
          path: filePath,
          repo: {
            name: targetRepo,
          },
        },
        include: {
          symbols: true,
        },
      });

      if (!fileNode) {
        return `❌ File not found: ${filePath} in repository ${targetRepo}`;
      }

      const directDependencies = await prisma.indexerDependency.findMany({
        where: { dependentFileId: fileNode.id },
        include: { dependencyFile: true },
      });

      const directDependents = await prisma.indexerDependency.findMany({
        where: { dependencyFileId: fileNode.id },
        include: { dependentFile: true },
      });

      const result = {
        repo: targetRepo,
        file: filePath,
        symbols: fileNode.symbols.map((s) => ({
          name: s.name,
          kind: s.kind,
          range: s.range,
        })),
        dependencies: Array.from(
          new Set(directDependencies.map((d) => d.dependencyFile.path)),
        ),
        dependents: Array.from(
          new Set(directDependents.map((d) => d.dependentFile.path)),
        ),
      };

      return JSON.stringify(result, null, 2);
    }

    const files = await prisma.indexerFile.findMany({
      where: {
        repo: {
          name: targetRepo,
        },
      },
    });

    const filesList = files.map((f) => f.path);
    const result = {
      repo: targetRepo,
      total_files: filesList.length,
      files: filesList,
    };

    return JSON.stringify(result, null, 2);
  } catch (error) {
    return `❌ Error querying repository index: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function indexRepository(
  repoPath: string,
  repoName?: string,
): Promise<string> {
  const resolvedPath = path.resolve(repoPath);
  if (!fs.existsSync(resolvedPath) || !fs.statSync(resolvedPath).isDirectory()) {
    return `❌ Error: Path '${repoPath}' does not exist or is not a directory.`;
  }

  const effectiveRepoName = repoName || path.basename(resolvedPath);

  try {
    // 1. Ensure Repository record in DB
    const repoRecord = await prisma.indexerRepo.upsert({
      where: { name: effectiveRepoName },
      update: { lastSyncedAt: new Date() },
      create: {
        name: effectiveRepoName,
        lastSyncedAt: new Date(),
      },
    });

    const skipDirs = new Set([
      "node_modules",
      ".git",
      ".next",
      ".venv",
      "__pycache__",
      "dist",
      "build",
      "coverage",
    ]);
    const validExtensions = new Set([
      ".ts",
      ".tsx",
      ".js",
      ".jsx",
      ".py",
      ".go",
      ".rs",
      ".json",
      ".md",
    ]);

    const indexedFiles: string[] = [];

    const walk = async (currentDir: string) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relPath = path.relative(resolvedPath, fullPath).replace(/\\/g, "/");

        if (entry.isDirectory()) {
          if (!skipDirs.has(entry.name)) {
            await walk(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (validExtensions.has(ext)) {
            const content = fs.readFileSync(fullPath, "utf-8");
            const hash = crypto
              .createHash("sha256")
              .update(content)
              .digest("hex");

            const fileRecord = await prisma.indexerFile.upsert({
              where: {
                repoId_path: {
                  repoId: repoRecord.id,
                  path: relPath,
                },
              },
              update: {
                hash,
              },
              create: {
                repoId: repoRecord.id,
                path: relPath,
                hash,
              },
            });

            const parsed = parseSourceFile(fullPath);
            if (parsed.exports.length > 0) {
              await prisma.indexerSymbol.deleteMany({
                where: { fileId: fileRecord.id },
              });
              await prisma.indexerSymbol.createMany({
                data: parsed.exports.map((s) => ({
                  fileId: fileRecord.id,
                  name: s.name,
                  kind: s.kind,
                  range: s.range ? JSON.stringify(s.range) : "",
                })),
              });
            }
            indexedFiles.push(relPath);
          }
        }
      }
    };

    await walk(resolvedPath);

    return (
      `✅ Indexing Successful for repository '${effectiveRepoName}'!\n` +
      `- Total files indexed: ${indexedFiles.length}\n` +
      `- Root path: ${resolvedPath}`
    );
  } catch (error) {
    return `❌ Exception running indexer: ${error instanceof Error ? error.message : String(error)}`;
  }
}
