import { describe, it, expect } from "vitest";
import {
  getNodeColor,
  getNodeCategoryLabel,
  groupTagsByScope,
  getConnectedTagIds,
} from "@/lib/graph-theme";
import { Node, Tag, Edge } from "@/lib/db";

describe("lib/graph-theme", () => {
  describe("getNodeColor", () => {
    it("should return nodes standard color", () => {
      const node = { id: "node-1", type: "LESSON", label: "My Lesson" } as Node;
      expect(getNodeColor(node)).toBe("#64748b");
    });

    it("should return nodes custom color if specified", () => {
      const node = {
        id: "node-1",
        type: "LESSON",
        label: "My Lesson",
        color: "#ff0000",
      } as object as Node;
      expect(getNodeColor(node)).toBe("#ff0000");
    });

    it("should return tag standard color if node is a tag and has no color", () => {
      const node = {
        id: "node-1",
        type: "TAG",
        label: "My Tag",
      } as object as Node;
      expect(getNodeColor(node)).toBe("#818cf8");
    });

    it("should return tag custom color if node is a tag and has color", () => {
      const node = {
        id: "node-1",
        type: "TAG",
        label: "My Tag",
        color: "#00ff00",
      } as object as Node;
      expect(getNodeColor(node)).toBe("#00ff00");
    });
  });

  describe("getNodeCategoryLabel", () => {
    it("should return nodes type", () => {
      const node = { id: "node-1", type: "LESSON" } as Node;
      expect(getNodeCategoryLabel(node)).toBe("LESSON");
    });

    it("should return default value if type is empty", () => {
      const node = { id: "node-1" } as Node;
      expect(getNodeCategoryLabel(node)).toBe("Knowledge Node");
    });
  });

  describe("groupTagsByScope", () => {
    it("should group tags by scope name lowercase", () => {
      const tags = [
        { id: "1", scope: "SYSTEM", name: "t1" },
        { id: "2", scope: "system", name: "t2" },
        { id: "3", scope: "USER", name: "t3" },
      ] as Tag[];

      const grouped = groupTagsByScope(tags);
      expect(grouped.system).toHaveLength(2);
      expect(grouped.user).toHaveLength(1);
      expect(grouped.system[0].name).toBe("t1");
    });
  });

  describe("getConnectedTagIds", () => {
    it("should extract to_id for non-ROOT_LINK edges", () => {
      const edges = [
        { id: 1, from_id: "node-1", to_id: "tag-1", relation_type: "TAGS" },
        { id: 2, from_id: "root", to_id: "tag-2", relation_type: "ROOT_LINK" },
        { id: 3, from_id: "node-2", to_id: "tag-3", relation_type: "USES" },
      ];

      const connected = getConnectedTagIds(edges as object as Edge[]);
      expect(connected.has("tag-1")).toBe(true);
      expect(connected.has("tag-2")).toBe(false);
      expect(connected.has("tag-3")).toBe(true);
      expect(connected.size).toBe(2);
    });
  });
});
