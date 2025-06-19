"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { createNextUrl } from "@/lib/utils";

export const ChickenTest = () => {
  // Simplified version with no SSR concerns since it's in a container
  const [position, setPosition] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const chickenRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Get container width for animation
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.offsetWidth;
    const chickenWidth = 104; // Width of chicken image

    // Start from right edge
    setPosition(containerWidth);

    let startTime: number | null = null;
    const walkSpeed = 80; // px per second

    // Animation function
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      // Move chicken from right to left
      let newPosition = containerWidth - (elapsed * walkSpeed) / 1000;

      // Reset position when chicken goes off screen
      if (newPosition < -chickenWidth) {
        startTime = timestamp;
        newPosition = containerWidth;
      }

      setPosition(newPosition);
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    // Clean up animation on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <div
        ref={chickenRef}
        className="absolute bottom-0 cursor-pointer"
        style={{ left: `${position}px` }}
      >
        <Image
          src={createNextUrl("/images/chicken2.gif")}
          width={104}
          height={104}
          alt="Walking chicken"
          priority
        />
      </div>
    </div>
  );
};

export default ChickenTest;
