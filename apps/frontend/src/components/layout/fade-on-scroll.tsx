"use client";

import { useEffect, useState, useRef } from "react";

export default function FadeOnScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  const [opacity, setOpacity] = useState(1);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollingUp, setScrollingUp] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [navHeight, setNavHeight] = useState(0);

  useEffect(() => {
    const heading = document.getElementById("heading-1");

    const updateNavHeight = () => {
      if (heading) {
        setNavHeight(heading.offsetHeight);
      }
    };

    // Observe size changes using ResizeObserver
    const observer = new ResizeObserver(() => updateNavHeight());
    if (heading) observer.observe(heading);

    // Initial height check
    updateNavHeight();

    window.addEventListener("resize", updateNavHeight);
    return () => {
      window.removeEventListener("resize", updateNavHeight);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;

      const elementTop = ref.current.getBoundingClientRect().top;
      const fadeStart = navHeight + 100; // Start fading when reaching heading
      const fadeEnd = navHeight; // Fully faded after moving past
      const fadeRange = fadeStart - fadeEnd;

      // Detect scrolling direction
      const currentScrollY = window.scrollY;
      setScrollingUp(currentScrollY < lastScrollY);
      setLastScrollY(currentScrollY);

      let fadeFactor = Math.min(
        1,
        Math.max(0, (elementTop - fadeEnd) / fadeRange),
      );

      // 🚀 Make elements fade in faster when scrolling up
      if (scrollingUp && elementTop > navHeight) {
        fadeFactor = 1;
      }

      setOpacity(fadeFactor);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [navHeight, lastScrollY, scrollingUp]);

  return (
    <div
      ref={ref}
      style={{
        opacity,
        transition: scrollingUp
          ? "opacity 0.15s ease-in"
          : "opacity 0.4s ease-out",
      }}
    >
      {children}
    </div>
  );
}
