import { NextResponse } from "next/server";
import { handleToolCall, TOOLS_MANIFEST } from "@/mcp";

export async function GET() {
  return NextResponse.json({
    status: "online",
    server: "SynapsePortal-MCP",
    version: "1.0.0",
    protocolVersion: "2024-11-05",
    tools: TOOLS_MANIFEST,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, method, params } = body;

    if (method === "initialize") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: { listChanged: false },
          },
          serverInfo: {
            name: "SynapsePortal",
            version: "1.0.0",
          },
        },
      });
    }

    if (method === "tools/list") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {
          tools: TOOLS_MANIFEST,
        },
      });
    }

    if (method === "tools/call") {
      const toolName = params?.name;
      const toolArgs = params?.arguments || {};

      try {
        const textResult = await handleToolCall(toolName, toolArgs);
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: textResult,
              },
            ],
          },
        });
      } catch (err) {
        return NextResponse.json({
          jsonrpc: "2.0",
          id,
          error: {
            code: -32603,
            message: err instanceof Error ? err.message : String(err),
          },
        });
      }
    }

    if (method === "ping") {
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result: {},
      });
    }

    return NextResponse.json({
      jsonrpc: "2.0",
      id,
      error: {
        code: -32601,
        message: "Method not found: " + method,
      },
    });
  } catch (error) {
    console.error("[API MCP] Error:", error);
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32700,
          message: "Parse error",
        },
      },
      { status: 400 },
    );
  }
}
