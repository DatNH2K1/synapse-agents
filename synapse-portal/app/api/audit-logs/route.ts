import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1. Fetch all nodes with status APPROVED, REJECTED, ARCHIVE
    // Explicitly select only necessary fields, completely avoiding massive embedding vectors
    const nodes = await prisma.node.findMany({
      where: {
        status: { in: ["APPROVED", "REJECTED", "ARCHIVE"] },
      },
      orderBy: {
        last_verified: "desc",
      },
      select: {
        id: true,
        label: true,
        type: true,
        properties: true,
        status: true,
        memory_tier: true,
        last_verified: true,
        success_count: true,
        tags: {
          select: {
            tag: true,
          },
        },
      },
    });

    // 2. Fetch all archive records
    const archives = await prisma.archive.findMany({
      orderBy: {
        mergedAt: "desc",
      },
    });

    const archiveMap = new Map();
    archives.forEach((arc) => {
      archiveMap.set(arc.fromNodeId, arc);
    });

    // 3. Match archives and construct a decorated history log
    const decoratedLogs = nodes.map((node) => {
      const archiveDetail = archiveMap.get(node.id);
      return {
        id: node.id,
        label: node.label,
        type: node.type,
        properties: node.properties,
        status: node.status,
        memory_tier: node.memory_tier,
        last_verified: node.last_verified,
        tags: node.tags.map((t) => t.tag),
        archiveDetail: archiveDetail
          ? {
              toNodeId: archiveDetail.toNodeId,
              reason: archiveDetail.reason,
              similarityScore: archiveDetail.similarityScore,
              mergedAt: archiveDetail.mergedAt,
            }
          : null,
      };
    });

    // Explicitly sort logs by last_verified descending (newest first)
    decoratedLogs.sort(
      (a, b) =>
        new Date(b.last_verified).getTime() -
        new Date(a.last_verified).getTime(),
    );

    return NextResponse.json({
      success: true,
      logs: decoratedLogs,
    });
  } catch (error) {
    console.error("Audit Logs API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
