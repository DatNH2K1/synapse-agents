import { useSyncExternalStore } from "react";

/**
 * Hook to detect if the component is mounted on the client.
 * Uses useSyncExternalStore for hydration-safe detection without triggering cascading renders.
 */
export function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
