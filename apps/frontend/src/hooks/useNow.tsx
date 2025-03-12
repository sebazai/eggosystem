import { useState, useEffect } from "react";

export function useServerTime() {
  const [serverTime, setServerTime] = useState<number>(0);

  useEffect(() => {
    const fetchTime = async () => {
      try {
        const res = await fetch("/api/now");
        const data = await res.json();
        setServerTime(data);
      } catch (error) {
        console.error("Error fetching server time:", error);
      }
    };

    fetchTime();
  }, []);

  return serverTime;
}
