import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ProposalCard from "@/components/gate/ProposalCard";
import { PendingUpdate, NodeWithTags } from "@/components/gate/types";

vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (key === "duplicate_detected" && params) {
        return `duplicate_detected_${params.score}`;
      }
      if (key === "similar_to" && params) {
        return `similar_to_${params.label}`;
      }
      return key;
    },
  }),
}));

vi.mock("@/lib/format-utils", () => ({
  formatFullTag: (scope: string, name: string, version?: string) =>
    `${scope}:${name}${version ? `@${version}` : ""}`,
}));

describe("components/gate/ProposalCard", () => {
  const mockUpdate: PendingUpdate = {
    id: "update-1",
    label: "Proposed Item",
    type: "Feature",
    status: "PENDING",
    last_verified: "2026-06-04T12:00:00Z",
    properties: JSON.stringify({ content: "Description of proposed item." }),
    tags: [
      {
        id: "tag-1",
        scope: "agent",
        name: "winston",
        version: null,
        color: "#ff0000",
      },
    ],
    matches: [{ id: "node-1", label: "Existing Item", score: 0.9 }],
  };

  const mockExistingNodes: NodeWithTags[] = [
    {
      id: "node-1",
      label: "Existing Item",
      type: "Feature",
      content_hash: "hash-1",
      success_count: 1,
      last_verified: new Date(),
      properties: JSON.stringify({ content: "Existing item content." }),
      status: "APPROVED",
      memory_tier: "CORE",
      embeddingModel: "text-embedding-3-small",
      tags: [],
    },
  ];

  const onAction = vi.fn();
  const onStartMerge = vi.fn();
  const onCompare = vi.fn();

  beforeEach(() => {
    cleanup();
    onAction.mockClear();
    onStartMerge.mockClear();
    onCompare.mockClear();
  });

  it("should render ProposalCard details and match info, and trigger click handlers", () => {
    render(
      <ProposalCard
        update={mockUpdate}
        existingNodes={mockExistingNodes}
        processingId={null}
        isSynthesizing={false}
        onAction={onAction}
        onStartMerge={onStartMerge}
        onCompare={onCompare}
      />,
    );

    expect(screen.getByText("Proposed Item")).toBeDefined();
    expect(screen.getByText("Description of proposed item.")).toBeDefined();
    expect(screen.getByText("duplicate_detected_90")).toBeDefined();
    expect(screen.getByText("similar_to_Existing Item")).toBeDefined();

    // Click Approve
    const approveBtn = screen.getByText(
      (_, el) =>
        el?.tagName === "BUTTON" && el.querySelector(".lucide-check") !== null,
    );
    fireEvent.click(approveBtn);
    expect(onAction).toHaveBeenCalledWith("update-1", "APPROVE");

    // Click Reject
    const rejectBtn = screen.getByText(
      (_, el) =>
        el?.tagName === "BUTTON" &&
        el.querySelector(".lucide-trash-2") !== null,
    );
    fireEvent.click(rejectBtn);
    expect(onAction).toHaveBeenCalledWith("update-1", "REJECT");

    // Click Merge
    const mergeBtn = screen.getByText(
      (_, el) =>
        el?.tagName === "BUTTON" &&
        el.querySelector(".lucide-git-merge") !== null,
    );
    fireEvent.click(mergeBtn);
    expect(onStartMerge).toHaveBeenCalledWith(mockUpdate, mockExistingNodes);

    // Click Compare
    const compareBtn = screen.getByText("compare");
    fireEvent.click(compareBtn);
    expect(onCompare).toHaveBeenCalledWith(mockUpdate, mockExistingNodes[0]);
  });

  it("should render ProposalCard with loading state, no description, low similarity score, and fallbacks", () => {
    const updateWithEmptyTagsAndProps: PendingUpdate = {
      ...mockUpdate,
      properties: "",
      tags: [],
      matches: [
        { id: "node-nonexistent", label: "Non-existent Item", score: 0.7 },
      ],
    };
    render(
      <ProposalCard
        update={updateWithEmptyTagsAndProps}
        existingNodes={mockExistingNodes}
        processingId="update-1"
        isSynthesizing={true}
        onAction={onAction}
        onStartMerge={onStartMerge}
        onCompare={onCompare}
      />,
    );
    expect(screen.getByText("No description provided.")).toBeDefined();
    expect(screen.getByText("duplicate_detected_70")).toBeDefined();
    expect(screen.getByText("similar_to_Non-existent Item")).toBeDefined();
  });
});
