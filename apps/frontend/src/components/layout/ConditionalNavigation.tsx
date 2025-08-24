"use client";

import { usePathname } from "next/navigation";
import { Navigation } from "./Navigation";

export function ConditionalNavigation() {
  const pathname = usePathname();

  // Don't render navigation on the homepage
  if (pathname === "/") {
    return null;
  }

  return <Navigation />;
}
