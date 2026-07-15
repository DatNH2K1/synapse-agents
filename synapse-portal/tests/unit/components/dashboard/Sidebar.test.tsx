import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import Sidebar from "@/components/dashboard/Sidebar";

vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/components/shared/RealtimeProvider", () => ({
  useRealtime: () => ({
    pendingCount: 4,
  }),
}));

vi.mock("@/components/shared/NavItem", () => ({
  default: ({ label, badge }: { label: string; badge?: number }) => (
    <div data-testid="navitem">
      {label} {badge !== undefined && `(${badge})`}
    </div>
  ),
}));

vi.mock("@/components/LanguageSwitcher", () => ({
  default: () => <div data-testid="lang-switch">LanguageSwitcher</div>,
}));

vi.mock("@/components/shared/ThemeSwitcher", () => ({
  default: () => <div data-testid="theme-switch">ThemeSwitcher</div>,
}));

vi.mock("@/components/shared/Avatar", () => ({
  default: ({ seed }: { seed: string }) => (
    <div data-testid="avatar">Avatar {seed}</div>
  ),
}));

vi.mock("next/link", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("components/dashboard/Sidebar", () => {
  beforeEach(() => {
    cleanup();
  });

  it("should render sidebar items and use pendingCount from useRealtime", () => {
    render(<Sidebar userName="Alice" pendingCount={10} />);

    expect(screen.getByText("Alice")).toBeDefined();
    // In our mocks, useRealtime returns pendingCount: 4, so it should override the prop value 10
    expect(screen.getAllByText("the_gate (4)").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("lang-switch").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("theme-switch").length).toBeGreaterThan(0);
    expect(screen.getAllByTestId("avatar").length).toBeGreaterThan(0);
  });

  it("should open mobile more menu when clicked and close when clicked outside", () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <Sidebar userName="Alice" />
      </div>,
    );

    const btn = screen.getByText("more_button");
    fireEvent.click(btn);

    // After clicking menu button, mobile items should be rendered
    expect(screen.getAllByTestId("navitem").length).toBeGreaterThan(5); // Desktop items + Mobile items

    // Click outside
    fireEvent.mouseDown(screen.getByTestId("outside"));
    // Mobile items should be closed
    expect(screen.getAllByTestId("navitem").length).toBe(5); // Back to just desktop items
  });
});
