import { cn } from "@/lib/utils";
import { DIVISIONS } from "@/lib/calendar-utils";

export function TierDot({
  tier,
  className
}: {
  tier: number;
  className?: string;
}) {
  const color = DIVISIONS[tier]?.color ?? "#6b7280";

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
