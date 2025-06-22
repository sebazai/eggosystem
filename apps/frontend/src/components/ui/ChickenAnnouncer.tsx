"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { cn, createNextUrl } from "@/lib/utils";

interface ChickenAnnouncerProps {
  message?: string;
  targetUrl?: string;
  showDelay?: number; // Delay in ms before showing the chicken
  autoHideAfter?: number; // Auto-hide after this many ms (if provided)
  walkSpeed?: number; // Walking speed in pixels per second
  onChickenClick?: () => void; // Callback when chicken is clicked
}

export const ChickenAnnouncer = ({
  message = "NEW FEATURES NEW FEATURES",
  targetUrl = "/new-features",
  showDelay = 1000,
  autoHideAfter,
  walkSpeed = 50, // Default walking speed
  onChickenClick
}: ChickenAnnouncerProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isBubbleVisible, setIsBubbleVisible] = useState(false);
  const [position, setPosition] = useState(0);
  const chickenRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const router = useRouter();

  // Handle initial position setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPosition(window.innerWidth);
    }
  }, []);

  // Handle chicken visibility and bubble visibility
  useEffect(() => {
    // Show the chicken after delay
    const showTimer = setTimeout(() => {
      setIsVisible(true);

      // Show bubble shortly after chicken appears
      setTimeout(() => {
        setIsBubbleVisible(true);
      }, 800);
    }, showDelay);

    // Auto-hide if specified
    let hideTimer: NodeJS.Timeout | undefined;
    if (autoHideAfter && autoHideAfter > 0) {
      hideTimer = setTimeout(() => {
        setIsBubbleVisible(false);
        setTimeout(() => setIsVisible(false), 500);
      }, autoHideAfter);
    }

    return () => {
      clearTimeout(showTimer);
      if (hideTimer) clearTimeout(hideTimer);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [showDelay, autoHideAfter]);

  // Handle animation
  useEffect(() => {
    if (!isVisible) return;

    const screenWidth = window.innerWidth;
    const chickenWidth = 104; // Fixed width of chicken image

    let startTime: number | null = null;

    // Animation function for walking from right to left
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      // Move chicken from right to left
      let newPosition = screenWidth - (elapsed * walkSpeed) / 1000;

      // Reset position when chicken goes off screen
      if (newPosition < -chickenWidth) {
        startTime = timestamp;
        newPosition = screenWidth;
      }

      setPosition(newPosition);
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isVisible, walkSpeed]);

  const handleClick = () => {
    // Call the onChickenClick callback if provided
    if (onChickenClick) {
      onChickenClick();
    }

    setIsBubbleVisible(false);
    setTimeout(() => {
      setIsVisible(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      router.push(targetUrl);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-32 pointer-events-none">
      <div
        ref={chickenRef}
        className="absolute flex items-end pointer-events-auto"
        style={{
          left: `${position}px`,
          bottom: 8
        }}
      >
        {/* Speech bubble - positioned above the chicken */}
        <div
          className={cn(
            "relative p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 shadow-lg transform transition-all duration-300",
            isBubbleVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4 pointer-events-none"
          )}
          style={{
            maxWidth: "300px",
            minWidth: "240px",
            marginBottom: "60px",
            padding: "12px",
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)"
          }}
          onClick={handleClick}
        >
          <div className="font-bold text-center whitespace-pre-line px-2 text-black dark:text-white text-base">
            {message}
          </div>
          <div className="absolute h-4 w-4 bg-white dark:bg-gray-800 border-b border-r border-gray-300 dark:border-gray-600 transform rotate-45 left-0 right-0 mx-auto -mb-2 bottom-0"></div>
        </div>

        {/* Chicken */}
        <div className="cursor-pointer" onClick={handleClick}>
          <Image
            src={createNextUrl("/images/chicken2.gif")}
            width={104} // 80 × 1.3 = 104
            height={104} // 80 × 1.3 = 104
            alt="Chicken announcer"
            priority
          />
        </div>
      </div>
    </div>
  );
};

export default ChickenAnnouncer;
