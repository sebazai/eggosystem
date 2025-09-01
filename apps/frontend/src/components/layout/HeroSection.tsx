"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  ExternalLink,
  Play,
  TrendingUp,
  Users
} from "lucide-react";
import { formatInTimezone } from "@/lib/timezone";
import { useSeasonCalendarMatches } from "@/hooks/data/useSeasonCalendarMatches";
import { useActiveSignupOrActiveSeasonForApp } from "@/hooks/data/useActiveSignupOrActiveSeasonForApp";
import type { MatchWithStreamUrls } from "@eggosystem/types";
import { getUpcomingMatchesSorted, DIVISIONS } from "@/lib/calendar-utils";
import Link from "next/link";

type HeroSectionProps = {
  device?: string;
};

export default function HeroSection({ device: _device }: HeroSectionProps) {
  const router = useRouter();

  // Get current season (CS2 app ID is typically 1)
  const { signupOrActiveSeason } = useActiveSignupOrActiveSeasonForApp(730);
  const currentSeasonId = signupOrActiveSeason?.season_id?.toString() || "16"; // fallback to season 16

  // Get upcoming matches for all divisions
  const { calendarMatches, isLoading: isLoadingMatches } =
    useSeasonCalendarMatches(currentSeasonId, "all");

  // Get upcoming matches sorted by date/time first, then by tier
  const allUpcomingMatches = getUpcomingMatchesSorted(
    calendarMatches || [],
    10,
    10
  );

  // Filter state for matches
  const [matchFilter, setMatchFilter] = useState<"all" | "streamed">("all");

  // Check if there are any streamed matches
  const hasStreamedMatches = useMemo(() => {
    return allUpcomingMatches.some(
      (match) => match.streamUrl && match.streamUrl.length > 0
    );
  }, [allUpcomingMatches]);

  // Set smart default: streamed if available, otherwise all
  useEffect(() => {
    if (hasStreamedMatches) {
      setMatchFilter("streamed");
    } else {
      setMatchFilter("all");
    }
  }, [hasStreamedMatches]);

  // Filter matches based on selection
  const upcomingMatches = useMemo(() => {
    if (matchFilter === "streamed") {
      return allUpcomingMatches.filter(
        (match) => match.streamUrl && match.streamUrl.length > 0
      );
    }
    return allUpcomingMatches;
  }, [allUpcomingMatches, matchFilter]);

  const handleMatchClick = (match: MatchWithStreamUrls) => {
    router.push(`/matches/${match.match_id}`);
  };

  const handleStreamClick = (match: MatchWithStreamUrls) => {
    if (match.streamUrl && match.streamUrl.length > 0) {
      window.open(match.streamUrl[0], "_blank");
    }
  };

  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-[800px] lg:min-h-[900px] 2xl:min-h-[1000px]">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-center opacity-10"></div>

      {/* Main Content */}
      <div className="relative z-10 max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-12 lg:py-24 2xl:py-32 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-start">
          {/* Left Side - Hero Content */}
          <div className="space-y-6">
            <div className="space-y-3">
              <Badge
                variant="secondary"
                className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-sm sm:text-base lg:text-lg 2xl:text-xl"
              >
                CS2 Season 4 • Live Now
              </Badge>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl 2xl:text-6xl font-bold text-white leading-tight">
                Finland&apos;s Premier
                <span className="block text-orange-400">
                  Corporate Esports League
                </span>
              </h1>

              <p className="text-lg sm:text-xl lg:text-xl 2xl:text-2xl text-slate-300 leading-relaxed">
                Join the most competitive CS2 corporate league in Finland. Watch
                live matches, follow your favorite teams, and be part of our
                thriving esports community.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="text-2xl sm:text-3xl lg:text-3xl 2xl:text-4xl font-bold text-orange-400">
                  90+
                </div>
                <div className="text-sm sm:text-base lg:text-base 2xl:text-lg text-slate-400">
                  Organizations
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="text-2xl sm:text-3xl lg:text-3xl 2xl:text-4xl font-bold text-orange-400">
                  800+
                </div>
                <div className="text-sm sm:text-base lg:text-base 2xl:text-lg text-slate-400">
                  Players
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="text-2xl sm:text-3xl lg:text-3xl 2xl:text-4xl font-bold text-orange-400">
                  110+
                </div>
                <div className="text-sm sm:text-base lg:text-base 2xl:text-lg text-slate-400">
                  Teams
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 sm:px-8 py-3 text-sm sm:text-base lg:text-base 2xl:text-lg h-auto"
                onClick={() =>
                  router.push(`/seasons/${currentSeasonId}/calendar`)
                }
              >
                <Calendar className="mr-2 h-4 w-4 sm:h-5 sm:w-5 lg:h-5 lg:w-5 2xl:h-6 2xl:w-6" />
                View Match Calendar
              </Button>
            </div>
          </div>

          {/* Right Side - Upcoming Matches */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl lg:text-2xl 2xl:text-3xl font-bold text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 lg:h-6 lg:w-6 2xl:h-7 2xl:w-7 text-orange-400" />
                Upcoming Matches
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-orange-400 hover:text-orange-300 text-sm sm:text-base lg:text-base 2xl:text-lg h-auto px-2 sm:px-4"
                onClick={() =>
                  router.push(`/seasons/${currentSeasonId}/calendar`)
                }
              >
                View All
              </Button>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant={matchFilter === "all" ? "default" : "ghost"}
                size="sm"
                className={`text-sm ${
                  matchFilter === "all"
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
                onClick={() => setMatchFilter("all")}
              >
                All ({allUpcomingMatches.length})
              </Button>
              <Button
                variant={matchFilter === "streamed" ? "default" : "ghost"}
                size="sm"
                className={`text-sm ${
                  matchFilter === "streamed"
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                } ${!hasStreamedMatches ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => hasStreamedMatches && setMatchFilter("streamed")}
                disabled={!hasStreamedMatches}
              >
                📺 Streamed (
                {
                  allUpcomingMatches.filter(
                    (m) => m.streamUrl && m.streamUrl.length > 0
                  ).length
                }
                )
              </Button>
            </div>

            {isLoadingMatches ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card
                    key={i}
                    className="bg-white/5 border-white/10 animate-pulse"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-slate-600 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-600 rounded w-3/4"></div>
                          <div className="h-3 bg-slate-600 rounded w-1/2"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : upcomingMatches.length > 0 ? (
              <div className="space-y-3 sm:space-y-4 max-h-[400px] overflow-y-auto">
                {upcomingMatches.map((match) => {
                  const hasStream =
                    match.streamUrl && match.streamUrl.length > 0;
                  return (
                    <Card
                      key={match.match_id}
                      className={`${
                        hasStream
                          ? "bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/15 ring-1 ring-orange-500/20"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      } transition-all duration-300 cursor-pointer group relative`}
                      onClick={() => handleMatchClick(match)}
                    >
                      {hasStream && (
                        <div
                          className="absolute top-2 right-2 text-lg opacity-90 bg-orange-500/20 rounded px-1.5 py-0.5 cursor-pointer hover:bg-orange-500/30 hover:scale-110 transition-all duration-200 z-10"
                          title="Click to watch stream"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStreamClick(match);
                          }}
                        >
                          📺
                        </div>
                      )}
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0 mt-1 flex-shrink-0"
                            style={{
                              backgroundColor:
                                DIVISIONS[match.league_tier]?.color
                            }}
                          />
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <h3
                              className={`font-semibold text-sm lg:text-base mb-1 group-hover:text-orange-400 transition-colors break-words leading-tight ${
                                hasStream ? "text-orange-100" : "text-white"
                              }`}
                            >
                              {match.title}
                              {hasStream && (
                                <span className="ml-2 text-xs bg-orange-500/30 text-orange-200 px-2 py-0.5 rounded-full">
                                  LIVE STREAM
                                </span>
                              )}
                            </h3>
                            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                              <Clock className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                {formatInTimezone(
                                  match.match_start,
                                  "MMM d 'at' HH:mm"
                                )}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <Badge
                                variant="secondary"
                                className="text-xs bg-white/10 text-slate-300 border-white/20 flex-shrink-0"
                              >
                                {match.league_name}
                              </Badge>
                              {hasStream && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-orange-300 hover:text-orange-200 hover:bg-orange-400/20 flex-shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStreamClick(match);
                                  }}
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-8 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                  <p className="text-lg text-white mb-2">
                    {matchFilter === "streamed"
                      ? "No streamed matches found"
                      : "No upcoming matches this week"}
                  </p>
                  <p className="text-sm text-slate-400">
                    {matchFilter === "streamed"
                      ? allUpcomingMatches.length > 0
                        ? "Try viewing all matches instead"
                        : "Check back later for new matches"
                      : "Check back later for new matches"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Bottom Section - Quick Links */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="grid md:grid-cols-4 gap-6">
            <Link href="/teams" className="group">
              <div className="p-6 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300 min-h-[120px] md:min-h-[140px] lg:min-h-[160px] 2xl:min-h-[180px] flex flex-col">
                <Users className="h-8 w-8 lg:h-10 lg:w-10 2xl:h-12 2xl:w-12 text-orange-400 mb-3 flex-shrink-0" />
                <div className="flex flex-col flex-grow">
                  <h3 className="text-lg lg:text-xl 2xl:text-2xl font-semibold text-white mb-2">
                    Browse Teams
                  </h3>
                  <p className="text-sm lg:text-base 2xl:text-lg text-slate-400">
                    Discover teams and their players
                  </p>
                </div>
              </div>
            </Link>

            <Link
              href={`/seasons/${currentSeasonId}/standings`}
              className="group"
            >
              <div className="p-6 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300 min-h-[120px] md:min-h-[140px] lg:min-h-[160px] 2xl:min-h-[180px] flex flex-col">
                <TrendingUp className="h-8 w-8 lg:h-10 lg:w-10 2xl:h-12 2xl:w-12 text-orange-400 mb-3 flex-shrink-0" />
                <div className="flex flex-col flex-grow">
                  <h3 className="text-lg lg:text-xl 2xl:text-2xl font-semibold text-white mb-2">
                    View Standings
                  </h3>
                  <p className="text-sm lg:text-base 2xl:text-lg text-slate-400">
                    Check current league rankings
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/matches" className="group">
              <div className="p-6 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300 min-h-[120px] md:min-h-[140px] lg:min-h-[160px] 2xl:min-h-[180px] flex flex-col">
                <Play className="h-8 w-8 lg:h-10 lg:w-10 2xl:h-12 2xl:w-12 text-orange-400 mb-3 flex-shrink-0" />
                <div className="flex flex-col flex-grow">
                  <h3 className="text-lg lg:text-xl 2xl:text-2xl font-semibold text-white mb-2">
                    All Matches
                  </h3>
                  <p className="text-sm lg:text-base 2xl:text-lg text-slate-400">
                    Browse complete match history
                  </p>
                </div>
              </div>
            </Link>

            <Link href="/organizations" className="group">
              <div className="p-6 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300 min-h-[120px] md:min-h-[140px] lg:min-h-[160px] 2xl:min-h-[180px] flex flex-col">
                <Users className="h-8 w-8 lg:h-10 lg:w-10 2xl:h-12 2xl:w-12 text-orange-400 mb-3 flex-shrink-0" />
                <div className="flex flex-col flex-grow">
                  <h3 className="text-lg lg:text-xl 2xl:text-2xl font-semibold text-white mb-2">
                    Organizations
                  </h3>
                  <p className="text-sm lg:text-base 2xl:text-lg text-slate-400">
                    Explore participating organizations
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
