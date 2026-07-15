import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const repo = body.repo || "synapse";
    const files = body.files;

    if (!Array.isArray(files)) {
      return NextResponse.json(
        { error: "Invalid payload: 'files' must be an array" },
        { status: 400 },
      );
    }

    // Process all files in a single transaction
    await prisma.$transaction(async (tx) => {
      // 0. Find or create the repository record and update its sync timestamp
      const dbRepo = await tx.indexerRepo.upsert({
        where: { name: repo },
        update: { lastSyncedAt: new Date() },
        create: { name: repo, lastSyncedAt: new Date() },
      });

      // 1. Delete all existing files for this repo to start fresh
      await tx.indexerFile.deleteMany({
        where: { repoId: dbRepo.id },
      });

      // 2. Insert all new files
      for (const file of files) {
        await tx.indexerFile.create({
          data: { repoId: dbRepo.id, path: file.path, hash: file.hash },
        });
      }

      // 3. Fetch the created files to get their IDs
      const dbFiles = await tx.indexerFile.findMany({
        where: { repoId: dbRepo.id },
      });

      // 3. Insert new symbols and dependencies
      for (const file of files) {
        const currentFile = dbFiles.find((f) => f.path === file.path);
        if (!currentFile) continue;

        // Insert symbols
        if (Array.isArray(file.exports)) {
          for (const sym of file.exports) {
            await tx.indexerSymbol.create({
              data: {
                fileId: currentFile.id,
                name: sym.name,
                kind: sym.kind,
                range: sym.range,
              },
            });
          }
        }

        // Insert dependencies
        if (Array.isArray(file.imports)) {
          for (const imp of file.imports) {
            // Find target dependency file in DB (scoped to the same repo)
            let targetFile = await tx.indexerFile.findUnique({
              where: { repoId_path: { repoId: dbRepo.id, path: imp.from } },
            });

            // If it doesn't exist, create a placeholder for it
            if (!targetFile) {
              targetFile = await tx.indexerFile.create({
                data: {
                  repoId: dbRepo.id,
                  path: imp.from,
                  hash: "placeholder",
                },
              });
            }

            await tx.indexerDependency.create({
              data: {
                dependentFileId: currentFile.id,
                dependencyFileId: targetFile.id,
                symbolName: imp.name || null,
              },
            });
          }
        }
      }
    });

    return NextResponse.json({ success: true, syncedFilesCount: files.length });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    console.error("[API Indexer Sync] Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
