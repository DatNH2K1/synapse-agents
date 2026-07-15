import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import MergeModal from "@/components/gate/MergeModal";
import { MergeData } from "@/components/gate/types";

vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/lib/format-utils", () => ({
  formatFullTag: (scope: string, name: string, version?: string) =>
    `${scope}:${name}${version ? `@${version}` : ""}`,
}));

vi.mock("@/lib/constants", () => ({
  NODE_TYPES: ["Feature", "Concept"],
}));

describe("components/gate/MergeModal", () => {
  const mockMergeData: MergeData = {
    sourceNodeIds: ["node-1", "node-2"],
    proposalId: "prop-123",
    sourceNodes: [
      {
        id: "node-1",
        label: "Node A",
        type: "Feature",
        content: "Details A",
        isProposal: true,
      },
      {
        id: "node-2",
        label: "Node B",
        type: "Feature",
        content: "Details B",
        isProposal: false,
      },
    ],
    label: "Merged Label",
    type: "Feature",
    content: "Synthesized content",
    allTags: [
      {
        id: "tag-1",
        scope: "agent",
        name: "winston",
        version: null,
        color: "#ff0000",
      },
      {
        id: "tag-2",
        scope: "project",
        name: "synapse",
        version: null,
        color: "#00ff00",
      },
    ],
    selectedTagIds: ["tag-1"],
    reason: "Duplicate concept",
    similarityScore: 0.88,
  };

  const onClose = vi.fn();
  const onConfirm = vi.fn();
  const onUpdateMergeData = vi.fn();

  beforeEach(() => {
    cleanup();
    onClose.mockClear();
    onConfirm.mockClear();
    onUpdateMergeData.mockClear();
  });

  it("should render modal form inputs and handle change updates", () => {
    render(
      <MergeModal
        mergeData={mockMergeData}
        processingId={null}
        onClose={onClose}
        onConfirm={onConfirm}
        onUpdateMergeData={onUpdateMergeData}
      />,
    );

    expect(screen.getByText("knowledge_synthesis")).toBeDefined();
    expect(screen.getByDisplayValue("Merged Label")).toBeDefined();
    expect(screen.getByDisplayValue("Synthesized content")).toBeDefined();
    expect(screen.getByDisplayValue("Duplicate concept")).toBeDefined();

    // Trigger label change
    const labelInput = screen.getByDisplayValue("Merged Label");
    fireEvent.change(labelInput, { target: { value: "New Merged Label" } });
    expect(onUpdateMergeData).toHaveBeenCalledWith(
      expect.objectContaining({ label: "New Merged Label" }),
    );

    // Trigger type change
    const typeLabel = screen.getByText("type_label");
    const selectContainer = typeLabel.nextElementSibling;
    const typeTrigger = selectContainer?.querySelector("button");
    if (!typeTrigger) throw new Error("Could not find type trigger button");
    fireEvent.click(typeTrigger);

    const conceptOption = screen.getByText("Concept");
    fireEvent.click(conceptOption);
    expect(onUpdateMergeData).toHaveBeenCalledWith(
      expect.objectContaining({ type: "Concept" }),
    );

    // Trigger content change
    const contentTextarea = screen.getByDisplayValue("Synthesized content");
    fireEvent.change(contentTextarea, {
      target: { value: "New synthesized details" },
    });
    expect(onUpdateMergeData).toHaveBeenCalledWith(
      expect.objectContaining({ content: "New synthesized details" }),
    );

    // Trigger reason change
    const reasonInput = screen.getByDisplayValue("Duplicate concept");
    fireEvent.change(reasonInput, { target: { value: "New reason info" } });
    expect(onUpdateMergeData).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "New reason info" }),
    );

    // Trigger tag toggle (select tag-2 to add it)
    const tag2Btn = screen.getByText("project:synapse");
    fireEvent.click(tag2Btn);
    expect(onUpdateMergeData).toHaveBeenCalledWith(
      expect.objectContaining({ selectedTagIds: ["tag-1", "tag-2"] }),
    );

    // Trigger tag toggle (select tag-1 to remove it)
    const tag1Btn = screen.getByText("agent:winston");
    fireEvent.click(tag1Btn);
    expect(onUpdateMergeData).toHaveBeenCalledWith(
      expect.objectContaining({ selectedTagIds: [] }),
    );

    // Click Confirm
    fireEvent.click(screen.getByText("confirm_merge"));
    expect(onConfirm).toHaveBeenCalled();

    // Click Cancel
    fireEvent.click(screen.getByText("cancel"));
    expect(onClose).toHaveBeenCalled();
  });
});
