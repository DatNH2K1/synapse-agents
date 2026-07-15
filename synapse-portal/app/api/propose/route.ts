import { NextResponse } from "next/server";
import { knowledgeService } from "@/lib/services/knowledge-service";
import { broadcastProposalCreated } from "@/lib/services/event-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validation based on v1.2.1 manifest
    if (!body.label || !body.content || !body.type) {
      return NextResponse.json(
        { error: "Missing required fields: label, content, type" },
        { status: 400 },
      );
    }

    const result = await knowledgeService.proposeKnowledge(body);
    if (result.success && result.id) {
      broadcastProposalCreated({
        id: result.id,
        label: body.label,
        type: body.type,
      });
    }
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    console.error("[API Propose] Error:", error);
    const status =
      message.startsWith("Invalid section tag:") ||
      message.startsWith("Invalid agent tag:")
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
