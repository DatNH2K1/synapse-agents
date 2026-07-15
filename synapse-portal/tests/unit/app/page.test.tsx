import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import LandingPage from "@/app/page";

interface AgentUI {
  name: string;
  seed: string;
  title: string;
  icon: string;
  desc: string;
}

interface LandingPageContentProps {
  userName: string;
  nodesCount: number;
  lessonCount: number;
  pendingCount: number;
  tagsCount: number;
  agents: AgentUI[];
}

vi.mock("@/lib/db", () => ({
  getConfig: () => ({
    user_name: "TestUser",
  }),
}));

vi.mock("@/lib/services/manifest-service", () => ({
  manifestService: {
    getAgents: () => [
      {
        name: "agent-1",
        displayName: "Sally Agent",
        title: "Sally",
        icon: "user",
        role: "UX Designer",
      },
      {
        name: "agent-2",
        title: "Winston",
        icon: "cpu",
        capabilities: "Architecture",
      },
    ],
  },
}));

vi.mock("@/lib/services/knowledge-service", () => ({
  knowledgeService: {
    getNodesWithColor: async () => [
      { id: "1", type: "LESSON", label: "Lesson A" },
      { id: "2", type: "CONCEPT", label: "Concept B" },
    ],
    getPendingUpdates: async () => [
      { id: "u-1" },
      { id: "u-2" },
      { id: "u-3" },
    ],
    getTags: async () => [{ id: "t-1" }],
  },
}));

vi.mock("@/components/landing/LandingPageContent", () => ({
  default: ({
    userName,
    nodesCount,
    lessonCount,
    pendingCount,
    tagsCount,
    agents,
  }: LandingPageContentProps) => (
    <div data-testid="landing-content">
      <span>User: {userName}</span>
      <span>Nodes: {nodesCount}</span>
      <span>Lessons: {lessonCount}</span>
      <span>Pending: {pendingCount}</span>
      <span>Tags: {tagsCount}</span>
      <span>Agents count: {agents.length}</span>
    </div>
  ),
}));

describe("app/page", () => {
  it("should render LandingPage as a Server Component", async () => {
    const element = await LandingPage();
    render(element);

    expect(screen.getByTestId("landing-content")).toBeDefined();
    expect(screen.getByText("User: TestUser")).toBeDefined();
    expect(screen.getByText("Nodes: 2")).toBeDefined();
    expect(screen.getByText("Lessons: 1")).toBeDefined();
    expect(screen.getByText("Pending: 3")).toBeDefined();
    expect(screen.getByText("Tags: 1")).toBeDefined();
    expect(screen.getByText("Agents count: 2")).toBeDefined();
  });
});
