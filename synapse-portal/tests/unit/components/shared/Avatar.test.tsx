import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, act, cleanup } from "@testing-library/react";
import Avatar from "@/components/shared/Avatar";

describe("components/shared/Avatar", () => {
  const mockLocalStorage: Record<string, string> = {};

  beforeEach(() => {
    cleanup();
    vi.stubGlobal("fetch", vi.fn());
    vi.spyOn(console, "warn").mockImplementation(() => {});
    Object.keys(mockLocalStorage).forEach((key) => {
      delete mockLocalStorage[key];
    });

    vi.stubGlobal("localStorage", {
      getItem: (key: string) => mockLocalStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockLocalStorage[key] = value;
      },
    });
  });

  it("should show loading skeleton initially and then render cached SVG if localStorage matches", async () => {
    mockLocalStorage["synapse_avatar_test-seed"] = "<svg>cached</svg>";

    let containerElement: HTMLElement | undefined;
    await act(async () => {
      const result = render(<Avatar seed="test-seed" />);
      containerElement = result.container;
    });

    expect(containerElement).toBeDefined();
    const svgDiv = containerElement?.querySelector("div");
    expect(svgDiv?.innerHTML).toBe("<svg>cached</svg>");
  });

  it("should fetch from API when local cache is empty", async () => {
    const mockResponseText = "<svg>fetched-svg</svg>";
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      text: async () => mockResponseText,
    } as Response);

    let containerElement: HTMLElement | undefined;
    await act(async () => {
      const result = render(<Avatar seed="new-seed" />);
      containerElement = result.container;
    });

    expect(fetch).toHaveBeenCalledWith(
      "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=new-seed",
    );
    expect(mockLocalStorage["synapse_avatar_new-seed"]).toBe(mockResponseText);
    const svgDiv = containerElement?.querySelector("div");
    expect(svgDiv?.innerHTML).toBe(mockResponseText);
  });

  it("should render fallback text initials if API fetch fails", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    await act(async () => {
      render(<Avatar seed="John Doe" alt="User Avatar" />);
    });

    const fallbackDiv = screen.getByTitle("User Avatar");
    expect(fallbackDiv.textContent).toBe("JD");
  });

  it("should render fallback text initials with single name seed if API fetch fails", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Network Error"));

    await act(async () => {
      render(<Avatar seed="Alice" alt="User Avatar" />);
    });

    const fallbackDiv = screen.getByTitle("User Avatar");
    expect(fallbackDiv.textContent).toBe("AL");
  });
});
