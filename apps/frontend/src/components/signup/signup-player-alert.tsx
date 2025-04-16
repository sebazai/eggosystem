import { CircleAlert, Info, OctagonX } from "lucide-react";
import type React from "react";

export const SignupPlayerNotification = ({
  type = "alert",
  children
}: {
  type?: "alert" | "warning" | "info";
  children: React.ReactNode;
}) => {
  switch (type) {
    case "alert":
      return (
        <span className="text-xs flex gap-2 items-center py-1">
          <OctagonX className="h-4 w-4 text-red-500" /> {children}
        </span>
      );
    case "warning":
      return (
        <span className="text-xs flex gap-2 items-center py-1">
          <CircleAlert className="h-4 w-4 text-yellow-500" /> {children}
        </span>
      );
    case "info":
      return (
        <span className="text-xs flex gap-2 items-center py-1">
          <Info className="h-4 w-4 text-blue-500" /> {children}
        </span>
      );
  }
};
