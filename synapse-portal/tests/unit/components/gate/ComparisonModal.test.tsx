import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ComparisonModal from "@/components/gate/ComparisonModal";
import { PendingUpdate, NodeWithTags } from "@/components/gate/types";

vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe("components/gate/ComparisonModal", () => {
  const mockUpdate: PendingUpdate = {
    id: "update-1",
    label: "Proposed Name",
    type: "Feature",
    status: "PENDING",
    last_verified: "2026-06-04T12:00:00Z",
    properties: JSON.stringify({ content: "Proposed content details." }),
    tags: [],
  };

  const mockMatch: NodeWithTags = {
    id: "node-1",
    label: "Current Name",
    type: "Feature",
    content_hash: "hash-1",
    success_count: 1,
    last_verified: new Date(),
    properties: JSON.stringify({ content: "Current content details." }),
    status: "APPROVED",
    memory_tier: "CORE",
    embeddingModel: "text-embedding-3-small",
    tags: [],
  };

  const onClose = vi.fn();
  const onAction = vi.fn();
  const onStartMerge = vi.fn();

  beforeEach(() => {
    cleanup();
    onClose.mockClear();
    onAction.mockClear();
    onStartMerge.mockClear();
  });

  it("should render comparison with match current master data side", () => {
    render(
      <ComparisonModal
        comparingUpdate={{ update: mockUpdate, match: mockMatch }}
        processingId={null}
        isSynthesizing={false}
        onClose={onClose}
        onAction={onAction}
        onStartMerge={onStartMerge}
      />,
    );

    expect(screen.getByText("Current Name")).toBeDefined();
    expect(screen.getByText("Proposed Name")).toBeDefined();
    expect(screen.getByText("Current content details.")).toBeDefined();
    expect(screen.getByText("Proposed content details.")).toBeDefined();

    // Click Merge
    fireEvent.click(screen.getByText("merge"));
    expect(onStartMerge).toHaveBeenCalledWith(mockUpdate, [mockMatch]);

    // Click Reject
    fireEvent.click(screen.getByText("reject"));
    expect(onAction).toHaveBeenCalledWith("update-1", "REJECT");

    // Click Approve
    fireEvent.click(screen.getByText("approve"));
    expect(onAction).toHaveBeenCalledWith("update-1", "APPROVE");

    // Click Close
    fireEvent.click(screen.getByText("close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("should render new entry message if no match exists", () => {
    render(
      <ComparisonModal
        comparingUpdate={{ update: mockUpdate }}
        processingId={null}
        isSynthesizing={false}
        onClose={onClose}
        onAction={onAction}
        onStartMerge={onStartMerge}
      />,
    );

    expect(screen.getByText("new_entry")).toBeDefined();
    // Merge button shouldn't exist because match is undefined
    expect(screen.queryByText("merge")).toBeNull();
  });

  it("should render comparison with loading spinners and fallback messages", () => {
    const updateWithEmptyProps: PendingUpdate = {
      ...mockUpdate,
      properties: "",
    };
    const matchWithEmptyProps: NodeWithTags = {
      ...mockMatch,
      properties: null,
    };
    render(
      <ComparisonModal
        comparingUpdate={{
          update: updateWithEmptyProps,
          match: matchWithEmptyProps,
        }}
        processingId="update-1"
        isSynthesizing={true}
        onClose={onClose}
        onAction={onAction}
        onStartMerge={onStartMerge}
      />,
    );
    expect(screen.getAllByText("No content.").length).toBeGreaterThan(0);
  });
});
