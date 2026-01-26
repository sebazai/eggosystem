"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FantasyTeamStatCardProps = {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  variant?: "default" | "success" | "danger";
  subtitle?: string;
};

export function FantasyTeamStatCard({
  label,
  value,
  icon,
  variant = "default",
  subtitle
}: FantasyTeamStatCardProps) {
  const variantStyles = {
    default: "bg-neutral-900/50 border-neutral-800",
    success: "bg-neutral-900/50 border-green-800/50",
    danger: "bg-neutral-900/50 border-red-800/50"
  };

  return (
    <div
      className={cn(
        "relative p-3 rounded-lg border overflow-hidden",
        variantStyles[variant]
      )}
    >
      <div className="relative">
        {icon && (
          <div className="flex items-center gap-1.5 mb-0.5">
            {icon}
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
              {label}
            </span>
          </div>
        )}
        {!icon && (
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5 block">
            {label}
          </span>
        )}
        <div className="text-xl font-black text-white">{value}</div>
        {subtitle && (
          <p className="text-[9px] text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
