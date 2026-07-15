import React from "react";
import { getConfig } from "@/lib/db";
import { knowledgeService } from "@/lib/services/knowledge-service";
import OverviewPageContent from "./page_content";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const config = getConfig();
  const [nodes, pendingUpdates, edges, tags, tagEdges, dashboardMetrics] =
    await Promise.all([
      knowledgeService.getNodesWithColor(),
      knowledgeService.getPendingUpdates(),
      knowledgeService.getEdges(),
      knowledgeService.getTags(),
      knowledgeService.getTagEdges(),
      knowledgeService.getDashboardMetrics(),
    ]);

  const pendingCount = pendingUpdates.length;

  return (
    <OverviewPageContent
      nodes={JSON.parse(JSON.stringify(nodes))}
      edges={JSON.parse(JSON.stringify(edges))}
      tags={JSON.parse(JSON.stringify(tags))}
      tagEdges={JSON.parse(JSON.stringify(tagEdges))}
      pendingCount={pendingCount}
      userName={config.user_name}
      dashboardMetrics={JSON.parse(JSON.stringify(dashboardMetrics))}
    />
  );
}
