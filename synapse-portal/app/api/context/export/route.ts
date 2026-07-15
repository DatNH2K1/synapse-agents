import { NextResponse } from "next/server";
import { knowledgeService } from "@/lib/services/knowledge-service";
import { Node, Tag } from "@/lib/db";

const safeParseProperties = (properties: string | null) => {
  if (!properties) return null;
  try {
    return JSON.parse(properties);
  } catch {
    return properties;
  }
};

const toExportJsonNode = (node: Node & { distance: number }) => {
  type FullNode = Node & { distance: number; embedding?: string | null };
  const {
    embedding: _embedding,
    embeddingModel: _embeddingModel,
    content_hash: _contentHash,
    ...sanitized
  } = node as FullNode;
  return {
    ...sanitized,
    properties: safeParseProperties(sanitized.properties ?? null),
  };
};

const formatTag = (tag: Tag) =>
  `${tag.scope}:${tag.name}${tag.version ? `@${tag.version}` : ""}`;

const toExportJsonNodeWithTags = (
  node: Node & { distance: number },
  tags: Tag[],
) => ({
  ...toExportJsonNode(node),
  tags: tags.map(formatTag),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tags = body.tags || [];
    const format = body.format || "json";

    const matchingNodes = await knowledgeService.getNodesByContext({ tags });
    if (matchingNodes.length === 0) {
      if (format === "md" || format === "markdown") {
        return new NextResponse("", {
          headers: { "Content-Type": "text/markdown" },
        });
      }
      return NextResponse.json([]);
    }

    const finalNodes = matchingNodes.map((node) => ({ ...node, distance: 0 }));

    if (format === "md" || format === "markdown") {
      const markdown = knowledgeService.formatAsMarkdown(finalNodes);
      return new NextResponse(markdown, {
        headers: { "Content-Type": "text/markdown" },
      });
    }

    const nodesWithTags = await knowledgeService.getNodesWithTagsByIds(
      finalNodes.map((n) => n.id),
    );
    const tagsByNodeId = new Map(nodesWithTags.map((n) => [n.id, n.tags]));

    return NextResponse.json(
      finalNodes.map((node) =>
        toExportJsonNodeWithTags(node, tagsByNodeId.get(node.id) || []),
      ),
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to export context";
    console.error("[API Context Export] Error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
