import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import AgentsPage from "@/app/(dashboard)/agents/page";
import fs from "fs";
import {
  manifestService,
  AgentManifestRecord,
  SkillManifestRecord,
} from "@/lib/services/manifest-service";

interface VitestMockFunction {
  mockReturnValue: (val: unknown) => void;
  mockImplementation: (fn: (...args: unknown[]) => unknown) => void;
}

vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (params) {
        return `${key}_${JSON.stringify(params)}`;
      }
      return key;
    },
  }),
}));

vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn(),
    statSync: vi.fn(),
    readFileSync: vi.fn(),
  },
}));

vi.mock("@/lib/services/manifest-service", () => ({
  manifestService: {
    getAgents: vi.fn(),
    getSkills: vi.fn(),
  },
}));

vi.mock("@/app/(dashboard)/agents/page_content", () => ({
  default: ({
    agents,
    skills,
  }: {
    agents: Record<string, string | number>[];
    skills: Record<string, string | number>[];
  }) => (
    <div data-testid="agents-page-content">
      <div data-testid="agents-count">{agents.length}</div>
      <div data-testid="skills-count">{skills.length}</div>
      {agents.length > 0 && (
        <div data-testid="first-agent-protocols">
          {agents[0].protocols ? JSON.stringify(agents[0].protocols) : "none"}
        </div>
      )}
      {agents.length > 0 && agents[0].complianceChecklist && (
        <div data-testid="compliance-checklist">
          {JSON.stringify(agents[0].complianceChecklist)}
        </div>
      )}
    </div>
  ),
}));

describe("app/(dashboard)/agents/page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("should handle error when manifestService throws error", () => {
    (
      manifestService.getAgents as unknown as VitestMockFunction
    ).mockImplementation(() => {
      throw new Error("Manifest Error");
    });
    (
      manifestService.getSkills as unknown as VitestMockFunction
    ).mockImplementation(() => {
      throw new Error("Skills Error");
    });

    render(<AgentsPage />);

    expect(screen.getByTestId("agents-count").textContent).toBe("0");
    expect(screen.getByTestId("skills-count").textContent).toBe("0");
  });

  it("should fetch agents and skills and render page content", () => {
    const mockAgents: AgentManifestRecord[] = [
      {
        name: "amelia",
        displayName: "Amelia",
        title: "Web Dev",
        icon: "Icon",
        capabilities: "Coding",
        role: "Developer",
        path: "skills/web-dev/SKILL.md",
        identity: "Identity",
        communicationStyle: "Style",
        principles: "Principles",
        module: "web-dev",
        canonicalId: "amelia-dev",
      },
    ];
    const mockSkills: SkillManifestRecord[] = [
      {
        canonicalId: "skill-1",
        name: "Coding",
        description: "Write code",
        module: "dev",
        path: "skills/web-dev",
      },
    ];

    (
      manifestService.getAgents as unknown as VitestMockFunction
    ).mockReturnValue(mockAgents);
    (
      manifestService.getSkills as unknown as VitestMockFunction
    ).mockReturnValue(mockSkills);

    const mockSkillMd = `
# COMPLIANCE CHECKLIST
- [ ] Checklist Item 1
- [x] Checklist Item 2

## PRINCIPLES
- Principle 1
- Principle 2

## CAPABILITIES
| Code | Description | Skill |
|---|---|---|
| CAP-1 | Test capability | Coding |

## CONTEXT LOAD
Mock context load line 1
Mock context load line 2

## GATEKEEPER
Mock gatekeeper line 1
`;

    const existsSyncMock = fs.existsSync as unknown as VitestMockFunction;
    const statSyncMock = fs.statSync as unknown as VitestMockFunction;
    const readFileSyncMock = fs.readFileSync as unknown as VitestMockFunction;

    existsSyncMock.mockReturnValue(true);
    statSyncMock.mockReturnValue({ isFile: () => true });
    readFileSyncMock.mockReturnValue(mockSkillMd);

    render(<AgentsPage />);

    expect(screen.getByTestId("agents-count").textContent).toBe("1");
    expect(screen.getByTestId("skills-count").textContent).toBe("1");

    expect(screen.getByTestId("compliance-checklist").textContent).toContain(
      "Checklist Item 1",
    );
    expect(screen.getByTestId("compliance-checklist").textContent).toContain(
      "Checklist Item 2",
    );
    expect(screen.getByTestId("first-agent-protocols").textContent).toContain(
      "Mock context load line 1",
    );
    expect(screen.getByTestId("first-agent-protocols").textContent).toContain(
      "Mock gatekeeper line 1",
    );
  });

  it("should handle error or missing file in parseSkillMd gracefully", () => {
    const mockAgents: AgentManifestRecord[] = [
      {
        name: "amelia",
        displayName: "Amelia",
        title: "Web Dev",
        icon: "Icon",
        capabilities: "Coding",
        role: "Developer",
        path: "skills/web-dev/SKILL.md",
        identity: "Identity",
        communicationStyle: "Style",
        principles: "Principles",
        module: "web-dev",
        canonicalId: "amelia-dev",
      },
    ];
    (
      manifestService.getAgents as unknown as VitestMockFunction
    ).mockReturnValue(mockAgents);
    (
      manifestService.getSkills as unknown as VitestMockFunction
    ).mockReturnValue([]);

    const existsSyncMock = fs.existsSync as unknown as VitestMockFunction;
    existsSyncMock.mockReturnValue(false); // file not found

    render(<AgentsPage />);

    expect(screen.getByTestId("first-agent-protocols").textContent).toBe(
      "none",
    );
  });

  it("should handle file read error in parseSkillMd gracefully", () => {
    const mockAgents: AgentManifestRecord[] = [
      {
        name: "amelia",
        displayName: "Amelia",
        title: "Web Dev",
        icon: "Icon",
        capabilities: "Coding",
        role: "Developer",
        path: "skills/web-dev/SKILL.md",
        identity: "Identity",
        communicationStyle: "Style",
        principles: "Principles",
        module: "web-dev",
        canonicalId: "amelia-dev",
      },
    ];
    (
      manifestService.getAgents as unknown as VitestMockFunction
    ).mockReturnValue(mockAgents);
    (
      manifestService.getSkills as unknown as VitestMockFunction
    ).mockReturnValue([]);

    const existsSyncMock = fs.existsSync as unknown as VitestMockFunction;
    const statSyncMock = fs.statSync as unknown as VitestMockFunction;
    const readFileSyncMock = fs.readFileSync as unknown as VitestMockFunction;

    existsSyncMock.mockReturnValue(true);
    statSyncMock.mockReturnValue({ isFile: () => true });
    readFileSyncMock.mockImplementation(() => {
      throw new Error("File System Error");
    });

    render(<AgentsPage />);

    expect(screen.getByTestId("first-agent-protocols").textContent).toBe(
      "none",
    );
  });
});
