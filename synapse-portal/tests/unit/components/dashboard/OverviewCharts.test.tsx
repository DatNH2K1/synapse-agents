import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import OverviewCharts from "@/components/dashboard/OverviewCharts";

vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (key === "archive_merges" && params) {
        return `archive_merges_${params.count}`;
      }
      return key;
    },
  }),
}));

let isMountedMockVal = true;
vi.mock("@/lib/hooks", () => ({
  useIsMounted: () => isMountedMockVal,
}));

vi.mock("recharts", () => {
  const Dummy = ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  );
  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    AreaChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="area-chart">{children}</div>
    ),
    Area: Dummy,
    XAxis: Dummy,
    YAxis: Dummy,
    CartesianGrid: Dummy,
    Tooltip: Dummy,
    BarChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="bar-chart">{children}</div>
    ),
    Bar: Dummy,
    Cell: Dummy,
    PieChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="pie-chart">{children}</div>
    ),
    Pie: Dummy,
    Legend: ({
      formatter,
    }: {
      formatter?: (value: string) => React.ReactNode;
    }) => <div>{formatter ? formatter("mock-legend-val") : null}</div>,
  };
});

describe("components/dashboard/OverviewCharts", () => {
  const growthData = [{ date: "2026-06-01", count: 10 }];
  const distributionData = [{ name: "Scope 1", value: 5, color: "#ff0000" }];
  const typeDistributionData = [{ name: "Type 1", value: 3, color: "#00ff00" }];
  const topLessonsData = [{ name: "Lesson 1", value: 90 }];
  const agentContributionData = [
    { name: "Agent 1", value: 8, color: "#0000ff" },
  ];
  const statusDistributionData = [
    { name: "Merged", value: 12, color: "#8884d8" },
  ];

  beforeEach(() => {
    cleanup();
    isMountedMockVal = true;
  });

  it("should render charts with correct headers and data keys when mounted", () => {
    render(
      <OverviewCharts
        growthData={growthData}
        distributionData={distributionData}
        typeDistributionData={typeDistributionData}
        topLessonsData={topLessonsData}
        agentContributionData={agentContributionData}
        statusDistributionData={statusDistributionData}
        archiveCount={4}
      />,
    );

    expect(screen.getByText("node_growth")).toBeDefined();
    expect(screen.getByText("knowledge_distribution")).toBeDefined();
    expect(screen.getByText("knowledge_type")).toBeDefined();
    expect(screen.getByText("efficacy_lessons")).toBeDefined();
    expect(screen.getByText("agent_contributions")).toBeDefined();
    expect(screen.getByText("approval_and_evolution")).toBeDefined();
    expect(screen.getByText("archive_merges_4")).toBeDefined();

    // Check Recharts mock wrapper divs
    expect(
      screen.getAllByTestId("responsive-container").length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByTestId("area-chart").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("bar-chart").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("pie-chart").length).toBeGreaterThan(0);
  });

  it("should render loading skeletons when not mounted", () => {
    isMountedMockVal = false;
    render(
      <OverviewCharts
        growthData={[]}
        distributionData={[]}
        typeDistributionData={[]}
        topLessonsData={[]}
        agentContributionData={[]}
        statusDistributionData={[]}
        archiveCount={0}
      />,
    );
    expect(screen.queryByText("node_growth")).toBeNull();
  });

  it("should render fallback messages when top lessons and agent contributions are empty", () => {
    render(
      <OverviewCharts
        growthData={growthData}
        distributionData={distributionData}
        typeDistributionData={typeDistributionData}
        topLessonsData={[]}
        agentContributionData={[]}
        statusDistributionData={statusDistributionData}
        archiveCount={0}
      />,
    );
    expect(screen.getByText("no_success_lessons_data")).toBeDefined();
    expect(screen.getByText("no_agent_contributions")).toBeDefined();
  });
});
