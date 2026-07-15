import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import StatCard from "@/components/shared/StatCard";

describe("components/shared/StatCard", () => {
  it("should render icon, label, and value", () => {
    cleanup();
    render(
      <StatCard
        label="Total Requests"
        value={150}
        icon={<span data-testid="mock-icon">📊</span>}
      />,
    );

    expect(screen.getByText("Total Requests")).toBeDefined();
    expect(screen.getByText("150")).toBeDefined();
    expect(screen.getByTestId("mock-icon")).toBeDefined();
  });
});
