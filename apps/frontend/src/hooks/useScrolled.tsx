"use client";

import { useEffect, useState } from "react";

export const useScrolled = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrolledTo, setIsScrolledTo] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
      setIsScrolledTo(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return { isScrolled, scrolledTo };
};
