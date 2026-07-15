import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import NavItem from "@/components/shared/NavItem";

let mockPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className} data-testid="nav-link">
      {children}
    </a>
  ),
}));

describe("components/shared/NavItem", () => {
  beforeEach(() => {
    cleanup();
  });

  it("should render NavItem and match pathname", () => {
    mockPathname = "/dashboard";
    render(
      <NavItem
        icon={<span data-testid="icon">🏠</span>}
        label="Dashboard"
        href="/dashboard"
        badge={5}
      />,
    );

    const link = screen.getByTestId("nav-link");
    expect(link.getAttribute("href")).toBe("/dashboard");
    expect(screen.getByText("Dashboard")).toBeDefined();
    expect(screen.getByTestId("icon")).toBeDefined();
    expect(screen.getByText("5")).toBeDefined();
    expect(link.className).toContain("bg-accent-primary"); // Active class
  });

  it("should render inactive NavItem when paths do not match", () => {
    mockPathname = "/other";
    render(
      <NavItem icon={<span>🏠</span>} label="Dashboard" href="/dashboard" />,
    );

    const link = screen.getByTestId("nav-link");
    expect(link.className).toContain("text-dashboard-fg/55"); // Inactive class
  });

  it("should render compact mode NavItem", () => {
    mockPathname = "/dashboard";
    render(
      <NavItem
        icon={<span>🏠</span>}
        label="Dashboard"
        href="/dashboard"
        compact
        badge={2}
      />,
    );

    const link = screen.getByTestId("nav-link");
    expect(link.className).toContain("w-auto");
  });
});
