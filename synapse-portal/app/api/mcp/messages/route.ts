import { NextResponse } from "next/server";
import { sseClients } from "../sse/route";
import { handleToolCall, TOOLS_MANIFEST } from "@/mcp";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const body = await request.json();
    const { id, method, params } = body;

    // Handle notifications (no response expected)
    if (!id && method?.startsWith("notifications/")) {
      return new NextResponse("Accepted", { status: 202 });
    }

    let responsePayload: Record<string, unknown> | null = null;

    if (method === "initialize") {
      responsePayload = {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: { listChanged: false },
            resources: { listChanged: false },
            prompts: { listChanged: false },
          },
          serverInfo: { name: "SynapsePortal", version: "1.0.0" },
        },
      };
    } else if (method === "tools/list") {
      responsePayload = {
        jsonrpc: "2.0",
        id,
        result: {
          tools: TOOLS_MANIFEST,
        },
      };
    } else if (method === "resources/list") {
      responsePayload = {
        jsonrpc: "2.0",
        id,
        result: {
          resources: [],
        },
      };
    } else if (method === "prompts/list") {
      responsePayload = {
        jsonrpc: "2.0",
        id,
        result: {
          prompts: [],
        },
      };
    } else if (method === "tools/call") {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};
      try {
        const textResult = await handleToolCall(toolName, toolArgs);
        responsePayload = {
          jsonrpc: "2.0",
          id,
          result: { content: [{ type: "text", text: textResult }] },
        };
      } catch (err) {
        responsePayload = {
          jsonrpc: "2.0",
          id,
          error: {
            code: -32603,
            message: err instanceof Error ? err.message : String(err),
          },
        };
      }
    } else if (method === "ping") {
      responsePayload = { jsonrpc: "2.0", id, result: {} };
    } else {
      responsePayload = {
        jsonrpc: "2.0",
        id,
        error: {
          code: -32601,
          message: "Method not found: " + method,
        },
      };
    }

    if (sessionId && sseClients.has(sessionId) && responsePayload) {
      const client = sseClients.get(sessionId);
      const sseMsg = "event: message\ndata: " + JSON.stringify(responsePayload) + "\n\n";
      client?.controller.enqueue(new TextEncoder().encode(sseMsg));
      return new NextResponse("Accepted", { status: 202 });
    }

    return NextResponse.json(responsePayload || { jsonrpc: "2.0", id, result: {} });
  } catch (error) {
    console.error("[API MCP Messages] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
