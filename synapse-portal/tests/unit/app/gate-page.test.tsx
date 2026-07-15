import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import GatePage from "@/app/(dashboard)/gate/page";

vi.mock("@/lib/services/knowledge-service", () => ({
  knowledgeService: {
    getPendingUpdates: async () => [
      { id: "update-1", label: "Pending Proposal" },
    ],
    getNodes: async () => [{ id: "node-1", label: "Existing Node" }],
  },
}));

interface MockProposal {
  id: string;
  label: string;
}

interface MockNode {
  id: string;
  label: string;
}

interface TheGateProps {
  pendingUpdates: MockProposal[];
  existingNodes: MockNode[];
}

vi.mock("@/components/gate/TheGate", () => ({
  default: ({ pendingUpdates, existingNodes }: TheGateProps) => (
    <div data-testid="the-gate">
      <span>Pending Updates Count: {pendingUpdates.length}</span>
      <span>Existing Nodes Count: {existingNodes.length}</span>
    </div>
  ),
}));

describe("app/(dashboard)/gate/page", () => {
  it("should render GatePage as a Server Component and pass values to TheGate", async () => {
    const element = await GatePage();
    render(element);

    expect(screen.getByTestId("the-gate")).toBeDefined();
    expect(screen.getByText("Pending Updates Count: 1")).toBeDefined();
    expect(screen.getByText("Existing Nodes Count: 1")).toBeDefined();
  });
});
