import { expressFetcher } from "@/lib/utils";
import { useState, useEffect } from "react";

export function useServerTime() {
  const [serverTime, setServerTime] = useState<number>(0);

  useEffect(() => {
    const fetchTime = async () => {
      const res = await expressFetcher<{
        now: number;
      }>("/api/v1/now");
      setServerTime(res.now);
    };

    fetchTime();
  }, []);

  return serverTime;
}
