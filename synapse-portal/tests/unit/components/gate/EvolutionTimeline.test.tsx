import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import EvolutionTimeline from "@/components/gate/EvolutionTimeline";
import { TimelineLog } from "@/components/gate/types";

vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string, _params?: Record<string, string | number>) => {
      if (key === "merge_metadata") return "Merge Metadata";
      if (key === "reason_label") return "Reason:";
      if (key === "similarity_score_label") return "Similarity:";
      if (key === "undo") return "Undo";
      if (key === "no_history_found") return "No History Found";
      return key;
    },
  }),
}));

vi.mock("@/lib/format-utils", () => ({
  formatFullTag: (scope: string, name: string, version?: string) =>
    `${scope}:${name}${version ? `@${version}` : ""}`,
}));

describe("components/gate/EvolutionTimeline", () => {
  const mockLogs: TimelineLog[] = [
    {
      id: "log-1",
      label: "Approved Node",
      type: "Feature",
      status: "APPROVED",
      memory_tier: "CORE",
      properties: JSON.stringify({ content: "Approved details." }),
      last_verified: "2026-06-01T12:00:00Z",
      tags: [
        {
          id: "tag-1",
          scope: "agent",
          name: "winston",
          color: "#ff0000",
          version: "1",
        },
      ],
      archiveDetail: null,
    },
    {
      id: "log-2",
      label: "Rejected Node",
      type: "Concept",
      status: "REJECTED",
      memory_tier: "COLD",
      properties: JSON.stringify({ content: "Rejected details." }),
      last_verified: "2026-06-02T12:00:00Z",
      tags: [],
      archiveDetail: null,
    },
    {
      id: "log-3",
      label: "Merged Node",
      type: "Task",
      status: "ARCHIVE",
      memory_tier: "ACTIVE",
      properties: JSON.stringify({ content: "Merged details." }),
      last_verified: "2026-06-03T12:00:00Z",
      tags: [],
      archiveDetail: {
        toNodeId: "node-master",
        reason: "Exact duplicate.",
        similarityScore: 0.95,
        mergedAt: "2026-06-03T12:30:00Z",
      },
    },
  ];

  const setSearchQuery = vi.fn();
  const setStatusFilter = vi.fn();
  const onUndo = vi.fn();

  beforeEach(() => {
    cleanup();
    setSearchQuery.mockClear();
    setStatusFilter.mockClear();
    onUndo.mockClear();
  });

  it("should render list of logs and handle filters/search clicks", () => {
    render(
      <EvolutionTimeline
        logs={mockLogs}
        isLoadingLogs={false}
        searchQuery=""
        setSearchQuery={setSearchQuery}
        statusFilter="ALL"
        setStatusFilter={setStatusFilter}
        undoingId={null}
        onUndo={onUndo}
      />,
    );

    expect(screen.getByText("Approved Node")).toBeDefined();
    expect(screen.getByText("Rejected Node")).toBeDefined();
    expect(screen.getByText("Merged Node")).toBeDefined();
    expect(screen.getByText("Reason:")).toBeDefined();
    expect(screen.getByText("Exact duplicate.")).toBeDefined();

    // Click filter buttons
    fireEvent.click(screen.getByText("approved_status"));
    expect(setStatusFilter).toHaveBeenCalledWith("APPROVED");

    // Type in search bar
    const searchInput = screen.getByPlaceholderText("all_actions...");
    fireEvent.change(searchInput, { target: { value: "search term" } });
    expect(setSearchQuery).toHaveBeenCalledWith("search term");

    // Click Undo
    const undoButtons = screen.getAllByText("Undo");
    fireEvent.click(undoButtons[0]);
    expect(onUndo).toHaveBeenCalledWith("log-1", "APPROVED");
  });

  it("should show loader if isLoadingLogs is true", () => {
    render(
      <EvolutionTimeline
        logs={mockLogs}
        isLoadingLogs={true}
        searchQuery=""
        setSearchQuery={setSearchQuery}
        statusFilter="ALL"
        setStatusFilter={setStatusFilter}
        undoingId={null}
        onUndo={onUndo}
      />,
    );

    expect(screen.getByText("Loading Evolution Logs...")).toBeDefined();
  });

  it("should show empty history state if filtered logs are empty", () => {
    render(
      <EvolutionTimeline
        logs={[]}
        isLoadingLogs={false}
        searchQuery=""
        setSearchQuery={setSearchQuery}
        statusFilter="ALL"
        setStatusFilter={setStatusFilter}
        undoingId={null}
        onUndo={onUndo}
      />,
    );

    expect(screen.getByText("No History Found")).toBeDefined();
  });
});
