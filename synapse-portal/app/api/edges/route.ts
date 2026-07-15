import { NextResponse } from "next/server";
import { knowledgeService } from "@/lib/services/knowledge-service";

export async function GET() {
  try {
    const edges = await knowledgeService.getEdges();
    return NextResponse.json(edges);
  } catch (error) {
    console.error("[API Edges] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch edges" },
      { status: 500 },
    );
  }
}
