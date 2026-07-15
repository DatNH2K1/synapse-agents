import { NextResponse } from "next/server";
import { knowledgeService } from "@/lib/services/knowledge-service";
import { broadcastProposalUpdated } from "@/lib/services/event-service";

export async function POST(request: Request) {
  try {
    const { id, action, type } = await request.json();

    if (typeof id !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid ID format (expected string)" },
        { status: 400 },
      );
    }
    if (action === "REJECT") {
      await knowledgeService.rejectPendingUpdate(id);
      broadcastProposalUpdated("REJECT", id);
      return NextResponse.json({
        success: true,
        message: "Proposal rejected.",
      });
    }

    if (action === "APPROVE") {
      await knowledgeService.approvePendingUpdate(id);
      broadcastProposalUpdated("APPROVE", id);
      return NextResponse.json({
        success: true,
        message: "Proposal approved.",
      });
    }

    if (action === "UNDO") {
      const result = await knowledgeService.undoAction(id, type);
      if (result.success) {
        broadcastProposalUpdated("UNDO", id);
        return NextResponse.json({
          success: true,
          message: "Action undone successfully.",
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            message: result.message || "Failed to undo action.",
          },
          { status: 400 },
        );
      }
    }

    if (action === "WAKEUP") {
      await knowledgeService.wakeUpNode(id);
      broadcastProposalUpdated("WAKEUP", id);
      return NextResponse.json({
        success: true,
        message: "Node resurrected successfully.",
      });
    }

    return NextResponse.json(
      { success: false, message: "Unknown action." },
      { status: 400 },
    );
  } catch (error) {
    console.error("Gate API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
