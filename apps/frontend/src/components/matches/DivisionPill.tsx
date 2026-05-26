import { TIERS, type TierKey } from "@/lib/matches/tiers";

interface DivisionPillProps {
  tierKey: TierKey;
}

export function DivisionPill({ tierKey }: DivisionPillProps) {
  const color = `hsl(var(--tier-${tierKey}))`;
  const bgColor = `hsl(var(--tier-${tierKey}) / 0.16)`;
  const borderColor = `hsl(var(--tier-${tierKey}) / 0.5)`;
  const label = TIERS[tierKey].label;

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]"
      style={{ color, borderColor, backgroundColor: bgColor }}
    >
      <span
        className="size-1.5 flex-shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {label}
    </span>
  );
}
