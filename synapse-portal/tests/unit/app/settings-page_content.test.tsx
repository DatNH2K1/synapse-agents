import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SettingsPageContent from "@/app/(dashboard)/settings/page_content";
import { Tag } from "@/lib/db";

vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (params) {
        return `${key}_${JSON.stringify(params)}`;
      }
      return key;
    },
  }),
}));

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

vi.mock("@/components/shared/Avatar", () => ({
  default: ({ seed }: { seed: string }) => (
    <div data-testid="avatar">{seed}</div>
  ),
}));

vi.mock("@/components/landing/TiltCard", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="tilt-card">{children}</div>
  ),
}));

describe("app/(dashboard)/settings/page_content", () => {
  const config = { user_name: "test-user" };
  const tags: Tag[] = [
    {
      id: "tag-1",
      scope: "agent",
      name: "am Amelia",
      version: "1.0",
      color: "#ff0000",
      virtual_clock: 0,
    },
    {
      id: "tag-2",
      scope: "agent",
      name: "wn Winston",
      version: "1.0",
      color: "#00ff00",
      virtual_clock: 0,
    },
  ];
  const aiConfig = {
    gemini: {
      model: "gemini-pro",
      embedding_model: "text-embedding",
      is_active: true,
    },
    stitch: { is_set: true },
    context7: { is_set: false },
  };
  const systemConfig = {
    rem_mode_enabled: "true",
    forget_mode_enabled: "false",
    forget_dry_run_enabled: "true",
    rem_similarity_threshold: "0.85",
    rem_confidence_threshold: "0.90",
  };

  const globalFetch = global.fetch;

  beforeEach(() => {
    mockRefresh.mockClear();
    vi.restoreAllMocks();
    global.fetch = globalFetch;
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  const getTabButton = (text: string) => {
    const buttons = screen.getAllByRole("button");
    const target = buttons.find((b) => b.textContent?.includes(text));
    if (!target) {
      throw new Error(`Tab button not found for text: ${text}`);
    }
    return target;
  };

  it("should render Profile tab content by default", () => {
    render(
      <SettingsPageContent
        config={config}
        tags={tags}
        aiConfig={aiConfig}
        systemConfig={systemConfig}
      />,
    );

    expect(screen.getAllByText("test-user")).toBeDefined();
    expect(screen.getByTestId("avatar")).toBeDefined();
    expect(screen.getByText("ai_infrastructure")).toBeDefined();
    expect(screen.getByText("gemini-pro")).toBeDefined();
    expect(screen.getByText("text-embedding")).toBeDefined();
  });

  it("should navigate to AI tab and back to Profile tab successfully", async () => {
    render(
      <SettingsPageContent
        config={config}
        tags={tags}
        aiConfig={aiConfig}
        systemConfig={systemConfig}
      />,
    );

    // Switch to AI tab
    const aiTabButton = getTabButton("agent_co_pilot");
    fireEvent.click(aiTabButton);
    expect(screen.getByText("rem_mode")).toBeDefined();

    // Switch back to Profile tab
    const profileTabButton = getTabButton("identity_profile");
    fireEvent.click(profileTabButton);
    expect(screen.getAllByText("test-user")).toBeDefined();
  });

  it("should update settings successfully including dry run toggle", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    global.fetch = mockFetch;

    render(
      <SettingsPageContent
        config={config}
        tags={tags}
        aiConfig={aiConfig}
        systemConfig={systemConfig}
      />,
    );

    // Switch to AI tab
    const aiTabButton = getTabButton("agent_co_pilot");
    fireEvent.click(aiTabButton);

    // Toggle Forget dry run
    const dryRunButton = screen.getAllByRole("button")[5]; // dry run switch
    fireEvent.click(dryRunButton);

    expect(mockFetch).toHaveBeenCalledWith("/api/system-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "forget_dry_run_enabled", value: "false" }),
    });

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("should handle alternative initial configs correctly", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    global.fetch = mockFetch;

    const altSystemConfig = {
      rem_mode_enabled: "false",
      forget_mode_enabled: "true",
      forget_dry_run_enabled: "false",
    };

    render(
      <SettingsPageContent
        config={config}
        tags={tags}
        aiConfig={aiConfig}
        systemConfig={altSystemConfig}
      />,
    );

    // Switch to AI tab
    const aiTabButton = getTabButton("agent_co_pilot");
    fireEvent.click(aiTabButton);

    // Toggle Forget dry run from false to true
    const dryRunButton = screen.getAllByRole("button")[5];
    fireEvent.click(dryRunButton);

    expect(mockFetch).toHaveBeenCalledWith("/api/system-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "forget_dry_run_enabled", value: "true" }),
    });
  });

  it("should handle error when updating settings fails", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
    });
    global.fetch = mockFetch;
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(
      <SettingsPageContent
        config={config}
        tags={tags}
        aiConfig={aiConfig}
        systemConfig={systemConfig}
      />,
    );

    // Switch to AI tab
    const aiTabButton = getTabButton("agent_co_pilot");
    fireEvent.click(aiTabButton);

    // Toggle REM mode
    const remModeButton = screen.getAllByRole("button")[3];
    fireEvent.click(remModeButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Failed to save configuration");
    });
  });

  it("should handle fetch throwing error when updating settings", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network Error"));
    global.fetch = mockFetch;
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(
      <SettingsPageContent
        config={config}
        tags={tags}
        aiConfig={aiConfig}
        systemConfig={systemConfig}
      />,
    );

    // Switch to AI tab
    const aiTabButton = getTabButton("agent_co_pilot");
    fireEvent.click(aiTabButton);

    // Toggle Forget mode
    const forgetModeButton = screen.getAllByRole("button")[4]; // forget mode switch
    fireEvent.click(forgetModeButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Failed to save configuration");
    });
  });

  it("should navigate to Tags tab, click visual color circle and update tag color", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    global.fetch = mockFetch;

    render(
      <SettingsPageContent
        config={config}
        tags={tags}
        aiConfig={aiConfig}
        systemConfig={systemConfig}
      />,
    );

    // Switch to Tags tab
    const tagsTabButton = getTabButton("tag_appearance");
    fireEvent.click(tagsTabButton);

    expect(screen.getByText("am Amelia")).toBeDefined();

    // Trigger visual circle click
    const colorCircle = document.querySelector(
      'div[style*="background-color: rgb(255, 0, 0)"]',
    ) as HTMLDivElement;
    expect(colorCircle).not.toBeNull();

    // Mock target input click
    const colorInput = document.querySelector(
      'input[type="color"]',
    ) as HTMLInputElement;
    const clickSpy = vi.spyOn(colorInput, "click");

    fireEvent.click(colorCircle);
    expect(clickSpy).toHaveBeenCalled();

    // Simulate color update
    fireEvent.change(colorInput, { target: { value: "#ffffff" } });

    expect(mockFetch).toHaveBeenCalledWith("/api/visual-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "tag-1", color: "#ffffff" }),
    });

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("should handle visual config update fail gracefully", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
    });
    global.fetch = mockFetch;

    render(
      <SettingsPageContent
        config={config}
        tags={tags}
        aiConfig={aiConfig}
        systemConfig={systemConfig}
      />,
    );

    // Switch to Tags tab
    const tagsTabButton = getTabButton("tag_appearance");
    fireEvent.click(tagsTabButton);

    const colorInput = document.querySelector(
      'input[type="color"]',
    ) as HTMLInputElement;
    fireEvent.change(colorInput, { target: { value: "#000000" } });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it("should handle visual config fetch throwing error gracefully", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Save Error"));
    global.fetch = mockFetch;
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <SettingsPageContent
        config={config}
        tags={tags}
        aiConfig={aiConfig}
        systemConfig={systemConfig}
      />,
    );

    // Switch to Tags tab
    const tagsTabButton = getTabButton("tag_appearance");
    fireEvent.click(tagsTabButton);

    const colorInput = document.querySelector(
      'input[type="color"]',
    ) as HTMLInputElement;
    fireEvent.change(colorInput, { target: { value: "#000000" } });

    await waitFor(() => {
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  it("should update values on range input change, mouseUp, and touchEnd for both sliders", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    global.fetch = mockFetch;

    render(
      <SettingsPageContent
        config={config}
        tags={tags}
        aiConfig={aiConfig}
        systemConfig={systemConfig}
      />,
    );

    // Switch to AI tab
    const aiTabButton = getTabButton("agent_co_pilot");
    fireEvent.click(aiTabButton);

    const sliders = screen.getAllByRole("slider");
    const similaritySlider = sliders[0];
    const confidenceSlider = sliders[1];

    // Similarity
    fireEvent.change(similaritySlider, { target: { value: "0.75" } });
    fireEvent.mouseUp(similaritySlider);
    fireEvent.touchEnd(similaritySlider);

    expect(mockFetch).toHaveBeenCalledWith("/api/system-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "rem_similarity_threshold", value: "0.75" }),
    });

    // Confidence
    fireEvent.change(confidenceSlider, { target: { value: "0.8" } });
    fireEvent.mouseUp(confidenceSlider);
    fireEvent.touchEnd(confidenceSlider);

    expect(mockFetch).toHaveBeenCalledWith("/api/system-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "rem_confidence_threshold", value: "0.8" }),
    });
  });

  it("should update similarity and confidence state thresholds correctly on slide and update", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    global.fetch = mockFetch;

    render(
      <SettingsPageContent
        config={config}
        tags={tags}
        aiConfig={aiConfig}
        systemConfig={systemConfig}
      />,
    );

    // Switch to AI tab
    const aiTabButton = getTabButton("agent_co_pilot");
    fireEvent.click(aiTabButton);

    const sliders = screen.getAllByRole("slider");
    const similaritySlider = sliders[0];

    fireEvent.change(similaritySlider, { target: { value: "0.60" } });
    fireEvent.mouseUp(similaritySlider);

    await waitFor(() => {
      expect(screen.getByText("60%")).toBeDefined();
    });
  });
});
