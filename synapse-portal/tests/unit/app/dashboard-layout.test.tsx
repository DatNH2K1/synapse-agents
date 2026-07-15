import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import DashboardLayout from "@/app/(dashboard)/layout";

vi.mock("@/lib/db", () => ({
  getConfig: () => ({
    user_name: "DashboardUser",
  }),
}));

vi.mock("@/lib/services/knowledge-service", () => ({
  knowledgeService: {
    getPendingUpdates: async () => [{ id: "u-1" }, { id: "u-2" }],
  },
}));

interface SidebarProps {
  userName: string;
  pendingCount: number;
}

vi.mock("@/components/dashboard/Sidebar", () => ({
  default: ({ userName, pendingCount }: SidebarProps) => (
    <div data-testid="sidebar">
      <span>User: {userName}</span>
      <span>Pending: {pendingCount}</span>
    </div>
  ),
}));

describe("app/(dashboard)/layout", () => {
  it("should render DashboardLayout with Sidebar and children", async () => {
    const element = await DashboardLayout({
      children: <div data-testid="dashboard-children">Main Dashboard View</div>,
    });
    render(element);

    expect(screen.getByTestId("sidebar")).toBeDefined();
    expect(screen.getByText("User: DashboardUser")).toBeDefined();
    expect(screen.getByText("Pending: 2")).toBeDefined();
    expect(screen.getByTestId("dashboard-children")).toBeDefined();
    expect(screen.getByText("Main Dashboard View")).toBeDefined();
  });
});
