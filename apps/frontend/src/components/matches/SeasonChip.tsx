import { cn } from "@/lib/utils";

interface SeasonChipProps {
  label: string;
  mini?: boolean;
}

export function SeasonChip({ label, mini = false }: SeasonChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-kanaliiga-light-brown/40 bg-kanaliiga-light-brown/15 font-mono font-bold tracking-[0.08em] text-kanaliiga-light-brown",
        mini ? "px-1.5 py-px text-[9px]" : "px-2 py-0.5 text-[10px]"
      )}
    >
      {label}
    </span>
  );
}
