import React, { useState } from "react";
import { Settings, Eye, EyeOff, ChevronDown, ChevronRight } from "lucide-react";
import { Tag } from "@/lib/db";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useI18n } from "@/lib/i18n";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function KnowledgeExplorer({
  tagsByScope,
  connectedTagIds,
  hideOrphans,
  onToggleOrphans,
  visibleTags,
  onToggleTag,
}: {
  tagsByScope: Record<string, Tag[]>;
  connectedTagIds: Set<string>;
  hideOrphans: boolean;
  onToggleOrphans: (val: boolean) => void;
  visibleTags: Set<string>;
  onToggleTag: (tagId: string) => void;
}) {
  const { t } = useI18n();
  const [expandedScopes, setExpandedScopes] = useState<Set<string>>(new Set());

  const toggleScope = (scope: string) => {
    const next = new Set(expandedScopes);
    if (next.has(scope)) next.delete(scope);
    else next.add(scope);
    setExpandedScopes(next);
  };

  const scopes = Object.keys(tagsByScope).sort();

  return (
    <div className="flex flex-col gap-4 p-4 rounded-2xl glass shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-left-4 max-h-[600px] overflow-y-auto w-72 pointer-events-auto">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-200">
          {t("knowledge_explorer")}
        </h4>
        <button
          onClick={() => onToggleOrphans(!hideOrphans)}
          className={cn(
            "flex items-center gap-2 px-2 py-1 rounded-md text-[9px] font-bold transition-all",
            hideOrphans
              ? "bg-indigo-500/20 text-indigo-400"
              : "bg-white/5 text-slate-500",
          )}
        >
          {hideOrphans ? <EyeOff size={12} /> : <Eye size={12} />}
          {hideOrphans ? t("hiding_empty") : t("showing_all")}
        </button>
      </div>

      <div className="flex flex-col gap-1">
        {scopes.map((scope) => {
          const tags = tagsByScope[scope];
          const isExpanded = expandedScopes.has(scope);
          const connectedCount = tags.filter((t) =>
            connectedTagIds.has(t.id),
          ).length;

          if (hideOrphans && connectedCount === 0) return null;

          return (
            <div key={scope} className="flex flex-col">
              <div
                className="flex items-center justify-between group cursor-pointer py-1.5"
                onClick={() => toggleScope(scope)}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown size={14} className="text-slate-500" />
                  ) : (
                    <ChevronRight size={14} className="text-slate-500" />
                  )}
                  <span
                    className={cn(
                      "text-[10px] font-black uppercase tracking-wider transition-all",
                      isExpanded
                        ? "text-dashboard-fg"
                        : "text-slate-400 group-hover:text-slate-200",
                    )}
                  >
                    {scope}
                  </span>
                  <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-white/5 text-slate-600 font-bold">
                    {connectedCount}/{tags.length}
                  </span>
                </div>
                <div className="p-1 text-slate-500 group-hover:text-dashboard-fg transition-colors">
                  <Settings size={12} />
                </div>
              </div>

              {isExpanded && (
                <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-white/5 pl-2 py-1">
                  {tags.map((tag) => {
                    const isConnected = connectedTagIds.has(tag.id);
                    if (hideOrphans && !isConnected) return null;

                    const isVisible = visibleTags.has(tag.id);

                    return (
                      <div
                        key={tag.id}
                        className="flex items-center justify-between group/tag py-1 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleTag(tag.id);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          <span
                            className={cn(
                              "text-[9px] font-medium transition-all",
                              isVisible
                                ? "text-slate-300"
                                : "text-slate-600 line-through",
                            )}
                          >
                            {tag.name}
                          </span>
                        </div>
                        <div className="opacity-40 group-hover/tag:opacity-100 transition-opacity">
                          {isVisible ? (
                            <Eye size={10} className="text-indigo-400" />
                          ) : (
                            <EyeOff size={10} className="text-slate-700" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
