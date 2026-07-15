import { getConfig, prisma } from "@/lib/db";
import { getAIConfig } from "@/lib/config";
import { knowledgeService } from "@/lib/services/knowledge-service";
import SettingsPageContent from "./page_content";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const config = getConfig();
  const aiConfig = getAIConfig();
  const tags = await knowledgeService.getTags();

  const systemConfigs = await prisma.systemConfig.findMany();
  const systemConfig: Record<string, string> = {};
  systemConfigs.forEach((c) => {
    systemConfig[c.key] = c.value;
  });

  return (
    <SettingsPageContent
      config={JSON.parse(JSON.stringify(config))}
      aiConfig={aiConfig}
      tags={JSON.parse(JSON.stringify(tags))}
      systemConfig={systemConfig}
    />
  );
}
