import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import LanguageSwitcher from "@/components/LanguageSwitcher";

let mockLocale = "en";
const mockSetLocale = vi.fn();
vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({
    locale: mockLocale,
    setLocale: mockSetLocale,
    t: (key: string) => key,
  }),
}));

describe("components/LanguageSwitcher", () => {
  beforeEach(() => {
    cleanup();
    mockSetLocale.mockClear();
  });

  it("should render and display current language", () => {
    render(<LanguageSwitcher />);

    expect(screen.getByText("English")).toBeDefined();
    expect(screen.getByText("EN")).toBeDefined();
    expect(screen.queryByText("Tiếng Việt")).toBeNull();

    // Toggle dropdown
    const btn = screen.getByRole("button");
    fireEvent.click(btn);

    expect(screen.getByText("Tiếng Việt")).toBeDefined();

    // Select Tiếng Việt
    const viBtn = screen.getByText("Tiếng Việt");
    fireEvent.click(viBtn);
    expect(mockSetLocale).toHaveBeenCalledWith("vi");
  });

  it("should close dropdown when clicking outside", () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <LanguageSwitcher />
      </div>,
    );

    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    expect(screen.getByText("Tiếng Việt")).toBeDefined();

    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByText("Tiếng Việt")).toBeNull();
  });

  it("should fallback to English if locale is not supported", () => {
    mockLocale = "fr";
    render(<LanguageSwitcher />);
    expect(screen.getByText("English")).toBeDefined();
    mockLocale = "en";
  });
});
