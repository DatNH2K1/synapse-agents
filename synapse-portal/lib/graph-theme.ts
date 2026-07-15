import { Node, Tag } from "./db";
import { Edge as DbEdge } from "./db";

export function getNodeColor(node: Node & { color?: string }): string {
  if (node.type === "TAG") return (node as Node & Tag).color || "#818cf8";
  return node.color || "#64748b";
}

export function getNodeCategoryLabel(node: Node): string {
  return node.type || "Knowledge Node";
}

export function groupTagsByScope(tags: Tag[]) {
  const groups: Record<string, Tag[]> = {};
  tags.forEach((t) => {
    const scope = t.scope.toLowerCase();
    if (!groups[scope]) groups[scope] = [];
    groups[scope].push(t);
  });
  return groups;
}

export function getConnectedTagIds(edges: DbEdge[]) {
  const connectedIds = new Set<string>();
  edges.forEach((edge) => {
    // Only count as connected if it's a link from a knowledge node to a tag
    // (excluding the synthetic links from root scopes to tags)
    if (edge.relation_type !== "ROOT_LINK") {
      connectedIds.add(edge.to_id);
    }
  });
  return connectedIds;
}
