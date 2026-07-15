import { describe, it, expect } from "vitest";

interface Proposal {
  tags?: string[];
  workspace_id?: string;
  agent_id?: string;
  technology?: string;
}

function extractMetadata(proposal: Proposal) {
  const tags = proposal.tags || [];
  const projectTag = tags.find((t: string) => t.startsWith("project:"));
  const agentTag = tags.find((t: string) => t.startsWith("agent:"));
  const techTag = tags.find(
    (t: string) => t.startsWith("technology:") || t.startsWith("tech:"),
  );

  return {
    projectName:
      projectTag?.split(":")[1] || proposal.workspace_id || "default",
    sourceAgent: agentTag?.split(":")[1] || proposal.agent_id || "unknown",
    technology: techTag?.split(":")[1]?.split("@")[0] || proposal.technology,
  };
}

describe("Propose Metadata Extraction", () => {
  it("TC1: Should prioritize tags over direct fields", () => {
    const proposal = {
      tags: ["project:synapse", "agent:amelia", "technology:nextjs@14"],
      workspace_id: "other-project",
      agent_id: "other-agent",
      technology: "other-tech",
    };
    const result = extractMetadata(proposal);
    expect(result).toEqual({
      projectName: "synapse",
      sourceAgent: "amelia",
      technology: "nextjs",
    });
  });

  it("TC2: Should fallback to direct fields if tags are missing", () => {
    const proposal = {
      tags: [],
      workspace_id: "sample-store",
      agent_id: "winston",
      technology: "react",
    };
    const result = extractMetadata(proposal);
    expect(result).toEqual({
      projectName: "sample-store",
      sourceAgent: "winston",
      technology: "react",
    });
  });

  it("TC3: Should support 'technology:' prefix for technology", () => {
    const proposal = {
      tags: ["technology:prisma@5.0"],
    };
    const result = extractMetadata(proposal);
    expect(result.technology).toBe("prisma");
    expect(result.projectName).toBe("default");
  });

  it("TC4: Should handle mixed tags and missing fields", () => {
    const proposal = {
      tags: ["project:nexus"],
      agent_id: "arthur",
    };
    const result = extractMetadata(proposal);
    expect(result).toEqual({
      projectName: "nexus",
      sourceAgent: "arthur",
      technology: undefined,
    });
  });

  it("TC5: Should handle absolute fallback (Empty proposal)", () => {
    const proposal = {};
    const result = extractMetadata(proposal);
    expect(result).toEqual({
      projectName: "default",
      sourceAgent: "unknown",
      technology: undefined,
    });
  });
});
