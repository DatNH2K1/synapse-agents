import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import SettingsPage from "@/app/(dashboard)/settings/page";

vi.mock("@/lib/db", () => ({
  getConfig: () => ({
    user_name: "SettingsUser",
  }),
  prisma: {
    systemConfig: {
      findMany: async () => [
        { key: "sys-k-1", value: "sys-v-1" },
        { key: "sys-k-2", value: "sys-v-2" },
      ],
    },
  },
}));

vi.mock("@/lib/config", () => ({
  getAIConfig: () => ({
    provider: "openai",
    model: "gpt-4",
  }),
}));

vi.mock("@/lib/services/knowledge-service", () => ({
  knowledgeService: {
    getTags: async () => [{ id: "t-1", name: "Tag One" }],
  },
}));

interface SettingsPageContentProps {
  config: { user_name: string };
  aiConfig: { provider: string; model: string };
  tags: { id: string; name: string }[];
  systemConfig: Record<string, string>;
}

vi.mock("@/app/(dashboard)/settings/page_content", () => ({
  default: ({
    config,
    aiConfig,
    tags,
    systemConfig,
  }: SettingsPageContentProps) => (
    <div data-testid="settings-content">
      <span>User: {config.user_name}</span>
      <span>AI Provider: {aiConfig.provider}</span>
      <span>Tags Count: {tags.length}</span>
      <span>System Config Value: {systemConfig["sys-k-1"]}</span>
    </div>
  ),
}));

describe("app/(dashboard)/settings/page", () => {
  it("should render SettingsPage server component and pass props", async () => {
    const element = await SettingsPage();
    render(element);

    expect(screen.getByTestId("settings-content")).toBeDefined();
    expect(screen.getByText("User: SettingsUser")).toBeDefined();
    expect(screen.getByText("AI Provider: openai")).toBeDefined();
    expect(screen.getByText("Tags Count: 1")).toBeDefined();
    expect(screen.getByText("System Config Value: sys-v-1")).toBeDefined();
  });
});
