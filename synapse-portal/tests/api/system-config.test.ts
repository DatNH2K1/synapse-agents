import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  GET as getSystemConfig,
  POST as postSystemConfig,
} from "@/app/api/system-config/route";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  prisma: {
    systemConfig: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

describe("System Config API Routes Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/system-config", () => {
    it("should return transformed configs on success", async () => {
      vi.mocked(prisma.systemConfig.findMany).mockResolvedValue([
        { key: "rem_mode_enabled", value: "true" },
        { key: "rem_similarity_threshold", value: "0.85" },
      ] as object as Awaited<ReturnType<typeof prisma.systemConfig.findMany>>);

      const response = await getSystemConfig();
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.config).toEqual({
        rem_mode_enabled: "true",
        rem_similarity_threshold: "0.85",
      });
    });

    it("should return 500 if database query fails", async () => {
      vi.mocked(prisma.systemConfig.findMany).mockRejectedValue(
        new Error("Database offline"),
      );

      const response = await getSystemConfig();
      expect(response.status).toBe(500);
    });
  });

  describe("POST /api/system-config", () => {
    it("should return 400 if key or value is not a string", async () => {
      const req = new Request("http://localhost/api/system-config", {
        method: "POST",
        body: JSON.stringify({ key: 123, value: "true" }),
      });

      const response = await postSystemConfig(req);
      expect(response.status).toBe(400);
    });

    it("should return 400 if boolean key is not true/false", async () => {
      const req = new Request("http://localhost/api/system-config", {
        method: "POST",
        body: JSON.stringify({ key: "rem_mode_enabled", value: "maybe" }),
      });

      const response = await postSystemConfig(req);
      expect(response.status).toBe(400);
    });

    it("should return 400 if threshold key is not a float between 0.0 and 1.0", async () => {
      const req = new Request("http://localhost/api/system-config", {
        method: "POST",
        body: JSON.stringify({ key: "rem_similarity_threshold", value: "1.5" }),
      });

      const response = await postSystemConfig(req);
      expect(response.status).toBe(400);
    });

    it("should upsert config and return 200 on success", async () => {
      const req = new Request("http://localhost/api/system-config", {
        method: "POST",
        body: JSON.stringify({ key: "rem_similarity_threshold", value: "0.8" }),
      });

      vi.mocked(prisma.systemConfig.upsert).mockResolvedValue(
        {} as object as Awaited<ReturnType<typeof prisma.systemConfig.upsert>>,
      );

      const response = await postSystemConfig(req);
      expect(response.status).toBe(200);
      expect(prisma.systemConfig.upsert).toHaveBeenCalledWith({
        where: { key: "rem_similarity_threshold" },
        update: { value: "0.8" },
        create: { key: "rem_similarity_threshold", value: "0.8" },
      });
    });

    it("should return 500 if database upsert fails", async () => {
      const req = new Request("http://localhost/api/system-config", {
        method: "POST",
        body: JSON.stringify({ key: "random_key", value: "val" }),
      });

      vi.mocked(prisma.systemConfig.upsert).mockRejectedValue(
        new Error("Upsert crash"),
      );

      const response = await postSystemConfig(req);
      expect(response.status).toBe(500);
    });
  });
});
