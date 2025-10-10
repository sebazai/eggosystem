import { cn } from "@/lib/utils";
import type React from "react";

export const CardContainer = ({
  children,
  classNames
}: {
  children: React.ReactNode;
  classNames?: string;
}) => {
  return (
    <div className={cn("min-h-fit bg-card", classNames)}>
      <div className="max-w-screen-2xl mx-auto">{children}</div>
    </div>
  );
};
