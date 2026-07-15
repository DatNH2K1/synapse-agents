import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import LandingPageContent, {
  Agent,
} from "@/components/landing/LandingPageContent";

vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (key === "welcome_back" && params) {
        return `welcome_back_${params.name}`;
      }
      return key;
    },
  }),
}));

vi.mock("@/components/shared/Avatar", () => ({
  default: ({ seed }: { seed: string }) => (
    <div data-testid={`avatar-${seed}`}>Avatar {seed}</div>
  ),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} data-testid="link-element">
      {children}
    </a>
  ),
}));

describe("components/landing/LandingPageContent", () => {
  const mockAgents: Agent[] = [
    {
      name: "Winston",
      seed: "winston",
      title: "Architect",
      icon: "📐",
      desc: "System architect",
    },
    {
      name: "Sally",
      seed: "sally",
      title: "UX Designer",
      icon: "🎨",
      desc: "UX designer",
    },
  ];

  beforeEach(() => {
    cleanup();
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  it("should render landing page elements with correct numbers and user info", () => {
    render(
      <LandingPageContent
        userName="TestUser"
        nodesCount={10}
        lessonCount={5}
        pendingCount={2}
        tagsCount={7}
        agents={mockAgents}
      />,
    );

    expect(screen.getByText("welcome_back_TestUser")).toBeDefined();
    expect(screen.getByText("10")).toBeDefined();
    expect(screen.getByText("5")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("7")).toBeDefined();

    // Check agents rendered
    expect(screen.getByText("Winston")).toBeDefined();
    expect(screen.getByText("Sally")).toBeDefined();
    expect(screen.getByTestId("avatar-winston")).toBeDefined();
    expect(screen.getByTestId("avatar-sally")).toBeDefined();
  });
});
