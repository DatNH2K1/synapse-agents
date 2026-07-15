import { prisma } from "../db";
import { vectorService } from "./vector-service";
import { aiService } from "./ai-service";
import { queueService } from "./queue-service";
import { randomUUID } from "crypto";

export interface SleepCycleSummary {
  processedCount: number;
  autoApprovedCount: number;
  autoMergedCount: number;
  logs: string[];
}

export const sleepCycleService = {
  run: async (): Promise<SleepCycleSummary> => {
    const logs: string[] = [];
    logs.push(`[SleepCycle] Starting REM Sleep Cycle consolidation job...`);
    console.log(`[SleepCycle] Starting REM Sleep Cycle consolidation job...`);

    // 0. Idempotency Lock Guard
    const runningConfig = await prisma.systemConfig.findUnique({
      where: { key: "rem_running" },
    });
    if (runningConfig && runningConfig.value === "true") {
      const msg = `[SleepCycle] REM Sleep Cycle is already running. Skipping execution.`;
      logs.push(msg);
      console.log(msg);
      return {
        processedCount: 0,
        autoApprovedCount: 0,
        autoMergedCount: 0,
        logs,
      };
    }

    // Set lock
    await prisma.systemConfig.upsert({
      where: { key: "rem_running" },
      create: { key: "rem_running", value: "true" },
      update: { value: "true" },
    });

    try {
      // 1. Check if REM mode is enabled in configuration
      const remEnabledConfig = await prisma.systemConfig.findUnique({
        where: { key: "rem_mode_enabled" },
      });

      if (!remEnabledConfig || remEnabledConfig.value !== "true") {
        const msg = `[SleepCycle] REM Sleep Mode is disabled. Skipping cycle.`;
        logs.push(msg);
        console.log(msg);
        return {
          processedCount: 0,
          autoApprovedCount: 0,
          autoMergedCount: 0,
          logs,
        };
      }

      // 2. Fetch thresholds
      const similarityConfig = await prisma.systemConfig.findUnique({
        where: { key: "rem_similarity_threshold" },
      });
      const confidenceConfig = await prisma.systemConfig.findUnique({
        where: { key: "rem_confidence_threshold" },
      });

      const similarityThreshold = similarityConfig
        ? parseFloat(similarityConfig.value)
        : 0.85;
      const confidenceThreshold = confidenceConfig
        ? parseFloat(confidenceConfig.value)
        : 0.9;

      logs.push(
        `[SleepCycle] Configured thresholds: Similarity=${similarityThreshold * 100}%, Confidence=${confidenceThreshold * 100}%`,
      );
      console.log(
        `[SleepCycle] Configured thresholds: Similarity=${similarityThreshold * 100}%, Confidence=${confidenceThreshold * 100}%`,
      );

      // 3. Scan pending proposals in The Gate
      const pendingNodes = await prisma.node.findMany({
        where: { status: "PENDING" },
        include: { tags: { include: { tag: true } } },
      });

      if (pendingNodes.length === 0) {
        const msg = `[SleepCycle] No pending nodes found in The Gate. Sleep cycle completed.`;
        logs.push(msg);
        console.log(msg);
        return {
          processedCount: 0,
          autoApprovedCount: 0,
          autoMergedCount: 0,
          logs,
        };
      }

      logs.push(
        `[SleepCycle] Found ${pendingNodes.length} pending proposals in staging.`,
      );
      console.log(
        `[SleepCycle] Found ${pendingNodes.length} pending proposals in staging.`,
      );

      let autoApprovedCount = 0;
      let autoMergedCount = 0;

      // 4. Process all pending proposals concurrently
      await Promise.allSettled(
        pendingNodes.map(async (proposal) => {
          logs.push(
            `[SleepCycle] Analyzing proposal: "${proposal.label}" (ID: ${proposal.id})`,
          );
          console.log(
            `[SleepCycle] Analyzing proposal: "${proposal.label}" (ID: ${proposal.id})`,
          );

          const props = JSON.parse(proposal.properties || "{}");
          const proposalContent = props.content || "";

          // Find similar active nodes (APPROVED, BETA, GOLD) using database-level vector similarity
          const matches = await vectorService.findSimilarToNode(
            proposal.id,
            proposal.type,
            proposal.label,
            0.5, // Grab anything with 50%+ similarity for checking
            5,
          );

          const bestMatch = matches.length > 0 ? matches[0] : null;
          const highestScore = bestMatch ? bestMatch.score : 0;

          logs.push(
            `[SleepCycle] Highest similarity score found: ${(highestScore * 100).toFixed(2)}%`,
          );
          console.log(
            `[SleepCycle] Highest similarity score found: ${(highestScore * 100).toFixed(2)}%`,
          );

          const shouldAutoConsolidate =
            bestMatch && highestScore >= confidenceThreshold;
          const shouldRequireManualReview =
            bestMatch &&
            highestScore >= similarityThreshold &&
            highestScore < confidenceThreshold;

          if (shouldAutoConsolidate) {
            logs.push(
              `[SleepCycle] Similarity score ${(highestScore * 100).toFixed(2)}% >= confidence threshold ${confidenceThreshold * 100}%. Triggering Auto-Consolidation...`,
            );
            console.log(
              `[SleepCycle] Similarity score ${(highestScore * 100).toFixed(2)}% >= confidence threshold ${confidenceThreshold * 100}%. Triggering Auto-Consolidation...`,
            );

            try {
              const matchedNode = await prisma.node.findUnique({
                where: { id: bestMatch.id },
                include: { tags: { include: { tag: true } } },
              });

              if (!matchedNode) {
                logs.push(
                  `[SleepCycle] [Error] Active node ${bestMatch.id} not found in database.`,
                );
                console.error(
                  `[SleepCycle] Active node ${bestMatch.id} not found.`,
                );
                return;
              }

              const matchedProps = JSON.parse(matchedNode.properties || "{}");
              const matchedContent = matchedProps.content || "";

              // Perform synthesis
              const synthesis = await aiService.synthesizeKnowledge([
                { label: proposal.label, content: proposalContent },
                { label: matchedNode.label, content: matchedContent },
              ]);

              // Combine tags
              const allTags = [...proposal.tags, ...matchedNode.tags];
              const uniqueTagIds = Array.from(
                new Set(allTags.map((t) => t.tagId)),
              );

              // Perform the node merge proposal inside a transaction
              const newNode = await prisma.$transaction(async (tx) => {
                // 1. Create the unified node in PENDING_MERGE state
                const unifiedNode = await tx.node.create({
                  data: {
                    label: synthesis.label,
                    type: proposal.type,
                    status: "PENDING_MERGE",
                    memory_tier: "ACTIVE",
                    properties: JSON.stringify({
                      content: synthesis.content,
                      merge_reason: `REM Sleep Cycle Consolidation Proposal: ${synthesis.reason}`,
                      auto_approved: false,
                      sourceNodeIds: [proposal.id, matchedNode.id],
                      similarityScore: highestScore,
                    }),
                  },
                });

                // Connect tags via explicit NodeTag
                for (const tagId of uniqueTagIds) {
                  const tag = await tx.tag.findUnique({ where: { id: tagId } });
                  await tx.nodeTag.create({
                    data: {
                      nodeId: unifiedNode.id,
                      tagId,
                      accessed_at_virtual_day: tag ? tag.virtual_clock : 0,
                    },
                  });
                }

                // 2. Archive only the incoming proposal so it is no longer scanned or shown as standalone PENDING
                await tx.node.update({
                  where: { id: proposal.id },
                  data: { status: "ARCHIVE", memory_tier: "ARCHIVE" },
                });

                return unifiedNode;
              });

              // Enqueue embedding calculation task for the new consolidated proposal node
              await queueService
                .enqueueEmbeddingTask(newNode.id, newNode.label)
                .catch(console.error);

              const successMsg = `[SleepCycle] Successfully proposed consolidation of "${proposal.label}" and "${matchedNode.label}" into new PENDING_MERGE node "${newNode.label}" (ID: ${newNode.id})`;
              logs.push(successMsg);
              console.log(successMsg);
              autoMergedCount++;
            } catch (err) {
              const errMsg = `[SleepCycle] [Error] Failed to auto-consolidate proposal ${proposal.id}: ${err instanceof Error ? err.message : err}`;
              logs.push(errMsg);
              console.error(errMsg);
            }
          } else if (shouldRequireManualReview) {
            const reviewMsg = `[SleepCycle] Similarity score ${(highestScore * 100).toFixed(2)}% is between similarity ${similarityThreshold * 100}% and confidence ${confidenceThreshold * 100}%. Keeping proposal in PENDING for manual review.`;
            logs.push(reviewMsg);
            console.log(reviewMsg);
          } else {
            logs.push(
              `[SleepCycle] Similarity score ${(highestScore * 100).toFixed(2)}% < ${similarityThreshold * 100}%. Triggering Auto-Approval as new BETA node...`,
            );
            console.log(
              `[SleepCycle] Similarity score ${(highestScore * 100).toFixed(2)}% < ${similarityThreshold * 100}%. Triggering Auto-Approval as new BETA node...`,
            );

            try {
              const updatedNode = await prisma.node.update({
                where: { id: proposal.id },
                data: {
                  status: "BETA",
                  last_verified: new Date(),
                  properties: JSON.stringify({
                    ...props,
                    auto_approved: true,
                  }),
                },
              });

              await queueService
                .enqueueEmbeddingTask(updatedNode.id, updatedNode.label)
                .catch(console.error);

              const successMsg = `[SleepCycle] Successfully auto-approved proposal "${updatedNode.label}" (ID: ${updatedNode.id}) as a BETA rule.`;
              logs.push(successMsg);
              console.log(successMsg);
              autoApprovedCount++;
            } catch (err) {
              const errMsg = `[SleepCycle] [Error] Failed to auto-approve proposal ${proposal.id}: ${err instanceof Error ? err.message : err}`;
              logs.push(errMsg);
              console.error(errMsg);
            }
          }
        }),
      );

      logs.push(
        `[SleepCycle] REM Sleep Cycle finished. Auto-Merged: ${autoMergedCount}, Auto-Approved: ${autoApprovedCount}.`,
      );
      console.log(
        `[SleepCycle] REM Sleep Cycle finished. Auto-Merged: ${autoMergedCount}, Auto-Approved: ${autoApprovedCount}.`,
      );

      // 5. Run Memory Decay Loop
      try {
        await sleepCycleService.runDecayLoop(logs);
      } catch (err) {
        logs.push(`[SleepCycle] [Error] Decay Loop failed: ${err}`);
        console.error(err);
      }

      // 6. Run Knowledge Crystal Consolidation
      try {
        await sleepCycleService.consolidateColdNodes(logs);
      } catch (err) {
        logs.push(`[SleepCycle] [Error] Crystal Consolidation failed: ${err}`);
        console.error(err);
      }

      // 6.5 Run Garbage Collection
      try {
        await sleepCycleService.runGarbageCollection(logs);
      } catch (err) {
        logs.push(`[SleepCycle] [Error] Garbage Collection failed: ${err}`);
        console.error(err);
      }

      // Record execution time in DB
      try {
        await prisma.systemConfig.upsert({
          where: { key: "rem_last_run_time" },
          create: { key: "rem_last_run_time", value: new Date().toISOString() },
          update: { value: new Date().toISOString() },
        });
      } catch (err) {
        console.error("[SleepCycle] Failed to update rem_last_run_time:", err);
      }

      return {
        processedCount: pendingNodes.length,
        autoApprovedCount,
        autoMergedCount,
        logs,
      };
    } finally {
      // Always release idempotency lock
      await prisma.systemConfig.upsert({
        where: { key: "rem_running" },
        create: { key: "rem_running", value: "false" },
        update: { value: "false" },
      });
    }
  },

  runDecayLoop: async (logs: string[]): Promise<void> => {
    logs.push(`[SleepCycle] Starting Memory Decay Loop...`);
    console.log(`[SleepCycle] Starting Memory Decay Loop...`);

    const forgetModeConfig = await prisma.systemConfig.findUnique({
      where: { key: "forget_mode_enabled" },
    });
    const forgetDryRunConfig = await prisma.systemConfig.findUnique({
      where: { key: "forget_dry_run_enabled" },
    });

    const forgetMode = forgetModeConfig
      ? forgetModeConfig.value === "true"
      : false;
    const dryRun = forgetDryRunConfig
      ? forgetDryRunConfig.value === "true"
      : true;

    if (!forgetMode) {
      logs.push(
        `[SleepCycle] Forget Mode is disabled. Skipping decay calculations.`,
      );
      console.log(
        `[SleepCycle] Forget Mode is disabled. Skipping decay calculations.`,
      );
      return;
    }

    logs.push(`[SleepCycle] Configured safety modes: DryRun=${dryRun}`);
    console.log(`[SleepCycle] Configured safety modes: DryRun=${dryRun}`);

    // Fetch all nodes with tier = ACTIVE
    const activeNodes = await prisma.node.findMany({
      where: {
        memory_tier: "ACTIVE",
        status: { in: ["APPROVED", "GOLD"] },
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    logs.push(
      `[SleepCycle] Scanning ${activeNodes.length} active nodes for connection decay...`,
    );
    console.log(
      `[SleepCycle] Scanning ${activeNodes.length} active nodes for connection decay...`,
    );

    for (const node of activeNodes) {
      if (node.tags.length === 0) continue;

      let allConnectionsDecayed = true;

      for (const nt of node.tags) {
        const virtualClock = nt.tag.virtual_clock;
        const accessedAt = nt.accessed_at_virtual_day;
        const virtualAge = virtualClock - accessedAt;

        // Recency weight (W2 = 80), Decay rate (lambda = 0.05), reinforcement coefficient (alpha = 0.5)
        const W2 = 80;
        const lambda = 0.05;
        const alpha = 0.5;
        const lambdaNew = lambda / (1 + alpha * node.success_count);

        // Agent Modifier (M_agent = 3.0 for QA/Security agent memory, 1.0 otherwise)
        const isQAAgent =
          nt.tag.scope === "agent" && nt.tag.name === "synapse-agent-qa";
        const M_agent = isQAAgent ? 3.0 : 1.0;

        const score = W2 * Math.exp(-lambdaNew * virtualAge) * M_agent;

        logs.push(
          `[SleepCycle] Node "${node.label}" connection to Tag "${nt.tag.scope}:${nt.tag.name}" virtualAge=${virtualAge}, score=${score.toFixed(2)} (M_agent=${M_agent})`,
        );

        // If virtual age is > 90 and score falls below 40, this connection is decayed!
        const connectionDecayed = virtualAge > 90 && score < 40;
        if (!connectionDecayed) {
          allConnectionsDecayed = false;
        }
      }

      if (allConnectionsDecayed) {
        if (dryRun) {
          logs.push(
            `[SleepCycle] [DryRun] Node "${node.label}" (ID: ${node.id}) WOULD be decayed to COLD tier.`,
          );
          console.log(
            `[SleepCycle] [DryRun] Node "${node.label}" (ID: ${node.id}) WOULD be decayed to COLD tier.`,
          );
        } else {
          await prisma.node.update({
            where: { id: node.id },
            data: { memory_tier: "COLD" },
          });
          // Prune vector embedding to save local storage & pgvector RAM!
          await prisma.$executeRaw`
            UPDATE "Node" SET embedding = NULL, "embeddingModel" = NULL WHERE id = cast(${node.id} as uuid)
          `;
          logs.push(
            `[SleepCycle] Decayed Node "${node.label}" (ID: ${node.id}) to COLD tier and pruned its vector embedding.`,
          );
          console.log(
            `[SleepCycle] Decayed Node "${node.label}" (ID: ${node.id}) to COLD tier and pruned its vector embedding.`,
          );
        }
      }
    }
  },

  consolidateColdNodes: async (logs: string[]): Promise<void> => {
    logs.push(
      `[SleepCycle] Starting Knowledge Crystal consolidation pipeline...`,
    );
    console.log(
      `[SleepCycle] Starting Knowledge Crystal consolidation pipeline...`,
    );

    // Fetch all COLD nodes
    const coldNodes = await prisma.node.findMany({
      where: {
        memory_tier: "COLD",
        status: { in: ["APPROVED", "GOLD"] },
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (coldNodes.length < 2) {
      logs.push(
        `[SleepCycle] Less than 2 COLD nodes found. Skipping consolidation.`,
      );
      console.log(
        `[SleepCycle] Less than 2 COLD nodes found. Skipping consolidation.`,
      );
      return;
    }

    logs.push(
      `[SleepCycle] Found ${coldNodes.length} COLD nodes for consolidation analysis.`,
    );
    console.log(
      `[SleepCycle] Found ${coldNodes.length} COLD nodes for consolidation analysis.`,
    );

    // Group by technology and project tags (or general:general fallback)
    const clusters: Record<string, typeof coldNodes> = {};
    for (const node of coldNodes) {
      const groupingTag = node.tags.find(
        (nt) => nt.tag.scope === "technology" || nt.tag.scope === "project",
      );
      if (groupingTag) {
        const key = `${groupingTag.tag.scope}:${groupingTag.tag.name}`;
        if (!clusters[key]) clusters[key] = [];
        clusters[key].push(node);
      } else {
        const key = "general:general";
        if (!clusters[key]) clusters[key] = [];
        clusters[key].push(node);
      }
    }

    for (const key in clusters) {
      const clusterNodes = clusters[key];
      if (clusterNodes.length < 2) continue;

      logs.push(
        `[SleepCycle] Cluster "${key}" has ${clusterNodes.length} nodes. Analyzing similarity...`,
      );
      console.log(
        `[SleepCycle] Cluster "${key}" has ${clusterNodes.length} nodes. Analyzing similarity...`,
      );

      const processedIds = new Set<string>();

      for (let i = 0; i < clusterNodes.length; i++) {
        const nodeA = clusterNodes[i];
        if (processedIds.has(nodeA.id)) continue;

        // Match nodes in cluster with similarity > 80% (0.80) using vector service
        const matches = await vectorService.findSimilarToNode(
          nodeA.id,
          nodeA.type,
          nodeA.label,
          0.8,
          5,
        );

        const similarColdNodes = clusterNodes.filter(
          (cn) =>
            !processedIds.has(cn.id) &&
            (matches.some((m) => m.id === cn.id) || cn.id === nodeA.id),
        );

        if (similarColdNodes.length >= 2) {
          similarColdNodes.forEach((cn) => processedIds.add(cn.id));

          logs.push(
            `[SleepCycle] Found ${similarColdNodes.length} highly similar COLD nodes in cluster "${key}". Starting synthesis...`,
          );
          console.log(
            `[SleepCycle] Found ${similarColdNodes.length} highly similar COLD nodes in cluster "${key}". Starting synthesis...`,
          );

          const propsList = similarColdNodes.map((n) => {
            const props = JSON.parse(n.properties || "{}");
            return { label: n.label, content: props.content || "" };
          });

          try {
            const synthesis = await aiService.synthesizeKnowledge(propsList);

            // Connect to union of tags from source nodes
            const allTagIds = new Set<string>();
            similarColdNodes.forEach((n) =>
              n.tags.forEach((nt) => allTagIds.add(nt.tagId)),
            );

            const crystal = await prisma.$transaction(async (tx) => {
              // Create Knowledge Crystal in PENDING_MERGE status
              const unifiedNode = await tx.node.create({
                data: {
                  id: randomUUID(),
                  label: `🔮 Crystal: ${synthesis.label}`,
                  type: nodeA.type,
                  status: "PENDING_MERGE",
                  memory_tier: "CORE",
                  properties: JSON.stringify({
                    content: synthesis.content,
                    consolidation_reason: `Consolidation of similar COLD nodes: ${synthesis.reason}`,
                    sourceNodeIds: similarColdNodes.map((n) => n.id),
                  }),
                },
              });

              // Connect tags to the new CORE crystal
              for (const tagId of allTagIds) {
                const tag = await tx.tag.findUnique({ where: { id: tagId } });
                await tx.nodeTag.create({
                  data: {
                    nodeId: unifiedNode.id,
                    tagId,
                    accessed_at_virtual_day: tag ? tag.virtual_clock : 0,
                  },
                });
              }

              // Archive the consolidated COLD nodes
              await tx.node.updateMany({
                where: { id: { in: similarColdNodes.map((n) => n.id) } },
                data: { status: "ARCHIVE", memory_tier: "ARCHIVE" },
              });

              return unifiedNode;
            });

            // Enqueue embedding task for the new CORE crystal proposal outside the transaction
            await queueService
              .enqueueEmbeddingTask(crystal.id, crystal.label)
              .catch(console.error);

            logs.push(
              `[SleepCycle] Successfully proposed consolidation of ${similarColdNodes.length} COLD nodes into CORE crystal "${crystal.label}" (ID: ${crystal.id})`,
            );
            console.log(
              `[SleepCycle] Successfully proposed consolidation of ${similarColdNodes.length} COLD nodes into CORE crystal "${crystal.label}" (ID: ${crystal.id})`,
            );
          } catch (err) {
            logs.push(
              `[SleepCycle] [Error] Failed to consolidate cluster "${key}": ${err}`,
            );
            console.error(err);
          }
        }
      }
    }
  },

  runGarbageCollection: async (logs: string[]): Promise<void> => {
    logs.push(`[SleepCycle] Starting Knowledge Garbage Collection...`);
    console.log(`[SleepCycle] Starting Knowledge Garbage Collection...`);

    try {
      // Find all archives that are older than 90 days
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

      // 1. Purge expired archives
      const expiredArchives = await prisma.archive.findMany({
        where: {
          mergedAt: { lt: ninetyDaysAgo },
        },
      });

      if (expiredArchives.length > 0) {
        const nodeIdsToRemove = expiredArchives.map((a) => a.fromNodeId);

        // Permanently delete archived nodes from DB to free up physical space
        const deleteResult = await prisma.node.deleteMany({
          where: {
            id: { in: nodeIdsToRemove },
            status: "ARCHIVE",
          },
        });

        // Also clean up the archive records
        await prisma.archive.deleteMany({
          where: {
            fromNodeId: { in: nodeIdsToRemove },
          },
        });

        const msg = `[SleepCycle] GC successfully purged ${deleteResult.count} expired archive nodes and their reference history.`;
        logs.push(msg);
        console.log(msg);
      } else {
        logs.push(`[SleepCycle] GC completed. No expired archive nodes found.`);
        console.log(
          `[SleepCycle] GC completed. No expired archive nodes found.`,
        );
      }

      // 2. Purge rejected nodes older than 90 days
      const deleteRejectedResult = await prisma.node.deleteMany({
        where: {
          status: "REJECTED",
          last_verified: { lt: ninetyDaysAgo },
        },
      });

      if (deleteRejectedResult.count > 0) {
        const msg = `[SleepCycle] GC successfully purged ${deleteRejectedResult.count} rejected nodes.`;
        logs.push(msg);
        console.log(msg);
      }
    } catch (err) {
      logs.push(`[SleepCycle] [Error] Garbage Collection failed: ${err}`);
      console.error("[SleepCycle] Garbage Collection error:", err);
    }
  },
};
