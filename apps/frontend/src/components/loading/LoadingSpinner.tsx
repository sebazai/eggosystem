"use client";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "default" | "lg" | "xl";
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({
  size = "default",
  text,
  className,
  fullScreen = false
}: LoadingSpinnerProps) {
  const containerClasses = cn(
    "flex items-center justify-center",
    fullScreen ? "min-h-[70vh]" : "py-8",
    className
  );

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-4">
        <Spinner size={size} />
        {text && (
          <p className="text-sm text-muted-foreground text-center">{text}</p>
        )}
      </div>
    </div>
  );
}
