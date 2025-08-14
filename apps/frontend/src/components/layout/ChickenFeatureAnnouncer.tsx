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

const SEEN_ANNOUNCEMENTS_KEY = "seen-chicken-announcements";

export const ChickenFeatureAnnouncer = ({
  enabled = true,
  showDelay = 2000, // Show after 2 seconds by default
  autoHideAfter = undefined, // Don't auto-hide by default
  message = "NEW FEATURES NEW FEATURES",
  targetUrl = "/new-features",
  featureDate = "2025-07-01" // Default to the chicken announcer date
}: ChickenFeatureAnnouncerProps) => {
  const { showChicken } = useChickenAnnouncer();

  // Check if the announcement has been seen before
  const hasSeenAnnouncement = (date: string): boolean => {
    if (typeof window === "undefined") return false;

    try {
      const seenAnnouncements = localStorage.getItem(SEEN_ANNOUNCEMENTS_KEY);
      if (!seenAnnouncements) return false;

      const announcements = JSON.parse(seenAnnouncements);
      return announcements.includes(date);
    } catch (error) {
      console.error("Error checking seen announcements:", error);
      return false;
    }
  };

  // Mark the announcement as seen
  const markAnnouncementAsSeen = (date: string): void => {
    if (typeof window === "undefined") return;

    try {
      const seenAnnouncements = localStorage.getItem(SEEN_ANNOUNCEMENTS_KEY);
      const announcements = seenAnnouncements
        ? JSON.parse(seenAnnouncements)
        : [];

      if (!announcements.includes(date)) {
        announcements.push(date);
        localStorage.setItem(
          SEEN_ANNOUNCEMENTS_KEY,
          JSON.stringify(announcements)
        );
      }
    } catch (error) {
      console.error("Error saving seen announcement:", error);
    }
  };

  useEffect(() => {
    // Check if we should show the chicken based on feature date
    if (!enabled) return;

    // If user has already seen this announcement, don't show it
    if (hasSeenAnnouncement(featureDate)) return;

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
        autoHideAfter,
        onChickenClick: () => markAnnouncementAsSeen(featureDate)
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
