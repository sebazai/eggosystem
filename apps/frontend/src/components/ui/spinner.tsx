import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

const spinnerVariants = cva("animate-spin rounded-full border-t-transparent", {
  variants: {
    size: {
      sm: "h-4 w-4 border-2",
      default: "h-6 w-6 border-2",
      lg: "h-8 w-8 border-2",
      xl: "h-12 w-12 border-4"
    }
  },
  defaultVariants: {
    size: "default"
  }
});

interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string;
}

export function Spinner({ size, className }: SpinnerProps) {
  return (
    <div
      className={cn(
        spinnerVariants({ size }),
        "border-muted-foreground/20 border-r-muted-foreground/40",
        className
      )}
    />
  );
}
