import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * True only in the browser after hydration, so locale/timezone-sensitive
 * formatting does not run during SSR (where the server TZ would leak).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
