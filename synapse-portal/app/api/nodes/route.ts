import { NextResponse } from "next/server";
import { knowledgeService } from "@/lib/services/knowledge-service";

export async function GET() {
  try {
    const nodes = await knowledgeService.getNodesWithColor();
    return NextResponse.json(nodes);
  } catch (error) {
    console.error("[API Nodes] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch nodes" },
      { status: 500 },
    );
  }
}
