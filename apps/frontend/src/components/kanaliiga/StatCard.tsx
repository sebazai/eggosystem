import { cn } from "@/lib/utils";

/**
 * Stat card — monospace numeral, small-caps label.
 * Hover tints to light-brown per brand guidelines.
 */
export function StatCard({
  value,
  label,
  className
}: {
  value: string | number;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius)] border bg-card px-4 py-3 transition-colors",
        "hover:bg-kanaliiga-light-brown/30",
        className
      )}
    >
      <div className="font-body text-3xl font-bold tabular-nums text-kanaliiga-orange">
        {value}
      </div>
      <div className="font-headings text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
