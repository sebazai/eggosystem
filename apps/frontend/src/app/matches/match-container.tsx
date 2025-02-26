"use client";

import { Suspense, useEffect, useState } from "react";

export default function OrganizationContainer({
  children
}: {
  children: React.ReactNode;
}) {
  const [navHeight, setNavHeight] = useState<number | null>(null);

  useEffect(() => {
    const nav = document.getElementById("navigation");
    if (!nav) return;

    const updateNavHeight = () => {
      const newHeight = nav.offsetHeight;
      if (newHeight !== navHeight) {
        setNavHeight(newHeight); // Trigger re-render
      }
    };

    // Initial set
    updateNavHeight();

    // Observe changes
    const observer = new ResizeObserver(updateNavHeight);
    observer.observe(nav);

    return () => observer.disconnect();
  }, [navHeight]); // Dependency ensures re-render

  return (
    <Suspense>
      <title>Recent matches - Kanahub</title>
      {navHeight !== null && ( // Ensure it renders only after we get height
        <div
          id="sticky-header"
          className="sticky z-30 backdrop-blur-xs transition-[top] duration-300 ease-in-out"
          style={{ top: `${navHeight}px` }}
        >
          <h1 className="pb-2">Recent matches</h1>
        </div>
      )}
      <div className="py-6">{children}</div>
    </Suspense>
  );
}
