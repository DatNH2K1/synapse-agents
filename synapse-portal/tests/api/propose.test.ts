import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as postPropose } from "@/app/api/propose/route";
import { knowledgeService } from "@/lib/services/knowledge-service";

vi.mock("@/lib/services/knowledge-service", () => ({
  knowledgeService: {
    proposeKnowledge: vi.fn(),
  },
}));

describe("POST /api/propose", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 if required fields are missing", async () => {
    const req = new Request("http://localhost/api/propose", {
      method: "POST",
      body: JSON.stringify({ label: "Missing fields" }),
    });

    const response = await postPropose(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Missing required fields");
  });

  it("should return proposed knowledge result on success", async () => {
    const req = new Request("http://localhost/api/propose", {
      method: "POST",
      body: JSON.stringify({
        label: "Test",
        content: "Body",
        type: "LESSON",
      }),
    });

    const mockResult = { success: true, id: "prop-id" };
    vi.mocked(knowledgeService.proposeKnowledge).mockResolvedValue(mockResult);

    const response = await postPropose(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockResult);
  });

  it("should return 500 if error is thrown", async () => {
    const req = new Request("http://localhost/api/propose", {
      method: "POST",
      body: JSON.stringify({
        label: "Test",
        content: "Body",
        type: "LESSON",
      }),
    });

    vi.mocked(knowledgeService.proposeKnowledge).mockRejectedValue(
      new Error("Propose error"),
    );

    const response = await postPropose(req);
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Propose error");
  });

  it("should return 400 if a validation error is thrown", async () => {
    const req = new Request("http://localhost/api/propose", {
      method: "POST",
      body: JSON.stringify({
        label: "Test",
        content: "Body",
        type: "LESSON",
        tags: ["section:invalid"],
      }),
    });

    vi.mocked(knowledgeService.proposeKnowledge).mockRejectedValue(
      new Error('Invalid section tag: "invalid". Allowed sections: ...'),
    );

    const response = await postPropose(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("Invalid section tag");
  });
});
