import { Node, Tag } from "@prisma/client";

export type NodeWithTags = Node & { tags: Tag[] };

export interface PendingUpdate {
  id: string;
  type: string;
  label: string;
  status: string;
  last_verified: string;
  properties: string;
  tags: {
    id: string;
    scope: string;
    name: string;
    version: string | null;
    color: string;
  }[];
  matches?: { id: string; label: string; score: number }[];
}

export interface CachedProposal {
  label: string;
  content: string;
  reason: string;
}

interface MergeSourceNode {
  id: string;
  label: string;
  content: string;
  type: string;
  isProposal?: boolean;
}

export interface MergeData {
  sourceNodeIds: string[];
  proposalId: string; // Keep for UI tracking (the main pending node)
  label: string;
  type: string;
  content: string;
  reason: string;
  selectedTagIds: string[];
  similarityScore: number;
  allTags: {
    id: string;
    scope: string;
    name: string;
    version: string | null;
    color: string;
  }[];
  sourceNodes: MergeSourceNode[];
}

export interface TimelineLog {
  id: string;
  label: string;
  type: string;
  properties: string;
  status: "APPROVED" | "REJECTED" | "ARCHIVE";
  memory_tier: string;
  last_verified: string;
  tags: {
    id: string;
    scope: string;
    name: string;
    version: string | null;
    color: string;
  }[];
  archiveDetail: {
    toNodeId: string;
    reason: string | null;
    similarityScore: number | null;
    mergedAt: string;
  } | null;
}
