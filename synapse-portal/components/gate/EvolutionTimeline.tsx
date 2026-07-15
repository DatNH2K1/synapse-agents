"use client";

import React from "react";
import {
  Search,
  Calendar,
  RotateCcw,
  CheckCircle,
  XCircle,
  GitMerge,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatFullTag } from "@/lib/format-utils";
import { TimelineLog } from "./types";

interface EvolutionTimelineProps {
  logs: TimelineLog[];
  isLoadingLogs: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: "ALL" | "APPROVED" | "REJECTED" | "ARCHIVE";
  setStatusFilter: (
    filter: "ALL" | "APPROVED" | "REJECTED" | "ARCHIVE",
  ) => void;
  undoingId: string | null;
  onUndo: (id: string, type: "APPROVED" | "REJECTED" | "ARCHIVE") => void;
}

export default function EvolutionTimeline({
  logs,
  isLoadingLogs,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  undoingId,
  onUndo,
}: EvolutionTimelineProps) {
  const { t } = useI18n();

  const filteredLogs = logs.filter((log) => {
    const properties = JSON.parse(log.properties || "{}");
    const content = properties.content || "";
    const matchesSearch =
      log.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.tags.some((tag) =>
        tag.name.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    const matchesStatus = statusFilter === "ALL" || log.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-dashboard-fg/45" />
          <input
            type="text"
            placeholder={t("all_actions") + "..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-bold bg-white/[0.04] border border-white/10 rounded-xl text-dashboard-fg placeholder:text-dashboard-fg/35 focus:outline-none focus:border-accent-primary/50 transition-all glass"
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {(["ALL", "APPROVED", "REJECTED", "ARCHIVE"] as const).map(
            (filter) => {
              const labelMap = {
                ALL: t("all_actions"),
                APPROVED: t("approved_status"),
                REJECTED: t("rejected_status"),
                ARCHIVE: t("merged_status"),
              };
              return (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                    statusFilter === filter
                      ? "bg-accent-primary/20 text-accent-primary border-accent-primary/45 shadow-[0_0_10px_rgba(99,102,241,0.15)]"
                      : "bg-white/[0.04] border-white/10 text-dashboard-fg/55 hover:bg-dashboard-fg/5 hover:text-dashboard-fg"
                  }`}
                >
                  {labelMap[filter]}
                </button>
              );
            },
          )}
        </div>
      </div>

      {/* Timeline Contents */}
      {isLoadingLogs ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-accent-primary h-8 w-8 mb-2" />
          <p className="text-xs font-black tracking-widest uppercase text-dashboard-fg/55">
            Loading Evolution Logs...
          </p>
        </div>
      ) : filteredLogs.length > 0 ? (
        <div className="relative space-y-8">
          {/* Timeline continuous line tracker */}
          <div className="absolute left-[13px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-emerald-500/25 via-rose-500/25 to-amber-500/25 rounded-full" />

          {filteredLogs.map((log) => {
            const properties = JSON.parse(log.properties || "{}");
            const content = properties.content || "No description provided.";
            const timestamp = new Date(log.last_verified).toLocaleString();

            return (
              <div
                key={log.id}
                className="relative flex flex-col pl-10 group animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                {/* Floating Circle marker for status */}
                <div className="absolute left-[0px] top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-dashboard-bg/90 border border-white/10 transition-all duration-300">
                  {log.status === "APPROVED" && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                      <CheckCircle size={10} />
                    </div>
                  )}
                  {log.status === "REJECTED" && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.25)]">
                      <XCircle size={10} />
                    </div>
                  )}
                  {log.status === "ARCHIVE" && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.25)]">
                      <GitMerge size={10} />
                    </div>
                  )}
                </div>

                {/* Timeline Event Card */}
                <div className="glass relative rounded-2xl p-5 border border-white/5 bg-white/[0.03] group-hover:bg-white/[0.06] group-hover:border-white/10 transition-all duration-300 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border ${
                          log.status === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : log.status === "REJECTED"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {log.status === "ARCHIVE"
                          ? t("merged_nodes")
                          : log.status}
                      </span>
                      {log.memory_tier && (
                        <span
                          className={`rounded-md px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border flex items-center gap-1 ${
                            log.memory_tier === "COLD"
                              ? "bg-sky-500/10 text-sky-400 border-sky-500/20 shadow-[0_0_8px_rgba(56,189,248,0.15)]"
                              : log.memory_tier === "CORE"
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_8px_rgba(168,85,247,0.15)]"
                                : log.memory_tier === "ACTIVE"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                          }`}
                        >
                          {log.memory_tier === "COLD" && "❄️ "}
                          {log.memory_tier === "CORE" && "🔮 "}
                          {log.memory_tier === "ACTIVE" && "✨ "}
                          {log.memory_tier}
                        </span>
                      )}
                      <span className="rounded bg-accent-primary/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-accent-primary border border-accent-primary/20">
                        {log.type}
                      </span>
                      {(() => {
                        const bestTag =
                          log.tags.find((t) => t.scope === "agent") ||
                          log.tags.find((t) => t.scope === "project") ||
                          log.tags[0];

                        if (!bestTag) return null;

                        return (
                          <span className="text-[9px] font-bold text-dashboard-fg/45 uppercase tracking-widest">
                            •{" "}
                            {formatFullTag(
                              bestTag.scope,
                              bestTag.name,
                              bestTag.version,
                            )}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center gap-1 text-[9px] font-bold text-dashboard-fg/45 uppercase tracking-widest">
                      <Calendar size={10} />
                      {timestamp}
                    </div>
                  </div>

                  {/* Title & Body */}
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-black tracking-tight text-dashboard-fg">
                      {log.label}
                    </h4>

                    {/* Render Tags */}
                    <div className="flex flex-wrap gap-1">
                      {log.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="px-1.5 py-0.5 rounded text-[8px] font-bold border border-white/10"
                          style={{
                            backgroundColor: `${tag.color}20`,
                            color: tag.color,
                          }}
                        >
                          {formatFullTag(tag.scope, tag.name, tag.version)}
                        </span>
                      ))}
                    </div>

                    <p className="text-xs text-dashboard-fg/55 line-clamp-3 max-w-4xl font-medium">
                      {content}
                    </p>
                  </div>

                  {/* Display Merge metadata detail if archived */}
                  {log.status === "ARCHIVE" && log.archiveDetail && (
                    <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-3 text-[11px] font-medium text-dashboard-fg/55 space-y-1">
                      <p className="font-bold text-amber-500 uppercase tracking-wider text-[9px]">
                        {t("merge_metadata")}
                      </p>
                      {log.archiveDetail.reason && (
                        <p>
                          <strong className="text-dashboard-fg/55">
                            {t("reason_label")}
                          </strong>{" "}
                          {log.archiveDetail.reason}
                        </p>
                      )}
                      {log.archiveDetail.similarityScore && (
                        <p>
                          <strong className="text-dashboard-fg/55">
                            {t("similarity_score_label")}
                          </strong>{" "}
                          {(log.archiveDetail.similarityScore * 100).toFixed(0)}
                          %
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Row - Undo capability */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => onUndo(log.id, log.status)}
                      disabled={!!undoingId}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-dashboard-fg/55 hover:bg-dashboard-fg/5 hover:text-dashboard-fg transition-all disabled:opacity-50"
                    >
                      {undoingId === log.id ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <RotateCcw size={10} />
                      )}
                      {t("undo")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed border-white/10 bg-white/[0.03]">
          <ShieldCheck size={48} className="text-dashboard-fg/35 mb-4" />
          <p className="text-lg font-black tracking-tight text-dashboard-fg/60 uppercase">
            {t("no_history_found")}
          </p>
          <p className="text-xs text-dashboard-fg/45">{t("no_history_desc")}</p>
        </div>
      )}
    </div>
  );
}
