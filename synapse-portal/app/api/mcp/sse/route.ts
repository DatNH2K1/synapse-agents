import { NextResponse } from "next/server";
import * as crypto from "crypto";
export { POST } from "../messages/route";

export const dynamic = "force-dynamic";

// Global map to hold active SSE controllers
type SseClient = {
  sessionId: string;
  controller: ReadableStreamDefaultController;
};

const globalForSse = globalThis as unknown as {
  sseClients?: Map<string, SseClient>;
};

export const sseClients =
  globalForSse.sseClients ?? new Map<string, SseClient>();
  globalForSse.sseClients = sseClients;

export async function GET() {
  const sessionId = crypto.randomUUID();
  const messagesEndpoint = `/api/mcp/messages?sessionId=${sessionId}`;

  const stream = new ReadableStream({
    start(controller) {
      sseClients.set(sessionId, { sessionId, controller });

      // Send initial endpoint event
      const endpointEvent = `event: endpoint\ndata: ${messagesEndpoint}\n\n`;
      controller.enqueue(new TextEncoder().encode(endpointEvent));
    },
    cancel() {
      sseClients.delete(sessionId);
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
