import { describe, it, expect, vi } from "vitest";
import { useIsMounted } from "@/lib/hooks";
import { useSyncExternalStore } from "react";

vi.mock("react", () => ({
  useSyncExternalStore: vi.fn((subscribe, getSnapshot, _getServerSnapshot) => {
    // Return the server snapshot to mock SSR, or client snapshot to mock hydrated state
    return getSnapshot();
  }),
}));

describe("lib/hooks - useIsMounted", () => {
  it("should invoke useSyncExternalStore with correct snapshot functions", () => {
    const isMounted = useIsMounted();

    expect(useSyncExternalStore).toHaveBeenCalled();
    expect(isMounted).toBe(true);

    const callArgs = vi.mocked(useSyncExternalStore).mock.calls[0];
    const subscribe = callArgs[0];
    const getSnapshot = callArgs[1];
    const getServerSnapshot = callArgs[2];

    expect(typeof subscribe).toBe("function");
    expect(getSnapshot()).toBe(true);
    expect(getServerSnapshot?.()).toBe(false);

    // Call subscribe to cover the empty unsubscriber function returning void
    const unsubscribe = subscribe(() => {});
    expect(typeof unsubscribe).toBe("function");
    expect(unsubscribe()).toBeUndefined();
  });
});
