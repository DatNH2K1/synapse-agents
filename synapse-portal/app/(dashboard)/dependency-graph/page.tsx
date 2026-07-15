import React from "react";
import { prisma } from "@/lib/db";
import DependencyGraphContent from "./page_content";

export const dynamic = "force-dynamic";

export default async function DependencyGraphPage() {
  let initialRepos: string[] = [];

  try {
    if (prisma && prisma.indexerRepo) {
      const dbRepos = await prisma.indexerRepo.findMany({
        select: { name: true },
        orderBy: { lastSyncedAt: "desc" },
      });
      initialRepos = dbRepos.map((r) => r.name);
    }
  } catch (error) {
    console.error("Error fetching repositories for dependency graph:", error);
  }

  return (
    <div className="h-full w-full">
      <DependencyGraphContent initialRepos={initialRepos} />
    </div>
  );
}
