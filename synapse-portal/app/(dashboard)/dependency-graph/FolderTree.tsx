import React from "react";
import {
  Folder,
  FileCode,
  ChevronDown,
  ChevronRight,
  FolderOpen,
} from "lucide-react";

export interface TreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  id?: string;
  children?: TreeNode[];
}

interface FolderTreeProps {
  fileTree: TreeNode[];
  selectedFileId: string | null;
  onFileSelect: (id: string) => void;
  expandedPaths: Set<string>;
  togglePath: (path: string) => void;
  title: string;
  subtitle?: string;
  noFilesText: string;
}

export const EXT_COLORS: Record<string, string> = {
  ts: "#818cf8", // Indigo
  tsx: "#6366f1", // Deep Indigo
  js: "#f59e0b", // Amber
  jsx: "#fbbf24", // Yellow
  py: "#38bdf8", // Sky
  go: "#14b8a6", // Teal
  vue: "#34d399", // Emerald/Vue Green
  php: "#a855f7", // Purple
  json: "#f43f5e", // Rose
};

const FolderTreeNode: React.FC<{
  node: TreeNode;
  selectedFileId: string | null;
  onFileSelect: (id: string) => void;
  expandedPaths: Set<string>;
  togglePath: (path: string) => void;
}> = ({ node, selectedFileId, onFileSelect, expandedPaths, togglePath }) => {
  const isExpanded = expandedPaths.has(node.path);
  const isSelected = node.type === "file" && node.id === selectedFileId;
  const hasChildren = node.children && node.children.length > 0;

  if (node.type === "folder") {
    return (
      <div className="pl-2">
        <button
          onClick={() => togglePath(node.path)}
          className="flex w-full items-center gap-1 py-0.5 text-left text-xs font-bold text-slate-400 hover:text-slate-200 transition-all outline-none"
        >
          <span className="text-slate-500 transition-transform duration-200 shrink-0">
            {isExpanded ? (
              <ChevronDown size={11} />
            ) : (
              <ChevronRight size={11} />
            )}
          </span>
          <Folder size={12} className="text-indigo-400/75 shrink-0" />
          <span className="truncate">{node.name}</span>
        </button>
        {isExpanded && hasChildren && (
          <div className="border-l border-white/5 ml-1.5 pl-0.5">
            {node.children!.map((child) => (
              <FolderTreeNode
                key={child.path}
                node={child}
                selectedFileId={selectedFileId}
                onFileSelect={onFileSelect}
                expandedPaths={expandedPaths}
                togglePath={togglePath}
              />
            ))}
          </div>
        )}
      </div>
    );
  } else {
    const ext = node.name.split(".").pop() || "";
    const color = EXT_COLORS[ext] || "#94a3b8";
    return (
      <div className="pl-2">
        <button
          onClick={() => node.id && onFileSelect(node.id)}
          className={`flex w-full items-center gap-1 py-0.5 px-1.5 text-left text-xs rounded transition-all outline-none ${
            isSelected
              ? "bg-indigo-500/15 text-indigo-300 font-semibold"
              : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.01]"
          }`}
        >
          <FileCode size={11} style={{ color }} className="shrink-0" />
          <span className="truncate">{node.name}</span>
        </button>
      </div>
    );
  }
};

export const FolderTree: React.FC<FolderTreeProps> = ({
  fileTree,
  selectedFileId,
  onFileSelect,
  expandedPaths,
  togglePath,
  title,
  subtitle,
  noFilesText,
}) => {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">
          <FolderOpen size={14} className="shrink-0" /> {title}
        </div>
        {subtitle && (
          <p className="text-[10px] text-slate-500 font-medium">{subtitle}</p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 custom-scrollbar">
        {fileTree.length > 0 ? (
          fileTree.map((node) => (
            <FolderTreeNode
              key={node.path}
              node={node}
              selectedFileId={selectedFileId}
              onFileSelect={onFileSelect}
              expandedPaths={expandedPaths}
              togglePath={togglePath}
            />
          ))
        ) : (
          <p className="text-xs text-slate-600 italic">{noFilesText}</p>
        )}
      </div>
    </div>
  );
};
