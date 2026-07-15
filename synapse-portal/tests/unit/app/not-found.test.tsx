import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import NotFound from "@/app/not-found";

vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} data-testid="next-link">
      {children}
    </a>
  ),
}));

describe("app/not-found", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      history: {
        back: vi.fn(),
      },
    });
  });

  it("should render 404 message and handle back navigation", () => {
    render(<NotFound />);

    expect(screen.getByText("404")).toBeDefined();
    expect(screen.getByText("not_found_title")).toBeDefined();
    expect(screen.getByText("not_found_desc")).toBeDefined();

    // Verify back to home link
    const homeLink = screen.getByTestId("next-link");
    expect(homeLink.getAttribute("href")).toBe("/dashboard");

    // Click Go Back button
    const backBtn = screen.getByText("go_back");
    fireEvent.click(backBtn);
    expect(window.history.back).toHaveBeenCalled();
  });
});
