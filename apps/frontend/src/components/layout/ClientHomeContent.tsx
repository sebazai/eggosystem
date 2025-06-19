"use client";

import { useEffect } from "react";

interface ClientHomeContentProps {
  children: React.ReactNode;
}

export const ClientHomeContent = ({ children }: ClientHomeContentProps) => {
  // Debug log to confirm this component is rendering
  useEffect(() => {
    console.log("ClientHomeContent mounted");
  }, []);

  return <>{children}</>;
};

export default ClientHomeContent;
