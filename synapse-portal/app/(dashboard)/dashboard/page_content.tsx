"use client";

import React, { useMemo } from "react";
import { Clock, Activity, ShieldCheck, Zap } from "lucide-react";
import StatCard from "@/components/shared/StatCard";
import { useI18n } from "@/lib/i18n";
import { Node, Edge, Tag } from "@/lib/db";
import OverviewCharts from "@/components/dashboard/OverviewCharts";
import KnowledgeAtlas from "@/components/dashboard/KnowledgeAtlas";
import { formatFullTag } from "@/lib/format-utils";
import { useRealtime } from "@/components/shared/RealtimeProvider";
import { useRouter } from "next/navigation";

export default function OverviewPageContent({
  nodes,
  edges,
  tags,
  tagEdges,
  pendingCount,
  userName,
  dashboardMetrics,
}: {
  nodes: Node[];
  edges: Edge[];
  tags: Tag[];
  tagEdges: Edge[];
  pendingCount: number;
  userName: string;
  dashboardMetrics: {
    statusCounts: { status: string; count: number }[];
    archiveCount: number;
  };
}) {
  const { t } = useI18n();
  const router = useRouter();
  const { subscribeToUpdates } = useRealtime();

  React.useEffect(() => {
    const unsubscribe = subscribeToUpdates(() => {
      router.refresh();
    });
    return unsubscribe;
  }, [subscribeToUpdates, router]);

  // --- Data Processing for Charts ---
  const growthData = useMemo(() => {
    // Group nodes by date (YYYY-MM-DD)
    const dailyCounts: Record<string, number> = {};
    nodes.forEach((node) => {
      const date = new Date(node.last_verified).toISOString().split("T")[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    // Sort dates and calculate cumulative count
    const sortedDates = Object.keys(dailyCounts).sort();
    const result: { date: string; count: number }[] = [];
    let currentTotal = 0;

    for (const date of sortedDates) {
      currentTotal += dailyCounts[date];
      result.push({ date, count: currentTotal });
    }

    return result;
  }, [nodes]);

  const distributionData = useMemo(() => {
    const scopeColors: Record<string, string> = {
      technology: "#f43f5e",
      project: "#8b5cf6",
      agent: "#ec4899",
      scope: "#06b6d4",
    };

    // Better approach: Count nodes for each scope present in their tags
    const counts: Record<string, number> = {
      technology: 0,
      project: 0,
      agent: 0,
    };

    nodes.forEach((node) => {
      const nodeTags = (node as Node & { tags?: Tag[] }).tags || [];
      const scopes = new Set(nodeTags.map((t) => t.scope.toLowerCase()));
      scopes.forEach((s) => {
        if (counts[s] !== undefined) counts[s]++;
      });
    });

    return Object.keys(counts).map((scope) => ({
      name: scope.charAt(0).toUpperCase() + scope.slice(1),
      value: counts[scope],
      color: scopeColors[scope] || "#64748b",
    }));
  }, [nodes]);

  const typeDistributionData = useMemo(() => {
    const counts = {
      LESSON: 0,
      CONTEXT: 0,
      FEATURE: 0,
    };
    nodes.forEach((node) => {
      if (counts[node.type as keyof typeof counts] !== undefined) {
        counts[node.type as keyof typeof counts]++;
      }
    });
    return [
      { name: t("lessons"), value: counts.LESSON, color: "#818cf8" },
      { name: t("contexts"), value: counts.CONTEXT, color: "#a855f7" },
      { name: t("features"), value: counts.FEATURE, color: "#ec4899" },
    ];
  }, [nodes, t]);

  const topLessonsData = useMemo(() => {
    return [...nodes]
      .filter((n) => n.type === "LESSON" && n.success_count > 0)
      .sort((a, b) => b.success_count - a.success_count)
      .slice(0, 5)
      .map((n) => ({
        name: n.label.length > 20 ? n.label.slice(0, 20) + "..." : n.label,
        value: n.success_count,
      }));
  }, [nodes]);

  const agentContributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    nodes.forEach((node) => {
      const nodeTags = (node as Node & { tags?: Tag[] }).tags || [];
      nodeTags.forEach((tag: Tag) => {
        if (tag.scope.toLowerCase() === "agent") {
          let agentName = tag.name;
          if (agentName.startsWith("synapse-agent-")) {
            agentName = agentName.replace("synapse-agent-", "");
          }
          agentName = agentName.charAt(0).toUpperCase() + agentName.slice(1);
          counts[agentName] = (counts[agentName] || 0) + 1;
        }
      });
    });

    const colors = [
      "#f43f5e",
      "#0ea5e9",
      "#8b5cf6",
      "#fbbf24",
      "#10b981",
      "#ec4899",
      "#6366f1",
      "#14b8a6",
      "#f59e0b",
      "#d946ef",
      "#06b6d4",
    ];
    return Object.keys(counts)
      .map((name, idx) => ({
        name,
        value: counts[name],
        color: colors[idx % colors.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [nodes]);

  const statusDistributionData = useMemo(() => {
    const statusColorMap: Record<string, string> = {
      APPROVED: "#10b981",
      PENDING: "#f59e0b",
      REJECTED: "#ef4444",
      ARCHIVE: "#64748b",
    };

    const defaultStatuses = ["APPROVED", "PENDING", "REJECTED", "ARCHIVE"];
    const counts: Record<string, number> = {};
    defaultStatuses.forEach((s) => {
      counts[s] = 0;
    });

    (dashboardMetrics.statusCounts || []).forEach((sc) => {
      counts[sc.status] = sc.count;
    });

    return defaultStatuses
      .map((status) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
        value: counts[status],
        color: statusColorMap[status] || "#64748b",
      }))
      .filter((item) => item.value > 0);
  }, [dashboardMetrics]);

  // --- Data Processing for Knowledge Graph ---
  const graphData = useMemo(() => {
    const rootColorMap: Record<string, string> = {
      technology: "#f43f5e",
      project: "#8b5cf6",
      agent: "#ec4899",
      scope: "#06b6d4",
    };

    const uniqueScopes = Array.from(
      new Set(tags.map((t) => t.scope.toLowerCase())),
    ).filter((s) => s !== "global");

    const effectiveMetaRoots = uniqueScopes.map((scopeName) => ({
      id: `root-${scopeName}`,
      type: "ROOT_SCOPE",
      label: scopeName.toUpperCase(),
      color: rootColorMap[scopeName] || "#64748b",
      val: 18,
    }));

    const combinedNodes = [
      ...nodes.map((n) => ({
        ...n,
        val: 3,
        color: (n as Node & { color?: string }).color || "#64748b",
      })),
      ...tags.map((t) => ({
        id: t.id,
        type: "TAG",
        label: formatFullTag(t.scope, t.name, t.version),
        color: t.color,
        val: 10,
        content_hash: null,
        success_count: 0,
        last_verified: new Date(),
        properties: JSON.stringify({ scope: t.scope }),
        status: "APPROVED",
        embeddingModel: null,
      })),
      ...effectiveMetaRoots.map((r) => ({
        ...r,
        content_hash: null,
        success_count: 0,
        last_verified: new Date(),
        properties: JSON.stringify({ isRoot: true }),
        status: "APPROVED",
        embeddingModel: null,
      })),
    ];

    const rootEdges: Edge[] = [];
    let syntheticEdgeId = -1;
    tags.forEach((ct) => {
      const parentRoot = effectiveMetaRoots.find(
        (rt) => rt.id === `root-${ct.scope.toLowerCase()}`,
      );
      if (parentRoot) {
        rootEdges.push({
          id: syntheticEdgeId--,
          from_id: parentRoot.id,
          to_id: ct.id,
          relation_type: "ROOT_LINK",
          properties: "{}",
        });
      }
    });

    const validNodeIds = new Set(combinedNodes.map((n) => n.id));
    const filteredTagEdges = tagEdges.filter(
      (te) => validNodeIds.has(te.from_id) && validNodeIds.has(te.to_id),
    );

    return {
      nodes: combinedNodes as Node[],
      edges: [...edges, ...filteredTagEdges, ...rootEdges],
    };
  }, [nodes, edges, tags, tagEdges]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      <section>
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p
              className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-slate-600"
              suppressHydrationWarning
            >
              <Clock size={10} /> {new Date().toLocaleDateString()} •{" "}
              {t("system_stable")}
            </p>
          </div>
        </div>
        <h2 className="mb-2 text-4xl font-black tracking-tight text-dashboard-fg">
          {t("hello")},{" "}
          <span className="bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
            {userName}
          </span>
        </h2>
        <p className="text-base font-medium text-slate-500 max-w-xl">
          {t("processing_nodes", { nodes: nodes.length })}
        </p>
      </section>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          style={{ "--delay-index": 1 } as React.CSSProperties}
          className="stagger-item"
          label={t("total_nodes")}
          value={nodes.length}
          icon={<Activity size={20} className="text-indigo-400" />}
        />
        <StatCard
          style={{ "--delay-index": 2 } as React.CSSProperties}
          className="stagger-item"
          label={t("successful_lessons")}
          value={nodes.filter((n) => n.type === "LESSON").length}
          icon={<ShieldCheck size={20} className="text-emerald-400" />}
        />
        <StatCard
          style={{ "--delay-index": 3 } as React.CSSProperties}
          className="stagger-item"
          label={t("pending_approval")}
          value={pendingCount}
          icon={<Zap size={20} className="text-amber-400" />}
        />
      </div>

      {/* Charts Section */}
      <OverviewCharts
        growthData={growthData}
        distributionData={distributionData}
        typeDistributionData={typeDistributionData}
        topLessonsData={topLessonsData}
        agentContributionData={agentContributionData}
        statusDistributionData={statusDistributionData}
        archiveCount={dashboardMetrics.archiveCount}
      />

      {/* Knowledge Graph */}
      <div className="grid grid-cols-1 gap-6">
        <KnowledgeAtlas
          nodes={graphData.nodes}
          edges={graphData.edges}
          tags={tags}
        />
      </div>
    </div>
  );
}
