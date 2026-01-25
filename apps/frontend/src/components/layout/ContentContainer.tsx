import { cn } from "@/lib/utils";
import type React from "react";

export const ContentContainer = ({
  children,
  classNames
}: {
  children: React.ReactNode;
  classNames?: string;
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-center min-h-[50vh]",
        classNames
      )}
    >
      {children}
    </div>
  );
};
