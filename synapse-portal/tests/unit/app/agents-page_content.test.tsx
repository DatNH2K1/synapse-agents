import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AgentsPageContent from "@/app/(dashboard)/agents/page_content";

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

vi.mock("@/components/shared/Avatar", () => ({
  default: ({ seed }: { seed: string }) => (
    <div data-testid="avatar">{seed}</div>
  ),
}));

vi.mock("@/components/landing/TiltCard", () => ({
  default: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <div data-testid="tilt-card" onClick={onClick}>
      {children}
    </div>
  ),
}));

describe("app/(dashboard)/agents/page_content", () => {
  const agents = [
    {
      name: "amelia",
      displayName: "Amelia",
      title: "Web Developer",
      icon: "💻",
      capabilities: "React, Node, CSS, HTML, Vitest, CI/CD", // 6 capabilities
      role: "Senior Fullstack Developer",
      identity: "Amelia's Identity Profile Description",
      communicationStyle: "Direct and technical",
      principles: "Keep code clean and performant",
      principlesList: ["Clean Code", "High Test Coverage"],
      module: "web-dev",
      path: "skills/web-dev/SKILL.md",
      complianceChecklist: ["Verify tests pass", "Run lint checks"],
      capabilitiesList: [
        {
          code: "CAP-01",
          description: "Write frontend UI components",
          skill: "React",
        },
        {
          code: "CAP-02",
          description: "Setup REST API endpoints",
          skill: "Express",
        },
      ],
      protocols: {
        contextLoad: "Load standard developer context files.",
        gatekeeper: "Prevent deployment without passing tests.",
      },
    },
    {
      name: "winston",
      displayName: "Winston",
      title: "System Architect",
      icon: "🏗️",
      capabilities: "Architecture, Design", // 2 capabilities (< 4)
      role: "Lead Architect",
      principles: "Principles string format only",
    },
  ];

  const skills = [
    {
      canonicalId: "skill-1",
      name: "React Development",
      description: "Build robust components",
      module: "frontend",
      path: "skills/react",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("should render agents and skills correctly", () => {
    render(<AgentsPageContent agents={agents} skills={skills} />);

    expect(screen.getByText("Amelia", { selector: "h4" })).toBeDefined();
    expect(screen.getByText("Winston", { selector: "h4" })).toBeDefined();
    expect(screen.getByText("React Development")).toBeDefined();

    // Verify capabilities count badge logic
    // Amelia has 6 capabilities, so only first 4 are shown + 'more' badge
    expect(screen.getByText("React")).toBeDefined();
    expect(screen.getByText('more_{"count":2}')).toBeDefined();

    // Winston has 2 capabilities, no 'more' badge
    expect(screen.getByText("Architecture")).toBeDefined();
  });

  it("should open detail modal when agent card is clicked and navigate tabs", () => {
    render(<AgentsPageContent agents={agents} skills={skills} />);

    // Click Amelia's card
    const ameliaCard = screen
      .getByText("Amelia", { selector: "h4" })
      .closest("[data-testid='tilt-card']")!;
    fireEvent.click(ameliaCard);

    // Modal is opened, check content
    expect(screen.getAllByText("Amelia").length).toBeGreaterThan(1); // Title + Header
    expect(
      screen.getByText("Amelia's Identity Profile Description"),
    ).toBeDefined();
    expect(screen.getByText("Clean Code")).toBeDefined();

    // Switch to Protocols tab
    const protocolsTabButton = screen.getByRole("button", {
      name: /system_protocols/i,
    });
    fireEvent.click(protocolsTabButton);

    expect(screen.getByText("Verify tests pass")).toBeDefined();
    expect(
      screen.getByText("Load standard developer context files."),
    ).toBeDefined();

    // Switch to Capabilities tab
    const capabilitiesTabButton = screen.getByRole("button", {
      name: /capabilities_tools/i,
    });
    fireEvent.click(capabilitiesTabButton);

    expect(screen.getByText("CAP-01")).toBeDefined();
    expect(screen.getByText("Write frontend UI components")).toBeDefined();

    // Close modal
    const closeButton = screen.getAllByRole("button")[0]; // X close button
    fireEvent.click(closeButton);

    // Modal should be closed
    expect(
      screen.queryByText("Amelia's Identity Profile Description"),
    ).toBeNull();
  });

  it("should handle agent with fallback principles string in modal", () => {
    render(<AgentsPageContent agents={agents} skills={skills} />);

    // Click Winston's card
    const winstonCard = screen
      .getByText("Winston", { selector: "h4" })
      .closest("[data-testid='tilt-card']")!;
    fireEvent.click(winstonCard);

    // Modal is opened
    expect(screen.getByText("Principles string format only")).toBeDefined();
  });
});
