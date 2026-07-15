import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import RootLayout from "@/app/layout";

vi.mock("@/lib/i18n", () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="i18n">{children}</div>
  ),
}));

vi.mock("@/components/shared/ThemeProvider", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="theme">{children}</div>
  ),
}));

vi.mock("@/components/shared/RealtimeProvider", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="realtime">{children}</div>
  ),
}));

describe("app/layout", () => {
  it("should render RootLayout with children and providers", () => {
    render(
      <RootLayout>
        <div data-testid="test-child">Child Content</div>
      </RootLayout>,
    );

    expect(screen.getByTestId("theme")).toBeDefined();
    expect(screen.getByTestId("i18n")).toBeDefined();
    expect(screen.getByTestId("realtime")).toBeDefined();
    expect(screen.getByTestId("test-child")).toBeDefined();
  });
});
