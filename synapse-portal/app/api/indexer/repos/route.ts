import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const repos = await prisma.indexerRepo.findMany({
      orderBy: { lastSyncedAt: "desc" },
    });
    return NextResponse.json({
      success: true,
      repos: repos.map((r) => ({
        name: r.name,
        lastSyncedAt: r.lastSyncedAt,
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
