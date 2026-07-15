import { EventEmitter } from "events";

declare global {
  var eventBus: EventEmitter | undefined;
}

export const eventBus = globalThis.eventBus ?? new EventEmitter();

if (process.env.NODE_ENV !== "production") {
  globalThis.eventBus = eventBus;
}

export const EVENTS = {
  PROPOSAL_CREATED: "proposal:created",
  PROPOSAL_UPDATED: "proposal:updated",
};

export function broadcastProposalCreated(proposal: {
  id: string;
  label: string;
  type: string;
}) {
  eventBus.emit(EVENTS.PROPOSAL_CREATED, proposal);
}

export function broadcastProposalUpdated(action: string, id: string) {
  eventBus.emit(EVENTS.PROPOSAL_UPDATED, { action, id });
}
