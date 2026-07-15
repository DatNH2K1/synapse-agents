import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const getDatabaseUrl = () => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const {
    POSTGRES_USER,
    POSTGRES_PASSWORD,
    POSTGRES_HOST,
    POSTGRES_PORT,
    POSTGRES_DB,
  } = process.env;
  if (POSTGRES_USER && POSTGRES_HOST) {
    return `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT || 5432}/${POSTGRES_DB}?schema=public`;
  }
  return undefined;
};

const connectionString = getDatabaseUrl();
let prisma: PrismaClient;

if (connectionString) {
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({ adapter });
} else {
  prisma = new PrismaClient();
}

async function main() {
  console.log("🌱 Starting seeding...");

  const tags = [
    // Agents
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      name: "synapse-agent-web-dev",
      scope: "agent",
      color: "#f43f5e",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440002",
      name: "synapse-agent-pm",
      scope: "agent",
      color: "#0ea5e9",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440003",
      name: "synapse-agent-architect",
      scope: "agent",
      color: "#8b5cf6",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440004",
      name: "synapse-agent-analyst",
      scope: "agent",
      color: "#fbbf24",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440005",
      name: "synapse-agent-tech-writer",
      scope: "agent",
      color: "#10b981",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440006",
      name: "synapse-agent-ux-designer",
      scope: "agent",
      color: "#ec4899",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440007",
      name: "synapse-agent-cto",
      scope: "agent",
      color: "#6366f1",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440008",
      name: "synapse-agent-user",
      scope: "agent",
      color: "#94a3b8",
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440009",
      name: "synapse-agent-mobile-dev",
      scope: "agent",
      color: "#14b8a6",
    },
    {
      id: "550e8400-e29b-41d4-a716-44665544000a",
      name: "synapse-agent-game-dev",
      scope: "agent",
      color: "#f59e0b",
    },
    {
      id: "550e8400-e29b-41d4-a716-44665544000b",
      name: "synapse-agent-creative",
      scope: "agent",
      color: "#d946ef",
    },
    {
      id: "550e8400-e29b-41d4-a716-44665544000c",
      name: "synapse-agent-qa",
      scope: "agent",
      color: "#06b6d4",
    },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { id: tag.id },
      update: {
        name: tag.name,
        scope: tag.scope,
        color: tag.color,
        version: null,
      },
      create: {
        ...tag,
        version: null,
      },
    });
  }

  console.log("🌱 Seeding default system configurations...");
  const configs = [
    { key: "rem_mode_enabled", value: "false" },
    { key: "rem_similarity_threshold", value: "0.85" },
    { key: "rem_confidence_threshold", value: "0.90" },
    { key: "forget_mode_enabled", value: "false" },
    { key: "forget_dry_run_enabled", value: "true" },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    });
  }

  console.log("✅ Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
