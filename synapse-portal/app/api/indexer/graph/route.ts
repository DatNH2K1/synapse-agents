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

    const fileIds = files.map((f) => f.id);

    const dependencies = await prisma.indexerDependency.findMany({
      where: {
        dependentFileId: { in: fileIds },
        dependencyFileId: { in: fileIds },
      },
    });

    return NextResponse.json({
      success: true,
      files,
      dependencies,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
