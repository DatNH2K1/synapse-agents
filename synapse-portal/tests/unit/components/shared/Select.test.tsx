import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import Select from "@/components/shared/Select";

describe("components/shared/Select", () => {
  const options = [
    { value: "val-1", label: "Option 1" },
    { value: "val-2", label: "Option 2" },
  ];
  const onChange = vi.fn();

  beforeEach(() => {
    cleanup();
    onChange.mockClear();
  });

  it("should render selected option and toggle dropdown on click", () => {
    const { container } = render(
      <Select
        value="val-1"
        onChange={onChange}
        options={options}
        className="custom-select"
        icon={<span data-testid="mock-icon">★</span>}
      />,
    );

    expect(screen.getByText("Option 1")).toBeDefined();
    expect(screen.getByTestId("mock-icon")).toBeDefined();
    expect((container.firstChild as HTMLElement).className).toContain(
      "custom-select",
    );

    // Dropdown should be hidden initially
    expect(screen.queryByText("Option 2")).toBeNull();

    // Click to open dropdown
    const selectBtn = screen.getByRole("button");
    fireEvent.click(selectBtn);

    expect(screen.getByText("Option 2")).toBeDefined();

    // Click again to close
    fireEvent.click(selectBtn);
    expect(screen.queryByText("Option 2")).toBeNull();
  });

  it("should select option and close dropdown when option clicked", () => {
    render(<Select value="val-1" onChange={onChange} options={options} />);

    // Open dropdown
    fireEvent.click(screen.getByRole("button"));

    // Click option 2
    const opt2Btn = screen.getByText("Option 2");
    fireEvent.click(opt2Btn);

    expect(onChange).toHaveBeenCalledWith("val-2");
    // Dropdown should close after select
    expect(screen.queryByText("Option 2")).toBeNull();
  });

  it("should close dropdown when clicked outside", () => {
    render(
      <div>
        <div data-testid="outside-element">Outside</div>
        <Select value="val-1" onChange={onChange} options={options} />
      </div>,
    );

    // Open dropdown
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Option 2")).toBeDefined();

    // Trigger mousedown outside
    fireEvent.mouseDown(screen.getByTestId("outside-element"));
    expect(screen.queryByText("Option 2")).toBeNull();
  });

  it("should not close dropdown when clicked inside the select container", () => {
    const { container } = render(
      <Select value="val-1" onChange={onChange} options={options} />,
    );

    // Open dropdown
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText("Option 2")).toBeDefined();

    // Trigger mousedown inside the container
    fireEvent.mouseDown(container.querySelector(".relative")!);
    expect(screen.getByText("Option 2")).toBeDefined();
  });

  it("should fallback to options[0] if value matches no option", () => {
    render(
      <Select value="nonexistent" onChange={onChange} options={options} />,
    );
    expect(screen.getByText("Option 1")).toBeDefined();
  });
});
