import { cn } from "@/lib/utils";

/**
 * The Kanaliiga signature separator — 1px orange rule between landing sections.
 * Don't swap for the default shadcn Separator in marketing contexts.
 */
export function SectionSeparator({ className }: { className?: string }) {
  return (
    <hr
      className={cn(
        "h-px w-full border-0 bg-kanaliiga-orange my-3 md:my-6",
        className
      )}
    />
  );
}
