import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import OverviewPageContent from "@/app/(dashboard)/dashboard/page_content";
import { Node, Edge, Tag } from "@/lib/db";

vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (params) {
        return `${key}_${JSON.stringify(params)}`;
      }
      return key;
    },
  }),
}));

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

vi.mock("@/components/shared/RealtimeProvider", () => ({
  useRealtime: () => ({
    subscribeToUpdates: (cb: () => void) => {
      cb();
      return vi.fn();
    },
  }),
}));

vi.mock("@/components/shared/StatCard", () => ({
  default: ({ label, value }: { label: string; value: number }) => (
    <div data-testid="stat-card">
      <span>
        {label}: {value}
      </span>
    </div>
  ),
}));

vi.mock("@/components/dashboard/OverviewCharts", () => ({
  default: () => <div data-testid="overview-charts" />,
}));

vi.mock("@/components/dashboard/KnowledgeAtlas", () => ({
  default: () => <div data-testid="knowledge-atlas" />,
}));

describe("app/(dashboard)/dashboard/page_content", () => {
  const nodes: (Node & { tags?: Tag[]; color?: string })[] = [
    {
      id: "node-1",
      label: "Node 1",
      type: "LESSON",
      content_hash: "h-1",
      success_count: 5,
      last_verified: new Date("2026-06-01T00:00:00.000Z"),
      properties: JSON.stringify({ content: "Lesson content details" }),
      status: "APPROVED",
      embeddingModel: "model-1",
      memory_tier: "short_term",
      tags: [
        {
          id: "tag-1",
          scope: "agent",
          name: "synapse-agent-amelia",
          version: "1.0",
          color: "#ff0000",
          virtual_clock: 0,
        },
        {
          id: "tag-2",
          scope: "agent",
          name: "winston",
          version: "1.0",
          color: "#00ff00",
          virtual_clock: 0,
        },
        {
          id: "tag-3",
          scope: "technology",
          name: "react",
          version: "18.0",
          color: "#0000ff",
          virtual_clock: 0,
        },
        {
          id: "tag-4",
          scope: "global",
          name: "common",
          version: "1.0",
          color: "#ffffff",
          virtual_clock: 0,
        },
        {
          id: "tag-5",
          scope: "other_scope",
          name: "custom",
          version: "1.0",
          color: "#888888",
          virtual_clock: 0,
        },
      ],
    },
    {
      id: "node-2",
      label: "Node 2",
      type: "CONCEPT",
      content_hash: "h-2",
      success_count: 2,
      last_verified: new Date("2026-06-02T00:00:00.000Z"),
      properties: JSON.stringify({ content: "Concept content details" }),
      status: "APPROVED",
      embeddingModel: "model-1",
      memory_tier: "short_term",
      tags: [],
    },
    {
      id: "node-3",
      label: "Node Lesson with a very long label name",
      type: "LESSON",
      content_hash: "h-3",
      success_count: 10,
      last_verified: new Date("2026-06-03T00:00:00.000Z"),
      properties: JSON.stringify({ content: "Another Lesson" }),
      status: "APPROVED",
      embeddingModel: "model-1",
      memory_tier: "short_term",
      color: "#ff00ff",
      tags: [
        {
          id: "tag-2",
          scope: "agent",
          name: "winston",
          version: "1.0",
          color: "#00ff00",
          virtual_clock: 0,
        },
      ],
    },
  ];

  const edges: Edge[] = [
    {
      id: 1,
      from_id: "node-1",
      to_id: "node-2",
      relation_type: "RELATES",
      properties: "{}",
    },
  ];

  const tags: Tag[] = [
    {
      id: "tag-1",
      scope: "agent",
      name: "am Amelia",
      version: "1.0",
      color: "#ff0000",
      virtual_clock: 0,
    },
    {
      id: "tag-4",
      scope: "global",
      name: "common",
      version: "1.0",
      color: "#ffffff",
      virtual_clock: 0,
    },
  ];

  const tagEdges: Edge[] = [
    {
      id: 2,
      from_id: "node-1",
      to_id: "tag-1",
      relation_type: "TAGGED",
      properties: "{}",
    },
    {
      id: 3,
      from_id: "invalid-node",
      to_id: "tag-1",
      relation_type: "TAGGED",
      properties: "{}",
    }, // invalid edge
  ];

  const dashboardMetrics = {
    statusCounts: [
      { status: "APPROVED", count: 2 },
      { status: "PENDING", count: 0 },
    ],
    archiveCount: 1,
  };

  beforeEach(() => {
    mockRefresh.mockClear();
  });

  it("should render stats, charts, and graph atlas properly with correct calculations", () => {
    render(
      <OverviewPageContent
        nodes={nodes}
        edges={edges}
        tags={tags}
        tagEdges={tagEdges}
        pendingCount={3}
        userName="John Doe"
        dashboardMetrics={dashboardMetrics}
      />,
    );

    expect(screen.getByText("hello,")).toBeDefined();
    expect(screen.getByText("John Doe")).toBeDefined();

    const statCards = screen.getAllByTestId("stat-card");
    expect(statCards.length).toBe(3);

    expect(screen.getByTestId("overview-charts")).toBeDefined();
    expect(screen.getByTestId("knowledge-atlas")).toBeDefined();

    expect(mockRefresh).toHaveBeenCalled();
  });

  it("should handle missing statusCounts in dashboardMetrics gracefully", () => {
    const incompleteMetrics = {
      statusCounts: undefined as unknown as { status: string; count: number }[],
      archiveCount: 0,
    };

    render(
      <OverviewPageContent
        nodes={nodes}
        edges={edges}
        tags={tags}
        tagEdges={tagEdges}
        pendingCount={1}
        userName="Jane Doe"
        dashboardMetrics={incompleteMetrics}
      />,
    );

    expect(screen.getByText("Jane Doe")).toBeDefined();
  });
});
