"use client";

import { useEffect, useState, useRef } from "react";

export default function FadeOnScroll({
  children
}: {
  children: React.ReactNode;
}) {
  const [opacity, setOpacity] = useState(1);
  const ref = useRef<HTMLDivElement>(null);
  const [stickyElementBottom, setStickyElementBottom] = useState(0);
  const [stickyElementHeight, setStickyElementHeight] = useState(0);

  useEffect(() => {
    const navigation = document.getElementById("navigation");
    const heading = document.getElementById("sticky-header");

    const updateNavHeight = () => {
      if (heading) {
        const boundingRect = heading.getBoundingClientRect();
        setStickyElementBottom(boundingRect.bottom * 0.4);
        setStickyElementHeight(boundingRect.height);
      }
    };

    // Observe size changes using ResizeObserver
    const observer = new ResizeObserver(() => updateNavHeight());
    if (navigation) observer.observe(navigation);

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
      const fadeStart = stickyElementBottom + 100;
      const fadeEnd = stickyElementBottom;
      const fadeRange = fadeStart - fadeEnd;

      const fadeFactor = Math.min(
        1,
        Math.max(0, (elementTop - fadeEnd) / fadeRange)
      );

      setOpacity(fadeFactor);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [stickyElementBottom, stickyElementHeight]);

  return (
    <div
      ref={ref}
      style={{
        opacity,
        transition: "opacity 0.3s ease-in"
      }}
    >
      {children}
    </div>
  );
}
