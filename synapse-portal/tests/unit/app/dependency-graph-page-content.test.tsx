import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
} from "@testing-library/react";
import DependencyGraphContent from "@/app/(dashboard)/dependency-graph/page_content";

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

interface SelectMockProps {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}

vi.mock("@/components/shared/Select", () => ({
  default: ({ value, onChange, options }: SelectMockProps) => (
    <select
      data-testid="mock-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o: { value: string; label: string }) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

// Mock ForceGraphWrapper dynamic component
interface ForceGraphMockProps {
  nodes: { id: string }[];
  links: unknown[];
  onNodeClick: (nodeId: string) => void;
  onRef: (ref: unknown) => void;
  searchQuery?: string;
}

interface CapturedRefType {
  zoomIn: ReturnType<typeof vi.fn>;
  zoomOut: ReturnType<typeof vi.fn>;
  zoomToFit: ReturnType<typeof vi.fn>;
}

let capturedOnRef: CapturedRefType | null = null;
vi.mock("next/dynamic", () => ({
  default: () => {
    return function MockedForceGraph({
      nodes,
      links,
      onNodeClick,
      onRef,
      searchQuery,
    }: ForceGraphMockProps) {
      React.useEffect(() => {
        capturedOnRef = {
          zoomIn: vi.fn(),
          zoomOut: vi.fn(),
          zoomToFit: vi.fn(),
        };
        onRef(capturedOnRef);
      }, [onRef]);

      return (
        <div data-testid="mock-force-graph">
          <div data-testid="nodes-count">{nodes.length}</div>
          <div data-testid="links-count">{links.length}</div>
          <div data-testid="search-query">{searchQuery || ""}</div>
          <button
            data-testid="node-click-trigger"
            onClick={() => onNodeClick("node-1")}
          >
            Click Node 1
          </button>
          <button
            data-testid="node-click-nonexistent"
            onClick={() => onNodeClick("node-nonexistent")}
          >
            Click Nonexistent
          </button>
        </div>
      );
    };
  },
}));

describe("app/(dashboard)/dependency-graph/page_content", () => {
  const initialRepos = ["synapse", "test-repo"];

  beforeEach(() => {
    cleanup();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("should render page header, select repository and fetch graph data", async () => {
    const mockGraphResponse = {
      success: true,
      files: [
        {
          id: "node-1",
          path: "src/index.ts",
          hash: "md5-hash-1",
          symbols: [
            { id: "sym-1", name: "hello", kind: "function", range: "1:0" },
          ],
        },
        {
          id: "node-2",
          path: "src/utils.py",
          hash: "md5-hash-2",
          symbols: [],
        },
        {
          id: "node-3",
          path: "Dockerfile",
          hash: "md5-hash-3",
          symbols: [],
        },
      ],
      dependencies: [
        { id: "dep-1", dependentFileId: "node-1", dependencyFileId: "node-2" },
      ],
    };

    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => mockGraphResponse,
    });
    vi.stubGlobal("fetch", mockFetch);

    await act(async () => {
      render(<DependencyGraphContent initialRepos={initialRepos} />);
    });

    expect(screen.getAllByText("dependency_graph")[0]).toBeDefined();
    expect(screen.getByTestId("mock-force-graph")).toBeDefined();

    // Verify correct api request
    expect(mockFetch).toHaveBeenCalledWith("/api/indexer/graph?repo=synapse");

    // Check force graph nodes and links counts
    expect(screen.getByTestId("nodes-count").textContent).toBe("3");
    expect(screen.getByTestId("links-count").textContent).toBe("1");

    // Change selected repo
    const select = screen.getByTestId("mock-select");
    await act(async () => {
      fireEvent.change(select, { target: { value: "test-repo" } });
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/indexer/graph?repo=test-repo");
  });

  it("should default to synapse repo if initialRepos is empty", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ success: true, files: [], dependencies: [] }),
      }),
    );

    await act(async () => {
      render(<DependencyGraphContent initialRepos={[]} />);
    });

    expect(fetch).toHaveBeenCalledWith("/api/indexer/graph?repo=synapse");
  });

  it("should handle unsuccessful graph API response payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ success: false, error: "Failed" }),
      }),
    );

    await act(async () => {
      render(<DependencyGraphContent initialRepos={initialRepos} />);
    });

    // Files should remain empty if success is false
    expect(screen.getByTestId("nodes-count").textContent).toBe("0");
  });

  it("should handle unsuccessful impact API response payload and nonexistent node click", async () => {
    const mockGraphResponse = {
      success: true,
      files: [
        { id: "node-1", path: "src/index.ts", hash: "hash-1", symbols: [] },
      ],
      dependencies: [],
    };

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        json: async () => mockGraphResponse,
      })
      .mockResolvedValueOnce({
        json: async () => ({ success: false, error: "Failed" }),
      });
    vi.stubGlobal("fetch", mockFetch);

    await act(async () => {
      render(<DependencyGraphContent initialRepos={initialRepos} />);
    });

    // Trigger nonexistent node click -> should return immediately without API call
    const nonexistentBtn = screen.getByTestId("node-click-nonexistent");
    await act(async () => {
      fireEvent.click(nonexistentBtn);
    });

    const nodeClickBtn = screen.getByTestId("node-click-trigger");
    await act(async () => {
      fireEvent.click(nodeClickBtn);
    });

    // Blast radius should be empty if success is false
    expect(screen.queryByText("app.ts")).toBeNull();
  });

  it("should display selected node details and load blast radius impact analysis", async () => {
    const mockGraphResponse = {
      success: true,
      files: [
        {
          id: "node-1",
          path: "src/index.ts",
          hash: "md5-hash-1",
          symbols: [
            { id: "sym-1", name: "hello", kind: "function", range: "1:0" },
          ],
        },
      ],
      dependencies: [],
    };

    const mockImpactResponse = {
      success: true,
      file: "src/index.ts",
      exists: true,
      impactedFiles: [{ path: "src/app.ts", depth: 1 }],
    };

    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({
        json: async () => mockGraphResponse,
      })
      .mockResolvedValueOnce({
        json: async () => mockImpactResponse,
      });
    vi.stubGlobal("fetch", mockFetch);

    await act(async () => {
      render(<DependencyGraphContent initialRepos={initialRepos} />);
    });

    // Trigger node click
    const nodeClickBtn = screen.getByTestId("node-click-trigger");
    await act(async () => {
      fireEvent.click(nodeClickBtn);
    });

    expect(mockFetch).toHaveBeenLastCalledWith(
      "/api/indexer/impact?file=src%2Findex.ts&repo=synapse",
    );

    // Node details should be displayed
    expect(
      screen.getByRole("heading", { name: "index.ts", level: 3 }),
    ).toBeDefined();
    expect(screen.getByText("md5-hash-1")).toBeDefined();
    expect(screen.getByText("hello")).toBeDefined();
    expect(screen.getByText("depth_label", { exact: false })).toBeDefined();
    expect(screen.getByText("app.ts")).toBeDefined();
  });

  it("should support search queries to highlight nodes without filtering", async () => {
    const mockGraphResponse = {
      success: true,
      files: [
        { id: "node-1", path: "src/index.ts", hash: "hash-1", symbols: [] },
        { id: "node-2", path: "src/utils.py", hash: "hash-2", symbols: [] },
      ],
      dependencies: [],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => mockGraphResponse,
      }),
    );

    await act(async () => {
      render(<DependencyGraphContent initialRepos={initialRepos} />);
    });

    expect(screen.getByTestId("nodes-count").textContent).toBe("2");

    // Search for index
    const searchInput = screen.getByPlaceholderText("search_file_placeholder");
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "index" } });
    });

    expect(screen.getByTestId("nodes-count").textContent).toBe("2");
    expect(screen.getByTestId("search-query").textContent).toBe("index");
  });

  it("should toggle fullscreen and handle zoom buttons", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({ success: true, files: [], dependencies: [] }),
      }),
    );

    await act(async () => {
      render(<DependencyGraphContent initialRepos={initialRepos} />);
    });

    // Toggle fullscreen
    const fsBtn = screen.getByText(
      (_, el) =>
        el?.tagName === "BUTTON" &&
        el.querySelector(".lucide-maximize2") !== null,
    );
    await act(async () => {
      fireEvent.click(fsBtn);
    });

    const minimizeBtn = screen.getByText(
      (_, el) =>
        el?.tagName === "BUTTON" &&
        el.querySelector(".lucide-minimize2") !== null,
    );
    expect(minimizeBtn).toBeDefined();

    // Call zoom buttons
    const plusBtn = screen.getByText(
      (_, el) =>
        el?.tagName === "BUTTON" && el.querySelector(".lucide-plus") !== null,
    );
    fireEvent.click(plusBtn);
    expect(capturedOnRef?.zoomIn).toHaveBeenCalled();

    const minusBtn = screen.getByText(
      (_, el) =>
        el?.tagName === "BUTTON" && el.querySelector(".lucide-minus") !== null,
    );
    fireEvent.click(minusBtn);
    expect(capturedOnRef?.zoomOut).toHaveBeenCalled();

    const resetBtn = screen.getByText(
      (_, el) =>
        el?.tagName === "BUTTON" &&
        el.querySelector(".lucide-rotate-ccw") !== null,
    );
    fireEvent.click(resetBtn);
    expect(capturedOnRef?.zoomToFit).toHaveBeenCalled();
  });

  it("should handle error when fetch graph data fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Graph API failure")),
    );

    await act(async () => {
      render(<DependencyGraphContent initialRepos={initialRepos} />);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to load graph:",
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });

  it("should handle error when fetch impact data fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const mockGraphResponse = {
      success: true,
      files: [
        { id: "node-1", path: "src/index.ts", hash: "hash-1", symbols: [] },
      ],
      dependencies: [],
    };

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          json: async () => mockGraphResponse,
        })
        .mockRejectedValueOnce(new Error("Impact API failure")),
    );

    await act(async () => {
      render(<DependencyGraphContent initialRepos={initialRepos} />);
    });

    const nodeClickBtn = screen.getByTestId("node-click-trigger");
    await act(async () => {
      fireEvent.click(nodeClickBtn);
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Failed to load impact analysis:",
      expect.any(Error),
    );
    consoleSpy.mockRestore();
  });

  it("should trigger enter keypress in search input and toggle orphans filter", async () => {
    const mockGraphResponse = {
      success: true,
      files: [
        { id: "node-1", path: "src/index.ts", hash: "hash-1", symbols: [] },
        { id: "node-2", path: "src/utils.py", hash: "hash-2", symbols: [] },
      ],
      dependencies: [],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => mockGraphResponse,
      }),
    );

    await act(async () => {
      render(<DependencyGraphContent initialRepos={initialRepos} />);
    });

    const searchInput = screen.getByPlaceholderText("search_file_placeholder");
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: "index" } });
    });

    // Press Enter to cycle matching node index
    await act(async () => {
      fireEvent.keyDown(searchInput, { key: "Enter", code: "Enter" });
    });

    // Toggle orphans
    const orphansBtn = screen.getByText(/Orphans \(/);
    await act(async () => {
      fireEvent.click(orphansBtn);
    });

    // Toggle off orphans
    await act(async () => {
      fireEvent.click(orphansBtn);
    });

    expect(screen.getByTestId("nodes-count").textContent).toBe("2");
  });
});
