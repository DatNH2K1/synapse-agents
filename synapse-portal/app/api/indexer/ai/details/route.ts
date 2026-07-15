import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const repo = searchParams.get("repo") || "synapse";
    const filePath = searchParams.get("file");

    if (!filePath) {
      return NextResponse.json(
        { error: "Missing required query parameter: file" },
        { status: 400 },
      );
    }

    const fileNode = await prisma.indexerFile.findFirst({
      where: {
        path: filePath,
        repo: {
          name: repo,
        },
      },
      include: {
        symbols: true,
      },
    });

    if (!fileNode) {
      return NextResponse.json(
        { error: `File not found: ${filePath} in repository ${repo}` },
        { status: 404 },
      );
    }

    // Direct dependencies (files imported by this file)
    const directDependencies = await prisma.indexerDependency.findMany({
      where: { dependentFileId: fileNode.id },
      include: {
        dependencyFile: true,
      },
    });

    // Direct dependents (files importing this file)
    const directDependents = await prisma.indexerDependency.findMany({
      where: { dependencyFileId: fileNode.id },
      include: {
        dependentFile: true,
      },
    });

    return NextResponse.json({
      success: true,
      repo,
      file: filePath,
      hash: fileNode.hash,
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
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
