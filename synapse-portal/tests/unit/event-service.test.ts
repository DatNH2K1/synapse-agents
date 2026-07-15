import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventEmitter } from "events";

describe("event-service Tests", () => {
  beforeEach(() => {
    vi.resetModules();
    globalThis.eventBus = undefined;
  });

  it("should broadcast proposal:created event with correct payload", async () => {
    const { eventBus, EVENTS, broadcastProposalCreated } =
      await import("@/lib/services/event-service");
    const mockProposal = {
      id: "prop-123",
      label: "Test Proposal",
      type: "LESSON",
    };

    const listener = vi.fn();
    eventBus.on(EVENTS.PROPOSAL_CREATED, listener);

    broadcastProposalCreated(mockProposal);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(mockProposal);
  });

  it("should broadcast proposal:updated event with correct payload", async () => {
    const { eventBus, EVENTS, broadcastProposalUpdated } =
      await import("@/lib/services/event-service");
    const listener = vi.fn();
    eventBus.on(EVENTS.PROPOSAL_UPDATED, listener);

    broadcastProposalUpdated("approve", "prop-123");

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({
      action: "approve",
      id: "prop-123",
    });
  });

  it("should reuse globalThis.eventBus if already defined", async () => {
    const dummyBus = new EventEmitter();
    globalThis.eventBus = dummyBus;

    const { eventBus } = await import("@/lib/services/event-service");
    expect(eventBus).toBe(dummyBus);
  });

  it("should not set globalThis.eventBus in production mode", async () => {
    vi.stubEnv("NODE_ENV", "production");
    globalThis.eventBus = undefined;

    const { eventBus } = await import("@/lib/services/event-service");
    expect(eventBus).toBeDefined();
    expect(globalThis.eventBus).toBeUndefined();
  });
});
