import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { DB_CONFIG } from "./config";

const getDatabaseUrl = () => {
  if (DB_CONFIG.url) return DB_CONFIG.url;

  const { user, password, host, port, database } = DB_CONFIG;
  if (user && host) {
    return `postgresql://${user}:${password}@${host}:${port}/${database}?schema=public`;
  }
  return undefined;
};

const prismaClientSingleton = () => {
  const connectionString = getDatabaseUrl();
  if (connectionString) {
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;

export function getConfig() {
  return { user_name: process.env.SYNAPSE_USER_NAME || "User" };
}

export interface Edge {
  id: number;
  from_id: string;
  to_id: string;
  relation_type: string;
  properties: string;
}

export type { Node, Tag } from "@prisma/client";
