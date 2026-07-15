import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
} from "@testing-library/react";
import TheGate from "@/components/gate/TheGate";
import {
  PendingUpdate,
  NodeWithTags,
  CachedProposal,
} from "@/components/gate/types";

const mockRefresh = vi.fn();
const stableRouter = {
  refresh: mockRefresh,
};
vi.mock("next/navigation", () => ({
  useRouter: () => stableRouter,
}));

vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (key === "pending_proposals" && params) {
        return `pending_proposals_${params.count}`;
      }
      return key;
    },
  }),
}));

const stableSubscribe = (cb: () => void) => {
  cb();
  return vi.fn();
};
const stableRealtime = {
  subscribeToUpdates: stableSubscribe,
};
vi.mock("@/components/shared/RealtimeProvider", () => ({
  useRealtime: () => stableRealtime,
}));

// Mock IndexedDB
let hasStore = false;
const mockDB = {
  transaction: (
    _storeNames: string | string[],
    _mode?: IDBTransactionMode,
  ): IDBTransaction => {
    return {
      objectStore: (_name: string): IDBObjectStore => {
        return {
          getAll: (): IDBRequest<CachedProposal[]> => {
            const req = {
              _onsuccess: null as (() => void) | null,
              get onsuccess() {
                return this._onsuccess;
              },
              set onsuccess(val) {
                this._onsuccess = val;
                if (val) val();
              },
              result: [] as CachedProposal[],
              addEventListener: vi.fn(),
              dispatchEvent: vi.fn(),
              removeEventListener: vi.fn(),
            };
            return req as object as IDBRequest<CachedProposal[]>;
          },
          getAllKeys: (): IDBRequest<IDBValidKey[]> => {
            const req = {
              _onsuccess: null as (() => void) | null,
              get onsuccess() {
                return this._onsuccess;
              },
              set onsuccess(val) {
                this._onsuccess = val;
                if (val) val();
              },
              result: [] as IDBValidKey[],
              addEventListener: vi.fn(),
              dispatchEvent: vi.fn(),
              removeEventListener: vi.fn(),
            };
            return req as object as IDBRequest<IDBValidKey[]>;
          },
          put: vi.fn(),
        } as object as IDBObjectStore;
      },
      addEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      removeEventListener: vi.fn(),
    } as object as IDBTransaction;
  },
  createObjectStore: vi.fn(() => {
    hasStore = true;
  }),
  objectStoreNames: {
    contains: (_name: string) => hasStore,
  } as object as DOMStringList,
  addEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  removeEventListener: vi.fn(),
};

const mockIDBRequest = {
  _onsuccess: null as (() => void) | null,
  _onupgradeneeded: null as (() => void) | null,
  get onsuccess() {
    return this._onsuccess;
  },
  set onsuccess(val) {
    this._onsuccess = val;
    if (val) val();
  },
  get onupgradeneeded() {
    return this._onupgradeneeded;
  },
  set onupgradeneeded(val) {
    this._onupgradeneeded = val;
    if (val) val();
  },
  result: mockDB as object as IDBDatabase,
  addEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  removeEventListener: vi.fn(),
};

vi.stubGlobal("indexedDB", {
  open: () => {
    // Reset properties to null on open, then return the request
    mockIDBRequest._onsuccess = null;
    mockIDBRequest._onupgradeneeded = null;
    return mockIDBRequest as EventTarget as IDBOpenDBRequest;
  },
});

describe("components/gate/TheGate", () => {
  const pendingUpdates: PendingUpdate[] = [
    {
      id: "update-123",
      label: "Proposal A",
      type: "Feature",
      status: "PENDING",
      last_verified: "2026-06-04T12:00:00Z",
      properties: JSON.stringify({ content: "Description text." }),
      tags: [
        {
          id: "tag-1",
          scope: "agent",
          name: "Sally",
          version: null,
          color: "#ff0000",
        },
      ],
      matches: [{ id: "node-1", label: "Existing Node A", score: 0.95 }],
    },
  ];

  const existingNodes: NodeWithTags[] = [
    {
      id: "node-1",
      label: "Existing Node A",
      type: "Feature",
      content_hash: "hash-1",
      success_count: 1,
      last_verified: new Date(),
      properties: JSON.stringify({ content: "Existing content details." }),
      status: "APPROVED",
      memory_tier: "CORE",
      embeddingModel: "text-embedding-3-small",
      tags: [
        {
          id: "tag-1",
          scope: "agent",
          name: "Sally",
          version: null,
          color: "#ff0000",
          virtual_clock: 0,
        },
      ],
    },
  ];

  beforeEach(() => {
    cleanup();
    mockRefresh.mockClear();
    vi.stubGlobal("fetch", vi.fn());
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should render review gate tab with proposal cards and handle tab switches", async () => {
    render(
      <TheGate pendingUpdates={pendingUpdates} existingNodes={existingNodes} />,
    );

    // Fast-forward indexedDB macrotask/timeout
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    expect(screen.getByText("Proposal A")).toBeDefined();
    expect(screen.getByText("pending_proposals_1")).toBeDefined();

    // Mock fetch for audit-logs API when switching tabs
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        logs: [
          {
            id: "log-1",
            label: "Approved node item",
            type: "Feature",
            status: "APPROVED",
            last_verified: "2026-06-03T12:00:00Z",
            properties: JSON.stringify({ content: "Approved details." }),
            tags: [],
          },
        ],
      }),
    } as Response);

    // Switch to Evolution History tab
    const historyBtn = screen.getByText("evolution_history");
    await act(async () => {
      fireEvent.click(historyBtn);
    });

    expect(fetch).toHaveBeenCalledWith("/api/audit-logs");
    expect(screen.getByText("Approved node item")).toBeDefined();
  });

  it("should handle approval action and refresh", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(
      <TheGate pendingUpdates={pendingUpdates} existingNodes={existingNodes} />,
    );

    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    // Click Approve button (the first button in the proposal controls)
    const approveBtn = screen.getByText(
      (_, el) =>
        el?.tagName === "BUTTON" && el.querySelector(".lucide-check") !== null,
    );
    await act(async () => {
      fireEvent.click(approveBtn);
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/gate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ id: "update-123", action: "APPROVE" }),
      }),
    );
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("should handle reject action and refresh", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(
      <TheGate pendingUpdates={pendingUpdates} existingNodes={existingNodes} />,
    );

    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    const rejectBtn = screen.getByText(
      (_, el) =>
        el?.tagName === "BUTTON" &&
        el.querySelector(".lucide-trash-2") !== null,
    );
    await act(async () => {
      fireEvent.click(rejectBtn);
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/gate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ id: "update-123", action: "REJECT" }),
      }),
    );
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("should handle merge synthesis and merge confirmation flow", async () => {
    // 1. Mock synthesis call
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        success: true,
        json: async () => ({
          success: true,
          label: "Synthesized Title",
          content: "Synthesized content info",
          reason: "Merge duplicate",
        }),
      } as unknown as Response)
      // 2. Mock merge call
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

    render(
      <TheGate pendingUpdates={pendingUpdates} existingNodes={existingNodes} />,
    );

    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    // Start merge flow
    const mergeBtn = screen.getByText(
      (_, el) =>
        el?.tagName === "BUTTON" &&
        el.querySelector(".lucide-git-merge") !== null,
    );
    await act(async () => {
      fireEvent.click(mergeBtn);
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/gate/synthesize",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ nodeIds: ["node-1", "update-123"] }),
      }),
    );

    // Now Synthesis Modal should be open, let's click confirm merge
    const confirmBtn = screen.getByText("confirm_merge");
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/gate/merge",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("MERGE"),
      }),
    );
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("should handle undo action in evolution log", async () => {
    // Fetch mock for tab switch
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          logs: [
            {
              id: "log-1",
              label: "Item A",
              type: "Feature",
              status: "APPROVED",
              last_verified: "2026-06-03T12:00:00Z",
              properties: JSON.stringify({ content: "content" }),
              tags: [],
            },
          ],
        }),
      } as Response)
      // Undo fetch call mock
      .mockResolvedValueOnce({
        json: async () => ({ success: true }),
      } as Response)
      // Refetch logs after undo
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          logs: [],
        }),
      } as Response);

    render(
      <TheGate pendingUpdates={pendingUpdates} existingNodes={existingNodes} />,
    );

    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    // Switch to Evolution History tab
    const historyBtn = screen.getByText("evolution_history");
    await act(async () => {
      fireEvent.click(historyBtn);
    });

    // Click Undo
    const undoBtn = screen.getByText("undo");
    await act(async () => {
      fireEvent.click(undoBtn);
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/gate",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ id: "log-1", action: "UNDO", type: "APPROVED" }),
      }),
    );
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("should handle merge flow with cached proposals", async () => {
    const cacheKey = "node-1_update-123";
    vi.spyOn(mockDB, "transaction").mockReturnValue({
      objectStore: (_name: string): IDBObjectStore => {
        const allReq = {
          onsuccess: null as (() => void) | null,
          result: [
            {
              label: "Cached Title",
              content: "Cached Content",
              reason: "Cached Reason",
            },
          ],
          addEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
          removeEventListener: vi.fn(),
        };
        const keysReq = {
          onsuccess: null as (() => void) | null,
          result: [cacheKey],
          addEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
          removeEventListener: vi.fn(),
        };
        queueMicrotask(() => {
          allReq.onsuccess?.();
          keysReq.onsuccess?.();
        });
        return {
          getAll: () => allReq as object as IDBRequest<CachedProposal[]>,
          getAllKeys: () => keysReq as object as IDBRequest<IDBValidKey[]>,
          put: vi.fn(),
        } as object as IDBObjectStore;
      },
      addEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      removeEventListener: vi.fn(),
    } as object as IDBTransaction);

    render(
      <TheGate pendingUpdates={pendingUpdates} existingNodes={existingNodes} />,
    );

    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    const mergeBtn = screen.getByText(
      (_, el) =>
        el?.tagName === "BUTTON" &&
        el.querySelector(".lucide-git-merge") !== null,
    );
    await act(async () => {
      fireEvent.click(mergeBtn);
    });

    expect(fetch).not.toHaveBeenCalledWith("/api/gate/synthesize");
    expect(screen.getByText("confirm_merge")).toBeDefined();
  });

  it("should render empty state when pendingUpdates is empty", () => {
    render(<TheGate pendingUpdates={[]} existingNodes={existingNodes} />);
    expect(screen.getByText("no_proposals_title")).toBeDefined();
  });

  it("should open comparison modal when clicking compare on proposal card", async () => {
    render(
      <TheGate pendingUpdates={pendingUpdates} existingNodes={existingNodes} />,
    );
    const compareBtn = screen.getByText("compare");
    await act(async () => {
      fireEvent.click(compareBtn);
    });
    expect(screen.getByText("diff_view")).toBeDefined();
  });

  it("should handle merge flow by calling synthesize API when not cached", async () => {
    vi.spyOn(mockDB, "transaction").mockReturnValue({
      objectStore: (_name: string): IDBObjectStore => {
        const allReq = {
          onsuccess: null as (() => void) | null,
          result: [],
          addEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
          removeEventListener: vi.fn(),
        };
        const keysReq = {
          onsuccess: null as (() => void) | null,
          result: [],
          addEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
          removeEventListener: vi.fn(),
        };
        queueMicrotask(() => {
          allReq.onsuccess?.();
          keysReq.onsuccess?.();
        });
        return {
          getAll: () => allReq as object as IDBRequest<CachedProposal[]>,
          getAllKeys: () => keysReq as object as IDBRequest<IDBValidKey[]>,
          put: vi.fn(),
        } as object as IDBObjectStore;
      },
      addEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      removeEventListener: vi.fn(),
    } as object as IDBTransaction);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        label: "Synthesized Title",
        content: "Synthesized Content",
        reason: "Synthesized Reason",
      }),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(
      <TheGate pendingUpdates={pendingUpdates} existingNodes={existingNodes} />,
    );

    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    const mergeBtn = screen.getByText(
      (_, el) =>
        el?.tagName === "BUTTON" &&
        el.querySelector(".lucide-git-merge") !== null,
    );
    await act(async () => {
      fireEvent.click(mergeBtn);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/gate/synthesize",
      expect.any(Object),
    );
  });

  it("should handle tab switches back and forth", async () => {
    render(
      <TheGate pendingUpdates={pendingUpdates} existingNodes={existingNodes} />,
    );
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    // Mock fetch for audit-logs API when switching tabs
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        logs: [],
      }),
    } as Response);

    const historyBtn = screen.getByText("evolution_history");
    await act(async () => {
      fireEvent.click(historyBtn);
    });

    const gateBtn = screen.getByText("review_gate");
    await act(async () => {
      fireEvent.click(gateBtn);
    });
  });

  it("should log error when synthesis fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("Synthesis Error")),
    );

    render(
      <TheGate pendingUpdates={pendingUpdates} existingNodes={existingNodes} />,
    );
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    const mergeBtn = screen.getByText(
      (_, el) =>
        el?.tagName === "BUTTON" &&
        el.querySelector(".lucide-git-merge") !== null,
    );
    await act(async () => {
      fireEvent.click(mergeBtn);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Synthesis failed",
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });

  it("should log error when merge fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // First fetch: get cached, or mock synthesize
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        success: true,
        json: async () => ({
          success: true,
          label: "Synthesized Title",
          content: "Synthesized content info",
          reason: "Merge duplicate",
        }),
      } as unknown as Response)
      // Second fetch: confirm merge fails
      .mockRejectedValueOnce(new Error("Merge API Error"));

    render(
      <TheGate pendingUpdates={pendingUpdates} existingNodes={existingNodes} />,
    );
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    const mergeBtn = screen.getByText(
      (_, el) =>
        el?.tagName === "BUTTON" &&
        el.querySelector(".lucide-git-merge") !== null,
    );
    await act(async () => {
      fireEvent.click(mergeBtn);
    });

    const confirmBtn = screen.getByText("confirm_merge");
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Merge failed",
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });

  it("should trigger ComparisonModal callbacks: onClose, onAction, onStartMerge", async () => {
    render(
      <TheGate pendingUpdates={pendingUpdates} existingNodes={existingNodes} />,
    );
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    // Open Comparison Modal
    const compareBtn = screen.getByText("compare");
    await act(async () => {
      fireEvent.click(compareBtn);
    });

    // Verify modal is open (e.g. diff_view exists)
    expect(screen.getByText("diff_view")).toBeDefined();

    // Trigger onClose -> click Close button
    const closeBtn = screen.getByText("close");
    await act(async () => {
      fireEvent.click(closeBtn);
    });
    expect(screen.queryByText("diff_view")).toBeNull();
  });

  it("should trigger ComparisonModal onAction and onStartMerge from within TheGate context", async () => {
    render(
      <TheGate pendingUpdates={pendingUpdates} existingNodes={existingNodes} />,
    );
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    // 1. Trigger onAction (Approve) in Comparison Modal
    const compareBtn = screen.getByText("compare");
    await act(async () => {
      fireEvent.click(compareBtn);
    });

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const approveBtn = screen.getByText("approve");
    await act(async () => {
      fireEvent.click(approveBtn);
    });
    expect(fetch).toHaveBeenCalledWith("/api/gate", expect.any(Object));

    // 2. Trigger onStartMerge in Comparison Modal
    await act(async () => {
      fireEvent.click(screen.getByText("compare"));
    });

    vi.mocked(fetch).mockResolvedValueOnce({
      success: true,
      json: async () => ({
        success: true,
        label: "Synthesized Title",
        content: "Synthesized Content",
        reason: "Merge Reason",
      }),
    } as unknown as Response);

    const mergeBtn = screen.getByText("merge");
    await act(async () => {
      fireEvent.click(mergeBtn);
    });
    expect(screen.getByText("knowledge_synthesis")).toBeDefined();
  });

  it("should trigger MergeModal onClose callback", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      success: true,
      json: async () => ({
        success: true,
        label: "Synthesized Title",
        content: "Synthesized content info",
        reason: "Merge duplicate",
      }),
    } as unknown as Response);

    render(
      <TheGate pendingUpdates={pendingUpdates} existingNodes={existingNodes} />,
    );
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    const mergeBtn = screen.getByText(
      (_, el) =>
        el?.tagName === "BUTTON" &&
        el.querySelector(".lucide-git-merge") !== null,
    );
    await act(async () => {
      fireEvent.click(mergeBtn);
    });

    expect(screen.getByText("knowledge_synthesis")).toBeDefined();

    // Click cancel in MergeModal to trigger onClose -> setMergeData(null)
    const cancelBtn = screen.getByText("cancel");
    await act(async () => {
      fireEvent.click(cancelBtn);
    });

    expect(screen.queryByText("knowledge_synthesis")).toBeNull();
  });

  it("should log error when fetchLogs fails during tab loading", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Logs Fetch Error"));

    render(
      <TheGate pendingUpdates={pendingUpdates} existingNodes={existingNodes} />,
    );
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    const historyBtn = screen.getByText("evolution_history");
    await act(async () => {
      fireEvent.click(historyBtn);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to fetch audit logs",
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });

  it("should log error when handleAction fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Action Fetch Error"));

    render(
      <TheGate pendingUpdates={pendingUpdates} existingNodes={existingNodes} />,
    );
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    const approveBtn = screen.getByText(
      (_, el) =>
        el?.tagName === "BUTTON" && el.querySelector(".lucide-check") !== null,
    );
    await act(async () => {
      fireEvent.click(approveBtn);
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Action failed",
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });

  it("should handle undo failure and log error", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    // 1. Initial tab switch fetch success
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          logs: [
            {
              id: "log-1",
              label: "Item A",
              type: "APPROVED",
              status: "APPROVED",
              last_verified: "2026-06-03T12:00:00Z",
              properties: JSON.stringify({ content: "content" }),
              tags: [],
            },
          ],
        }),
      } as Response)
      // 2. Undo API fetch returns failure message
      .mockResolvedValueOnce({
        json: async () => ({ success: false, message: "Undo not allowed" }),
      } as Response);

    render(
      <TheGate pendingUpdates={pendingUpdates} existingNodes={existingNodes} />,
    );
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    // Switch to history
    await act(async () => {
      fireEvent.click(screen.getByText("evolution_history"));
    });

    // Click Undo
    await act(async () => {
      fireEvent.click(screen.getByText("undo"));
    });

    expect(window.alert).toHaveBeenCalledWith("Undo not allowed");

    // 3. Undo API fetch throws error
    vi.mocked(fetch).mockRejectedValueOnce(new Error("Undo Network Error"));

    // Click Undo again
    await act(async () => {
      fireEvent.click(screen.getByText("undo"));
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Undo action failed",
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it("should log error when fetchLogs fails during successful undo", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          logs: [
            {
              id: "log-1",
              label: "Item A",
              type: "APPROVED",
              status: "APPROVED",
              last_verified: "2026-06-03T12:00:00Z",
              properties: JSON.stringify({ content: "content" }),
              tags: [],
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        json: async () => ({ success: true }),
      } as Response)
      .mockRejectedValueOnce(new Error("Fetch logs failure"));

    render(
      <TheGate pendingUpdates={pendingUpdates} existingNodes={existingNodes} />,
    );
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    // Switch to history
    await act(async () => {
      fireEvent.click(screen.getByText("evolution_history"));
    });

    // Click Undo
    await act(async () => {
      fireEvent.click(screen.getByText("undo"));
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to fetch audit logs",
      expect.any(Error),
    );
    consoleErrorSpy.mockRestore();
  });

  it("should handle undo failure with default alert message when message is missing", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    vi.mocked(fetch)
      .mockResolvedValueOnce({
        json: async () => ({
          success: true,
          logs: [
            {
              id: "log-1",
              label: "Item A",
              type: "APPROVED",
              status: "APPROVED",
              last_verified: "2026-06-03T12:00:00Z",
              properties: JSON.stringify({ content: "content" }),
              tags: [],
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        json: async () => ({ success: false }),
      } as Response);

    render(
      <TheGate pendingUpdates={pendingUpdates} existingNodes={existingNodes} />,
    );
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    await act(async () => {
      fireEvent.click(screen.getByText("evolution_history"));
    });

    await act(async () => {
      fireEvent.click(screen.getByText("undo"));
    });

    expect(window.alert).toHaveBeenCalledWith("Failed to undo action");
    alertSpy.mockRestore();
  });

  it("should do nothing when handleAction response is not ok", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
    } as Response);

    render(
      <TheGate pendingUpdates={pendingUpdates} existingNodes={existingNodes} />,
    );
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    const approveBtn = screen.getByText(
      (_, el) =>
        el?.tagName === "BUTTON" && el.querySelector(".lucide-check") !== null,
    );
    const initialCalls = mockRefresh.mock.calls.length;
    await act(async () => {
      fireEvent.click(approveBtn);
    });

    expect(fetch).toHaveBeenCalledWith("/api/gate", expect.any(Object));
    expect(mockRefresh.mock.calls.length).toBe(initialCalls);
  });

  it("should do nothing when confirmMerge response is not ok", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({
        success: true,
        json: async () => ({
          success: true,
          label: "Synthesized Title",
          content: "Synthesized content info",
          reason: "Merge duplicate",
        }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: false,
      } as Response);

    render(
      <TheGate pendingUpdates={pendingUpdates} existingNodes={existingNodes} />,
    );
    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    const mergeBtn = screen.getByText(
      (_, el) =>
        el?.tagName === "BUTTON" &&
        el.querySelector(".lucide-git-merge") !== null,
    );
    await act(async () => {
      fireEvent.click(mergeBtn);
    });

    const confirmBtn = screen.getByText("confirm_merge");
    const initialCalls = mockRefresh.mock.calls.length;
    await act(async () => {
      fireEvent.click(confirmBtn);
    });

    expect(mockRefresh.mock.calls.length).toBe(initialCalls);
  });
});
