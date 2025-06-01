import { CircleAlert, Info, OctagonX } from "lucide-react";
import type React from "react";

export const SignupPlayerNotification = ({
  type = "alert",
  children,
  ...props
}: {
  type?: "alert" | "warning" | "info";
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLSpanElement>) => {
  switch (type) {
    case "alert":
      return (
        <span className="text-xs flex gap-2 items-center py-1" {...props}>
          <OctagonX className="min-h-4 min-w-4 h-4 w-4 text-red-500" />{" "}
          {children}
        </span>
      );
    case "warning":
      return (
        <span className="text-xs flex gap-2 items-center py-1" {...props}>
          <CircleAlert className="min-h-4 min-w-4 h-4 w-4 text-yellow-500" />{" "}
          {children}
        </span>
      );
    case "info":
      return (
        <span className="text-xs flex gap-2 items-center py-1" {...props}>
          <Info className="min-h-4 min-w-4 h-4 w-4 text-blue-500" /> {children}
        </span>
      );
  }
};
