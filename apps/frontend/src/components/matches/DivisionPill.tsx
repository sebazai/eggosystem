import { leagueColor, formatLeagueName } from "@/lib/matches/tiers";
import { cn } from "@/lib/utils";

interface DivisionPillProps {
  leagueName: string;
  compact?: boolean;
}

export function DivisionPill({
  leagueName,
  compact = false
}: DivisionPillProps) {
  const { color, bg, border } = leagueColor(leagueName);
  const label = formatLeagueName(leagueName);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-mono uppercase tracking-[0.12em]",
        compact
          ? "gap-1 px-2 py-px text-[9px]"
          : "gap-1.5 px-2 py-0.5 text-[10px]"
      )}
      style={{ color, borderColor: border, backgroundColor: bg }}
    >
      <span
        className={cn(
          "flex-shrink-0 rounded-full",
          compact ? "size-1" : "size-1.5"
        )}
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
