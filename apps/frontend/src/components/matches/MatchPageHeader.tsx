"use client";

import { useEffect, useState } from "react";

interface MatchPageHeaderProps {
  seasonId?: number | null;
}

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

export function MatchPageHeader({ seasonId }: MatchPageHeaderProps) {
  const minutesAgo = useMinutesAgo();

  const eyebrow =
    seasonId != null ? `◇◇ CS2 Season ${seasonId}` : "◇◇ Kanaliiga";
  const updatedLabel = minutesAgo === 0 ? "Just now" : `${minutesAgo} min ago`;

  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-kanaliiga-orange">
          {eyebrow}
        </p>
        <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground whitespace-nowrap">
          Updated {updatedLabel}
        </p>
      </div>
      <h1 className="text-4xl md:text-5xl">Recent Matches</h1>
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
