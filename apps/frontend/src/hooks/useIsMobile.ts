"use client";

import { useEffect, useState } from "react";

export const useIsMobile = (passMobile?: boolean) => {
  const [isMobile, setIsMobile] = useState(passMobile ?? false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return isMobile;
};
