import { randomUUID } from "crypto";
import { prisma, Node, Edge, Tag } from "../db";
import { vectorService } from "./vector-service";
import { queueService } from "./queue-service";
import { manifestService } from "./manifest-service";

const parseTag = (tagStr: string) => {
  const [scope, rest] = tagStr.includes(":")
    ? tagStr.split(":")
    : ["general", tagStr];

  const [name, version] = rest.includes("@") ? rest.split("@") : [rest, null];

  return {
    scope: scope.toLowerCase(),
    name: name.toLowerCase(),
    version: version ? version.toLowerCase() : null,
  };
};

const ACTIVE_STATUSES = ["APPROVED", "BETA", "GOLD"];

export const knowledgeService = {
  getNodes: async (): Promise<Node[]> => {
    return prisma.node.findMany({
      where: {
        status: { in: ACTIVE_STATUSES },
        memory_tier: { in: ["ACTIVE", "CORE"] },
      },
      select: {
        id: true,
        type: true,
        label: true,
        properties: true,
        status: true,
        last_verified: true,
        success_count: true,
        embeddingModel: true,
      },
    }) as object as Promise<Node[]>;
  },

  getNodesWithColor: async (): Promise<
    (Node & { color: string; tags: Tag[] })[]
  > => {
    const nodes = await prisma.node.findMany({
      where: {
        status: { in: ACTIVE_STATUSES },
        memory_tier: { in: ["ACTIVE", "CORE", "COLD"] },
      },
      select: {
        id: true,
        type: true,
        label: true,
        properties: true,
        status: true,
        memory_tier: true,
        last_verified: true,
        success_count: true,
        embeddingModel: true,
        tags: {
          select: {
            tag: true,
          },
        },
      },
    });

    return nodes.map((n) => {
      const resolvedTags = n.tags.map((t) => t.tag);
      const sortedTags = [...resolvedTags].sort((a, b) => {
        const priority: Record<string, number> = {
          technology: 1,
          project: 2,
          agent: 3,
          scope: 4,
        };
        return (priority[a.scope] || 99) - (priority[b.scope] || 99);
      });

      return {
        ...n,
        tags: resolvedTags,
        last_verified: n.last_verified,
        properties: n.properties || "{}",
        color: sortedTags[0]?.color || "#64748b",
      };
    }) as object as (Node & { color: string; tags: Tag[] })[];
  },

  getNodesWithTagsByIds: async (ids: string[]) => {
    if (ids.length === 0) return [];
    const nodes = await prisma.node.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        type: true,
        label: true,
        properties: true,
        status: true,
        last_verified: true,
        success_count: true,
        embeddingModel: true,
        tags: {
          select: {
            tag: true,
          },
        },
      },
    });

    return nodes.map((n) => ({
      ...n,
      tags: n.tags.map((t) => t.tag),
    }));
  },

  getEdges: async (): Promise<Edge[]> => {
    return []; // Edges removed in favor of Tag-based context
  },

  getTags: async (): Promise<Tag[]> => {
    return prisma.tag.findMany({
      orderBy: [{ scope: "asc" }, { name: "asc" }],
    });
  },

  getTagEdges: async (): Promise<Edge[]> => {
    const nodes = (await prisma.node.findMany({
      select: {
        id: true,
        tags: {
          select: { tagId: true },
        },
      },
    })) as object as { id: string; tags: { tagId: string }[] }[];

    const edges: Edge[] = [];
    let idx = 0;
    nodes.forEach((node) => {
      node.tags.forEach((tag) => {
        edges.push({
          id: 900000 + idx++,
          from_id: node.id,
          to_id: tag.tagId,
          relation_type: "TAGGED_WITH",
          properties: "{}",
        });
      });
    });
    return edges;
  },

  getStats: async () => {
    const nodeCount = await prisma.node.count();
    return {
      nodeCount,
      edgeCount: 0,
    };
  },

  getDashboardMetrics: async () => {
    const [statusCounts, archiveCount] = await Promise.all([
      prisma.node.groupBy({
        by: ["status"],
        _count: {
          id: true,
        },
      }),
      prisma.archive.count(),
    ]);
    return {
      statusCounts: statusCounts.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      archiveCount,
    };
  },

  getPendingUpdates: async () => {
    const pending = await prisma.node.findMany({
      where: { status: "PENDING" },
      orderBy: { last_verified: "desc" },
      select: {
        id: true,
        type: true,
        label: true,
        properties: true,
        status: true,
        last_verified: true,
        success_count: true,
        embeddingModel: true,
        tags: {
          select: {
            tag: true,
          },
        },
      },
    });

    // Decorate with similarity scores
    const decorated = await Promise.all(
      pending.map(async (p) => {
        // Use existing embedding if available (p.id) to avoid redundant API calls
        const matches = await vectorService.findSimilarToNode(
          p.id,
          p.type,
          p.label,
          0.7,
          5,
        );
        return {
          ...p,
          tags: p.tags.map((t) => t.tag),
          matches: matches.map((m) => ({
            id: m.id,
            label: m.label,
            score: m.score,
          })),
        };
      }),
    );

    return decorated;
  },

  approvePendingUpdate: async (id: string) => {
    const nodeToCheck = await prisma.node.findUnique({
      where: { id },
    });
    if (!nodeToCheck) throw new Error(`Node not found: ${id}`);

    if (nodeToCheck.status === "PENDING_MERGE") {
      let sourceNodeIds: string[] = [];
      let similarityScore = 0.85;
      try {
        const props = JSON.parse(nodeToCheck.properties || "{}");
        sourceNodeIds = props.sourceNodeIds || [];
        if (typeof props.similarityScore === "number") {
          similarityScore = props.similarityScore;
        }
      } catch (e) {
        console.error(
          "Failed to parse node properties for pending merge sourceNodeIds",
          e,
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        // 1. Approve the merge proposal node
        const approved = await tx.node.update({
          where: { id },
          data: {
            status: "APPROVED",
            last_verified: new Date(),
          },
        });

        // 2. Archive source nodes
        if (sourceNodeIds.length > 0) {
          await tx.node.updateMany({
            where: { id: { in: sourceNodeIds } },
            data: {
              status: "ARCHIVE",
              memory_tier: "ARCHIVE",
              last_verified: new Date(),
            },
          });

          // 3. Clear vector embeddings of the source nodes
          for (const sId of sourceNodeIds) {
            await tx.$executeRaw`
              UPDATE "Node" SET embedding = NULL, "embeddingModel" = NULL WHERE id = cast(${sId} as uuid)
            `;
          }

          // 4. Create Archive records for history trace
          for (const sId of sourceNodeIds) {
            await tx.archive.create({
              data: {
                fromNodeId: sId,
                toNodeId: id,
                reason: `Approved merge proposal (Consolidated)`,
                similarityScore: similarityScore,
              },
            });
          }
        }
        return approved;
      });

      // Enqueue vector generation task
      queueService
        .enqueueEmbeddingTask(id, nodeToCheck.label)
        .catch(console.error);

      return updated;
    }

    // Standard non-merge PENDING approval path
    const node = await prisma.node.update({
      where: { id },
      data: {
        status: "APPROVED",
        last_verified: new Date(),
      },
    });

    // Enqueue vector generation task
    queueService.enqueueEmbeddingTask(id, node.label).catch(console.error);

    return node;
  },

  proposeKnowledge: async (proposal: {
    label: string;
    type: string;
    content: string;
    tags?: string[];
    metadata?: Record<string, string | number | boolean | null>;
    workspace_id?: string;
    agent_id?: string;
    technology?: string;
  }) => {
    // ID will be generated by the DB (UUID)

    // Normalize metadata from proposal tags or direct fields
    const tags = proposal.tags || [];

    const ALLOWED_SECTIONS = [
      "specialized-conventions",
      "optimized-techniques",
      "mistakes-to-avoid",
      "user-personals",
    ];

    const ALLOWED_AGENTS = manifestService.getAgents().map((a) => a.name);

    for (const tagStr of tags) {
      const { scope, name } = parseTag(tagStr);
      if (scope === "section" && !ALLOWED_SECTIONS.includes(name)) {
        throw new Error(
          `Invalid section tag: "${name}". Allowed sections: ${ALLOWED_SECTIONS.join(", ")}`,
        );
      }
      if (scope === "agent" && !ALLOWED_AGENTS.includes(name)) {
        throw new Error(
          `Invalid agent tag: "${name}". Allowed agents: ${ALLOWED_AGENTS.join(", ")}`,
        );
      }
    }
    const projectTag = tags.find((t: string) => t.startsWith("project:"));
    const agentTag = tags.find((t: string) => t.startsWith("agent:"));
    const techTag = tags.find(
      (t: string) => t.startsWith("technology:") || t.startsWith("tech:"),
    );

    const extractedMetadata = {
      projectName:
        projectTag?.split(":")[1] || proposal.workspace_id || "default",
      sourceAgent: agentTag?.split(":")[1] || proposal.agent_id || "unknown",
      technology: techTag?.split(":")[1]?.split("@")[0] || proposal.technology,
    };

    const metadata = {
      ...extractedMetadata,
      ...(proposal.metadata || {}),
    };

    // Normalize + de-duplicate tag payload to avoid duplicate NodeTag writes
    const normalizedTagKeys = Array.from(
      new Set(
        (tags || []).map((tagStr) => {
          const { scope, name, version } = parseTag(tagStr);
          return `${scope}:${name}${version ? "@" + version : ""}`;
        }),
      ),
    );

    // 1. Resolve tags outside the Node creation transaction
    const resolvedTags: { id: string; virtual_clock: number }[] = [];
    for (const tagKey of normalizedTagKeys) {
      const {
        scope: normalizedScope,
        name: normalizedName,
        version,
      } = parseTag(tagKey);

      const tagLookup = {
        scope: normalizedScope,
        name: normalizedName,
        version: version || null,
      };

      let tag = await prisma.tag.findFirst({
        where: tagLookup,
        select: { id: true, virtual_clock: true },
      });

      if (!tag) {
        try {
          tag = await prisma.tag.create({
            data: {
              id: randomUUID(),
              scope: normalizedScope,
              name: normalizedName,
              version: version || null,
            },
            select: { id: true, virtual_clock: true },
          });
        } catch {
          // Another request may have inserted the same unique tag concurrently.
          tag = await prisma.tag.findFirst({
            where: tagLookup,
            select: { id: true, virtual_clock: true },
          });
        }
      }

      if (!tag) throw new Error(`Failed to resolve tag: ${tagKey}`);
      resolvedTags.push(tag);
    }

    // 2. Start transaction for creating Node and NodeTags
    const node = await prisma.$transaction(async (tx) => {
      const createdNode = await tx.node.create({
        data: {
          id: randomUUID(),
          label: proposal.label,
          type: proposal.type,
          status: "PENDING",
          memory_tier: "ACTIVE",
          properties: JSON.stringify({
            content: proposal.content || "",
            ...metadata,
          }),
        },
      });

      const nodeTagRows = resolvedTags.map((t) => ({
        nodeId: createdNode.id,
        tagId: t.id,
        accessed_at_virtual_day: t.virtual_clock,
      }));

      if (nodeTagRows.length > 0) {
        await tx.nodeTag.createMany({
          data: nodeTagRows,
          skipDuplicates: true,
        });
      }

      return createdNode;
    });

    // Enqueue vector generation task in background
    queueService.enqueueEmbeddingTask(node.id, proposal.label).catch((err) => {
      console.error(
        `[KnowledgeService] Queueing embedding failed for ${node.id}:`,
        err,
      );
    });

    return { success: true, id: node.id };
  },

  rejectPendingUpdate: async (id: string) => {
    await prisma.$executeRaw`UPDATE "Node" SET embedding = NULL WHERE id = cast(${id} as uuid)`;
    return prisma.node.update({
      where: { id },
      data: {
        status: "REJECTED",
        memory_tier: "ARCHIVE",
        last_verified: new Date(),
      },
    });
  },

  getRelatedNodes: async (startNodeId: string) => {
    // Postgres uses $1, $2 notation for raw queries or simple Prisma replacement
    const query = `
      SELECT n.id, n.label, n.type, n.properties, n.status, n.last_verified, COUNT(target_tags."tagId") as overlap_count
      FROM "Node" n
      JOIN "NodeTag" nt ON n.id = nt."nodeId"
      JOIN "NodeTag" target_tags ON nt."tagId" = target_tags."tagId"
      WHERE target_tags."nodeId" = $1 AND n.id != $2 AND n.status = 'APPROVED'
      GROUP BY n.id, n.label, n.type, n.properties, n.status, n.last_verified
      ORDER BY overlap_count DESC
      LIMIT 20
    `;

    const results = await prisma.$queryRawUnsafe(
      query,
      startNodeId,
      startNodeId,
    );
    return (results as (Node & { overlap_count: number | bigint })[]).map(
      (n) => ({
        ...n,
        overlap_count: Number(n.overlap_count),
        distance: 1, // Normalized distance for UI compatibility
      }),
    );
  },

  getNodesByContext: async (context: { tags: string[] }): Promise<Node[]> => {
    if (!context.tags || context.tags.length === 0) return [];

    const parsedRequested = context.tags.map(parseTag);
    const normalizedContextTags = new Set(
      parsedRequested.map(
        (t) => `${t.scope}:${t.name}${t.version ? "@" + t.version : ""}`,
      ),
    );

    // 1. Group requested tags by scope (set-based for O(1) lookup)
    const requestedByScope: Record<string, Set<string>> = {};
    parsedRequested.forEach(({ scope, name, version }) => {
      const key = `${name}${version ? "@" + version : ""}`;
      if (!requestedByScope[scope]) requestedByScope[scope] = new Set();
      requestedByScope[scope].add(key);
    });

    // 2. Fetch only nodes that match at least one requested tag or are global
    const nodes = await prisma.node.findMany({
      where: {
        status: { in: ACTIVE_STATUSES },
        memory_tier: { in: ["ACTIVE", "CORE", "COLD"] },
        tags: {
          some: {
            tag: {
              OR: [
                { scope: "scope", name: "global" },
                { scope: "global", name: "global" },
                ...parsedRequested.map(({ scope, name, version }) => ({
                  scope,
                  name,
                  version: version || null,
                })),
              ],
            },
          },
        },
      },
      orderBy: { last_verified: "desc" },
      select: {
        id: true,
        label: true,
        type: true,
        properties: true,
        status: true,
        memory_tier: true,
        last_verified: true,
        success_count: true,
        tags: {
          select: {
            tagId: true,
            accessed_at_virtual_day: true,
            last_accessed_at: true,
            tag: true,
          },
        },
      },
    });

    // 3. Apply relevance and purity filtering
    const matchedNodes = nodes.filter((node) => {
      const nodeTagsByScope: Record<string, string[]> = {};
      node.tags.forEach((t) => {
        const key = `${t.tag.name}${t.tag.version ? "@" + t.tag.version : ""}`;
        if (!nodeTagsByScope[t.tag.scope]) nodeTagsByScope[t.tag.scope] = [];
        nodeTagsByScope[t.tag.scope].push(key);
      });

      const isGlobal =
        nodeTagsByScope["scope"]?.includes("global") ||
        nodeTagsByScope["global"]?.includes("global");
      const hasMatchingTag = parsedRequested.some(
        ({ scope, name, version }) => {
          const key = `${name}${version ? "@" + version : ""}`;
          return nodeTagsByScope[scope]?.includes(key);
        },
      );

      if (!isGlobal && !hasMatchingTag) return false;

      for (const scope in requestedByScope) {
        if (scope === "scope" || scope === "global") continue;

        const requestedValues = requestedByScope[scope];
        const nodeValues = nodeTagsByScope[scope] || [];

        if (nodeValues.length > 0) {
          const hasDifferentValue = nodeValues.some(
            (val) => !requestedValues.has(val),
          );
          if (hasDifferentValue) return false;
        }
      }

      return true;
    });

    // 4. Increment clock and update access metrics for matched tags/nodes inside a transaction
    const isSameDay = (d1: Date, d2: Date) => {
      return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
      );
    };

    const tagIdToClock = new Map<string, number>();
    const today = new Date();
    const requestedTagFilters = Array.from(
      new Set(
        parsedRequested.map(
          ({ scope, name, version }) => `${scope}:${name}:${version || ""}`,
        ),
      ),
    ).map((key) => {
      const [scope, name, version] = key.split(":");
      return { scope, name, version: version || null };
    });

    const requestedTags = requestedTagFilters.length
      ? await prisma.tag.findMany({
          where: { OR: requestedTagFilters },
          select: { id: true, virtual_clock: true },
        })
      : [];

    if (requestedTags.length > 0) {
      const tagAccessAgg = await prisma.nodeTag.groupBy({
        by: ["tagId"],
        where: { tagId: { in: requestedTags.map((t) => t.id) } },
        _max: { last_accessed_at: true },
      });
      const lastAccessByTag = new Map(
        tagAccessAgg.map((row) => [row.tagId, row._max.last_accessed_at]),
      );

      const tagsToIncrement: string[] = [];
      for (const tag of requestedTags) {
        const lastAccess = lastAccessByTag.get(tag.id);
        const alreadyAccessedToday =
          lastAccess instanceof Date && isSameDay(lastAccess, today);

        if (!alreadyAccessedToday) {
          tagsToIncrement.push(tag.id);
        }
      }

      const tempTagIdToClock = new Map<string, number>();
      const tagsToIncrementSet = new Set(tagsToIncrement);

      await prisma.$transaction(async (tx) => {
        if (tagsToIncrement.length > 0) {
          await tx.$executeRaw`
            UPDATE "Tag" SET virtual_clock = virtual_clock + 1 WHERE id = ANY(${tagsToIncrement}::uuid[])
          `;
        }

        for (const tag of requestedTags) {
          const wasIncremented = tagsToIncrementSet.has(tag.id);
          tempTagIdToClock.set(
            tag.id,
            tag.virtual_clock + (wasIncremented ? 1 : 0),
          );
        }

        const nodeIdsByRequestedTag = new Map<string, string[]>();
        for (const node of matchedNodes) {
          for (const nt of node.tags) {
            if (!tempTagIdToClock.has(nt.tagId)) continue;
            const list = nodeIdsByRequestedTag.get(nt.tagId) || [];
            list.push(node.id);
            nodeIdsByRequestedTag.set(nt.tagId, list);
          }
        }

        for (const [tagId, nodeIds] of nodeIdsByRequestedTag.entries()) {
          const clock = tempTagIdToClock.get(tagId);
          if (clock === undefined || nodeIds.length === 0) continue;

          await tx.nodeTag.updateMany({
            where: { tagId, nodeId: { in: nodeIds } },
            data: {
              accessed_at_virtual_day: clock,
              last_accessed_at: today,
            },
          });
        }
      });

      for (const [k, v] of tempTagIdToClock.entries()) {
        tagIdToClock.set(k, v);
      }
    }

    // 5. Separate into CORE/ACTIVE vs COLD
    const activeOrCore = matchedNodes
      .filter((n) => n.memory_tier !== "COLD")
      .slice(0, 100);
    const coldNodes = matchedNodes.filter((n) => n.memory_tier === "COLD");

    const getOverlapCount = (n: { tags: { tag: Tag }[] }) => {
      let count = 0;
      n.tags.forEach((t) => {
        const tagStr = `${t.tag.scope}:${t.tag.name}${t.tag.version ? "@" + t.tag.version : ""}`;
        if (normalizedContextTags.has(tagStr)) count++;
      });
      return count;
    };

    coldNodes.sort((a, b) => getOverlapCount(b) - getOverlapCount(a));
    const slicedColdNodes = coldNodes.slice(0, 3);

    // Map tags back to Tag[] format expected by downstream calls
    const finalNodes = [...activeOrCore, ...slicedColdNodes].map((node) => {
      let virtual_age = 0;
      let representative_tag = "";
      let tag_overlap = "";

      if (node.memory_tier === "COLD") {
        let maxAge = 0;
        let repTag = "project";
        let overlap = 0;

        node.tags.forEach((nt) => {
          const age =
            (tagIdToClock.get(nt.tag.id) || nt.tag.virtual_clock) -
            nt.accessed_at_virtual_day;
          if (age > maxAge) {
            maxAge = age;
            repTag = `${nt.tag.scope}:${nt.tag.name}`;
          }
          const tagStr = `${nt.tag.scope}:${nt.tag.name}${nt.tag.version ? "@" + nt.tag.version : ""}`;
          if (normalizedContextTags.has(tagStr)) overlap++;
        });

        virtual_age = maxAge;
        representative_tag = repTag;
        tag_overlap = `${overlap}/${node.tags.length}`;
      }

      return {
        ...node,
        tags: node.tags.map((t) => t.tag),
        virtual_age,
        representative_tag,
        tag_overlap,
      };
    });

    return finalNodes as object as Node[];
  },

  updateTagColor: async (tagId: string, color: string) => {
    await prisma.tag.update({
      where: { id: tagId },
      data: { color },
    });
    return { success: true };
  },

  formatAsMarkdown: (
    nodes: (Node & {
      distance: number;
      tags?: Tag[];
      virtual_age?: number;
      representative_tag?: string;
      tag_overlap?: string;
    })[],
  ) => {
    let markdown = "# 🧠 Synapse JIT Context\n\n";
    markdown += `> [!NOTE]\n`;
    markdown += `> **AI Instructions**: You must consume these retrieved knowledge nodes to guide your execution:\n`;
    markdown += `> - 💡 **LESSON**: Mandatory best practices and pitfalls. You **MUST** strictly adhere to these to avoid past errors.\n`;
    markdown += `> - ✨ **FEATURE**: Reference implementation details of completed features. Use these as architecture blueprints.\n`;
    markdown += `> - 🔮 **CONTEXT**: High-level domain context or design patterns. Use these as general principles.\n\n`;
    markdown += `Retrieved ${nodes.length} relevant knowledge nodes.\n\n`;

    // Define sections we want to group by
    const sectionConfig = [
      { key: "specialized-conventions", title: "📌 Specialized Conventions" },
      { key: "optimized-techniques", title: "🚀 Optimized Techniques" },
      { key: "mistakes-to-avoid", title: "⚠️ Mistakes to Avoid" },
      { key: "user-personals", title: "👤 User Personas & Guidelines" },
    ];

    // Initialize groups
    const groups: Record<
      string,
      (Node & {
        distance: number;
        tags?: Tag[];
        virtual_age?: number;
        representative_tag?: string;
        tag_overlap?: string;
      })[]
    > = {
      "specialized-conventions": [],
      "optimized-techniques": [],
      "mistakes-to-avoid": [],
      "user-personals": [],
      "general-context": [],
    };

    // Group the nodes based on the "section" tag
    nodes.forEach((node) => {
      const sectionTag = node.tags?.find((t) => t.scope === "section");
      if (sectionTag && groups[sectionTag.name] !== undefined) {
        groups[sectionTag.name].push(node);
      } else {
        groups["general-context"].push(node);
      }
    });

    // Helper to render a node as a beautiful markdown card/block
    const renderNode = (
      node: Node & {
        distance: number;
        tags?: Tag[];
        virtual_age?: number;
        representative_tag?: string;
        tag_overlap?: string;
      },
    ) => {
      const props = JSON.parse(node.properties || "{}");
      const content = props.content || "";

      // COLD storage formatting (Summary Stub + Alert block)
      if (node.memory_tier === "COLD") {
        const decayPercent = Math.min(
          100,
          Math.round(((node.virtual_age || 90) / 90) * 30),
        );
        let summaryStub = content.split(/[.!?]/)[0];
        if (summaryStub.length > 120) {
          summaryStub = summaryStub.slice(0, 120);
        }
        summaryStub = summaryStub.trim() + "... (Hibernating Memory)";

        let coldMd = `> [!NOTE]\n`;
        coldMd += `> ❄️ **[COLD STORAGE - Decayed ${decayPercent}%]** [${node.type}] ${node.label}\n`;
        coldMd += `> *This rule has hibernated for ${node.virtual_age || 90} active days in ${node.representative_tag || "project"}. Tag overlap: ${node.tag_overlap || "3/4"}.*\n`;
        coldMd += `> **Summary**: ${summaryStub}\n\n`;
        return coldMd;
      }

      // Determine type emoji for visually rich presentation
      let typeEmoji = "🧠";
      if (node.type === "LESSON") typeEmoji = "💡";
      else if (node.type === "FEATURE") typeEmoji = "✨";
      else if (node.type === "CONTEXT") typeEmoji = "🔮";

      // Extract other tags grouped by scope
      const otherTags = (node.tags || [])
        .filter((t) => t.scope !== "section")
        .map((t) => `${t.scope}:${t.name}${t.version ? `@${t.version}` : ""}`);

      let nodeMd = `#### ${typeEmoji} [${node.type}] ${node.label}\n`;
      nodeMd += `- **Reference ID**: \`${node.id}\`\n`;
      if (otherTags.length > 0) {
        nodeMd += `- **Tags**: ${otherTags.map((t) => `\`${t}\``).join(", ")}\n`;
      }
      if (node.distance > 0) {
        nodeMd += `- **Distance**: \`${node.distance.toFixed(4)}\`\n`;
      }
      if (node.status === "BETA") {
        nodeMd += `> [!WARNING]\n`;
        nodeMd += `> **Beta Rule**: This rule was auto-approved via REM sleep cycle; verify in runtime.\n\n`;
      }
      nodeMd += `\n${content.trim()}\n\n---\n\n`;
      return nodeMd;
    };

    // 1. Output specialized sections first if they have nodes
    sectionConfig.forEach((sec) => {
      const groupNodes = groups[sec.key];
      if (groupNodes.length > 0) {
        markdown += `## ${sec.title}\n\n`;
        groupNodes.forEach((node) => {
          markdown += renderNode(node);
        });
      }
    });

    // 2. Output general context if any
    const generalNodes = groups["general-context"];
    if (generalNodes.length > 0) {
      markdown += `## 📁 General Context & Other Knowledge\n\n`;
      generalNodes.forEach((node) => {
        markdown += renderNode(node);
      });
    }

    return markdown;
  },

  mergeNodes: async (params: {
    sourceNodeIds: string[];
    newLabel: string;
    newType: string;
    newContent: string;
    selectedTagIds: string[];
    reason: string;
    similarityScore: number;
  }) => {
    const newNode = await prisma.$transaction(async (tx) => {
      // 1. Create Node C
      const node = await tx.node.create({
        data: {
          id: randomUUID(),
          label: params.newLabel,
          type: params.newType,
          status: "APPROVED",
          memory_tier: "ACTIVE",
          properties: JSON.stringify({
            content: params.newContent,
            merge_reason: params.reason,
          }),
        },
      });

      // Connect tags via explicit NodeTag
      for (const tagId of params.selectedTagIds) {
        const tag = await tx.tag.findUnique({ where: { id: tagId } });
        await tx.nodeTag.create({
          data: {
            nodeId: node.id,
            tagId,
            accessed_at_virtual_day: tag ? tag.virtual_clock : 0,
          },
        });
      }

      // 2. Archive all source nodes and nullify their embeddings to save local space
      await tx.node.updateMany({
        where: { id: { in: params.sourceNodeIds } },
        data: {
          status: "ARCHIVE",
          memory_tier: "ARCHIVE",
          last_verified: new Date(),
        },
      });
      for (const srcId of params.sourceNodeIds) {
        await tx.$executeRaw`UPDATE "Node" SET embedding = NULL WHERE id = cast(${srcId} as uuid)`;
      }

      // 3. Create Archive Records for each source node
      for (const sourceId of params.sourceNodeIds) {
        await tx.archive.create({
          data: {
            id: randomUUID(),
            fromNodeId: sourceId,
            toNodeId: node.id,
            reason: params.reason,
            similarityScore: params.similarityScore,
          },
        });
      }

      return node;
    });

    // 4. Enqueue embedding for new node outside transaction
    queueService
      .enqueueEmbeddingTask(newNode.id, params.newLabel)
      .catch(console.error);

    return newNode;
  },

  undoAction: async (id: string, type: "REJECTED" | "ARCHIVE") => {
    const tasksToEnqueue: { id: string; label: string }[] = [];

    const result = await prisma.$transaction(async (tx) => {
      if (type === "REJECTED") {
        // Restore to PENDING
        const node = await tx.node.update({
          where: { id },
          data: { status: "PENDING", last_verified: new Date() },
          select: { id: true, label: true },
        });

        tasksToEnqueue.push({ id: node.id, label: node.label });
        return { success: true };
      }

      if (type === "ARCHIVE") {
        // Find the Archive record where this node was a source (fromNodeId)
        const archiveRecord = await tx.archive.findFirst({
          where: { fromNodeId: id },
        });

        if (!archiveRecord) {
          return { success: false, message: "Merge history not found." };
        }

        const mergedNodeId = archiveRecord.toNodeId;

        // Find all Archive records that were part of this exact merge
        const siblingArchives = await tx.archive.findMany({
          where: { toNodeId: mergedNodeId },
        });

        const sourceNodeIds = siblingArchives.map((a) => a.fromNodeId);

        // 1. Restore all source nodes to APPROVED and ACTIVE
        await tx.node.updateMany({
          where: { id: { in: sourceNodeIds } },
          data: {
            status: "APPROVED",
            memory_tier: "ACTIVE",
            last_verified: new Date(),
          },
        });

        // Fetch restored nodes labels to queue embeddings
        const restoredNodes = await tx.node.findMany({
          where: { id: { in: sourceNodeIds } },
          select: { id: true, label: true },
        });

        // Queue embeddings for all restored nodes
        for (const n of restoredNodes) {
          tasksToEnqueue.push({ id: n.id, label: n.label });
        }

        // 2. Delete the merged node (Node C)
        await tx.node.delete({
          where: { id: mergedNodeId },
        });

        // 3. Delete the Archive link rows
        await tx.archive.deleteMany({
          where: { toNodeId: mergedNodeId },
        });

        return { success: true };
      }

      return { success: false, message: "Unknown undo type." };
    });

    if (result.success && tasksToEnqueue.length > 0) {
      for (const t of tasksToEnqueue) {
        queueService.enqueueEmbeddingTask(t.id, t.label).catch(console.error);
      }
    }

    return result;
  },

  incrementSuccessCount: async (nodeId: string) => {
    const node = await prisma.node.findUnique({
      where: { id: nodeId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
    if (!node) throw new Error("Node not found");

    const newSuccessCount = node.success_count + 1;
    const shouldEscalate = node.status === "BETA" && newSuccessCount >= 3;
    const isCold = node.memory_tier === "COLD";

    if (isCold) {
      // Reset accessed_at_virtual_day to current tag virtual_clocks for all connections
      for (const nt of node.tags) {
        await prisma.nodeTag.update({
          where: {
            nodeId_tagId: {
              nodeId: node.id,
              tagId: nt.tag.id,
            },
          },
          data: {
            accessed_at_virtual_day: nt.tag.virtual_clock,
            last_accessed_at: new Date(),
          },
        });
      }
    }

    return prisma.node.update({
      where: { id: nodeId },
      data: {
        success_count: newSuccessCount,
        last_verified: new Date(),
        status: shouldEscalate ? "GOLD" : node.status,
        memory_tier: isCold ? "ACTIVE" : node.memory_tier,
      },
    });
  },

  wakeUpNode: async (nodeId: string) => {
    const node = await prisma.node.findUnique({
      where: { id: nodeId },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
    if (!node) throw new Error("Node not found");

    for (const nt of node.tags) {
      await prisma.nodeTag.update({
        where: {
          nodeId_tagId: {
            nodeId: node.id,
            tagId: nt.tag.id,
          },
        },
        data: {
          accessed_at_virtual_day: nt.tag.virtual_clock,
          last_accessed_at: new Date(),
        },
      });
    }

    return prisma.node.update({
      where: { id: nodeId },
      data: {
        memory_tier: "ACTIVE",
        last_verified: new Date(),
      },
    });
  },
};
