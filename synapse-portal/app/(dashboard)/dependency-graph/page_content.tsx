"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  RotateCcw,
  Search,
  FileCode,
  Network,
  ChevronRight,
  Activity,
  FolderOpen,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import Select from "@/components/shared/Select";
import { FolderTree, TreeNode, EXT_COLORS } from "./FolderTree";

const ForceGraph = dynamic(() => import("./ForceGraphWrapper"), { ssr: false });

interface Symbol {
  id: string;
  name: string;
  kind: string;
  range: string;
}

interface FileNode {
  id: string;
  path: string;
  hash: string;
  symbols: Symbol[];
}

interface Dependency {
  id: string;
  dependentFileId: string;
  dependencyFileId: string;
  symbolName: string | null;
}

export default function DependencyGraphContent({
  initialRepos,
}: {
  initialRepos: string[];
}) {
  const { t } = useI18n();

  const [repos] = useState<string[]>(initialRepos);
  const [selectedRepo, setSelectedRepo] = useState<string>(
    initialRepos[0] || "synapse",
  );

  const [files, setFiles] = useState<FileNode[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"tree" | "graph" | "details">(
    "graph",
  );
  const [impactData, setImpactData] = useState<
    { path: string; depth: number }[]
  >([]);
  const [isLoadingImpact, setIsLoadingImpact] = useState(false);

  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [filterOrphans, setFilterOrphans] = useState(false);

  const [prevFilterOrphans, setPrevFilterOrphans] = useState(false);
  const [prevFilteredFiles, setPrevFilteredFiles] = useState<FileNode[]>([]);

  const connectedNodeIds = useMemo(() => {
    const ids = new Set<string>();
    dependencies.forEach((dep) => {
      ids.add(dep.dependentFileId);
      ids.add(dep.dependencyFileId);
    });
    return ids;
  }, [dependencies]);

  const orphanCount = useMemo(() => {
    return files.filter((f) => !connectedNodeIds.has(f.id)).length;
  }, [files, connectedNodeIds]);

  const filteredFiles = useMemo(() => {
    if (!filterOrphans) return files;
    return files.filter((f) => !connectedNodeIds.has(f.id));
  }, [files, connectedNodeIds, filterOrphans]);

  if (
    filterOrphans !== prevFilterOrphans ||
    filteredFiles !== prevFilteredFiles
  ) {
    setPrevFilterOrphans(filterOrphans);
    setPrevFilteredFiles(filteredFiles);
    if (filterOrphans) {
      const paths = new Set<string>();
      filteredFiles.forEach((file) => {
        const parts = file.path.split("/");
        let currentPath = "";
        for (let i = 0; i < parts.length - 1; i++) {
          currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
          paths.add(currentPath);
        }
      });
      setExpandedPaths(paths);
    } else {
      setExpandedPaths(new Set());
    }
  }

  const togglePath = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const fileTree = useMemo(() => {
    const rootNode: TreeNode = {
      name: "Root",
      path: "",
      type: "folder",
      children: [],
    };

    filteredFiles.forEach((file) => {
      const parts = file.path.split("/");
      let current = rootNode;
      let currentPath = "";

      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isLast = index === parts.length - 1;

        if (!current.children) {
          current.children = [];
        }

        let found = current.children.find((child) => child.name === part);
        if (!found) {
          found = {
            name: part,
            path: currentPath,
            type: isLast ? "file" : "folder",
            id: isLast ? file.id : undefined,
            children: isLast ? undefined : [],
          };
          current.children.push(found);
        }
        current = found;
      });
    });

    const sortTree = (node: TreeNode) => {
      if (node.children) {
        node.children.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === "folder" ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortTree);
      }
    };

    sortTree(rootNode);
    return rootNode.children || [];
  }, [filteredFiles]);

  const graphRef = useRef<{
    zoomIn: () => void;
    zoomOut: () => void;
    zoomToFit: (d?: number) => void;
  } | null>(null);

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

  // Load graph data dynamically when selectedRepo changes
  useEffect(() => {
    let active = true;
    async function loadGraph() {
      setIsLoadingGraph(true);
      try {
        const res = await fetch(
          `/api/indexer/graph?repo=${encodeURIComponent(selectedRepo)}`,
        );
        const data = await res.json();
        if (data.success !== false && active) {
          setFiles(data.files || []);
          setDependencies(data.dependencies || []);
          setSelectedFileId(null);
          setImpactData([]);
        }
      } catch (err) {
        console.error("Failed to load graph:", err);
      } finally {
        if (active) setIsLoadingGraph(false);
      }
    }
    loadGraph();
    return () => {
      active = false;
    };
  }, [selectedRepo]);

  // Parse files list to force graph format
  const { nodes, links } = useMemo(() => {
    const gNodes = files.map((file) => {
      const ext = file.path.split(".").pop() || "";
      const color = EXT_COLORS[ext] || "#94a3b8"; // fallback slate
      return {
        id: file.id,
        label: file.path,
        kind: ext.toUpperCase(),
        size: file.symbols.length || 1,
        color,
      };
    });

    const gLinks = dependencies.map((dep) => ({
      source: dep.dependentFileId,
      target: dep.dependencyFileId,
    }));

    return { nodes: gNodes, links: gLinks };
  }, [files, dependencies]);

  const filteredNodes = useMemo(() => {
    if (!filterOrphans) return nodes;
    return nodes.filter((n) => !connectedNodeIds.has(n.id));
  }, [nodes, connectedNodeIds, filterOrphans]);

  const filteredLinks = useMemo(() => {
    if (filterOrphans) return [];
    return links;
  }, [links, filterOrphans]);

  const matchingNodes = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) return [];
    return filteredNodes.filter((n) => n.label.toLowerCase().includes(trimmed));
  }, [filteredNodes, searchQuery]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && matchingNodes.length > 0) {
      e.preventDefault();
      setActiveMatchIndex((prev) => (prev + 1) % matchingNodes.length);
    }
  };

  // Selected file details
  const selectedFile = useMemo(() => {
    return files.find((f) => f.id === selectedFileId);
  }, [files, selectedFileId]);

  // Fetch impact blast radius from the backend API
  const handleNodeClick = async (nodeId: string) => {
    setSelectedFileId(nodeId);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setActiveTab("details");
    }
    const file = files.find((f) => f.id === nodeId);
    if (!file) return;

    // Expand parent folders of the clicked file
    const parts = file.path.split("/");
    if (parts.length > 1) {
      setExpandedPaths((prev) => {
        const next = new Set(prev);
        let currentPath = "";
        for (let i = 0; i < parts.length - 1; i++) {
          currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i];
          next.add(currentPath);
        }
        return next;
      });
    }

    setIsLoadingImpact(true);
    setImpactData([]);
    try {
      const response = await fetch(
        `/api/indexer/impact?file=${encodeURIComponent(
          file.path,
        )}&repo=${encodeURIComponent(selectedRepo)}`,
      );
      const data = await response.json();
      if (data.success !== false) {
        setImpactData(data.impactedFiles || []);
      }
    } catch (err) {
      console.error("Failed to load impact analysis:", err);
    } finally {
      setIsLoadingImpact(false);
    }
  };

  const handleZoomIn = () => graphRef.current?.zoomIn();
  const handleZoomOut = () => graphRef.current?.zoomOut();
  const handleResetZoom = () => graphRef.current?.zoomToFit(400);

  const repoOptions = useMemo(() => {
    return repos.map((r) => ({ value: r, label: r }));
  }, [repos]);

  return (
    <div
      className={`space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10 ${
        isFullscreen ? "fixed inset-0 z-[100] bg-[#020617] p-6 space-y-0" : ""
      }`}
    >
      {!isFullscreen && (
        <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-dashboard-fg">
              {t("dependency_graph")}
            </h2>
            <p className="text-base font-medium text-slate-500">
              {t("dep_graph_subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Repository Selector Dropdown */}
            <Select
              value={selectedRepo}
              onChange={setSelectedRepo}
              options={repoOptions}
              icon={<FolderOpen size={14} className="text-indigo-400" />}
              disabled={repos.length === 0}
            />
            <button
              onClick={() => setFilterOrphans(!filterOrphans)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition-all duration-300 ${
                filterOrphans
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                  : "border-white/5 bg-dashboard-bg/85 text-slate-400 hover:bg-white/5 hover:text-slate-300"
              }`}
            >
              <Network
                size={14}
                className={
                  filterOrphans
                    ? "text-amber-400 animate-pulse"
                    : "text-amber-500"
                }
              />
              <span>
                {filterOrphans ? "Orphans Only" : `Orphans (${orphanCount})`}
              </span>
            </button>
            <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-dashboard-bg/85 px-4 py-2 text-xs font-bold text-slate-400">
              <Activity size={14} className="text-emerald-400" />
              {t("files_count", { count: files.length })}
            </div>
          </div>
        </section>
      )}

      {/* Segmented control for mobile screens */}
      <div className="flex rounded-xl bg-slate-900/50 p-1 border border-white/5 lg:hidden">
        <button
          onClick={() => setActiveTab("tree")}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
            activeTab === "tree"
              ? "bg-indigo-600 text-white shadow"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {t("folder_tree")}
        </button>
        <button
          onClick={() => setActiveTab("graph")}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
            activeTab === "graph"
              ? "bg-indigo-600 text-white shadow"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {t("dependency_graph")}
        </button>
        <button
          onClick={() => setActiveTab("details")}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all relative ${
            activeTab === "details"
              ? "bg-indigo-600 text-white shadow"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {t("details")}
          {selectedFileId && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>
      </div>

      <div
        className={`grid grid-cols-1 gap-6 lg:grid-cols-12 2xl:grid-cols-12 ${isFullscreen ? "h-full w-full" : ""}`}
      >
        {/* Folder Tree Sidebar */}
        <div
          className={`rounded-2xl glass p-5 border border-white/5 flex flex-col gap-4 shadow-2xl overflow-y-auto lg:col-span-4 lg:row-start-1 2xl:col-span-3 ${
            activeTab === "tree" ? "flex" : "hidden lg:flex"
          } ${
            isFullscreen
              ? "h-[90vh]"
              : "h-[calc(100vh-16rem)] min-h-[500px] lg:h-[calc(50vh-9rem)] lg:min-h-[250px] 2xl:h-[calc(100vh-16rem)] 2xl:min-h-[500px]"
          }`}
        >
          <FolderTree
            fileTree={fileTree}
            selectedFileId={selectedFileId}
            onFileSelect={handleNodeClick}
            expandedPaths={expandedPaths}
            togglePath={togglePath}
            title={t("folder_tree")}
            subtitle="Browse workspace file hierarchy"
            noFilesText={t("no_results")}
          />
        </div>

        {/* Force Graph Panel */}
        <div
          className={`relative overflow-hidden rounded-2xl glass shadow-2xl border border-white/5 lg:col-span-8 lg:row-span-2 2xl:col-span-6 2xl:row-span-1 ${
            activeTab === "graph" ? "block" : "hidden lg:block"
          } ${
            isFullscreen
              ? "h-[90vh]"
              : "h-[calc(100vh-16rem)] min-h-[520px] 2xl:min-h-[500px]"
          }`}
        >
          {isLoadingGraph ? (
            <div className="absolute inset-0 z-[120] flex items-center justify-center bg-[#020617]/50 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                <span className="text-sm text-slate-400 font-bold">
                  {t("analyzing_graph")}
                </span>
              </div>
            </div>
          ) : null}

          <ForceGraph
            nodes={filteredNodes}
            links={filteredLinks}
            onNodeClick={handleNodeClick}
            onRef={handleOnRef}
            searchQuery={searchQuery}
            activeMatchId={matchingNodes[activeMatchIndex]?.id}
          />

          {/* Search bar overlay */}
          <div className="absolute left-4 top-4 z-[110] flex w-72 items-center gap-2 rounded-xl border border-white/10 bg-dashboard-bg/90 px-3 py-2 shadow-2xl backdrop-blur-xl">
            <Search size={14} className="text-slate-400" />
            <input
              type="text"
              placeholder={t("search_file_placeholder")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActiveMatchIndex(0);
              }}
              onKeyDown={handleSearchKeyDown}
              className="w-full bg-transparent text-xs text-dashboard-fg placeholder-slate-500 outline-none"
            />
          </div>

          {/* Controls Overlay */}
          <div className="absolute right-4 top-4 z-[110] flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="rounded-xl glass p-2.5 text-dashboard-fg/55 shadow-2xl backdrop-blur-xl transition-all hover:bg-dashboard-fg/5 hover:text-dashboard-fg"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <div className="flex gap-1 rounded-xl border border-white/10 bg-dashboard-bg/85 p-1 shadow-2xl backdrop-blur-xl">
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
                className="rounded-lg p-2 text-dashboard-fg/55 transition-all hover:bg-dashboard-fg/5 hover:text-dashboard-fg"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Selected File Details Panel */}
        <div
          className={`rounded-2xl glass p-6 border border-white/5 flex flex-col gap-6 shadow-2xl overflow-y-auto lg:col-span-4 lg:row-start-2 2xl:col-span-3 2xl:row-start-1 ${
            activeTab === "details" ? "flex" : "hidden lg:flex"
          } ${
            isFullscreen
              ? "h-[90vh]"
              : "h-[calc(100vh-16rem)] min-h-[500px] lg:h-[calc(50vh-9rem)] lg:min-h-[250px] 2xl:h-[calc(100vh-16rem)] 2xl:min-h-[500px]"
          }`}
        >
          {selectedFile ? (
            <>
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">
                  <FileCode size={14} /> {t("details")}
                </div>
                <h3 className="text-lg font-black tracking-tight text-dashboard-fg break-all">
                  {selectedFile.path.split("/").pop()}
                </h3>
                <p className="text-xs text-slate-500 font-mono break-all mt-1">
                  {selectedFile.path}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  {t("md5_hash")}
                </p>
                <code className="block rounded-lg bg-black/40 px-3 py-2 text-[10px] font-mono text-emerald-400 break-all border border-white/5">
                  {selectedFile.hash}
                </code>
              </div>

              {/* Exports */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  {t("exported_symbols", {
                    count: selectedFile.symbols.length,
                  })}
                </p>
                {selectedFile.symbols.length > 0 ? (
                  <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                    {selectedFile.symbols.map((sym) => (
                      <div
                        key={sym.id}
                        className="flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-1.5 border border-white/5"
                      >
                        <span className="text-xs font-bold text-dashboard-fg font-mono truncate mr-2">
                          {sym.name}
                        </span>
                        <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[8px] font-black uppercase text-indigo-400 tracking-wider">
                          {sym.kind}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 italic">
                    {t("no_exports")}
                  </p>
                )}
              </div>

              {/* Impact / Blast Radius */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1">
                  <Network
                    size={12}
                    className="text-accent-primary animate-pulse"
                  />
                  {t("blast_radius")}
                </p>

                {isLoadingImpact ? (
                  <div className="flex items-center gap-2 py-4 justify-center">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                    <span className="text-xs text-slate-500">
                      {t("analyzing_graph")}
                    </span>
                  </div>
                ) : impactData.length > 0 ? (
                  <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                    {impactData.map((item) => (
                      <div
                        key={item.path}
                        className="flex items-center justify-between rounded-lg bg-rose-500/5 px-3 py-1.5 border border-rose-500/10"
                      >
                        <span className="text-xs font-bold text-dashboard-fg font-mono truncate mr-2">
                          {item.path.split("/").pop()}
                        </span>
                        <span className="flex items-center gap-1 text-[9px] font-black text-rose-400">
                          {t("depth_label")} <ChevronRight size={8} />{" "}
                          {item.depth}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-600 italic">
                    {t("no_dependents")}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <Network
                size={48}
                className="text-slate-700 animate-pulse mb-3"
              />
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                {t("select_file_analyze")}
              </h4>
              <p className="text-xs text-slate-600 mt-2">
                {t("click_node_instruction")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
