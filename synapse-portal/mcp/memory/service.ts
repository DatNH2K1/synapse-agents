import { knowledgeService } from "@/lib/services/knowledge-service";
import { prisma, Tag } from "@/lib/db";

export async function queryMemory(tags: string[]): Promise<string> {
  if (!tags || tags.length === 0) {
    return "❌ Error: At least one tag must be provided.";
  }

  try {
    const matchingNodes = await knowledgeService.getNodesByContext({ tags });
    if (!matchingNodes || matchingNodes.length === 0) {
      return `ℹ️ No matching knowledge nodes found for tags: ${tags.join(", ")}`;
    }

    const finalNodes = matchingNodes.map((node) => ({ ...node, distance: 0 }));
    const markdown = knowledgeService.formatAsMarkdown(finalNodes);

    if (!markdown.trim()) {
      return `ℹ️ No matching knowledge nodes found for tags: ${tags.join(", ")}`;
    }
    return markdown;
  } catch (error) {
    return `❌ Error querying memory: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function proposeMemory(
  label: string,
  content: string,
  tags: string[],
): Promise<string> {
  if (!label || !label.trim()) {
    return "❌ Error: label must be provided.";
  }

  if (!content || !content.trim()) {
    return "❌ Error: content must be provided.";
  }

  if (!tags || !tags.some((t) => t.startsWith("section:"))) {
    return "❌ Error: Proposal requires a 'section:<name>' tag (e.g. 'section:mistakes-to-avoid', 'section:optimized-techniques', 'section:specialized-conventions', 'section:user-personals').";
  }

  try {
    const result = await knowledgeService.proposeKnowledge({
      label,
      content,
      tags: tags || [],
    });

    if (result.success && result.id) {
      return `✅ Success: Recorded knowledge node '${label}' (ID: ${result.id})`;
    } else {
      return `❌ Failed: ${(result as { error?: string }).error || "Unknown error"}`;
    }
  } catch (error) {
    return `❌ Error proposing node: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function approveProposal(nodeId: string): Promise<string> {
  if (!nodeId) {
    return "❌ Error: Node ID must be provided.";
  }

  try {
    await knowledgeService.approvePendingUpdate(nodeId);
    return `✅ Success: Proposal ${nodeId} approved.`;
  } catch (error) {
    return `❌ Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function rejectProposal(nodeId: string): Promise<string> {
  if (!nodeId) {
    return "❌ Error: Node ID must be provided.";
  }

  try {
    await knowledgeService.rejectPendingUpdate(nodeId);
    return `✅ Success: Proposal ${nodeId} rejected.`;
  } catch (error) {
    return `❌ Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function incrementEfficacy(nodeId: string): Promise<string> {
  if (!nodeId) {
    return "❌ Error: Node ID must be provided.";
  }

  try {
    const node = await prisma.node.findUnique({
      where: { id: nodeId },
    });

    if (!node) {
      return `❌ Error: Node with ID ${nodeId} not found.`;
    }

    const updated = await prisma.node.update({
      where: { id: nodeId },
      data: {
        success_count: {
          increment: 1,
        },
      },
    });

    return `✅ Success: Efficacy count incremented. Current success count: ${updated.success_count}`;
  } catch (error) {
    return `❌ Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

export async function listNodes(): Promise<string> {
  try {
    const nodes = await knowledgeService.getNodesWithColor();
    if (!nodes || nodes.length === 0) {
      return "ℹ️ No active/approved nodes found in the Portal.";
    }

    const output = ["### Active/Approved Knowledge Nodes in Synapse Portal:"];
    for (const n of nodes) {
      const tagsList = (n.tags as Tag[]) || [];
      const tagsStr = tagsList.map((t) => `${t.scope}:${t.name}`).join(", ");
      output.push(
        `- **${n.label}**\n` +
          `  - ID: \`${n.id}\`\n` +
          `  - Status: \`${n.status}\` | Tier: \`${n.memory_tier}\` | Efficacy: \`${n.success_count}\`\n` +
          `  - Tags: [${tagsStr}]`,
      );
    }
    return output.join("\n");
  } catch (error) {
    return `❌ Error listing nodes: ${error instanceof Error ? error.message : String(error)}`;
  }
}
