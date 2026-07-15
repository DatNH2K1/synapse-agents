import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { aiService } from "@/lib/services/ai-service";

export async function POST(request: Request) {
  try {
    const { nodeIds } = await request.json();

    if (!nodeIds || !Array.isArray(nodeIds) || nodeIds.length < 2) {
      return NextResponse.json(
        { success: false, message: "At least two node IDs are required" },
        { status: 400 },
      );
    }

    const nodes = await prisma.node.findMany({
      where: { id: { in: nodeIds } },
      select: {
        id: true,
        label: true,
        properties: true,
      },
    });

    if (nodes.length !== nodeIds.length) {
      return NextResponse.json(
        { success: false, message: "Some nodes were not found" },
        { status: 404 },
      );
    }

    const synthesisInput = nodes.map((node) => {
      let content = "";
      try {
        content = JSON.parse(node.properties || "{}").content || "";
      } catch (e) {
        console.error(`Failed to parse properties for node ${node.id}:`, e);
      }
      return {
        label: node.label,
        content,
      };
    });

    const synthesis = await aiService.synthesizeKnowledge(synthesisInput);

    return NextResponse.json({
      success: true,
      ...synthesis,
    });
  } catch (error) {
    console.error("[SYNTHESIZE_API] Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
