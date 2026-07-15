import React from "react";
import { knowledgeService } from "@/lib/services/knowledge-service";
import TheGate from "@/components/gate/TheGate";

export const dynamic = "force-dynamic";

export default async function GatePage() {
  const pendingUpdates = await knowledgeService.getPendingUpdates();
  const existingNodes = await knowledgeService.getNodes();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <TheGate
        pendingUpdates={JSON.parse(JSON.stringify(pendingUpdates))}
        existingNodes={JSON.parse(JSON.stringify(existingNodes))}
      />
    </div>
  );
}
