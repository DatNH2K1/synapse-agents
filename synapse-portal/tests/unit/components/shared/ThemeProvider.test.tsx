import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, cleanup } from "@testing-library/react";

describe("components/shared/ThemeProvider", () => {
  beforeEach(() => {
    cleanup();
    vi.stubEnv("NODE_ENV", "development");
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("should render and setup console.error filter in development", async () => {
    const origError = console.error;
    const mockConsoleError = vi.fn();
    console.error = mockConsoleError;

    const { default: ThemeProvider } =
      await import("@/components/shared/ThemeProvider");

    render(
      <ThemeProvider>
        <div data-testid="child">Test</div>
      </ThemeProvider>,
    );

    // Trigger the modified console.error
    console.error("Encountered a script tag");
    expect(mockConsoleError).not.toHaveBeenCalled();

    console.error("Some other error");
    expect(mockConsoleError).toHaveBeenCalledWith("Some other error");

    // Restore
    console.error = origError;
  });
});
