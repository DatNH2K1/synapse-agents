import { describe, it, expect } from "vitest";

// Mocking the Node and Tag structures from Prisma
interface MockTag {
  scope: string;
  name: string;
  version: string | null;
}

interface MockNode {
  id: string;
  label: string;
  tags: MockTag[];
}

const parseTagString = (tagStr: string): MockTag => {
  const [scope, rest] = tagStr.includes(":")
    ? tagStr.split(":")
    : ["general", tagStr];

  const [name, version] = rest.includes("@") ? rest.split("@") : [rest, null];

  return {
    scope: scope.toLowerCase(),
    name: name.toLowerCase(),
    version: version ? version.toLowerCase() : null,
  };
};

// The logic extracted from knowledge-service.ts for testing
function filterNodes(nodes: MockNode[], requestedTags: string[]): MockNode[] {
  if (!requestedTags || requestedTags.length === 0) return [];

  const requestedByScope: Record<string, string[]> = {};
  requestedTags.forEach((tagStr) => {
    const { scope, name, version } = parseTagString(tagStr);
    const key = `${name}${version ? "@" + version : ""}`;
    if (!requestedByScope[scope]) requestedByScope[scope] = [];
    requestedByScope[scope].push(key);
  });

  return nodes.filter((node) => {
    const nodeTagsByScope: Record<string, string[]> = {};
    node.tags.forEach((t) => {
      const key = `${t.name}${t.version ? "@" + t.version : ""}`;
      if (!nodeTagsByScope[t.scope]) nodeTagsByScope[t.scope] = [];
      nodeTagsByScope[t.scope].push(key);
    });

    const isGlobal =
      nodeTagsByScope["scope"]?.includes("global") ||
      nodeTagsByScope["global"]?.includes("global");
    const hasMatchingTag = requestedTags.some((tagStr) => {
      const { scope, name, version } = parseTagString(tagStr);
      const key = `${name}${version ? "@" + version : ""}`;
      return nodeTagsByScope[scope]?.includes(key);
    });

    if (!isGlobal && !hasMatchingTag) return false;

    for (const scope in requestedByScope) {
      if (scope === "scope" || scope === "global") continue;

      const requestedValues = requestedByScope[scope];
      const nodeValues = nodeTagsByScope[scope] || [];

      if (nodeValues.length > 0) {
        const hasDifferentValue = nodeValues.some(
          (val) => !requestedValues.includes(val),
        );
        if (hasDifferentValue) return false;
      }
    }

    return true;
  });
}

const sampleData: MockNode[] = [
  {
    id: "N1",
    label: "Amelia-SYNAPSE-Nextjs",
    tags: [
      parseTagString("project:synapse"),
      parseTagString("technology:nextjs"),
      parseTagString("agent:amelia"),
    ],
  },
  {
    id: "N2",
    label: "SYNAPSE-Antd4",
    tags: [
      parseTagString("project:synapse"),
      parseTagString("technology:antd@4"),
    ],
  },
  {
    id: "N3",
    label: "SYNAPSE-General",
    tags: [parseTagString("project:synapse")],
  },
  {
    id: "N4",
    label: "Amelia-Nextjs-Gen",
    tags: [parseTagString("technology:nextjs"), parseTagString("agent:amelia")],
  },
  {
    id: "N5",
    label: "Antd4-Docs",
    tags: [parseTagString("technology:antd@4")],
  },
  { id: "N6", label: "Amelia-Style", tags: [parseTagString("agent:amelia")] },
  {
    id: "N7",
    label: "Global-CleanCode",
    tags: [parseTagString("scope:global")],
  },
  {
    id: "N8",
    label: "OtherProject-Nextjs",
    tags: [
      parseTagString("project:other-app"),
      parseTagString("technology:nextjs"),
    ],
  },
  {
    id: "N9",
    label: "Winston-Synapse",
    tags: [parseTagString("project:synapse"), parseTagString("agent:winston")],
  },
  {
    id: "N10",
    label: "Global-Nextjs-Tip",
    tags: [parseTagString("scope:global"), parseTagString("technology:nextjs")],
  },
];

describe("Context Retrieval Logic", () => {
  it("TC1: Only Project requested", () => {
    const result = filterNodes(sampleData, ["project:synapse"]).map(
      (n) => n.id,
    );
    expect(result).toEqual(
      expect.arrayContaining(["N1", "N2", "N3", "N7", "N9", "N10"]),
    );
    expect(result.length).toBe(6);
  });

  it("TC2: Project and Technology requested", () => {
    const result = filterNodes(sampleData, [
      "project:synapse",
      "technology:nextjs",
    ]).map((n) => n.id);
    expect(result).toEqual(
      expect.arrayContaining(["N1", "N3", "N4", "N7", "N9", "N10"]),
    );
    expect(result.length).toBe(6);
  });

  it("TC3: Multiple Technologies requested", () => {
    const result = filterNodes(sampleData, [
      "technology:nextjs",
      "technology:antd@4",
    ]).map((n) => n.id);
    expect(result).toEqual(
      expect.arrayContaining(["N1", "N2", "N4", "N5", "N7", "N8", "N10"]),
    );
    expect(result.length).toBe(7);
  });

  it("TC4: Project and Multiple Technologies requested", () => {
    const result = filterNodes(sampleData, [
      "project:synapse",
      "technology:nextjs",
      "technology:antd@4",
    ]).map((n) => n.id);
    expect(result).toEqual(
      expect.arrayContaining(["N1", "N2", "N3", "N4", "N5", "N7", "N9", "N10"]),
    );
    expect(result.length).toBe(8);
  });

  it("TC5: Multiple Agents requested", () => {
    const result = filterNodes(sampleData, [
      "agent:amelia",
      "agent:winston",
    ]).map((n) => n.id);
    expect(result).toEqual(
      expect.arrayContaining(["N1", "N4", "N6", "N7", "N9", "N10"]),
    );
    expect(result.length).toBe(6);
  });

  it("TC6: Specific Project, Tech, and Agent requested", () => {
    const result = filterNodes(sampleData, [
      "project:synapse",
      "technology:nextjs",
      "agent:amelia",
    ]).map((n) => n.id);
    expect(result).toEqual(
      expect.arrayContaining(["N1", "N3", "N4", "N6", "N7", "N10"]),
    );
    expect(result.length).toBe(6);
  });

  it("TC7: Multiple Projects requested", () => {
    const result = filterNodes(sampleData, [
      "project:synapse",
      "project:other-app",
    ]).map((n) => n.id);
    expect(result).toEqual(
      expect.arrayContaining(["N1", "N2", "N3", "N7", "N8", "N9", "N10"]),
    );
    expect(result.length).toBe(7);
  });

  it("TC8: Global node with extra Technology (should include)", () => {
    const result = filterNodes(sampleData, ["project:synapse"]).map(
      (n) => n.id,
    );
    expect(result).toContain("N10");
  });

  it("TC9: Global node with forbidden Technology (should exclude)", () => {
    const result = filterNodes(sampleData, [
      "project:synapse",
      "technology:antd@4",
    ]).map((n) => n.id);
    expect(result).not.toContain("N10");
  });

  it("TC10: Empty request tags (should return empty)", () => {
    const result = filterNodes(sampleData, []);
    expect(result).toEqual([]);
  });
});

import { knowledgeService } from "@/lib/services/knowledge-service";

describe("formatAsMarkdown", () => {
  it("groups nodes by section and formats beautifully", () => {
    const mockNodes = [
      {
        id: "node-1",
        type: "LESSON",
        label: "Avoid direct mut",
        properties: JSON.stringify({ content: "Never mutate state directly." }),
        distance: 0.1234,
        tags: [
          {
            id: "t1",
            scope: "section",
            name: "mistakes-to-avoid",
            version: null,
            color: "#f87171",
          },
          {
            id: "t2",
            scope: "technology",
            name: "react",
            version: "18",
            color: "#818cf8",
          },
        ],
      },
      {
        id: "node-2",
        type: "FEATURE",
        label: "Auth Implementation",
        properties: JSON.stringify({ content: "Implemented Better Auth." }),
        distance: 0,
        tags: [
          {
            id: "t3",
            scope: "section",
            name: "optimized-techniques",
            version: null,
            color: "#34d399",
          },
        ],
      },
      {
        id: "node-3",
        type: "CONTEXT",
        label: "Global Architecture",
        properties: JSON.stringify({ content: "Monolithic to microservices." }),
        distance: 0,
        tags: [],
      },
    ] as Parameters<typeof knowledgeService.formatAsMarkdown>[0];

    const markdown = knowledgeService.formatAsMarkdown(mockNodes);

    // Verify AI Instructions are present
    expect(markdown).toContain("> **AI Instructions**:");

    // Verify sections are present
    expect(markdown).toContain("## ⚠️ Mistakes to Avoid");
    expect(markdown).toContain("## 🚀 Optimized Techniques");
    expect(markdown).toContain("## 📁 General Context & Other Knowledge");

    // Verify content and headings are correctly formatted
    expect(markdown).toContain("#### 💡 [LESSON] Avoid direct mut");
    expect(markdown).toContain("#### ✨ [FEATURE] Auth Implementation");
    expect(markdown).toContain("#### 🔮 [CONTEXT] Global Architecture");

    // Verify other tags formatting
    expect(markdown).toContain("- **Tags**: `technology:react@18`");
    expect(markdown).toContain("Never mutate state directly.");
    expect(markdown).toContain("Implemented Better Auth.");
    expect(markdown).toContain("Monolithic to microservices.");
  });
});
