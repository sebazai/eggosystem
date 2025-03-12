import type React from "react";

export const TheContainer = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      {children}
    </div>
  );
};
