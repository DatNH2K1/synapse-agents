import React from "react";
import { getConfig } from "@/lib/db";
import { knowledgeService } from "@/lib/services/knowledge-service";
import { manifestService } from "@/lib/services/manifest-service";
import LandingPageContent from "@/components/landing/LandingPageContent";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const config = getConfig();

  // Parse dynamic agents using the shared manifest service
  const manifestAgents = manifestService.getAgents();

  // Transform to the format expected by the UI
  const agents = manifestAgents.map((a) => ({
    name: a.displayName || a.name,
    seed: a.displayName || a.name,
    title: a.title,
    icon: a.icon,
    desc: a.role || a.identity || a.capabilities,
  }));

  // Fetch real-time DB stats
  const [nodes, pendingUpdates, tags] = await Promise.all([
    knowledgeService.getNodesWithColor(),
    knowledgeService.getPendingUpdates(),
    knowledgeService.getTags(),
  ]);

  const pendingCount = pendingUpdates.length;
  const lessonCount = nodes.filter((n) => n.type === "LESSON").length;

  return (
    <LandingPageContent
      userName={config.user_name}
      nodesCount={nodes.length}
      lessonCount={lessonCount}
      pendingCount={pendingCount}
      tagsCount={tags.length}
      agents={agents}
    />
  );
}
