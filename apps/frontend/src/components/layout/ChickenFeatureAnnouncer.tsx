"use client";

import { useEffect } from "react";
import { useChickenAnnouncer } from "@/providers/ChickenAnnouncerProvider";

interface ChickenFeatureAnnouncerProps {
  enabled?: boolean;
  showDelay?: number;
  autoHideAfter?: number;
  message?: string;
  targetUrl?: string;
  featureDate?: string; // ISO date string for the feature
}

export const ChickenFeatureAnnouncer = ({
  enabled = true,
  showDelay = 2000, // Show after 2 seconds by default
  autoHideAfter = undefined, // Don't auto-hide by default
  message = "NEW FEATURES NEW FEATURES",
  targetUrl = "/new-features",
  featureDate = "2026-06-20" // Default to the chicken announcer date
}: ChickenFeatureAnnouncerProps) => {
  const { showChicken } = useChickenAnnouncer();

  useEffect(() => {
    // Check if we should show the chicken based on feature date
    if (!enabled) return;

    // Check if the feature date is within the last 7 days
    const featureDateObj = new Date(featureDate);
    const currentDate = new Date();

    // Calculate the difference in days
    const diffTime = currentDate.getTime() - featureDateObj.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Only show if the feature is within 7 days
    if (diffDays > 7) return;

    // Show the chicken after the specified delay
    const timer = setTimeout(() => {
      showChicken({
        message,
        targetUrl,
        autoHideAfter
      });
    }, showDelay);

    return () => clearTimeout(timer);
  }, [
    enabled,
    showDelay,
    autoHideAfter,
    message,
    targetUrl,
    showChicken,
    featureDate
  ]);

  // This component doesn't render anything directly
  return null;
};

export default ChickenFeatureAnnouncer;
