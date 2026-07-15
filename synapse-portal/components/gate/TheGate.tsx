"use client";

import React, { useState } from "react";
import { Zap, ShieldCheck } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useRealtime } from "@/components/shared/RealtimeProvider";

import {
  PendingUpdate,
  NodeWithTags,
  CachedProposal,
  MergeData,
  TimelineLog,
} from "./types";
import ProposalCard from "./ProposalCard";
import ComparisonModal from "./ComparisonModal";
import MergeModal from "./MergeModal";
import EvolutionTimeline from "./EvolutionTimeline";

const DB_NAME = "synapse_cache";
const STORE_NAME = "merge_proposals";

const getIndexedDBCache = async (): Promise<Record<string, CachedProposal>> => {
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const getAllRequest = store.getAll();
      const getAllKeysRequest = store.getAllKeys();

      let values: CachedProposal[] | null = null;
      let keys: IDBValidKey[] | null = null;

      const checkComplete = () => {
        if (values !== null && keys !== null) {
          const cache: Record<string, CachedProposal> = {};
          keys.forEach((key, i) => {
            cache[key as string] = values![i];
          });
          resolve(cache);
        }
      };

      getAllRequest.onsuccess = () => {
        values = getAllRequest.result;
        checkComplete();
      };
      getAllKeysRequest.onsuccess = () => {
        keys = getAllKeysRequest.result;
        checkComplete();
      };
      getAllRequest.onerror = () => resolve({});
      getAllKeysRequest.onerror = () => resolve({});
    };
    request.onerror = () => resolve({});
  });
};

const setIndexedDBCache = async (key: string, value: CachedProposal) => {
  const request = indexedDB.open(DB_NAME, 1);
  request.onsuccess = () => {
    const db = request.result;
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(value, key);
  };
};

export default function TheGate({
  pendingUpdates,
  existingNodes,
}: {
  pendingUpdates: PendingUpdate[];
  existingNodes: NodeWithTags[];
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

  const [processingId, setProcessingId] = useState<string | null>(null);
  const [comparingUpdate, setComparingUpdate] = useState<{
    update: PendingUpdate;
    match?: NodeWithTags;
  } | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [mergeData, setMergeData] = useState<MergeData | null>(null);
  const [cachedProposals, setCachedProposals] = useState<
    Record<string, CachedProposal>
  >({});

  const [activeTab, setActiveTab] = useState<"gate" | "evolution">("gate");
  const [logs, setLogs] = useState<TimelineLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "APPROVED" | "REJECTED" | "ARCHIVE"
  >("ALL");
  const [undoingId, setUndoingId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch("/api/audit-logs");
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (e) {
      console.error("Failed to fetch audit logs", e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleUndo = async (
    id: string,
    type: "APPROVED" | "REJECTED" | "ARCHIVE",
  ) => {
    setUndoingId(id);
    try {
      const res = await fetch("/api/gate", {
        method: "POST",
        body: JSON.stringify({ id, action: "UNDO", type }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        await fetchLogs();
        router.refresh();
      } else {
        alert(data.message || "Failed to undo action");
      }
    } catch (e) {
      console.error("Undo action failed", e);
    } finally {
      setUndoingId(null);
    }
  };

  React.useEffect(() => {
    let isMounted = true;
    if (activeTab === "evolution") {
      const load = async () => {
        setIsLoadingLogs(true);
        try {
          const res = await fetch("/api/audit-logs");
          const data = await res.json();
          if (data.success && isMounted) {
            setLogs(data.logs);
          }
        } catch (e) {
          console.error("Failed to fetch audit logs", e);
        } finally {
          if (isMounted) {
            setIsLoadingLogs(false);
          }
        }
      };
      load();
    }
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  // Load cache from IndexedDB on mount
  React.useEffect(() => {
    let isMounted = true;
    getIndexedDBCache().then((cache) => {
      if (isMounted) {
        setCachedProposals(cache);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAction = async (id: string, action: "APPROVE" | "REJECT") => {
    setProcessingId(id);
    try {
      const res = await fetch("/api/gate", {
        method: "POST",
        body: JSON.stringify({ id, action }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setComparingUpdate(null);
        router.refresh();
      }
    } catch (e) {
      console.error("Action failed", e);
    } finally {
      setProcessingId(null);
    }
  };

  const startMergeFlow = async (
    proposal: PendingUpdate,
    masters: NodeWithTags[],
  ) => {
    setIsSynthesizing(true);
    setComparingUpdate(null);
    const allIds = [proposal.id, ...masters.map((m) => m.id)].sort();
    const cacheKey = allIds.join("_");

    const parsedProps = JSON.parse(proposal.properties || "{}");
    const sourceNodes = [
      {
        id: proposal.id,
        label: proposal.label,
        content: parsedProps.content || "No content provided.",
        type: proposal.type,
        isProposal: true,
      },
      ...masters.map((m) => {
        const parsedMProps = JSON.parse(m.properties || "{}");
        return {
          id: m.id,
          label: m.label,
          content: parsedMProps.content || "No content provided.",
          type: m.type,
          isProposal: false,
        };
      }),
    ];

    if (cachedProposals[cacheKey]) {
      const data = cachedProposals[cacheKey];
      const allTagsMap = new Map();
      [proposal, ...masters].forEach((n) => {
        n.tags?.forEach((t) => allTagsMap.set(t.id, t));
      });
      const allTags = Array.from(allTagsMap.values());

      // Intersection of tags across ALL nodes (common denominator)
      const intersectionTagIds = proposal.tags
        .filter((pt) =>
          masters.every((m) => m.tags?.some((mt) => mt.id === pt.id)),
        )
        .map((t) => t.id);

      setMergeData({
        sourceNodeIds: allIds,
        proposalId: proposal.id,
        label: data.label,
        type: masters[0].type,
        content: data.content,
        reason: data.reason,
        selectedTagIds: intersectionTagIds,
        similarityScore: Math.max(
          ...(proposal.matches
            ?.filter((m) => masters.some((mast) => mast.id === m.id))
            .map((m) => m.score) || [0]),
        ),
        allTags,
        sourceNodes,
      });
      setIsSynthesizing(false);
      return;
    }

    try {
      const res = await fetch("/api/gate/synthesize", {
        method: "POST",
        body: JSON.stringify({ nodeIds: allIds }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        const synthesis = {
          label: data.label,
          content: data.content,
          reason: data.reason,
        };

        // Cache result
        setCachedProposals((prev) => ({ ...prev, [cacheKey]: synthesis }));
        setIndexedDBCache(cacheKey, synthesis);

        const allTagsMap = new Map();
        [proposal, ...masters].forEach((n) => {
          n.tags?.forEach((t) => allTagsMap.set(t.id, t));
        });
        const allTags = Array.from(allTagsMap.values());

        const intersectionTagIds = proposal.tags
          .filter((pt) =>
            masters.every((m) => m.tags?.some((mt) => mt.id === pt.id)),
          )
          .map((t) => t.id);

        setMergeData({
          sourceNodeIds: allIds,
          proposalId: proposal.id,
          ...synthesis,
          type: masters[0].type,
          selectedTagIds: intersectionTagIds,
          similarityScore: Math.max(
            ...(proposal.matches
              ?.filter((m) => masters.some((mast) => mast.id === m.id))
              .map((m) => m.score) || [0]),
          ),
          allTags,
          sourceNodes,
        });
      }
    } catch (e) {
      console.error("Synthesis failed", e);
    } finally {
      setIsSynthesizing(false);
    }
  };

  const confirmMerge = async () => {
    if (!mergeData) return;
    setProcessingId(mergeData.proposalId);
    try {
      const res = await fetch("/api/gate/merge", {
        method: "POST",
        body: JSON.stringify({
          sourceNodeIds: mergeData.sourceNodeIds,
          selectedTagIds: mergeData.selectedTagIds,
          reason: mergeData.reason,
          similarityScore: mergeData.similarityScore,
          newLabel: mergeData.label,
          newType: mergeData.type,
          newContent: mergeData.content,
          action: "MERGE",
        }),
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        setMergeData(null);
        router.refresh();
      }
    } catch (e) {
      console.error("Merge failed", e);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black tracking-tight text-dashboard-fg uppercase italic">
            {activeTab === "gate" ? t("the_gate") : t("evolution_history")}
            <span className="text-accent-primary">.</span>
          </h3>
          <p className="text-xs font-medium text-slate-500">
            {activeTab === "gate"
              ? t("gate_subtitle")
              : t("evolution_subtitle")}
          </p>
        </div>
        {activeTab === "gate" && (
          <div className="flex items-center gap-2 rounded-lg bg-accent-primary/10 px-3 py-1.5 border border-accent-primary/20">
            <Zap size={14} className="text-accent-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-accent-primary">
              {t("pending_proposals", { count: pendingUpdates.length })}
            </span>
          </div>
        )}
      </div>

      {/* Tab Control */}
      <div className="flex border-b border-white/5 gap-6">
        <button
          onClick={() => setActiveTab("gate")}
          className={`pb-3 text-xs font-black tracking-widest uppercase transition-all border-b-2 ${
            activeTab === "gate"
              ? "border-accent-primary text-accent-primary"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          {t("review_gate")}
        </button>
        <button
          onClick={() => setActiveTab("evolution")}
          className={`pb-3 text-xs font-black tracking-widest uppercase transition-all border-b-2 ${
            activeTab === "evolution"
              ? "border-accent-primary text-accent-primary"
              : "border-transparent text-slate-500 hover:text-slate-300"
          }`}
        >
          {t("evolution_history")}
        </button>
      </div>

      {activeTab === "gate" ? (
        <div className="space-y-4">
          {pendingUpdates.length > 0 ? (
            pendingUpdates.map((update, i) => (
              <ProposalCard
                key={update.id}
                style={{ "--delay-index": (i % 4) + 1 } as React.CSSProperties}
                className="stagger-item"
                update={update}
                existingNodes={existingNodes}
                processingId={processingId}
                isSynthesizing={isSynthesizing}
                onAction={handleAction}
                onStartMerge={(u, m) => startMergeFlow(u, m)}
                onCompare={(u, m) =>
                  setComparingUpdate({ update: u, match: m })
                }
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed border-white/5 bg-slate-900/10">
              <ShieldCheck size={48} className="text-slate-800 mb-4" />
              <p className="text-lg font-black tracking-tight text-slate-600 uppercase">
                {t("no_proposals_title")}
              </p>
              <p className="text-xs text-slate-700">
                {t("no_proposals_subtitle")}
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Evolution Timeline View */
        <EvolutionTimeline
          logs={logs}
          isLoadingLogs={isLoadingLogs}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          undoingId={undoingId}
          onUndo={handleUndo}
        />
      )}

      {comparingUpdate && (
        <ComparisonModal
          comparingUpdate={comparingUpdate}
          processingId={processingId}
          isSynthesizing={isSynthesizing}
          onClose={() => setComparingUpdate(null)}
          onAction={handleAction}
          onStartMerge={(u, masters) => startMergeFlow(u, masters)}
        />
      )}

      {mergeData && (
        <MergeModal
          mergeData={mergeData}
          processingId={processingId}
          onClose={() => setMergeData(null)}
          onConfirm={confirmMerge}
          onUpdateMergeData={setMergeData}
        />
      )}
    </section>
  );
}
