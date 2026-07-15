"use client";

import React, { useRef, useState, useMemo } from "react";
import {
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  RotateCcw,
  Brain,
} from "lucide-react";
import dynamic from "next/dynamic";

const KnowledgeGraph = dynamic(() => import("@/components/KnowledgeGraph"), {
  ssr: false,
});

import KnowledgeExplorer from "@/components/shared/KnowledgeExplorer";
import { Node, Edge, Tag } from "@/lib/db";
import { useI18n } from "@/lib/i18n";
import { groupTagsByScope, getConnectedTagIds } from "@/lib/graph-theme";

export default function KnowledgeAtlas({
  nodes,
  edges,
  tags = [],
}: {
  nodes: Node[];
  edges: Edge[];
  tags?: Tag[];
}) {
  const { t } = useI18n();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExplorer, setShowExplorer] = useState(false);
  const [hideOrphans, setHideOrphans] = useState(true);
  const [visibleTagIds, setVisibleTagIds] = useState<Set<string>>(
    new Set(tags.map((t) => t.id)),
  );

  const graphRef = useRef<{
    zoomIn: () => void;
    zoomOut: () => void;
    zoomToFit: (d?: number) => void;
  } | null>(null);

  const tagsByScope = useMemo(() => groupTagsByScope(tags), [tags]);
  const connectedTagIds = useMemo(() => getConnectedTagIds(edges), [edges]);

  // Filter graph data
  const filteredNodes = useMemo(() => {
    // 1. First pass: Filter tags
    const step1 = nodes.filter((n) => {
      if (n.type === "TAG") {
        const isVisible = visibleTagIds.has(n.id);
        const isConnected = connectedTagIds.has(n.id);
        if (!isVisible) return false;
        if (hideOrphans && !isConnected) return false;
      }
      return true;
    });

    // 2. Second pass: Filter roots that no longer have visible children
    const visibleTagScopes = new Set(
      step1
        .filter((n) => n.type === "TAG")
        .map((n) => {
          try {
            return JSON.parse(n.properties || "{}").scope?.toLowerCase();
          } catch {
            return null;
          }
        }),
    );

    return step1.filter((n) => {
      if (n.type === "ROOT_SCOPE") {
        const scopeName = n.id.replace("root-", "").toLowerCase();
        return visibleTagScopes.has(scopeName);
      }
      return true;
    });
  }, [nodes, visibleTagIds, connectedTagIds, hideOrphans]);

  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    return edges.filter((e) => nodeIds.has(e.from_id) && nodeIds.has(e.to_id));
  }, [edges, filteredNodes]);

  const handleZoomIn = () => graphRef.current?.zoomIn();
  const handleZoomOut = () => graphRef.current?.zoomOut();
  const handleResetZoom = () => graphRef.current?.zoomToFit(400);

  const handleOnRef = React.useCallback(
    (ref: {
      zoomIn: () => void;
      zoomOut: () => void;
      zoomToFit: (d?: number) => void;
    }) => {
      graphRef.current = ref;
    },
    [],
  );

  const handleToggleTag = (tagId: string) => {
    const next = new Set(visibleTagIds);
    if (next.has(tagId)) next.delete(tagId);
    else next.add(tagId);
    setVisibleTagIds(next);
  };

  return (
    <section
      className={`transition-all duration-500 ${
        isFullscreen
          ? "fixed inset-0 z-[100] bg-[#020617]"
          : "relative space-y-4"
      }`}
    >
      {!isFullscreen && (
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-dashboard-fg">
              {t("knowledge_graph")}
            </h3>
            <p className="text-xs text-dashboard-fg/55">
              {t("graph_description")}
            </p>
          </div>
        </div>
      )}

      <div
        className={`relative w-full overflow-hidden transition-all duration-500 ${
          isFullscreen
            ? "h-full w-full"
            : "h-[calc(100vh-14rem)] min-h-[500px] rounded-2xl glass shadow-2xl"
        }`}
      >
        <KnowledgeGraph
          nodes={filteredNodes}
          edges={filteredEdges}
          onRef={handleOnRef}
        />

        {/* Overlay Controls */}
        <div className="absolute right-2 top-2 z-[110] flex flex-row gap-2 sm:right-6 sm:top-6 sm:flex-col">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="rounded-xl glass p-2.5 text-dashboard-fg/55 shadow-2xl backdrop-blur-xl transition-all hover:bg-dashboard-fg/5 hover:text-dashboard-fg sm:p-3"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            onClick={() => setShowExplorer(!showExplorer)}
            className={`rounded-xl glass p-3 shadow-2xl backdrop-blur-xl transition-all ${
              showExplorer
                ? "bg-accent-primary text-white"
                : "text-dashboard-fg/55 hover:bg-dashboard-fg/5 hover:text-dashboard-fg"
            }`}
          >
            <Brain size={16} />
          </button>
          <div className="flex flex-row gap-1 rounded-xl border border-white/10 bg-dashboard-bg/85 p-1 shadow-2xl backdrop-blur-xl sm:flex-col">
            <button
              onClick={handleZoomIn}
              className="rounded-lg p-2 text-dashboard-fg/55 transition-all hover:bg-dashboard-fg/5 hover:text-dashboard-fg"
            >
              <Plus size={16} />
            </button>
            <button
              onClick={handleZoomOut}
              className="rounded-lg p-2 text-dashboard-fg/55 transition-all hover:bg-dashboard-fg/5 hover:text-dashboard-fg"
            >
              <Minus size={16} />
            </button>
            <button
              onClick={handleResetZoom}
              className="rounded-lg border-t border-white/10 p-2 text-dashboard-fg/55 transition-all hover:bg-dashboard-fg/5 hover:text-dashboard-fg sm:rounded-b-lg sm:border-t"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        {/* Explorer Overlay */}
        {showExplorer && (
          <div
            className={`absolute bottom-3 left-3 z-[110] max-w-[calc(100vw-1.5rem)] transition-all duration-500 sm:bottom-8 sm:left-8 sm:max-w-none ${
              isFullscreen ? "opacity-100" : "opacity-90"
            }`}
          >
            <KnowledgeExplorer
              tagsByScope={tagsByScope}
              connectedTagIds={connectedTagIds}
              hideOrphans={hideOrphans}
              onToggleOrphans={setHideOrphans}
              visibleTags={visibleTagIds}
              onToggleTag={handleToggleTag}
            />
          </div>
        )}

        {isFullscreen && (
          <div className="absolute left-3 top-3 z-[110] sm:left-8 sm:top-8">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/60 p-3 shadow-2xl backdrop-blur-2xl sm:p-4">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 sm:h-8 sm:w-8">
                <Brain size={16} />
              </div>
              <div>
                <p className="text-sm font-black tracking-tight text-dashboard-fg uppercase">
                  {t("knowledge_graph")}
                </p>
                <p className="text-[10px] font-bold text-indigo-400 uppercase">
                  {t("fullscreen_analysis")}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
