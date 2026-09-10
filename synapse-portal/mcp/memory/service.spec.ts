import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  proposeMemory,
  queryMemory,
  approveProposal,
  incrementEfficacy,
  listNodes,
} from "./service";
import { prisma } from "@/lib/db";

describe("Memory Service - Real DB Integration Spec", () => {
  let isDbConnected = false;
  let testNodeId: string | null = null;
  const testLabel = "Integration Spec Test Memory Node - " + Date.now();

  beforeAll(async () => {
    try {
      await prisma.$connect();
      await prisma.node.count();
      isDbConnected = true;
    } catch {
      isDbConnected = false;
      console.warn("⚠️ Live PostgreSQL DB not reachable. Skipping real DB integration assertions.");
    }
  });

  afterAll(async () => {
    if (isDbConnected && testNodeId) {
      try {
        await prisma.node.delete({ where: { id: testNodeId } });
      } catch {}
    }
    await prisma.$disconnect();
  });

  it("should propose and save a real knowledge node into database", async () => {
    if (!isDbConnected) return;

    const result = await proposeMemory(
      testLabel,
      "This is a real integration test content saved to PostgreSQL.",
      ["section:optimized-techniques", "project:integration-test", "type:spec"],
    );

    expect(result).toContain("Success: Recorded knowledge node");
    const idMatch = result.match(/\(ID:\s*([^\)]+)\)/);
    expect(idMatch).toBeTruthy();
    testNodeId = idMatch ? idMatch[1].trim() : null;

    // Verify directly from real Prisma DB
    expect(testNodeId).toBeDefined();
    const dbRecord = await prisma.node.findUnique({
      where: { id: testNodeId! },
      include: { tags: true },
    });

    expect(dbRecord).not.toBeNull();
    expect(dbRecord?.label).toBe(testLabel);
    expect(dbRecord?.status).toBe("PENDING");
  });

  it("should increment efficacy count on the real database record", async () => {
    if (!isDbConnected || !testNodeId) return;

    const result = await incrementEfficacy(testNodeId);
    expect(result).toContain("Success: Efficacy count incremented");

    const dbRecord = await prisma.node.findUnique({ where: { id: testNodeId } });
    expect(dbRecord?.success_count).toBeGreaterThanOrEqual(1);
  });

  it("should approve the proposal in the real database", async () => {
    if (!isDbConnected || !testNodeId) return;

    const result = await approveProposal(testNodeId);
    expect(result).toContain("approved");

    const dbRecord = await prisma.node.findUnique({ where: { id: testNodeId } });
    expect(dbRecord?.status).toBe("APPROVED");
  });

  it("should list active nodes and query by tag from real database", async () => {
    if (!isDbConnected || !testNodeId) return;

    const listResult = await listNodes();
    expect(listResult).toContain(testLabel);

    const queryResult = await queryMemory(["project:integration-test"]);
    expect(queryResult).toContain(testLabel);
  });
});
