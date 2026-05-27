import type { ReactNode } from "react";

interface DateGroupProps {
  date: string;
  count: number;
  children: ReactNode;
}

function formatDateGroupHeading(dateStr: string): string {
  const [year, monthStr, dayStr] = dateStr.split("-");
  const month = parseInt(monthStr ?? "1", 10);
  const day = parseInt(dayStr ?? "1", 10);
  const date = new Date(parseInt(year ?? "2000", 10), month - 1, day);
  const mon = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
  return `${mon} ${day} · ${year}`;
}

export function DateGroup({ date, count, children }: DateGroupProps) {
  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="whitespace-nowrap text-sm uppercase tracking-[0.04em]">
          {formatDateGroupHeading(date)}
        </h2>
        <hr className="flex-1 border-t border-white/8" />
        <span className="whitespace-nowrap font-mono text-[10px] text-muted-foreground">
          {count} {count === 1 ? "match" : "matches"}
        </span>
      </div>
      {children}
    </div>
  );
}
