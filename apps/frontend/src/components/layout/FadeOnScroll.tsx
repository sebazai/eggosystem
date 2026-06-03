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
  const stickyElementRef = useRef<number>(0);

  useEffect(() => {
    stickyElementRef.current = stickyElementBottom;
  }, [stickyElementBottom]);

  useEffect(() => {
    const updateStickyAnchor = () => {
      const heading = document.getElementById("sticky-header");
      if (!heading) return;

      const nextBottom = heading.getBoundingClientRect().bottom * 0.2;
      if (nextBottom !== stickyElementRef.current) {
        setStickyElementBottom(nextBottom);
      }
    };

    updateStickyAnchor();
    window.addEventListener("resize", updateStickyAnchor);
    window.addEventListener("scroll", updateStickyAnchor, { passive: true });

    return () => {
      window.removeEventListener("resize", updateStickyAnchor);
      window.removeEventListener("scroll", updateStickyAnchor);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;

      const isLandscapeMobile =
        window.innerWidth <= 768 && window.innerHeight < window.innerWidth;
      if (isLandscapeMobile) {
        setOpacity(1);
        return;
      }

      const elementTop = ref.current.getBoundingClientRect().top;
      const viewportHeight = window.innerHeight;
      const fadeStart = stickyElementBottom + viewportHeight * 0.1;
      const fadeEnd = stickyElementBottom - viewportHeight * 0.2;
      const fadeRange = fadeStart - fadeEnd;

      const fadeFactor = Math.min(
        1,
        Math.max(0, (elementTop - fadeEnd) / fadeRange)
      );

      setOpacity(fadeFactor);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [stickyElementBottom]);

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
