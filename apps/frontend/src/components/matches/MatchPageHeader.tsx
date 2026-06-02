"use client";

import { useEffect, useState } from "react";

function useMinutesAgo(): number {
  const [loadedAt] = useState(() => Date.now());
  const [minutesAgo, setMinutesAgo] = useState(0);

  useEffect(() => {
    const tick = () =>
      setMinutesAgo(Math.floor((Date.now() - loadedAt) / 60000));
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [loadedAt]);

  return minutesAgo;
}

export function MatchPageHeader() {
  const minutesAgo = useMinutesAgo();

  const updatedLabel = minutesAgo === 0 ? "Just now" : `${minutesAgo} min ago`;

  return (
    <div className="mb-6 min-w-0">
      <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
        Loaded {updatedLabel}
      </p>
      <h1 className="tracking-[0.02em] text-4xl md:text-5xl">Match History</h1>
      <hr
        className="mt-4"
        style={{
          border: "none",
          borderTop: "1px solid var(--kanaliiga-orange)",
          opacity: 0.85
        }}
      />
    </div>
  );
}
