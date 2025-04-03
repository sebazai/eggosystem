import { expressFetcher } from "@/lib/utils";
import { useState, useEffect } from "react";

export function useServerTime() {
  const [serverTime, setServerTime] = useState<number>(0);

  useEffect(() => {
    const fetchTime = async () => {
      try {
        const res = await expressFetcher<{
          now: number;
        }>("/api/v1/now");
        setServerTime(res.now);
      } catch (error) {
        console.error("Error fetching server time:", error);
      }
    };

    fetchTime();
  }, []);

  return serverTime;
}
