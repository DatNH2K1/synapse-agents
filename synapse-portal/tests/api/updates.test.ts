import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getUpdates } from "@/app/api/updates/route";
import { knowledgeService } from "@/lib/services/knowledge-service";
import { eventBus, EVENTS } from "@/lib/services/event-service";
import { NextRequest } from "next/server";

vi.mock("@/lib/services/knowledge-service", () => ({
  knowledgeService: {
    getPendingUpdates: vi.fn(),
  },
}));

describe("GET /api/updates (SSE)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eventBus.removeAllListeners();
  });

  it("should connect, stream pending count, and handle eventBus events", async () => {
    vi.mocked(knowledgeService.getPendingUpdates).mockResolvedValue([
      { id: "node-1" },
    ] as object as Awaited<
      ReturnType<typeof knowledgeService.getPendingUpdates>
    >);

    const mockReq = {
      signal: {
        addEventListener: vi.fn(),
      },
    } as object as NextRequest;

    const response = await getUpdates(mockReq);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/event-stream");

    const reader = response.body!.getReader();

    // Read initial connection message
    const chunk1 = await reader.read();
    const text1 = new TextDecoder().decode(chunk1.value);
    expect(text1).toContain('"type":"connected"');

    // Read initial pending updates counts
    const chunk2 = await reader.read();
    const text2 = new TextDecoder().decode(chunk2.value);
    expect(text2).toContain('"type":"init"');
    expect(text2).toContain('"pendingCount":1');

    // Emit a proposal created event on eventBus
    vi.mocked(knowledgeService.getPendingUpdates).mockResolvedValue([
      { id: "node-1" },
      { id: "node-2" },
    ] as object as Awaited<
      ReturnType<typeof knowledgeService.getPendingUpdates>
    >);

    eventBus.emit(EVENTS.PROPOSAL_CREATED, {
      id: "node-2",
      label: "New Proposal",
      type: "LESSON",
    });

    const chunk3 = await reader.read();
    const text3 = new TextDecoder().decode(chunk3.value);
    expect(text3).toContain(EVENTS.PROPOSAL_CREATED);
    expect(text3).toContain('"pendingCount":2');

    // Emit updates event
    eventBus.emit(EVENTS.PROPOSAL_UPDATED, {
      action: "APPROVE",
      id: "node-2",
    });
    const chunk4 = await reader.read();
    const text4 = new TextDecoder().decode(chunk4.value);
    expect(text4).toContain(EVENTS.PROPOSAL_UPDATED);
    expect(text4).toContain('"action":"APPROVE"');

    // Verify abort handler cleans up listeners
    expect(mockReq.signal.addEventListener).toHaveBeenCalledWith(
      "abort",
      expect.any(Function),
    );
    const abortListener = vi.mocked(mockReq.signal.addEventListener).mock
      .calls[0][1] as object as () => void;

    const offSpy = vi.spyOn(eventBus, "off");
    abortListener();
    expect(offSpy).toHaveBeenCalled();
  });

  it("should gracefully handle database error in initial pending count fetch", async () => {
    vi.mocked(knowledgeService.getPendingUpdates).mockRejectedValue(
      new Error("Init DB error"),
    );

    const mockReq = {
      signal: {
        addEventListener: vi.fn(),
      },
    } as object as NextRequest;

    const response = await getUpdates(mockReq);
    expect(response.status).toBe(200);

    const reader = response.body!.getReader();
    const chunk1 = await reader.read();
    const text1 = new TextDecoder().decode(chunk1.value);
    expect(text1).toContain('"type":"connected"');
  });

  it("should handle error in onProposalCreated listener", async () => {
    vi.mocked(knowledgeService.getPendingUpdates).mockResolvedValue(
      [] as object as Awaited<
        ReturnType<typeof knowledgeService.getPendingUpdates>
      >,
    );

    const mockReq = {
      signal: {
        addEventListener: vi.fn(),
      },
    } as object as NextRequest;

    const response = await getUpdates(mockReq);
    expect(response.status).toBe(200);

    // Next call inside onProposalCreated throws
    vi.mocked(knowledgeService.getPendingUpdates).mockRejectedValue(
      new Error("Event DB error"),
    );

    // Emit event
    eventBus.emit(EVENTS.PROPOSAL_CREATED, {
      id: "node-1",
      label: "Broken Proposal",
      type: "LESSON",
    });
  });

  it("should handle error in onProposalUpdated listener", async () => {
    vi.mocked(knowledgeService.getPendingUpdates).mockResolvedValue(
      [] as object as Awaited<
        ReturnType<typeof knowledgeService.getPendingUpdates>
      >,
    );

    const mockReq = {
      signal: {
        addEventListener: vi.fn(),
      },
    } as object as NextRequest;

    const response = await getUpdates(mockReq);
    expect(response.status).toBe(200);

    // Next call inside onProposalUpdated throws
    vi.mocked(knowledgeService.getPendingUpdates).mockRejectedValue(
      new Error("Event DB error"),
    );

    // Emit event
    eventBus.emit(EVENTS.PROPOSAL_UPDATED, {
      action: "APPROVE",
      id: "node-1",
    });
  });

  it("should send keepalive pings and handle keepalive failures", async () => {
    vi.useFakeTimers();
    vi.mocked(knowledgeService.getPendingUpdates).mockResolvedValue(
      [] as object as Awaited<
        ReturnType<typeof knowledgeService.getPendingUpdates>
      >,
    );

    const mockReq = {
      signal: {
        addEventListener: vi.fn(),
      },
    } as object as NextRequest;

    const response = await getUpdates(mockReq);
    const reader = response.body!.getReader();

    // Read initial connection messages
    await reader.read();
    await reader.read();

    // Fast-forward 30 seconds
    vi.advanceTimersByTime(30000);

    const chunk = await reader.read();
    const text = new TextDecoder().decode(chunk.value);
    // Verify SSE ping comment is sent (":\n\n")
    expect(text).toBe(":\n\n");

    // Now close/abort the stream and let timer run, should handle error when enqueuing
    reader.releaseLock();
    await response.body!.cancel();

    // Advance timer again - should catch error on enqueue and clear interval
    vi.advanceTimersByTime(30000);

    vi.useRealTimers();
  });
});
