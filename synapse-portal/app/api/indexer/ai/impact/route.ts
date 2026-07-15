import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface ImpactResult {
  path: string;
  depth: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("file");
    const repo = searchParams.get("repo") || "synapse";

    if (!filePath) {
      return NextResponse.json(
        { error: "Missing required query parameter: file" },
        { status: 400 },
      );
    }

    // Check if the file exists in the indexer database first
    const fileNode = await prisma.indexerFile.findFirst({
      where: {
        path: filePath,
        repo: {
          name: repo,
        },
      },
    });

    if (!fileNode) {
      return NextResponse.json(
        { error: `File not found: ${filePath} in repository ${repo}` },
        { status: 404 },
      );
    }

    // Recursive Common Table Expression (CTE) to traverse dependent files
    const results = await prisma.$queryRaw<ImpactResult[]>`
      WITH RECURSIVE impact_graph AS (
        -- Anchor member: find direct dependents of target file
        SELECT 
          d."dependentFileId" AS file_id,
          1 AS depth
        FROM "IndexerDependency" d
        WHERE d."dependencyFileId" = ${fileNode.id}::uuid

        UNION

        -- Recursive member: find dependents of the dependents
        SELECT 
          d."dependentFileId" AS file_id,
          ig.depth + 1 AS depth
        FROM "IndexerDependency" d
        JOIN impact_graph ig ON d."dependencyFileId" = ig.file_id
        WHERE ig.depth < 10 -- Safety recursion limit
      )
      SELECT DISTINCT f.path, MIN(ig.depth) as depth
      FROM impact_graph ig
      JOIN "IndexerFile" f ON ig.file_id = f.id
      GROUP BY f.path
      ORDER BY depth ASC;
    `;

    const directlyAffected: string[] = [];
    const indirectlyAffected: { path: string; depth: number }[] = [];

    results.forEach((r) => {
      const depth = Number(r.depth);
      if (depth === 1) {
        directlyAffected.push(r.path);
      } else {
        indirectlyAffected.push({
          path: r.path,
          depth,
        });
      }
    });

    return NextResponse.json({
      success: true,
      repo,
      file: filePath,
      directlyAffected,
      indirectlyAffected,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    console.error("[API Indexer AI Impact] Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
