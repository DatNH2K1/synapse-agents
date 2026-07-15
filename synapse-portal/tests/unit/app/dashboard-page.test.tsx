import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import OverviewPage from "@/app/(dashboard)/dashboard/page";

vi.mock("@/lib/db", () => ({
  getConfig: () => ({
    user_name: "DashboardUser",
  }),
}));

vi.mock("@/lib/services/knowledge-service", () => ({
  knowledgeService: {
    getNodesWithColor: async () => [{ id: "n-1" }],
    getPendingUpdates: async () => [{ id: "u-1" }, { id: "u-2" }],
    getEdges: async () => [{ id: "e-1" }],
    getTags: async () => [{ id: "t-1" }],
    getTagEdges: async () => [{ id: "te-1" }],
    getDashboardMetrics: async () => ({
      statusCounts: [{ status: "APPROVED", count: 1 }],
      archiveCount: 0,
    }),
  },
}));

interface MockNode {
  id: string;
}

interface MockEdge {
  id: string;
}

interface MockTag {
  id: string;
}

interface OverviewPageContentProps {
  nodes: MockNode[];
  edges: MockEdge[];
  tags: MockTag[];
  tagEdges: MockEdge[];
  pendingCount: number;
  userName: string;
  dashboardMetrics: {
    statusCounts: { status: string; count: number }[];
    archiveCount: number;
  };
}

vi.mock("@/app/(dashboard)/dashboard/page_content", () => ({
  default: ({
    nodes,
    edges,
    tags,
    tagEdges,
    pendingCount,
    userName,
    dashboardMetrics,
  }: OverviewPageContentProps) => (
    <div data-testid="overview-content">
      <span>User: {userName}</span>
      <span>Nodes Count: {nodes.length}</span>
      <span>Edges Count: {edges.length}</span>
      <span>Tags Count: {tags.length}</span>
      <span>Tag Edges Count: {tagEdges.length}</span>
      <span>Pending Count: {pendingCount}</span>
      <span>Archive Count: {dashboardMetrics.archiveCount}</span>
    </div>
  ),
}));

describe("app/(dashboard)/dashboard/page", () => {
  it("should render OverviewPage server component and pass props", async () => {
    const element = await OverviewPage();
    render(element);

    expect(screen.getByTestId("overview-content")).toBeDefined();
    expect(screen.getByText("User: DashboardUser")).toBeDefined();
    expect(screen.getByText("Nodes Count: 1")).toBeDefined();
    expect(screen.getByText("Edges Count: 1")).toBeDefined();
    expect(screen.getByText("Tags Count: 1")).toBeDefined();
    expect(screen.getByText("Tag Edges Count: 1")).toBeDefined();
    expect(screen.getByText("Pending Count: 2")).toBeDefined();
    expect(screen.getByText("Archive Count: 0")).toBeDefined();
  });
});
