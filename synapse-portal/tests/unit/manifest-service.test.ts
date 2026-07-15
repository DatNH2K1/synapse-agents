import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import { manifestService } from "@/lib/services/manifest-service";

vi.mock("fs");

describe("ManifestService Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getAgents", () => {
    it("should return empty list if agent manifest file does not exist", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(false);
      const agents = manifestService.getAgents();
      expect(agents).toEqual([]);
    });

    it("should parse agent CSV data correctly", () => {
      const csvData =
        "name,displayName,title,icon,capabilities,role,identity,communicationStyle,principles,module,path,canonicalId\n" +
        'agent-1,"Agent 1","Lead",icon.png,"chat,code",dev,"You are dev","friendly","do best",mod,path/to/mod,id-1';

      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "readFileSync").mockReturnValue(csvData);

      const agents = manifestService.getAgents();
      expect(agents).toHaveLength(1);
      expect(agents[0]).toEqual({
        name: "agent-1",
        displayName: "Agent 1",
        title: "Lead",
        icon: "icon.png",
        capabilities: "chat,code",
        role: "dev",
        identity: "You are dev",
        communicationStyle: "friendly",
        principles: "do best",
        module: "mod",
        path: "path/to/mod",
        canonicalId: "id-1",
      });
    });

    it("should handle error gracefully and return empty list", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(true);
      vi.spyOn(fs, "readFileSync").mockImplementation(() => {
        throw new Error("Disk read failure");
      });

      const agents = manifestService.getAgents();
      expect(agents).toEqual([]);
    });
  });

  describe("getSkills", () => {
    it("should return empty list if skill manifest file does not exist", () => {
      vi.spyOn(fs, "existsSync").mockReturnValue(false);
      const skills = manifestService.getSkills();
      expect(skills).toEqual([]);
    });

    it("should parse skill CSV data correctly", () => {
      const csvData =
        "canonicalId,name,description,module,path\n" +
        'skill-1,"Skill Name","Description of skill",mod,path/to/skill';

      vi.spyOn(fs, "existsSync").mockImplementation((p) => {
        return (
          typeof p === "string" && !p.includes("addition-skill-manifest.csv")
        );
      });
      vi.spyOn(fs, "readFileSync").mockReturnValue(csvData);

      const skills = manifestService.getSkills();
      expect(skills).toHaveLength(1);
      expect(skills[0]).toEqual({
        canonicalId: "skill-1",
        name: "Skill Name",
        description: "Description of skill",
        module: "mod",
        path: "path/to/skill",
      });
    });
  });
});
