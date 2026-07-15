import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ForceGraphWrapper from "@/app/(dashboard)/dependency-graph/ForceGraphWrapper";

// Mock next-themes
let themeMockVal = "midnight";
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: themeMockVal }),
}));

// Mock ResizeObserver
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

const mockD3Force = vi.fn().mockImplementation((_name: string) => {
  return {
    strength: vi.fn(),
    distance: vi.fn(),
  };
});
const mockZoom = vi.fn().mockReturnValue(1);
const mockZoomToFit = vi.fn();
const mockCenterAt = vi.fn();

interface NodeCanvasObjectProps {
  id: string;
  label: string;
  kind: string;
  size: number;
  val: number;
  color: string;
  x?: number;
  y?: number;
}

interface ForceGraphProps {
  onNodeClick?: (node: { id: string }) => void;
  onNodeHover: (
    node: {
      id: string;
      val: number;
      x?: number;
      y?: number;
      label: string;
    } | null,
  ) => void;
  nodeCanvasObject: (
    node: NodeCanvasObjectProps,
    ctx: CanvasRenderingContext2D,
    globalScale: number,
  ) => void;
  onRenderFramePost: (
    ctx: CanvasRenderingContext2D,
    globalScale: number,
  ) => void;
  linkColor?: (link: {
    source?: string | { id?: string; label?: string };
    target?: string | { id?: string; label?: string };
  }) => string;
  nodeColor?: (node: { id: string; color: string }) => string;
}

vi.mock("react-force-graph-2d", () => {
  const ForceGraph = React.forwardRef(
    (props: ForceGraphProps, ref: React.Ref<object>) => {
      React.useImperativeHandle(ref, () => ({
        d3Force: mockD3Force,
        zoom: mockZoom,
        zoomToFit: mockZoomToFit,
        centerAt: mockCenterAt,
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
              props.onNodeClick && props.onNodeClick({ id: "node-1" })
            }
            data-testid="click-node"
          >
            Click Node
          </button>
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
                // Valid coordinates
                props.nodeCanvasObject(
                  {
                    id: "node-1",
                    label: "node-1",
                    kind: "TS",
                    size: 5,
                    val: 5,
                    color: "#ff0000",
                    x: 10,
                    y: 10,
                  },
                  ctx,
                  1,
                );
                // Undefined coordinates
                props.nodeCanvasObject(
                  {
                    id: "node-2",
                    label: "node-2",
                    kind: "TS",
                    size: 5,
                    val: 5,
                    color: "#ff0000",
                  },
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
                // Valid coordinates
                props.nodeCanvasObject(
                  {
                    id: "node-1",
                    label: "node-1",
                    kind: "TS",
                    size: 5,
                    val: 5,
                    color: "#ff0000",
                    x: 10,
                    y: 10,
                  },
                  ctx,
                  3,
                );
                // Undefined coordinates
                props.nodeCanvasObject(
                  {
                    id: "node-2",
                    label: "node-2",
                    kind: "TS",
                    size: 5,
                    val: 5,
                    color: "#ff0000",
                  },
                  ctx,
                  3,
                );
              }
            }}
            data-testid="draw-scale-3"
          >
            Draw Scale 3
          </button>
          <button
            onClick={() =>
              props.onNodeHover({ id: "node-3", val: 5, label: "NoCoordsNode" })
            }
            data-testid="hover-node-no-coords"
          >
            Hover No Coords
          </button>
          <button
            onClick={() => {
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              if (ctx) {
                // Node matching searchQuery="utils" but is NOT the activeMatchId="node-1"
                props.nodeCanvasObject(
                  {
                    id: "node-2",
                    label: "utils.py",
                    kind: "PY",
                    size: 5,
                    val: 5,
                    color: "#38bdf8",
                    x: 20,
                    y: 20,
                  },
                  ctx,
                  1,
                );
              }
            }}
            data-testid="draw-non-active-match"
          >
            Draw Non Active Match
          </button>
          <button
            onClick={() => {
              if (props.linkColor) {
                // Object source with label
                props.linkColor({
                  source: { id: "node-1", label: "index.ts" },
                  target: "node-2",
                });
                // String source that is unknown
                props.linkColor({ source: "node-unknown", target: "node-2" });
                // Falsy source
                props.linkColor({ source: undefined, target: "node-2" });
              }
            }}
            data-testid="test-link-color"
          >
            Test Link Color
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
          <button
            onClick={() => {
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              if (ctx) {
                props.onRenderFramePost(ctx, 3);
              }
            }}
            data-testid="post-draw-scale-3"
          >
            Post Draw Scale 3
          </button>
        </div>
      );
    },
  );
  ForceGraph.displayName = "ForceGraph2D";
  return {
    default: ForceGraph,
  };
});

describe("app/(dashboard)/dependency-graph/ForceGraphWrapper", () => {
  const nodes = [
    { id: "node-1", label: "index.ts", kind: "TS", size: 10, color: "#818cf8" },
    { id: "node-2", label: "utils.py", kind: "PY", size: 5, color: "#38bdf8" },
  ];

  const links = [{ source: "node-1", target: "node-2" }];

  const onNodeClick = vi.fn();
  const onRef = vi.fn();

  beforeEach(() => {
    cleanup();
    onNodeClick.mockClear();
    onRef.mockClear();
    mockZoom.mockClear();
    mockZoomToFit.mockClear();
    mockCenterAt.mockClear();
  });

  it("should render force graph wrapper, setup sizing, and invoke callbacks", () => {
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

    render(
      <ForceGraphWrapper
        nodes={nodes}
        links={links}
        onNodeClick={onNodeClick}
        onRef={onRef}
      />,
    );

    expect(screen.getByTestId("force-graph")).toBeDefined();
    expect(onRef).toHaveBeenCalled();

    // Call ref callbacks
    const refCall = onRef.mock.calls[0][0];
    refCall.zoomIn();
    expect(mockZoom).toHaveBeenCalled();

    refCall.zoomOut();
    expect(mockZoom).toHaveBeenCalled();

    refCall.zoomToFit();
    expect(mockZoomToFit).toHaveBeenCalled();

    // Click Node trigger
    fireEvent.click(screen.getByTestId("click-node"));
    expect(onNodeClick).toHaveBeenCalledWith("node-1");

    // Canvas Draw tests
    fireEvent.click(screen.getByTestId("draw"));
    fireEvent.click(screen.getByTestId("draw-scale-3"));

    // Hover Node and Post Draw
    fireEvent.click(screen.getByTestId("hover-node"));
    fireEvent.click(screen.getByTestId("post-draw"));
    fireEvent.click(screen.getByTestId("post-draw-scale-3"));

    // Hover Node with No Coords
    fireEvent.click(screen.getByTestId("hover-node-no-coords"));
    fireEvent.click(screen.getByTestId("post-draw"));

    // Hover null
    fireEvent.click(screen.getByTestId("hover-null"));
  });

  it("should handle search query highlight, match active focus styling, themes, and all branch scenarios", () => {
    // 1. Setup dark theme and render active match
    themeMockVal = "dark";
    const { rerender } = render(
      <ForceGraphWrapper
        nodes={nodes}
        links={links}
        searchQuery="index"
        activeMatchId="node-1"
      />,
    );
    expect(screen.getByTestId("force-graph")).toBeDefined();

    const mockContext: Partial<CanvasRenderingContext2D> = {
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      createRadialGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      } as CanvasGradient),
      fillText: vi.fn(),
      font: "",
      textAlign: "center",
      textBaseline: "middle",
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
      save: vi.fn(),
      restore: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 50 } as TextMetrics),
      fillRect: vi.fn(),
    };

    vi.spyOn(window.HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      mockContext as CanvasRenderingContext2D,
    );

    // Click draw trigger, which executes nodeCanvasObject in the mock component for active match
    fireEvent.click(screen.getByTestId("draw"));
    expect(mockContext.save).toHaveBeenCalled();

    // Click test-link-color to trigger linkColor callback helper branches
    fireEvent.click(screen.getByTestId("test-link-color"));

    // 2. Setup light theme and render non-active match
    themeMockVal = "light";
    rerender(
      <ForceGraphWrapper
        nodes={nodes}
        links={links}
        searchQuery="utils"
        activeMatchId="node-1"
      />,
    );
    fireEvent.click(screen.getByTestId("draw-non-active-match"));
    fireEvent.click(screen.getByTestId("test-link-color"));

    // 3. Setup arctic theme to cover arctic theme check
    themeMockVal = "arctic";
    rerender(
      <ForceGraphWrapper
        nodes={nodes}
        links={links}
        searchQuery="utils"
        activeMatchId="node-1"
      />,
    );

    // 4. Test zoom/center edge cases (e.g. unknown activeMatchId, matching node with no coords)
    rerender(
      <ForceGraphWrapper
        nodes={nodes}
        links={links}
        searchQuery="utils"
        activeMatchId="node-unknown"
      />,
    );

    // Node without coordinates activeMatchId
    const nodesNoCoords = [
      {
        id: "node-1",
        label: "index.ts",
        kind: "TS",
        size: 10,
        color: "#818cf8",
      },
    ];
    rerender(
      <ForceGraphWrapper
        nodes={nodesNoCoords}
        links={links}
        searchQuery="utils"
        activeMatchId="node-1"
      />,
    );

    // 5. Test canvas save/restore fallback by making them undefined
    const mockContextNoSave: Partial<CanvasRenderingContext2D> = {
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      createRadialGradient: vi.fn().mockReturnValue({
        addColorStop: vi.fn(),
      } as CanvasGradient),
      fillText: vi.fn(),
      font: "",
      textAlign: "center",
      textBaseline: "middle",
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
      save: undefined,
      restore: undefined,
    };
    vi.spyOn(window.HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      mockContextNoSave as CanvasRenderingContext2D,
    );
    fireEvent.click(screen.getByTestId("draw"));

    // 6. Clearing search query to trigger zoomToFit in useEffect
    rerender(
      <ForceGraphWrapper
        nodes={nodes}
        links={links}
        searchQuery=""
        activeMatchId={null}
      />,
    );
    expect(mockZoomToFit).toHaveBeenCalled();
  });
});
