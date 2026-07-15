export const dynamic = "force-dynamic";

import Sidebar from "@/components/dashboard/Sidebar";
import { getConfig } from "@/lib/db";
import { knowledgeService } from "@/lib/services/knowledge-service";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = getConfig();
  const pendingUpdates = await knowledgeService.getPendingUpdates();
  const pendingCount = pendingUpdates.length;

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-dashboard-bg text-dashboard-fg selection:bg-accent-primary/30 lg:h-screen lg:flex-row">
      <Sidebar userName={config.user_name} pendingCount={pendingCount} />

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-dashboard-bg/50">
        <div className="flex-1 overflow-y-auto p-4 pb-8 pt-20 space-y-8 custom-scrollbar sm:p-6 sm:pt-20 lg:p-8 lg:pb-8 lg:pt-10">
          {children}
        </div>
      </main>
    </div>
  );
}
