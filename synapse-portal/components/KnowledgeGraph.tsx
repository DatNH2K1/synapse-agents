"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import type {
  ForceGraphMethods,
  LinkObject,
  NodeObject,
} from "react-force-graph-2d";
import { useTheme } from "next-themes";
import { Node as DbNode, Edge as DbEdge } from "@/lib/db";
import { getNodeColor, getNodeCategoryLabel } from "@/lib/graph-theme";

interface GraphNode {
  id: string;
  label: string;
  type: string;
  categoryLabel: string;
  success_count: number;
  val: number;
  color: string;
  memory_tier?: string;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
}

export default function KnowledgeGraph({
  nodes,
  edges,
  onRef,
}: {
  nodes: DbNode[];
  edges: DbEdge[];
  onRef?: (ref: {
    zoomIn: () => void;
    zoomOut: () => void;
    zoomToFit: (d?: number) => void;
  }) => void;
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
    const gNodes: GraphNode[] = nodes.map((n: DbNode) => {
      const isRoot = n.type === "ROOT_SCOPE";
      const isTag = n.type === "TAG";
      const isCore = n.memory_tier === "CORE";
      return {
        id: n.id,
        label: n.label,
        type: n.type,
        memory_tier: n.memory_tier || "ACTIVE",
        categoryLabel: isRoot
          ? "ROOT"
          : isTag
            ? "TAG"
            : getNodeCategoryLabel(n),
        success_count: n.success_count || 0,
        val: isRoot
          ? 18
          : isTag
            ? 10
            : n.type === "Feature"
              ? 5
              : isCore
                ? 8
                : 3,
        color:
          n.memory_tier === "COLD"
            ? "#38bdf8"
            : n.memory_tier === "CORE"
              ? "#a855f7"
              : getNodeColor(n),
      };
    });

    const gLinks: GraphLink[] = edges.map((e) => ({
      source: e.from_id,
      target: e.to_id,
      type: e.relation_type,
    }));

    return { nodes: gNodes, links: gLinks };
  }, [nodes, edges]);

  useEffect(() => {
    if (fgRef.current) {
      const chargeForce = fgRef.current.d3Force("charge") as
        | { strength: (value: number) => void }
        | undefined;
      chargeForce?.strength(-1200); // Reduced from -4500

      const linkForce = fgRef.current.d3Force("link") as
        | {
            distance: (
              fn: (link: LinkObject<GraphNode, GraphLink>) => number,
            ) => void;
          }
        | undefined;
      linkForce?.distance((link: LinkObject<GraphNode, GraphLink>) => {
        // Reduced distances for a tighter, more stable graph
        return link.type === "ROOT_LINK" ? 400 : 150;
      });

      const centerForce = fgRef.current.d3Force("center") as
        | { strength: (value: number) => void }
        | undefined;
      centerForce?.strength(0.15);

      // Expose controls to parent
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
            fgRef.current?.zoomToFit(duration, 100);
          },
        });
      }
    }
  }, [size, onRef]);

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
          onNodeHover={(node) => setHoveredNode(node as GraphNode | null)}
          nodeColor={(node) => (node as GraphNode).color}
          linkColor={() =>
            isLight ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.08)"
          }
          linkWidth={1}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.005}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const n = node as GraphNode & { x: number; y: number };
            const radius = n.val;

            if (n.x === undefined || n.y === undefined) return;

            const isCold = n.memory_tier === "COLD";
            const isCore = n.memory_tier === "CORE";

            // Aura
            ctx.beginPath();
            const gradient = ctx.createRadialGradient(
              n.x,
              n.y,
              0,
              n.x,
              n.y,
              radius * 2,
            );

            const auraColor = isCold ? "#38bdf8" : isCore ? "#a855f7" : n.color;
            const alphaPrefix = isCold ? "12" : "55";

            gradient.addColorStop(0, `${auraColor}${alphaPrefix}`);
            gradient.addColorStop(1, "transparent");
            ctx.fillStyle = gradient;
            ctx.arc(
              n.x,
              n.y,
              radius * (isCore ? 3.5 : 2.5),
              0,
              2 * Math.PI,
              false,
            );
            ctx.fill();

            // Node drawing
            ctx.beginPath();
            ctx.arc(n.x, n.y, radius, 0, 2 * Math.PI, false);
            ctx.fillStyle = isCold
              ? "rgba(56, 189, 248, 0.45)"
              : isCore
                ? "rgba(168, 85, 247, 0.95)"
                : n.color;
            ctx.fill();

            if (n.type === "ROOT_SCOPE") {
              ctx.strokeStyle = isLight
                ? "rgba(0, 0, 0, 0.6)"
                : "rgba(255, 255, 255, 0.9)";
              ctx.lineWidth = 4 / globalScale;
              ctx.stroke();
              // Outer ring for roots
              ctx.beginPath();
              ctx.arc(
                n.x,
                n.y,
                radius + 4 / globalScale,
                0,
                2 * Math.PI,
                false,
              );
              ctx.strokeStyle = `${n.color}88`;
              ctx.lineWidth = 2 / globalScale;
              ctx.stroke();
            } else if (n.type === "TAG") {
              ctx.strokeStyle = isLight
                ? "rgba(0, 0, 0, 0.4)"
                : "rgba(255, 255, 255, 0.8)";
              ctx.lineWidth = 2 / globalScale;
              ctx.stroke();
              // Inner dot for tags
              ctx.beginPath();
              ctx.arc(n.x, n.y, radius * 0.4, 0, 2 * Math.PI, false);
              ctx.fillStyle = isLight
                ? "rgba(0, 0, 0, 0.3)"
                : "rgba(255, 255, 255, 0.5)";
              ctx.fill();
            } else if (isCore) {
              // Glowing border for CORE nodes!
              ctx.strokeStyle = "rgba(168, 85, 247, 0.85)";
              ctx.lineWidth = 2 / globalScale;
              ctx.stroke();
            } else if (isCold) {
              // Icy dotted boundary for COLD nodes
              ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
              ctx.lineWidth = 1 / globalScale;
              ctx.setLineDash([2, 2]); // Dotted border!
              ctx.stroke();
              ctx.setLineDash([]); // Reset line dash!
            } else {
              ctx.strokeStyle = isLight
                ? "rgba(0, 0, 0, 0.2)"
                : "rgba(255, 255, 255, 0.3)";
              ctx.lineWidth = 1 / globalScale;
              ctx.stroke();
            }
          }}
          onRenderFramePost={(ctx, globalScale) => {
            if (!hoveredNode) return;
            const n = hoveredNode as GraphNode & { x: number; y: number };
            if (n.x === undefined || n.y === undefined) return;

            const label = n.label;
            const fontSize = 14 / globalScale;
            const radius = n.val;

            ctx.font = `${globalScale > 2 ? "600" : "400"} ${fontSize}px "Outfit", sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const textWidth = ctx.measureText(label).width;
            const bPadding = 2;
            ctx.fillStyle = isLight
              ? "rgba(255, 255, 255, 0.95)"
              : "rgba(2, 6, 23, 0.85)";
            ctx.fillRect(
              n.x - textWidth / 2 - bPadding,
              n.y + radius + 2,
              textWidth + bPadding * 2,
              fontSize + bPadding * 2,
            );

            ctx.fillStyle = isLight ? "#0f172a" : "rgba(255, 255, 255, 1)";
            ctx.fillText(
              label,
              n.x,
              n.y + radius + 2 + fontSize / 2 + bPadding,
            );
          }}
        />
      )}
    </div>
  );
}
