import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as postVisualConfig } from "@/app/api/visual-config/route";
import { prisma } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  prisma: {
    tag: {
      update: vi.fn(),
    },
  },
}));

describe("POST /api/visual-config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should update tag color successfully", async () => {
    const req = new Request("http://localhost/api/visual-config", {
      method: "POST",
      body: JSON.stringify({ id: "tag-1", color: "#ff0000" }),
    });

    vi.mocked(prisma.tag.update).mockResolvedValue(
      {} as object as Awaited<ReturnType<typeof prisma.tag.update>>,
    );

    const response = await postVisualConfig(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(prisma.tag.update).toHaveBeenCalledWith({
      where: { id: "tag-1" },
      data: { color: "#ff0000" },
    });
  });

  it("should return 500 if prisma update fails", async () => {
    const req = new Request("http://localhost/api/visual-config", {
      method: "POST",
      body: JSON.stringify({ id: "tag-1", color: "#ff0000" }),
    });

    vi.mocked(prisma.tag.update).mockRejectedValue(new Error("Prisma error"));

    const response = await postVisualConfig(req);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.message).toBe("Server Error");
  });
});
