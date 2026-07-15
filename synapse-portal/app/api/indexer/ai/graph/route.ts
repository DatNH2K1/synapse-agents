import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get("repo") || "synapse";

    const files = await prisma.indexerFile.findMany({
      where: {
        repo: {
          name: repo,
        },
      },
      include: {
        symbols: true,
      },
    });

    const idToPath: Record<string, string> = {};
    files.forEach((file) => {
      idToPath[file.id] = file.path;
    });

    const fileIds = files.map((f) => f.id);

    const dependencies = await prisma.indexerDependency.findMany({
      where: {
        dependentFileId: { in: fileIds },
        dependencyFileId: { in: fileIds },
      },
    });

    // Group dependencies by dependent file path
    const dependencyMap: Record<string, string[]> = {};
    files.forEach((file) => {
      dependencyMap[file.path] = [];
    });

    dependencies.forEach((dep) => {
      const dependentPath = idToPath[dep.dependentFileId];
      const dependencyPath = idToPath[dep.dependencyFileId];
      if (dependentPath && dependencyPath) {
        if (!dependencyMap[dependentPath].includes(dependencyPath)) {
          dependencyMap[dependentPath].push(dependencyPath);
        }
      }
    });

    const graph: Record<
      string,
      {
        symbols: { name: string; kind: string; range: string }[];
        dependencies: string[];
      }
    > = {};

    files.forEach((file) => {
      graph[file.path] = {
        symbols: file.symbols.map((s) => ({
          name: s.name,
          kind: s.kind,
          range: s.range,
        })),
        dependencies: dependencyMap[file.path] || [],
      };
    });

    return NextResponse.json({
      success: true,
      repo,
      graph,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
