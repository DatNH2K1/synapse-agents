import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import KnowledgeAtlas from "@/components/dashboard/KnowledgeAtlas";
import { Node, Edge, Tag } from "@/lib/db";

vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/components/shared/KnowledgeExplorer", () => ({
  default: ({
    onToggleOrphans,
    onToggleTag,
  }: {
    onToggleOrphans: (val: boolean) => void;
    onToggleTag: (tagId: string) => void;
  }) => (
    <div data-testid="mock-explorer">
      <button
        onClick={() => onToggleOrphans(false)}
        data-testid="btn-toggle-orphans"
      >
        Toggle Orphans
      </button>
      <button onClick={() => onToggleTag("tag-1")} data-testid="btn-toggle-tag">
        Toggle Tag 1
      </button>
    </div>
  ),
}));

// Mock next/dynamic to render synchronously
vi.mock("next/dynamic", () => ({
  default: () => {
    return function MockedGraph({ onRef }: { onRef: (ref: object) => void }) {
      React.useEffect(() => {
        onRef({
          zoomIn: vi.fn(),
          zoomOut: vi.fn(),
          zoomToFit: vi.fn(),
        });
      }, [onRef]);
      return <div data-testid="mock-graph">Knowledge Graph</div>;
    };
  },
}));

describe("components/dashboard/KnowledgeAtlas", () => {
  const mockNodes: Node[] = [
    {
      id: "node-1",
      type: "TAG",
      properties: JSON.stringify({ scope: "scope1" }),
    } as Node,
    { id: "root-scope1", type: "ROOT_SCOPE" } as Node,
  ];
  const mockEdges: Edge[] = [
    { from_id: "node-1", to_id: "root-scope1" } as Edge,
  ];
  const mockTags: Tag[] = [
    { id: "node-1", name: "Tag 1", color: "#ff0000", scope: "scope1" } as Tag,
  ];

  beforeEach(() => {
    cleanup();
  });

  it("should render graph and overlays, toggle fullscreen, and toggle explorer", () => {
    render(
      <KnowledgeAtlas nodes={mockNodes} edges={mockEdges} tags={mockTags} />,
    );

    expect(screen.getByTestId("mock-graph")).toBeDefined();
    expect(screen.getByText("knowledge_graph")).toBeDefined();

    // Explorer should be hidden initially
    expect(screen.queryByTestId("mock-explorer")).toBeNull();

    // Click brain button to show explorer
    const brainBtn = screen.getByText(
      (_, element) =>
        element?.tagName === "BUTTON" &&
        element.querySelector(".lucide-brain") !== null,
    );
    fireEvent.click(brainBtn);
    expect(screen.getByTestId("mock-explorer")).toBeDefined();

    // Toggle fullscreen button click
    const fsBtn = screen.getByText(
      (_, element) =>
        element?.tagName === "BUTTON" &&
        element.querySelector(".lucide-maximize2") !== null,
    );
    fireEvent.click(fsBtn);
    expect(screen.getByText("fullscreen_analysis")).toBeDefined();

    // Toggle back
    const fsMinimizeBtn = screen.getByText(
      (_, element) =>
        element?.tagName === "BUTTON" &&
        element.querySelector(".lucide-minimize2") !== null,
    );
    fireEvent.click(fsMinimizeBtn);
    expect(screen.queryByText("fullscreen_analysis")).toBeNull();
  });

  it("should respond to zoom and explorer controls", () => {
    render(
      <KnowledgeAtlas nodes={mockNodes} edges={mockEdges} tags={mockTags} />,
    );

    // Click brain button to show explorer
    const brainBtn = screen.getByText(
      (_, element) =>
        element?.tagName === "BUTTON" &&
        element.querySelector(".lucide-brain") !== null,
    );
    fireEvent.click(brainBtn);

    // Zoom buttons clicks
    const plusBtn = screen.getByText(
      (_, element) =>
        element?.tagName === "BUTTON" &&
        element.querySelector(".lucide-plus") !== null,
    );
    fireEvent.click(plusBtn);

    const minusBtn = screen.getByText(
      (_, element) =>
        element?.tagName === "BUTTON" &&
        element.querySelector(".lucide-minus") !== null,
    );
    fireEvent.click(minusBtn);

    const resetBtn = screen.getByText(
      (_, element) =>
        element?.tagName === "BUTTON" &&
        element.querySelector(".lucide-rotate-ccw") !== null,
    );
    fireEvent.click(resetBtn);

    // Explorer button interactions
    const toggleOrphansBtn = screen.getByTestId("btn-toggle-orphans");
    fireEvent.click(toggleOrphansBtn);

    const toggleTagBtn = screen.getByTestId("btn-toggle-tag");
    fireEvent.click(toggleTagBtn);
  });
});
