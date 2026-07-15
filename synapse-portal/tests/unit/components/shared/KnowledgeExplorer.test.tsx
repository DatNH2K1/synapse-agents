import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import KnowledgeExplorer from "@/components/shared/KnowledgeExplorer";
import { Tag } from "@/lib/db";

vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe("components/shared/KnowledgeExplorer", () => {
  const tagsByScope: Record<string, Tag[]> = {
    scopeA: [
      { id: "tag1", name: "Tag 1", color: "#ff0000", scope: "scopeA" } as Tag,
      { id: "tag2", name: "Tag 2", color: "#00ff00", scope: "scopeA" } as Tag,
    ],
    scopeB: [
      { id: "tag3", name: "Tag 3", color: "#0000ff", scope: "scopeB" } as Tag,
    ],
  };

  const connectedTagIds = new Set(["tag1"]);
  const visibleTags = new Set(["tag1", "tag2", "tag3"]);
  const onToggleOrphans = vi.fn();
  const onToggleTag = vi.fn();

  beforeEach(() => {
    cleanup();
    onToggleOrphans.mockClear();
    onToggleTag.mockClear();
  });

  it("should render list of scopes", () => {
    render(
      <KnowledgeExplorer
        tagsByScope={tagsByScope}
        connectedTagIds={connectedTagIds}
        hideOrphans={false}
        onToggleOrphans={onToggleOrphans}
        visibleTags={visibleTags}
        onToggleTag={onToggleTag}
      />,
    );

    expect(screen.getByText("scopeA")).toBeDefined();
    expect(screen.getByText("scopeB")).toBeDefined();
  });

  it("should expand a scope on click and show tags, then trigger onToggleTag on click", () => {
    render(
      <KnowledgeExplorer
        tagsByScope={tagsByScope}
        connectedTagIds={connectedTagIds}
        hideOrphans={false}
        onToggleOrphans={onToggleOrphans}
        visibleTags={visibleTags}
        onToggleTag={onToggleTag}
      />,
    );

    // Initial state: Tag 1 should not be in the document
    expect(screen.queryByText("Tag 1")).toBeNull();

    // Click scopeA to expand
    fireEvent.click(screen.getByText("scopeA"));
    expect(screen.getByText("Tag 1")).toBeDefined();
    expect(screen.getByText("Tag 2")).toBeDefined();

    // Click Tag 1
    fireEvent.click(screen.getByText("Tag 1"));
    expect(onToggleTag).toHaveBeenCalledWith("tag1");
  });

  it("should toggle orphans when orphan button is clicked", () => {
    render(
      <KnowledgeExplorer
        tagsByScope={tagsByScope}
        connectedTagIds={connectedTagIds}
        hideOrphans={false}
        onToggleOrphans={onToggleOrphans}
        visibleTags={visibleTags}
        onToggleTag={onToggleTag}
      />,
    );

    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    expect(onToggleOrphans).toHaveBeenCalledWith(true);
  });

  it("should hide empty scopes if hideOrphans is true", () => {
    render(
      <KnowledgeExplorer
        tagsByScope={tagsByScope}
        connectedTagIds={connectedTagIds}
        hideOrphans={true}
        onToggleOrphans={onToggleOrphans}
        visibleTags={visibleTags}
        onToggleTag={onToggleTag}
      />,
    );

    // scopeB has tag3 which is not in connectedTagIds, so connectedCount is 0.
    // In hideOrphans mode, scopeB is empty/orphan and should be hidden.
    expect(screen.queryByText("scopeB")).toBeNull();
    expect(screen.getByText("scopeA")).toBeDefined();
  });
});
