import { cn } from "@/lib/utils";
import { numericTierToKey, tierCssColor } from "@/lib/matches/tiers";

export function TierDot({
  tier,
  className
}: {
  tier: number;
  className?: string;
}) {
  const color = tierCssColor(numericTierToKey(tier));

  return (
    <span
      className={cn(
        "inline-block size-2 rounded-full flex-shrink-0",
        className
      )}
      style={{ backgroundColor: color }}
      aria-label={`Tier ${tier}`}
    />
  );
}
