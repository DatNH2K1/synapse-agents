import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import FormSelect from "@/components/shared/FormSelect";

describe("components/shared/FormSelect", () => {
  const options = [
    { value: "opt1", label: "Option 1" },
    { value: "opt2", label: "Option 2" },
  ];

  it("should render select options and label", () => {
    cleanup();
    render(
      <FormSelect
        label="Choose option"
        options={options}
        defaultValue="opt1"
      />,
    );

    expect(screen.getByText("Choose option")).toBeDefined();
    expect(screen.getByText("Option 1")).toBeDefined();
  });

  it("should fire onChange event when select option changes", () => {
    cleanup();
    const handleChange = vi.fn();
    render(
      <FormSelect
        options={options}
        defaultValue="opt1"
        onChange={handleChange}
      />,
    );

    // The select is closed initially, clicking the button triggers open
    const triggerButton = screen.getByRole("button");
    fireEvent.click(triggerButton);

    // Now both options should be visible
    const option2 = screen.getByText("Option 2");
    fireEvent.click(option2);

    expect(handleChange).toHaveBeenCalledWith(
      expect.objectContaining({
        target: { value: "opt2" },
      }),
    );
  });
});
