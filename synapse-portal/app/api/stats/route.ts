import { NextResponse } from "next/server";
import { knowledgeService } from "@/lib/services/knowledge-service";

export async function GET() {
  try {
    const stats = await knowledgeService.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("[API Stats] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 },
    );
  }
}
