"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import type {
  ForceGraphMethods,
  LinkObject,
  NodeObject,
} from "react-force-graph-2d";
import { useTheme } from "next-themes";

interface GraphNode {
  id: string;
  label: string;
  kind: string;
  size: number;
  val: number;
  color: string;
}

interface GraphLink {
  source: string;
  target: string;
}

export default function ForceGraphWrapper({
  nodes,
  links,
  onNodeClick,
  onRef,
  searchQuery,
  activeMatchId,
}: {
  nodes: {
    id: string;
    label: string;
    kind: string;
    size: number;
    color: string;
  }[];
  links: { source: string; target: string }[];
  onNodeClick?: (nodeId: string) => void;
  onRef?: (ref: {
    zoomIn: () => void;
    zoomOut: () => void;
    zoomToFit: (d?: number) => void;
  }) => void;
  searchQuery?: string;
  activeMatchId?: string | null;
}) {
  const { theme } = useTheme();
  const isLight = theme === "light" || theme === "arctic";

  const fgRef = useRef<
    | ForceGraphMethods<NodeObject<GraphNode>, LinkObject<GraphNode, GraphLink>>
    | undefined
  >(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  const graphData = useMemo(() => {
    const gNodes: GraphNode[] = nodes.map((n) => ({
      id: n.id,
      label: n.label,
      kind: n.kind,
      size: n.size,
      val: 6,
      color: n.color,
    }));

    const gLinks: GraphLink[] = links.map((l) => ({
      source: l.source,
      target: l.target,
    }));

    return { nodes: gNodes, links: gLinks };
  }, [nodes, links]);

  useEffect(() => {
    if (fgRef.current) {
      const chargeForce = fgRef.current.d3Force("charge") as
        | { strength: (value: number) => void }
        | undefined;
      chargeForce?.strength(-800);

      const linkForce = fgRef.current.d3Force("link") as
        | { distance: (d: number) => void }
        | undefined;
      linkForce?.distance(120);

      if (onRef) {
        onRef({
          zoomIn: () => {
            const currentZoom = fgRef.current?.zoom() || 1;
            fgRef.current?.zoom(currentZoom * 1.5, 400);
          },
          zoomOut: () => {
            const currentZoom = fgRef.current?.zoom() || 1;
            fgRef.current?.zoom(currentZoom / 1.5, 400);
          },
          zoomToFit: (duration = 400) => {
            fgRef.current?.zoomToFit(duration, 80);
          },
        });
      }
    }
  }, [size, onRef]);

  const lastActiveMatchId = useRef<string | null | undefined>(undefined);
  const lastSearchQuery = useRef<string | undefined>(undefined);

  useEffect(() => {
    const trimmedQuery = searchQuery?.trim() || "";
    const prevQuery = lastSearchQuery.current || "";

    if (activeMatchId !== lastActiveMatchId.current) {
      lastActiveMatchId.current = activeMatchId;
      lastSearchQuery.current = searchQuery;

      if (activeMatchId) {
        const match = (graphData.nodes as NodeObject<GraphNode>[]).find(
          (n) => n.id === activeMatchId,
        );
        if (match && match.x !== undefined && match.y !== undefined) {
          fgRef.current?.centerAt(match.x, match.y, 800);
          fgRef.current?.zoom(2.5, 800);
        }
      } else if (!trimmedQuery) {
        fgRef.current?.zoomToFit(800, 80);
      }
    } else if (!trimmedQuery && prevQuery) {
      lastSearchQuery.current = searchQuery;
      lastActiveMatchId.current = activeMatchId;
      fgRef.current?.zoomToFit(800, 80);
    } else {
      lastSearchQuery.current = searchQuery;
      lastActiveMatchId.current = activeMatchId;
    }
  }, [activeMatchId, searchQuery, graphData]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const { width, height } = el.getBoundingClientRect();
      setSize({ width: Math.floor(width), height: Math.floor(height) });
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="h-full w-full">
      {size.width > 0 && size.height > 0 && (
        <ForceGraph2D
          ref={fgRef}
          width={size.width}
          height={size.height}
          graphData={graphData}
          backgroundColor="transparent"
          d3AlphaDecay={0.01}
          d3VelocityDecay={0.3}
          onNodeClick={(node) =>
            onNodeClick && onNodeClick((node as GraphNode).id)
          }
          onNodeHover={(node) => setHoveredNode(node as GraphNode | null)}
          nodeColor={(node) => (node as GraphNode).color}
          linkColor={(link) => {
            const l = link as {
              source?: string | { id?: string; label?: string };
              target?: string | { id?: string; label?: string };
            };
            const isSearchActive = !!(searchQuery && searchQuery.trim());
            if (isSearchActive) {
              const lower = searchQuery!.trim().toLowerCase();

              const getLabel = (
                idOrObj: string | { id?: string; label?: string } | undefined,
              ) => {
                if (idOrObj && typeof idOrObj === "object") {
                  return idOrObj.label || "";
                }
                const found = nodes.find((n) => n.id === idOrObj);
                return found ? found.label : "";
              };

              const sourceLabel = getLabel(l.source);
              const targetLabel = getLabel(l.target);

              const isSourceMatch = sourceLabel.toLowerCase().includes(lower);
              const isTargetMatch = targetLabel.toLowerCase().includes(lower);

              if (isSourceMatch || isTargetMatch) {
                return isLight
                  ? "rgba(245, 158, 11, 0.8)"
                  : "rgba(251, 191, 36, 0.8)";
              }
            }
            return isLight
              ? "rgba(0, 0, 0, 0.08)"
              : "rgba(255, 255, 255, 0.08)";
          }}
          linkWidth={1}
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={1}
          linkDirectionalParticles={1}
          linkDirectionalParticleSpeed={0.004}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const n = node as GraphNode & { x: number; y: number };
            const radius = n.val;

            if (n.x === undefined || n.y === undefined) return;

            const isSearchActive = !!(searchQuery && searchQuery.trim());
            const isMatch =
              isSearchActive &&
              n.label.toLowerCase().includes(searchQuery!.trim().toLowerCase());
            const isActiveMatch = activeMatchId === n.id;

            // Save canvas context to restore settings later
            if (ctx.save) ctx.save();

            // Draw outer aura glow for hovered/selected/matching nodes
            ctx.beginPath();
            const glowRadius = isActiveMatch ? 4.5 : isMatch ? 3.5 : 2.5;
            const gradient = ctx.createRadialGradient(
              n.x,
              n.y,
              0,
              n.x,
              n.y,
              radius * glowRadius,
            );
            if (isActiveMatch) {
              gradient.addColorStop(0, "#f97316cc"); // Intense Orange for active match
              gradient.addColorStop(1, "transparent");
            } else if (isMatch) {
              gradient.addColorStop(0, "#f59e0b99"); // Bright Amber/Yellow for matching nodes
              gradient.addColorStop(1, "transparent");
            } else {
              gradient.addColorStop(0, `${n.color}55`); // Regular glow
              gradient.addColorStop(1, "transparent");
            }
            ctx.fillStyle = gradient;
            ctx.arc(n.x, n.y, radius * glowRadius, 0, 2 * Math.PI, false);
            ctx.fill();

            // Draw core node
            ctx.beginPath();
            ctx.arc(n.x, n.y, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = n.color;
            ctx.fill();

            // Draw border
            if (isActiveMatch) {
              ctx.strokeStyle = "#ea580c"; // Dark orange border for active match
              ctx.lineWidth = 4.0 / globalScale;
            } else if (isMatch) {
              ctx.strokeStyle = "#fbbf24";
              ctx.lineWidth = 3.0 / globalScale;
            } else {
              ctx.strokeStyle = isLight
                ? "rgba(255, 255, 255, 0.8)"
                : "rgba(15, 23, 42, 0.8)";
              ctx.lineWidth = 1.5 / globalScale;
            }
            ctx.stroke();

            // Draw label always for matched nodes
            if (isMatch) {
              const label = n.label.split("/").pop() || n.label;
              const fontSize = isActiveMatch
                ? 13 / globalScale
                : 11 / globalScale;
              ctx.font = `${isActiveMatch ? "800" : "600"} ${fontSize}px "Outfit", sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = isActiveMatch
                ? isLight
                  ? "#c2410c"
                  : "#ffedd5"
                : isLight
                  ? "#0f172a"
                  : "#ffffff";
              ctx.fillText(label, n.x, n.y + radius + 4 + fontSize / 2);
            }

            if (ctx.restore) ctx.restore();
          }}
          onRenderFramePost={(ctx, globalScale) => {
            if (!hoveredNode) return;
            const n = hoveredNode as GraphNode & { x: number; y: number };
            if (n.x === undefined || n.y === undefined) return;

            const label = n.label;
            const fontSize = 13 / globalScale;
            const radius = n.val;

            ctx.font = `${globalScale > 2 ? "600" : "400"} ${fontSize}px "Outfit", sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const textWidth = ctx.measureText(label).width;
            const bPadding = 3;
            ctx.fillStyle = isLight
              ? "rgba(255, 255, 255, 0.95)"
              : "rgba(2, 6, 23, 0.9)";
            ctx.fillRect(
              n.x - textWidth / 2 - bPadding,
              n.y + radius + 3,
              textWidth + bPadding * 2,
              fontSize + bPadding * 2,
            );

            ctx.fillStyle = isLight ? "#0f172a" : "rgba(255, 255, 255, 1)";
            ctx.fillText(
              label,
              n.x,
              n.y + radius + 3 + fontSize / 2 + bPadding,
            );
          }}
        />
      )}
    </div>
  );
}
