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
    <div className={cn("min-h-fit rounded-xl bg-card", classNames)}>
      <div className="max-w-[1920px] mx-auto">{children}</div>
    </div>
  );
};
