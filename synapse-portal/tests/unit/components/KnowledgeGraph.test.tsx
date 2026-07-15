import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import KnowledgeGraph from "@/components/KnowledgeGraph";
import { Node as DbNode, Edge as DbEdge } from "@/lib/db";

// Mock next-themes
let themeMockVal = "midnight";
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: themeMockVal }),
}));

// Mock ResizeObserver to trigger callback on observe
class MockResizeObserver {
  callback: () => void;
  constructor(callback: () => void) {
    this.callback = callback;
  }
  observe() {
    this.callback();
  }
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", MockResizeObserver);

const mockD3Force = vi.fn().mockImplementation((name: string) => {
  if (name === "link") {
    return {
      distance: (fn: (link: { type: string }) => number) => {
        fn({ type: "ROOT_LINK" });
        fn({ type: "OTHER" });
      },
    };
  }
  return {
    strength: vi.fn(),
    distance: vi.fn(),
  };
});
const mockZoom = vi.fn().mockReturnValue(1);
const mockZoomToFit = vi.fn();

interface NodeCanvasObjectProps {
  id: string;
  type: string;
  val: number;
  x?: number;
  y?: number;
  memory_tier?: string;
  color?: string;
}

interface ForceGraphProps {
  onNodeHover: (node: object | null) => void;
  nodeCanvasObject: (
    node: NodeCanvasObjectProps,
    ctx: CanvasRenderingContext2D,
    globalScale: number,
  ) => void;
  onRenderFramePost: (
    ctx: CanvasRenderingContext2D,
    globalScale: number,
  ) => void;
  linkColor?: (link: object) => string;
  nodeColor?: (node: object) => string;
}

vi.mock("react-force-graph-2d", () => {
  const ForceGraph = React.forwardRef(
    (props: ForceGraphProps, ref: React.Ref<object>) => {
      React.useImperativeHandle(ref, () => ({
        d3Force: mockD3Force,
        zoom: mockZoom,
        zoomToFit: mockZoomToFit,
      }));
      if (props.linkColor) {
        props.linkColor({ source: "node-1", target: "node-2" });
      }
      if (props.nodeColor) {
        props.nodeColor({ id: "node-1", color: "#ff0000" });
      }
      return (
        <div data-testid="force-graph">
          <button
            onClick={() =>
              props.onNodeHover({
                id: "node-1",
                val: 5,
                x: 10,
                y: 10,
                label: "TestNode",
              })
            }
            data-testid="hover-node"
          >
            Hover
          </button>
          <button
            onClick={() => props.onNodeHover(null)}
            data-testid="hover-null"
          >
            Hover Null
          </button>
          <button
            onClick={() => {
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              if (ctx) {
                // ROOT_SCOPE
                props.nodeCanvasObject(
                  {
                    id: "node-1",
                    type: "ROOT_SCOPE",
                    val: 5,
                    x: 10,
                    y: 10,
                    color: "#ff0000",
                  },
                  ctx,
                  1,
                );
                // TAG
                props.nodeCanvasObject(
                  {
                    id: "node-2",
                    type: "TAG",
                    val: 5,
                    x: 10,
                    y: 10,
                    color: "#00ff00",
                  },
                  ctx,
                  1,
                );
                // CORE
                props.nodeCanvasObject(
                  {
                    id: "node-3",
                    type: "Feature",
                    val: 5,
                    x: 10,
                    y: 10,
                    memory_tier: "CORE",
                    color: "#0000ff",
                  },
                  ctx,
                  1,
                );
                // COLD
                props.nodeCanvasObject(
                  {
                    id: "node-4",
                    type: "Feature",
                    val: 5,
                    x: 10,
                    y: 10,
                    memory_tier: "COLD",
                    color: "#ffffff",
                  },
                  ctx,
                  1,
                );
                // Default/Other
                props.nodeCanvasObject(
                  {
                    id: "node-5",
                    type: "Feature",
                    val: 5,
                    x: 10,
                    y: 10,
                    color: "#bbbbbb",
                  },
                  ctx,
                  1,
                );
                // Undefined coordinates
                props.nodeCanvasObject(
                  { id: "node-6", type: "Feature", val: 5 },
                  ctx,
                  1,
                );
              }
            }}
            data-testid="draw"
          >
            Draw
          </button>
          <button
            onClick={() => {
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              if (ctx) {
                props.onRenderFramePost(ctx, 1);
              }
            }}
            data-testid="post-draw"
          >
            Post Draw
          </button>
        </div>
      );
    },
  );
  ForceGraph.displayName = "ForceGraph";
  return {
    default: ForceGraph,
  };
});

describe("components/KnowledgeGraph", () => {
  const nodes = [
    { id: "node-1", label: "Root Scope", type: "ROOT_SCOPE" } as DbNode,
    { id: "node-2", label: "Tag A", type: "TAG" } as DbNode,
    {
      id: "node-3",
      label: "Cold Item",
      type: "Feature",
      memory_tier: "COLD",
    } as DbNode,
    {
      id: "node-4",
      label: "Core Item",
      type: "Feature",
      memory_tier: "CORE",
    } as DbNode,
  ];

  const edges = [
    {
      from_id: "node-1",
      to_id: "node-2",
      relation_type: "ROOT_LINK",
    } as DbEdge,
  ];

  const onRef = vi.fn();

  beforeEach(() => {
    cleanup();
    onRef.mockClear();
    mockZoom.mockClear();
    mockZoomToFit.mockClear();
  });

  it("should render component and register ref callbacks", () => {
    vi.spyOn(
      window.HTMLDivElement.prototype,
      "getBoundingClientRect",
    ).mockReturnValue({
      width: 800,
      height: 600,
      top: 0,
      left: 0,
      bottom: 600,
      right: 800,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    const mockContext: Partial<CanvasRenderingContext2D> = {
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      setLineDash: vi.fn(),
      createRadialGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      } as CanvasGradient),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 50 } as TextMetrics),
      font: "",
      textAlign: "center",
      textBaseline: "middle",
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
    };

    vi.spyOn(window.HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      mockContext as CanvasRenderingContext2D,
    );

    render(<KnowledgeGraph nodes={nodes} edges={edges} onRef={onRef} />);

    expect(screen.getByTestId("force-graph")).toBeDefined();
    expect(onRef).toHaveBeenCalled();

    // Call injected onRef callbacks to verify they forward properly to ForceGraph methods
    const refCall = onRef.mock.calls[0][0];
    refCall.zoomIn();
    expect(mockZoom).toHaveBeenCalled();

    refCall.zoomOut();
    expect(mockZoom).toHaveBeenCalled();

    refCall.zoomToFit();
    expect(mockZoomToFit).toHaveBeenCalled();

    // Trigger canvas draw and post draw to cover drawing branches
    const drawBtn = screen.getByTestId("draw");
    fireEvent.click(drawBtn);

    // Hover a node to test hoveredNode state, then draw post frame
    const hoverBtn = screen.getByTestId("hover-node");
    fireEvent.click(hoverBtn);

    const postDrawBtn = screen.getByTestId("post-draw");
    fireEvent.click(postDrawBtn);

    // Hover null to test clear hoveredNode
    const hoverNullBtn = screen.getByTestId("hover-null");
    fireEvent.click(hoverNullBtn);
  });

  it("should render correctly in light theme", () => {
    themeMockVal = "light";
    render(<KnowledgeGraph nodes={nodes} edges={edges} onRef={onRef} />);
    expect(screen.getByTestId("force-graph")).toBeDefined();
  });
});
