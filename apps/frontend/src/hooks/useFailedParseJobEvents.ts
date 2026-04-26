"use client";

import { useEffect, useRef } from "react";
import type { FailedParseJobEvent } from "@eggosystem/types";
import { envConfig } from "@/configs/env";

const SSE_EVENT_NAME = "failed-parse-job";

/**
 * Subscribes to dashboard failed-parse background job events (SSE).
 * Uses cookie auth (`withCredentials`) like `clientApiFetch`.
 */
export const useFailedParseJobEvents = (
  onEvent: (event: FailedParseJobEvent) => void
): void => {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const url = `${envConfig.CLIENT_API_URL}/api/v1/dashboard/demos/failed/parse/events`;
    const eventSource = new EventSource(url, { withCredentials: true });

    const handler = (ev: MessageEvent<string>) => {
      try {
        const parsed = JSON.parse(ev.data) as FailedParseJobEvent;
        onEventRef.current(parsed);
      } catch {
        // ignore malformed payloads
      }
    };

    eventSource.addEventListener(SSE_EVENT_NAME, handler as EventListener);

    eventSource.onerror = () => {
      // Browser will retry automatically; no toast spam here.
    };

    return () => {
      eventSource.removeEventListener(SSE_EVENT_NAME, handler as EventListener);
      eventSource.close();
    };
  }, []);
};
