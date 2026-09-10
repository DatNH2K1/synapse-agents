import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { indexRepository, queryRepositoryIndex } from "./service";
import { prisma } from "@/lib/db";
import * as path from "path";

describe("Repo Indexer Service - Real DB Integration Spec", () => {
  let isDbConnected = false;
  const testRepoName = "spec-test-repo-" + Date.now();
  const fixtureDir = path.resolve(__dirname, "fixtures");

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.indexerRepo.count();
      isDbConnected = true;
    } catch {
      isDbConnected = false;
      console.warn("⚠️ Live PostgreSQL DB not reachable. Skipping real DB integration assertions.");
    }
  });

  afterAll(async () => {
    if (isDbConnected) {
      try {
        await prisma.indexerRepo.deleteMany({ where: { name: testRepoName } });
      } catch {}
    }
    await prisma.$disconnect();
  });

  it("should index directory and save repo, files, and symbols into real database", async () => {
    if (!isDbConnected) return;

    const result = await indexRepository(fixtureDir, testRepoName);
    expect(result).toContain("Indexing Successful");

    // Verify DB records directly
    const repoRecord = await prisma.indexerRepo.findUnique({
      where: { name: testRepoName },
      include: {
        files: {
          include: { symbols: true },
        },
      },
    });

    expect(repoRecord).not.toBeNull();
    expect(repoRecord?.files.length).toBeGreaterThanOrEqual(1);

    const sampleTs = repoRecord?.files.find((f) => f.path === "sample.ts");
    expect(sampleTs).toBeDefined();
    expect(sampleTs?.symbols.length).toBeGreaterThanOrEqual(2);
    expect(sampleTs?.symbols.map((s) => s.name)).toContain("main");
    expect(sampleTs?.symbols.map((s) => s.name)).toContain("Engine");
  });

  it("should query repository index from real database", async () => {
    if (!isDbConnected) return;

    const queryResult = await queryRepositoryIndex(testRepoName);
    const parsed = JSON.parse(queryResult);
    expect(parsed.repo).toBe(testRepoName);
    expect(parsed.files).toContain("sample.ts");

    const fileQueryResult = await queryRepositoryIndex(testRepoName, "sample.ts");
    const fileParsed = JSON.parse(fileQueryResult);
    expect(fileParsed.symbols).toContainEqual(
      expect.objectContaining({ name: "main", kind: "function" }),
    );
  });
});
