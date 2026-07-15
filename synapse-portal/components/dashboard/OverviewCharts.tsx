"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import {
  Activity,
  Layers,
  Award,
  Users,
  GitMerge,
  Network,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useIsMounted } from "@/lib/hooks";

interface GrowthData {
  date: string;
  count: number;
}

interface DistributionData {
  name: string;
  value: number;
  color: string;
}

interface TypeDistributionData {
  name: string;
  value: number;
  color: string;
}

interface TopLessonsData {
  name: string;
  value: number;
}

interface AgentContributionData {
  name: string;
  value: number;
  color: string;
}

interface StatusDistributionData {
  name: string;
  value: number;
  color: string;
}

export default function OverviewCharts({
  growthData,
  distributionData,
  typeDistributionData,
  topLessonsData,
  agentContributionData,
  statusDistributionData,
  archiveCount,
}: {
  growthData: GrowthData[];
  distributionData: DistributionData[];
  typeDistributionData: TypeDistributionData[];
  topLessonsData: TopLessonsData[];
  agentContributionData: AgentContributionData[];
  statusDistributionData: StatusDistributionData[];
  archiveCount: number;
}) {
  const { t } = useI18n();
  const mounted = useIsMounted();

  const tooltipStyle = {
    backgroundColor: "var(--chart-tooltip-bg)",
    border: "1px solid var(--chart-tooltip-border)",
    borderRadius: "12px",
    fontSize: "12px",
    color: "var(--foreground)",
  };

  const itemStyle = { color: "var(--foreground)" };

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl glass p-6 h-[320px] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Node Growth Chart */}
      <div className="rounded-2xl glass p-6">
        <h3 className="mb-6 text-lg font-bold text-dashboard-fg flex items-center gap-2">
          <Activity size={18} className="text-indigo-500" />
          {t("node_growth")}
        </h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height={250} debounce={50}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="var(--chart-grid)"
              />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--chart-tick)", fontSize: 10 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--chart-tick)", fontSize: 10 }}
              />
              <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#818cf8"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorCount)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Knowledge Scope Distribution Chart */}
      <div className="rounded-2xl glass p-6">
        <h3 className="mb-6 text-lg font-bold text-dashboard-fg flex items-center gap-2">
          <Layers size={18} className="text-cyan-500" />
          {t("knowledge_distribution")}
        </h3>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height={250} debounce={50}>
            <BarChart data={distributionData} layout="vertical">
              <CartesianGrid
                strokeDasharray="3 3"
                horizontal={false}
                stroke="var(--chart-grid)"
              />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--chart-tick)", fontSize: 10 }}
              />
              <YAxis
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "var(--foreground)",
                  fontSize: 12,
                  fontWeight: 600,
                }}
                width={80}
              />
              <Tooltip
                cursor={{ fill: "var(--chart-cursor)" }}
                contentStyle={tooltipStyle}
                itemStyle={itemStyle}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Knowledge Types (Donut Chart) */}
      <div className="rounded-2xl glass p-6">
        <h3 className="mb-6 text-lg font-bold text-dashboard-fg flex items-center gap-2">
          <Network size={18} className="text-pink-500" />
          {t("knowledge_type")}
        </h3>
        <div className="h-[250px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height={250} debounce={50}>
            <PieChart>
              <Pie
                data={typeDistributionData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={6}
                dataKey="value"
              >
                {typeDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Top Efficacy Lessons (BarChart) */}
      <div className="rounded-2xl glass p-6">
        <h3 className="mb-6 text-lg font-bold text-dashboard-fg flex items-center gap-2">
          <Award size={18} className="text-amber-500" />
          {t("efficacy_lessons")}
        </h3>
        <div className="h-[250px] w-full">
          {topLessonsData.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 text-sm">
              <Award size={36} className="opacity-20 mb-2" />
              {t("no_success_lessons_data")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250} debounce={50}>
              <BarChart data={topLessonsData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--chart-grid)"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--chart-tick)", fontSize: 9 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--chart-tick)", fontSize: 10 }}
                />
                <Tooltip
                  cursor={{ fill: "var(--chart-cursor)" }}
                  contentStyle={tooltipStyle}
                  itemStyle={itemStyle}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={25}>
                  {topLessonsData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill="#fbbf24" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 5. Agent Contributions (Horizontal BarChart) */}
      <div className="rounded-2xl glass p-6">
        <h3 className="mb-6 text-lg font-bold text-dashboard-fg flex items-center gap-2">
          <Users size={18} className="text-emerald-500" />
          {t("agent_contributions")}
        </h3>
        <div className="h-[250px] w-full">
          {agentContributionData.length === 0 ? (
            <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 text-sm">
              <Users size={36} className="opacity-20 mb-2" />
              {t("no_agent_contributions")}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250} debounce={50}>
              <BarChart data={agentContributionData} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="var(--chart-grid)"
                />
                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--chart-tick)", fontSize: 10 }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "var(--foreground)",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                  width={80}
                />
                <Tooltip
                  cursor={{ fill: "var(--chart-cursor)" }}
                  contentStyle={tooltipStyle}
                  itemStyle={itemStyle}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={15}>
                  {agentContributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 6. Approval & Evolution (Donut + Stats) */}
      <div className="rounded-2xl glass p-6">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-dashboard-fg flex items-center gap-2">
            <GitMerge size={18} className="text-violet-500" />
            {t("approval_and_evolution")}
          </h3>
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
            {t("archive_merges", { count: archiveCount })}
          </span>
        </div>
        <div className="h-[250px] w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height={250} debounce={50}>
            <PieChart>
              <Pie
                data={statusDistributionData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={6}
                dataKey="value"
              >
                {statusDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
