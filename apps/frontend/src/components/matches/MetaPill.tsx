import type { LucideIcon } from "lucide-react";

interface MetaPillProps {
  icon: LucideIcon;
  label: string;
}

export function MetaPill({ icon: Icon, label }: MetaPillProps) {
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.08em] text-muted-foreground">
      <Icon size={12} strokeWidth={1.5} />
      {label}
    </span>
  );
}
