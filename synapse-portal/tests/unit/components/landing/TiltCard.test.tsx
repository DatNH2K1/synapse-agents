import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, fireEvent, cleanup } from "@testing-library/react";
import TiltCard from "@/components/landing/TiltCard";

describe("components/landing/TiltCard", () => {
  beforeEach(() => {
    cleanup();
    vi.useFakeTimers();
    // Stub requestAnimationFrame
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render children", () => {
    const { getByText } = render(
      <TiltCard>
        <div>Test Child</div>
      </TiltCard>,
    );
    expect(getByText("Test Child")).toBeDefined();
  });

  it("should apply tilt transform on mouse move", () => {
    const { container } = render(
      <TiltCard className="test-card">
        <div>Test Child</div>
      </TiltCard>,
    );

    const card = container.firstChild as HTMLDivElement;

    // Mock getBoundingClientRect
    card.getBoundingClientRect = () => ({
      left: 10,
      top: 10,
      width: 100,
      height: 100,
      right: 110,
      bottom: 110,
      x: 10,
      y: 10,
      toJSON: () => {},
    });

    fireEvent.mouseMove(card, { clientX: 20, clientY: 20 });
    // Fire a second time to trigger cancelAnimationFrame
    fireEvent.mouseMove(card, { clientX: 25, clientY: 25 });

    expect(card.style.transform).toContain("perspective(800px)");
    expect(card.style.getPropertyValue("--mouse-x")).toBe("15px");
    expect(card.style.getPropertyValue("--mouse-y")).toBe("15px");
  });

  it("should reset transform on mouse leave", () => {
    const { container } = render(
      <TiltCard>
        <div>Test Child</div>
      </TiltCard>,
    );

    const card = container.firstChild as HTMLDivElement;
    card.style.transform = "perspective(800px) rotateX(10deg)";

    fireEvent.mouseLeave(card);

    expect(card.style.transform).toBe("");
  });

  it("should not apply tilt transform when disableTilt is true", () => {
    const { container } = render(
      <TiltCard disableTilt>
        <div>Test Child</div>
      </TiltCard>,
    );

    const card = container.firstChild as HTMLDivElement;
    card.getBoundingClientRect = () => ({
      left: 10,
      top: 10,
      width: 100,
      height: 100,
      right: 110,
      bottom: 110,
      x: 10,
      y: 10,
      toJSON: () => {},
    });

    fireEvent.mouseMove(card, { clientX: 20, clientY: 20 });
    expect(card.style.transform).toBe("");

    // Trigger mouseLeave when disableTilt is true
    fireEvent.mouseLeave(card);
    expect(card.style.transform).toBe("");
  });

  it("should return early in mouse handlers if ref.current is null", () => {
    const mockRef = { current: null };
    vi.spyOn(React, "useRef").mockReturnValue(mockRef);

    const { container } = render(
      <TiltCard>
        <div>Test Child</div>
      </TiltCard>,
    );

    const card = container.firstChild as HTMLDivElement;
    fireEvent.mouseMove(card, { clientX: 20, clientY: 20 });
    fireEvent.mouseLeave(card);

    expect(card.style.transform).toBe("");
  });
});
