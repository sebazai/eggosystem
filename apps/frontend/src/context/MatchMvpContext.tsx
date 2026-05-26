"use client";

import { expressFetcher } from "@/lib/utils";
import type { MatchMvp } from "@eggosystem/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefCallback,
  type ReactNode
} from "react";

interface MatchMvpsResponse {
  mvps: MatchMvp[];
}

interface MatchMvpContextValue {
  getMvp: (matchId: number) => MatchMvp | null | undefined;
  isMvpLoading: (matchId: number) => boolean;
  registerVisible: (matchId: number) => void;
}

const MatchMvpContext = createContext<MatchMvpContextValue | null>(null);

const DEBOUNCE_MS = 150;
const BATCH_SIZE = 50;
const PREFETCH_ROOT_MARGIN = "200px";

interface MatchMvpProviderProps {
  children: ReactNode;
  initialCache?: Map<number, MatchMvp | null>;
}

export function MatchMvpProvider({
  children,
  initialCache
}: MatchMvpProviderProps) {
  const [cache, setCache] = useState<Map<number, MatchMvp | null>>(
    () => initialCache ?? new Map()
  );
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set());
  const pendingRef = useRef<Set<number>>(new Set());
  const fetchedRef = useRef<Set<number>>(
    new Set(initialCache ? [...initialCache.keys()] : [])
  );
  const inFlightRef = useRef<Set<number>>(new Set());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushPending = useCallback(async () => {
    const toFetch = [...pendingRef.current].filter(
      (id) => !fetchedRef.current.has(id) && !inFlightRef.current.has(id)
    );
    pendingRef.current.clear();

    if (toFetch.length === 0) return;

    for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
      const chunk = toFetch.slice(i, i + BATCH_SIZE);
      chunk.forEach((id) => inFlightRef.current.add(id));

      try {
        const response = await expressFetcher<MatchMvpsResponse>(
          `/api/v1/matches/mvps?match_ids=${chunk.join(",")}`
        );

        setCache((prev) => {
          const next = new Map(prev);
          const returned = new Set(response.mvps.map((m) => m.match_id));
          for (const mvp of response.mvps) {
            next.set(mvp.match_id, mvp);
            fetchedRef.current.add(mvp.match_id);
          }
          for (const id of chunk) {
            if (!returned.has(id)) {
              next.set(id, null);
              fetchedRef.current.add(id);
            }
          }
          return next;
        });
        setLoadingIds((prev) => {
          const next = new Set(prev);
          chunk.forEach((id) => next.delete(id));
          return next;
        });
      } finally {
        chunk.forEach((id) => inFlightRef.current.delete(id));
      }
    }
  }, []);

  const scheduleFetch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      void flushPending();
    }, DEBOUNCE_MS);
  }, [flushPending]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const registerVisible = useCallback(
    (matchId: number) => {
      if (fetchedRef.current.has(matchId)) return;
      pendingRef.current.add(matchId);
      setLoadingIds((prev) => new Set(prev).add(matchId));
      scheduleFetch();
    },
    [scheduleFetch]
  );

  const isMvpLoading = useCallback(
    (matchId: number) => loadingIds.has(matchId),
    [loadingIds]
  );

  const getMvp = useCallback(
    (matchId: number) => {
      if (!cache.has(matchId)) return undefined;
      return cache.get(matchId) ?? null;
    },
    [cache]
  );

  const value = useMemo(
    () => ({ getMvp, isMvpLoading, registerVisible }),
    [getMvp, isMvpLoading, registerVisible]
  );

  return (
    <MatchMvpContext.Provider value={value}>
      {children}
    </MatchMvpContext.Provider>
  );
}

export function useMatchMvp(matchId: number) {
  const ctx = useContext(MatchMvpContext);
  if (!ctx) {
    throw new Error("useMatchMvp must be used within MatchMvpProvider");
  }

  const observerRef = useRef<IntersectionObserver | null>(null);

  const { registerVisible } = ctx;

  const visibilityRef: RefCallback<HTMLElement> = useCallback(
    (node) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            registerVisible(matchId);
          }
        },
        { rootMargin: PREFETCH_ROOT_MARGIN }
      );
      observerRef.current.observe(node);
    },
    [registerVisible, matchId]
  );

  useEffect(() => {
    return () => observerRef.current?.disconnect();
  }, []);

  return {
    seriesMvp: ctx.getMvp(matchId),
    isMvpLoading: ctx.isMvpLoading(matchId),
    visibilityRef
  };
}

/** Test-only helper to register visibility without IntersectionObserver. */
export function useMatchMvpContext() {
  const ctx = useContext(MatchMvpContext);
  if (!ctx) {
    throw new Error("useMatchMvpContext must be used within MatchMvpProvider");
  }
  return ctx;
}
