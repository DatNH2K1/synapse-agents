import { NextResponse } from "next/server";
import { knowledgeService } from "@/lib/services/knowledge-service";

export async function POST(request: Request) {
  try {
    const { nodeId } = await request.json();
    if (!nodeId) {
      return NextResponse.json(
        { success: false, message: "Node ID is required" },
        { status: 400 },
      );
    }

    const updatedNode = await knowledgeService.incrementSuccessCount(nodeId);
    return NextResponse.json({
      success: true,
      message: `Efficacy count incremented successfully.`,
      nodeId: updatedNode.id,
      successCount: updatedNode.success_count,
    });
  } catch (error) {
    console.error("[API Nodes Efficacy] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to increment efficacy";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
