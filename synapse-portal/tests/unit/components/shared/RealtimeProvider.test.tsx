import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, act, cleanup } from "@testing-library/react";
import RealtimeProvider, {
  useRealtime,
} from "@/components/shared/RealtimeProvider";

// Mock EventSource
interface MockEventSourceInstance {
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: (() => void) | null;
  close: () => void;
  url: string;
}

let activeInstance: MockEventSourceInstance | null = null;

class MockEventSource {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  close = vi.fn();
  constructor(public url: string) {
    activeInstance = [this][0];
  }
}

vi.stubGlobal("EventSource", MockEventSource);

// Mock global Notification
const mockRequestPermission = vi.fn().mockResolvedValue("granted");
class MockNotification {
  static permission = "default";
  static requestPermission = mockRequestPermission;
  static instances: MockNotification[] = [];
  onclick: (() => void) | null = null;

  constructor(
    public title: string,
    public options?: NotificationOptions,
  ) {
    MockNotification.instances.push(this);
  }
}
vi.stubGlobal("Notification", MockNotification);

// Mock window.focus and window.location
const mockFocus = vi.fn();
vi.stubGlobal("focus", mockFocus);

// Redefine window.location to allow writes in tests
const mockLocation = { href: "" };
Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
  configurable: true,
});

vi.mock("@/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string | number>) => {
      if (key === "new_proposal_msg" && params) {
        return `New proposal msg: ${params.label} - ${params.type}`;
      }
      if (key === "proposal_status_msg" && params) {
        return `Proposal status msg: ${params.action}`;
      }
      return key;
    },
  }),
}));

// Test helper component to consume hook
function Consumer({
  onRender,
}: {
  onRender: (context: ReturnType<typeof useRealtime>) => void;
}) {
  const context = useRealtime();
  onRender(context);
  return <div>Pending: {context.pendingCount}</div>;
}

describe("components/shared/RealtimeProvider", () => {
  beforeEach(() => {
    cleanup();
    activeInstance = null;
    MockNotification.instances = [];
    MockNotification.permission = "default";
    mockRequestPermission.mockClear();
    mockFocus.mockClear();
    mockLocation.href = "";
    vi.useFakeTimers();
  });

  it("should throw error if useRealtime is used outside Provider", () => {
    expect(() => {
      render(<Consumer onRender={() => {}} />);
    }).toThrow("useRealtime must be used within a RealtimeProvider");
  });

  it("should render children and connect to EventSource", () => {
    render(
      <RealtimeProvider>
        <div>Child Content</div>
      </RealtimeProvider>,
    );

    expect(screen.getByText("Child Content")).toBeDefined();
    expect(activeInstance).not.toBeNull();
    expect(activeInstance?.url).toBe("/api/updates");
  });

  it("should update pendingCount on message: proposal:created", () => {
    let capturedContext: ReturnType<typeof useRealtime> | undefined;

    render(
      <RealtimeProvider>
        <Consumer
          onRender={(c) => {
            capturedContext = c;
          }}
        />
      </RealtimeProvider>,
    );

    expect(capturedContext?.pendingCount).toBe(0);

    // Simulate SSE message
    act(() => {
      activeInstance?.onmessage?.({
        data: JSON.stringify({
          pendingCount: 3,
          type: "proposal:created",
          proposal: { label: "Test Proposal", type: "add" },
        }),
      } as MessageEvent);
    });

    expect(capturedContext?.pendingCount).toBe(3);
  });

  it("should update pendingCount on message: proposal:updated", () => {
    let capturedContext: ReturnType<typeof useRealtime> | undefined;
    render(
      <RealtimeProvider>
        <Consumer
          onRender={(c) => {
            capturedContext = c;
          }}
        />
      </RealtimeProvider>,
    );

    expect(capturedContext?.pendingCount).toBe(0);

    act(() => {
      activeInstance?.onmessage?.({
        data: JSON.stringify({
          pendingCount: 1,
          type: "proposal:updated",
          action: "merged",
        }),
      } as MessageEvent);
    });

    expect(capturedContext?.pendingCount).toBe(1);
  });

  it("should attempt reconnect on error", () => {
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});
    render(
      <RealtimeProvider>
        <div>Child</div>
      </RealtimeProvider>,
    );

    const firstInstance = activeInstance;
    expect(firstInstance).not.toBeNull();

    act(() => {
      firstInstance?.onerror?.();
    });

    expect(firstInstance?.close).toHaveBeenCalled();
    expect(consoleWarnSpy).toHaveBeenCalled();

    // Fast forward reconnect timer (5s)
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    // A new instance should be created
    expect(activeInstance).not.toBeNull();
    expect(activeInstance).not.toBe(firstInstance);
    consoleWarnSpy.mockRestore();
  });

  it("should support subscribing to updates and triggering refresh", () => {
    let capturedContext: ReturnType<typeof useRealtime> | undefined;
    render(
      <RealtimeProvider>
        <Consumer
          onRender={(c) => {
            capturedContext = c;
          }}
        />
      </RealtimeProvider>,
    );

    const mockCallback = vi.fn();
    let unsubscribe: (() => void) | undefined;
    act(() => {
      unsubscribe = capturedContext?.subscribeToUpdates(mockCallback);
    });

    act(() => {
      capturedContext?.triggerRefresh();
    });
    expect(mockCallback).toHaveBeenCalledTimes(1);

    // Unsubscribe
    act(() => {
      unsubscribe?.();
    });
    act(() => {
      capturedContext?.triggerRefresh();
    });
    expect(mockCallback).toHaveBeenCalledTimes(1); // Should not increase
  });

  it("should request Notification permission on mount if default", () => {
    MockNotification.permission = "default";
    render(
      <RealtimeProvider>
        <div>Child</div>
      </RealtimeProvider>,
    );
    expect(mockRequestPermission).toHaveBeenCalled();
  });

  it("should trigger Notification and handle onclick for proposal:created event", () => {
    MockNotification.permission = "granted";
    render(
      <RealtimeProvider>
        <div>Child</div>
      </RealtimeProvider>,
    );

    act(() => {
      activeInstance?.onmessage?.({
        data: JSON.stringify({
          pendingCount: 2,
          type: "proposal:created",
          proposal: { label: "Awesome Proposal", type: "new-type" },
        }),
      } as MessageEvent);
    });

    expect(MockNotification.instances.length).toBe(1);
    const notif = MockNotification.instances[0];
    expect(notif.title).toContain("new_proposal_title");
    expect(notif.options?.body).toContain("Awesome Proposal");
    expect(notif.options?.icon).toBe("/favicon.ico");

    // Test click behavior
    expect(mockFocus).not.toHaveBeenCalled();
    expect(mockLocation.href).toBe("");
    act(() => {
      notif.onclick?.();
    });
    expect(mockFocus).toHaveBeenCalled();
    expect(mockLocation.href).toBe("/gate");
  });

  it("should trigger Notification and handle onclick for proposal:updated event", () => {
    MockNotification.permission = "granted";
    render(
      <RealtimeProvider>
        <div>Child</div>
      </RealtimeProvider>,
    );

    act(() => {
      activeInstance?.onmessage?.({
        data: JSON.stringify({
          pendingCount: 1,
          type: "proposal:updated",
          action: "approved",
        }),
      } as MessageEvent);
    });

    expect(MockNotification.instances.length).toBe(1);
    const notif = MockNotification.instances[0];
    expect(notif.title).toContain("proposal_status_title");
    expect(notif.options?.body).toContain("approved");

    // Test click behavior
    expect(mockFocus).not.toHaveBeenCalled();
    act(() => {
      notif.onclick?.();
    });
    expect(mockFocus).toHaveBeenCalled();
  });
});
