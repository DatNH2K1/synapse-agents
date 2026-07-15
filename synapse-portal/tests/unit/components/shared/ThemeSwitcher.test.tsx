import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ThemeSwitcher from "@/components/shared/ThemeSwitcher";

const mockSetTheme = vi.fn();
vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "midnight",
    setTheme: mockSetTheme,
  }),
}));

vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/lib/hooks", () => ({
  useIsMounted: () => true,
}));

describe("components/shared/ThemeSwitcher", () => {
  beforeEach(() => {
    cleanup();
    mockSetTheme.mockClear();
  });

  it("should render current theme and toggle dropdown", () => {
    render(<ThemeSwitcher />);

    // Find the toggle button
    const btn = screen.getByRole("button");
    expect(screen.getByText("Midnight")).toBeDefined();

    // Dropdown should be closed initially, Arctic theme options not visible
    expect(screen.queryByText("Arctic")).toBeNull();

    // Click button to open dropdown
    fireEvent.click(btn);
    expect(screen.getByText("Arctic")).toBeDefined();

    // Click button to close
    fireEvent.click(btn);
    expect(screen.queryByText("Arctic")).toBeNull();
  });

  it("should change theme and close dropdown on selection", () => {
    render(<ThemeSwitcher />);

    const btn = screen.getByRole("button");
    fireEvent.click(btn);

    // Select Neon theme
    const neonBtn = screen.getByText("Neon");
    fireEvent.click(neonBtn);

    expect(mockSetTheme).toHaveBeenCalledWith("neon");
    expect(screen.queryByText("Neon")).toBeNull(); // Closed
  });

  it("should close dropdown when clicking outside", () => {
    render(
      <div>
        <div data-testid="outside">Outside Element</div>
        <ThemeSwitcher />
      </div>,
    );

    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    expect(screen.getByText("Arctic")).toBeDefined();

    // Click outside
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByText("Arctic")).toBeNull();
  });
});
