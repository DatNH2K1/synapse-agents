"use client";

import React from "react";
import { GitMerge, Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatFullTag } from "@/lib/format-utils";
import { MergeData } from "./types";
import { NODE_TYPES } from "@/lib/constants";
import FormSelect from "../shared/FormSelect";

interface MergeModalProps {
  mergeData: MergeData;
  processingId: string | null;
  onClose: () => void;
  onConfirm: () => void;
  onUpdateMergeData: (data: MergeData) => void;
}

export default function MergeModal({
  mergeData,
  processingId,
  onClose,
  onConfirm,
  onUpdateMergeData,
}: MergeModalProps) {
  const { t } = useI18n();

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="flex w-full max-w-5xl max-h-[85vh] flex-col overflow-hidden rounded-3xl border border-amber-500/20 bg-slate-950 shadow-[0_0_50px_rgba(245,158,11,0.1)]">
        <div className="flex items-center justify-between gap-4 p-4 border-b border-white/5 bg-amber-500/5 sm:p-6">
          <div>
            <h4 className="text-xl font-black tracking-tight text-white uppercase italic flex items-center gap-2">
              <GitMerge className="text-amber-500" />
              {t("knowledge_synthesis")}
            </h4>
            <p className="text-[10px] text-amber-500/60 uppercase tracking-widest font-bold">
              {t("synthesize_subtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            {t("close")}
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          {/* Left Panel: Source Nodes Review */}
          <div className="max-h-[42vh] overflow-y-auto border-b border-white/5 bg-slate-950/50 p-4 space-y-4 custom-scrollbar lg:max-h-none lg:w-[38%] lg:border-b-0 lg:border-r lg:p-6">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                {t("source_nodes_review")}
              </span>
              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                {t("nodes_count", { count: mergeData.sourceNodes.length })}
              </span>
            </div>

            <div className="space-y-4">
              {mergeData.sourceNodes.map((node) => (
                <div
                  key={node.id}
                  className={`rounded-2xl border p-4 space-y-3 transition-all ${
                    node.isProposal
                      ? "border-amber-500/20 bg-amber-500/5 shadow-[0_4px_12px_rgba(245,158,11,0.03)]"
                      : "border-white/5 bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest border ${
                        node.isProposal
                          ? "bg-amber-500/20 text-amber-500 border-amber-500/20"
                          : "bg-slate-800 border-slate-700 text-slate-400"
                      }`}
                    >
                      {node.isProposal ? "Proposal" : "Master"}
                    </span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">
                      {node.type}
                    </span>
                  </div>
                  <h6 className="text-xs font-bold text-white leading-tight">
                    {node.label}
                  </h6>
                  <div className="text-[11px] text-slate-400 font-medium leading-relaxed max-h-[160px] overflow-y-auto pr-1.5 custom-scrollbar whitespace-pre-wrap font-mono rounded-xl bg-slate-900/60 p-3 border border-white/5 select-text">
                    {node.content}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Merge Synthesized Editor */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar lg:p-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                  {t("label_header")}
                </label>
                <input
                  type="text"
                  value={mergeData.label}
                  onChange={(e) =>
                    onUpdateMergeData({ ...mergeData, label: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:border-amber-500/50 outline-none transition-all"
                />
              </div>
              <FormSelect
                label={t("type_label")}
                value={mergeData.type}
                onChange={(e) =>
                  onUpdateMergeData({ ...mergeData, type: e.target.value })
                }
                options={NODE_TYPES.map((t) => ({ value: t, label: t }))}
              />
            </div>

            {/* Content Editor */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                {t("synthesized_content")}
              </label>
              <textarea
                value={mergeData.content}
                onChange={(e) =>
                  onUpdateMergeData({ ...mergeData, content: e.target.value })
                }
                rows={9}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-slate-300 font-mono focus:border-amber-500/50 outline-none transition-all resize-none"
              />
            </div>

            {/* Tag Selector */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                {t("select_tags_union")}
              </label>
              <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-white/5 border border-white/10">
                {mergeData.allTags.map((tag) => {
                  const isSelected = mergeData.selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => {
                        const newIds = isSelected
                          ? mergeData.selectedTagIds.filter(
                              (id) => id !== tag.id,
                            )
                          : [...mergeData.selectedTagIds, tag.id];
                        onUpdateMergeData({
                          ...mergeData,
                          selectedTagIds: newIds,
                        });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20"
                          : "bg-white/5 border-white/10 text-slate-500 hover:border-white/20"
                      }`}
                    >
                      {formatFullTag(tag.scope, tag.name, tag.version)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                {t("merge_reason")}
              </label>
              <input
                type="text"
                value={mergeData.reason}
                onChange={(e) =>
                  onUpdateMergeData({ ...mergeData, reason: e.target.value })
                }
                placeholder={t("merge_reason_placeholder")}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-500/50 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/5 bg-slate-900/50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                {t("similarity_score_value", {
                  score: (mergeData.similarityScore * 100).toFixed(1),
                })}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl text-slate-400 hover:text-white transition-all text-xs font-black uppercase tracking-widest"
            >
              {t("cancel")}
            </button>
            <button
              onClick={onConfirm}
              disabled={processingId === mergeData.proposalId}
              className="px-8 py-2 rounded-xl bg-amber-600 text-white shadow-lg shadow-amber-600/20 hover:bg-amber-500 transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2"
            >
              {processingId === mergeData.proposalId ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <GitMerge size={14} />
              )}
              {t("confirm_merge")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
