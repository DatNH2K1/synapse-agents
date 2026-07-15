import { NextResponse } from "next/server";
import { knowledgeService } from "@/lib/services/knowledge-service";
import { broadcastProposalUpdated } from "@/lib/services/event-service";

export async function POST(request: Request) {
  try {
    const {
      sourceNodeIds,
      newLabel,
      newType,
      newContent,
      selectedTagIds,
      reason,
      similarityScore,
      action,
    } = await request.json();

    if (action !== "MERGE") {
      return NextResponse.json(
        { success: false, message: "Only MERGE action is supported" },
        { status: 400 },
      );
    }

    const newNode = await knowledgeService.mergeNodes({
      sourceNodeIds,
      newLabel,
      newType,
      newContent,
      selectedTagIds,
      reason,
      similarityScore: similarityScore || 0,
    });

    broadcastProposalUpdated("MERGE", newNode.id);

    return NextResponse.json({
      success: true,
      message: "Knowledge merged successfully into a new node.",
      newNodeId: newNode.id,
    });
  } catch (error) {
    console.error("[MERGE_API] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
