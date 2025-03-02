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
  const stickyElementRef = useRef<number>(0); // Persist value across renders

  useEffect(() => {
    // Save the current value before the component re-renders
    stickyElementRef.current = stickyElementBottom;
  }, [stickyElementBottom]);

  useEffect(() => {
    const navigation = document.getElementById("navigation");

    const updateNavHeight = () => {
      const heading = document.getElementById("sticky-header");
      if (heading) {
        const boundingRect = heading.getBoundingClientRect();
        if (boundingRect.bottom * 0.2 !== stickyElementRef.current) {
          // Experimental.
          setStickyElementBottom(boundingRect.bottom * 0.2);
        }
      }
    };

    // Observe size changes using ResizeObserver
    const observer = new ResizeObserver(() => updateNavHeight());
    if (navigation) observer.observe(navigation);

    // Initial height check
    updateNavHeight();

    window.addEventListener("resize", updateNavHeight);
    window.addEventListener("scroll", updateNavHeight);
    return () => {
      window.removeEventListener("resize", updateNavHeight);
      window.removeEventListener("scroll", updateNavHeight);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      // is landscape mobile
      const isLandscapeMobile =
        window.innerWidth <= 768 && window.innerHeight < window.innerWidth;
      if (isLandscapeMobile) return;

      const elementTop = ref.current.getBoundingClientRect().top;
      const viewportHeight = window.innerHeight;

      // Define fade range dynamically based on viewport height
      const fadeStart = stickyElementBottom + viewportHeight * 0.1; // 10% from the bottom
      const fadeEnd = stickyElementBottom - viewportHeight * 0.2; // 20% above the bottom
      const fadeRange = fadeStart - fadeEnd;

      const fadeFactor = Math.min(
        1,
        Math.max(0, (elementTop - fadeEnd) / fadeRange)
      );

      setOpacity(fadeFactor);
    };

    const handleResize = () => {
      handleScroll(); // Recalculate on resize to adapt to new viewport height
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
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
