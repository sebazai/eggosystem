"use client";

import { useMyTeamsUpcomingMatches } from "@/hooks/data/user/useMyTeamsUpcomingMatches";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { ExternalLink, Clock, Swords } from "lucide-react";
import Link from "next/link";
import { createNextUrl } from "@/lib/utils";

export const UpcomingMatchToast = () => {
  const { user } = useAuth();
  const { matches, isLoading } = useMyTeamsUpcomingMatches();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const toastIdRef = useRef<string | number | null>(null);
  const lastMatchIdRef = useRef<number | null>(null);

  // Set mounted state on client
  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
  }, []);

  // Update time every minute to re-check if match is within 2 hours
  useEffect(() => {
    if (!mounted) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [mounted]);

  useEffect(() => {
    // Don't show toast if not mounted, not authenticated or still loading
    if (!mounted || !currentTime || !user || isLoading) {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
      return;
    }

    // Find the next upcoming match that is within 2 hours (or already started)
    const upcomingMatch = matches.find((match) => {
      const matchDateTime = new Date(`${match.match_date}T${match.start_time}`);
      const timeDiff = matchDateTime.getTime() - currentTime.getTime();
      const minutesUntilMatch = Math.floor(timeDiff / (1000 * 60));

      // Show if match starts within 2 hours (120 minutes) or is already ongoing
      return (
        minutesUntilMatch <= 120 &&
        (minutesUntilMatch >= 0 || match.status === "ONGOING")
      );
    });

    // If no upcoming match, dismiss the toast
    if (!upcomingMatch) {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
        lastMatchIdRef.current = null;
      }
      return;
    }

    const matchDateTime = new Date(
      `${upcomingMatch.match_date}T${upcomingMatch.start_time}`
    );
    const timeDiff = matchDateTime.getTime() - currentTime.getTime();
    const minutesUntilMatch = Math.floor(timeDiff / (1000 * 60));

    const getFaceitMatchLink = (
      external_match_room_id: string | null,
      platform: string | null
    ) => {
      if (platform === "faceit" && external_match_room_id) {
        return `https://www.faceit.com/en/cs2/room/${external_match_room_id}`;
      }
      return null;
    };

    const faceitLink = getFaceitMatchLink(
      upcomingMatch.external_match_room_id,
      upcomingMatch.platform
    );

    const formatTimeUntilMatch = () => {
      if (upcomingMatch.status === "ONGOING") {
        return "Match is LIVE!";
      }
      if (minutesUntilMatch === 0) {
        return "Match starting now!";
      }
      if (minutesUntilMatch === 1) {
        return "Match starts in 1 minute";
      }
      if (minutesUntilMatch < 60) {
        return `Match starts in ${minutesUntilMatch} minutes`;
      }
      const hours = Math.floor(minutesUntilMatch / 60);
      const mins = minutesUntilMatch % 60;
      if (mins === 0) {
        return `Match starts in ${hours}h`;
      }
      return `Match starts in ${hours}h ${mins}m`;
    };

    // If it's a new match or we need to update the toast
    if (
      !toastIdRef.current ||
      lastMatchIdRef.current !== upcomingMatch.match_id
    ) {
      // Dismiss previous toast if exists
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }

      // Create new persistent toast
      toastIdRef.current = toast(
        <div className="flex items-start gap-1.5 w-[250px]">
          <Swords className="h-4 w-4 flex-shrink-0 mt-0.5 text-orange-600" />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm mb-0.5">
              {formatTimeUntilMatch()}
            </div>
            <div className="font-semibold text-sm truncate">
              {upcomingMatch.team_name} vs {upcomingMatch.opponent_team_name}
            </div>
            <div className="text-xs text-muted-foreground mb-1">
              BO{upcomingMatch.best_of} •{" "}
              {matchDateTime.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit"
              })}
            </div>
            <div className="flex gap-1 flex-wrap">
              <Link
                href={createNextUrl(`/matches/${upcomingMatch.match_id}`)}
                className="inline-flex items-center justify-center rounded text-xs font-medium bg-orange-600 text-white hover:bg-orange-700 h-6 px-2"
              >
                Details
              </Link>
              {faceitLink && (
                <a
                  href={faceitLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded text-xs font-medium bg-orange-600 text-white hover:bg-orange-700 h-6 px-2"
                >
                  <ExternalLink className="mr-0.5 h-3 w-3" />
                  Room
                </a>
              )}
            </div>
          </div>
        </div>,
        {
          duration: Infinity, // Persistent toast - cannot be dismissed
          position: "bottom-right",
          closeButton: false,
          className: "p-2 !pr-2",
          style: {
            width: "250px",
            maxWidth: "250px"
          }
        }
      );
      lastMatchIdRef.current = upcomingMatch.match_id;
    }

    // Cleanup on unmount
    return () => {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
    };
  }, [user, isLoading, matches, currentTime, mounted]);

  return null; // This component doesn't render anything directly
};
