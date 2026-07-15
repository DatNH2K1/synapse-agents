import { NextRequest } from "next/server";
import { eventBus, EVENTS } from "@/lib/services/event-service";
import { knowledgeService } from "@/lib/services/knowledge-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode('data: {"type":"connected"}\n\n'));

      // Send current pending count on connect
      try {
        const pending = await knowledgeService.getPendingUpdates();
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "init", pendingCount: pending.length })}\n\n`,
          ),
        );
      } catch (e) {
        console.error(
          "[SSE Updates] Error getting initial pending updates:",
          e,
        );
      }

      // Define event listeners
      const onProposalCreated = async (proposal: {
        id: string;
        label: string;
        type: string;
      }) => {
        try {
          const pending = await knowledgeService.getPendingUpdates();
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: EVENTS.PROPOSAL_CREATED,
                proposal,
                pendingCount: pending.length,
              })}\n\n`,
            ),
          );
        } catch (err) {
          console.error(err);
        }
      };

      const onProposalUpdated = async (data: {
        action: string;
        id: string;
      }) => {
        try {
          const pending = await knowledgeService.getPendingUpdates();
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: EVENTS.PROPOSAL_UPDATED,
                action: data.action,
                id: data.id,
                pendingCount: pending.length,
              })}\n\n`,
            ),
          );
        } catch (err) {
          console.error(err);
        }
      };

      // Register listeners
      eventBus.on(EVENTS.PROPOSAL_CREATED, onProposalCreated);
      eventBus.on(EVENTS.PROPOSAL_UPDATED, onProposalUpdated);

      // Keep connection alive with periodic pings
      const keepAliveInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(":\n\n")); // SSE ping comment
        } catch {
          // Stream might be closed, clear interval
          clearInterval(keepAliveInterval);
        }
      }, 30000);

      // Handle stream cancellation/close
      req.signal.addEventListener("abort", () => {
        clearInterval(keepAliveInterval);
        eventBus.off(EVENTS.PROPOSAL_CREATED, onProposalCreated);
        eventBus.off(EVENTS.PROPOSAL_UPDATED, onProposalUpdated);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
