"use client";

import React from "react";
import {
  Check,
  GitMerge,
  Trash2,
  ArrowRight,
  Zap,
  Loader2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatFullTag } from "@/lib/format-utils";
import { PendingUpdate, NodeWithTags } from "./types";
import TiltCard from "@/components/landing/TiltCard";

interface ProposalCardProps {
  update: PendingUpdate;
  existingNodes: NodeWithTags[];
  processingId: string | null;
  isSynthesizing: boolean;
  onAction: (id: string, action: "APPROVE" | "REJECT") => void;
  onStartMerge: (proposal: PendingUpdate, masters: NodeWithTags[]) => void;
  onCompare: (update: PendingUpdate, match: NodeWithTags | undefined) => void;
  style?: React.CSSProperties;
  className?: string;
}

export default function ProposalCard({
  update,
  existingNodes,
  processingId,
  isSynthesizing,
  onAction,
  onStartMerge,
  onCompare,
  style,
  className = "",
}: ProposalCardProps) {
  const { t } = useI18n();
  const data = {
    label: update.label,
    properties: JSON.parse(update.properties || "{}"),
  };
  const matches = update.matches || [];
  const hasHighSimilarity = matches.some((m) => m.score > 0.85);
  const topMatch = update.matches?.[0]
    ? existingNodes.find((n) => n.id === update.matches![0].id)
    : null;

  return (
    <TiltCard
      disableTilt={true}
      style={style}
      className={`group relative rounded-2xl border transition-all p-6 ${
        hasHighSimilarity
          ? "border-amber-500/30 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.05)]"
          : "glass"
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-accent-primary/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-accent-primary">
              {update.type}
            </span>
            {(() => {
              const bestTag =
                update.tags.find((t) => t.scope === "agent") ||
                update.tags.find((t) => t.scope === "project") ||
                update.tags[0];

              if (!bestTag) return null;

              return (
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  •{" "}
                  {formatFullTag(bestTag.scope, bestTag.name, bestTag.version)}
                </span>
              );
            })()}
          </div>
          <h4 className="text-lg font-black tracking-tight text-dashboard-fg">
            {data.label}
          </h4>
          <div className="flex flex-wrap gap-1 mt-1 mb-2">
            {update.tags.map((tag) => (
              <span
                key={tag.id}
                className="px-1.5 py-0.5 rounded text-[8px] font-bold border border-foreground/5"
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                }}
              >
                {formatFullTag(tag.scope, tag.name, tag.version)}
              </span>
            ))}
          </div>
          <p className="text-xs font-medium text-slate-500 line-clamp-2 max-w-2xl">
            {data.properties?.content || "No description provided."}
          </p>
        </div>

        <div className="flex gap-2 opacity-40 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onAction(update.id, "APPROVE")}
            disabled={!!processingId}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
          >
            {processingId === update.id ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={18} />
            )}
          </button>
          {topMatch && (
            <button
              onClick={() => {
                const allMasters = (update.matches || [])
                  .map((m) => existingNodes.find((en) => en.id === m.id))
                  .filter(Boolean) as NodeWithTags[];
                onStartMerge(update, allMasters);
              }}
              disabled={isSynthesizing || !!processingId}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600/10 text-amber-500 border border-amber-500/20 hover:bg-amber-600 hover:text-white transition-all disabled:opacity-50"
              title={t("merge_action")}
            >
              {isSynthesizing ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <GitMerge size={18} />
              )}
            </button>
          )}
          <button
            onClick={() => onAction(update.id, "REJECT")}
            disabled={!!processingId}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600/10 text-rose-500 border border-rose-500/20 hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {matches.length > 0 && (
        <div className="mt-4 space-y-2">
          {matches.map((matchInfo) => {
            const match = existingNodes.find((n) => n.id === matchInfo.id);
            const matchScore = matchInfo.score;
            return (
              <div
                key={matchInfo.id}
                className={`flex items-center justify-between rounded-xl p-3 border ${
                  matchScore > 0.85
                    ? "bg-amber-500/10 border-amber-500/20"
                    : "bg-foreground/5 border-foreground/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-lg ${
                      matchScore > 0.85
                        ? "bg-amber-500/20 text-amber-500"
                        : "bg-slate-700/20 text-slate-500"
                    }`}
                  >
                    <Zap size={12} />
                  </div>
                  <div>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-widest ${
                        matchScore > 0.85 ? "text-amber-600" : "text-slate-500"
                      }`}
                    >
                      {t("duplicate_detected", {
                        score: (matchScore * 100).toFixed(0),
                      })}
                    </p>
                    <p className="text-[10px] font-medium text-slate-500 italic">
                      {t("similar_to", {
                        label: match?.label || matchInfo.label,
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onCompare(update, match)}
                  className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-accent-primary hover:text-accent-secondary transition-colors"
                >
                  {t("compare")} <ArrowRight size={10} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </TiltCard>
  );
}
