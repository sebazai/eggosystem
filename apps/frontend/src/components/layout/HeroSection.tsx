"use client";

import { useState, useMemo } from "react";
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
import { MatchStatus, type MatchWithStreamUrls } from "@eggosystem/types";
import {
  getUpcomingMatchesSorted,
  DIVISIONS,
  getUpcomingStreamedMatchesSorted
} from "@/lib/calendar-utils";
import Link from "next/link";
import { createNextUrl } from "@/lib/utils";

type HeroSectionProps = {
  device?: string;
};

// Component for displaying a single match card (non-streamed)
const MatchCard = ({ match }: { match: MatchWithStreamUrls }) => {
  return (
    <Link href={createNextUrl(`/matches/${match.match_id}`)} className="block">
      <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer group relative">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0 mt-1 flex-shrink-0"
              style={{
                backgroundColor: DIVISIONS[match.league_tier]?.color
              }}
            />
            <div className="flex-1 min-w-0 overflow-hidden">
              <h3 className="font-semibold text-sm lg:text-base mb-1 group-hover:text-orange-400 transition-colors break-words leading-tight text-white">
                {match.title}
              </h3>
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {formatInTimezone(match.match_start, "MMM d 'at' HH:mm")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <Badge
                  variant="secondary"
                  className="text-xs bg-white/10 text-slate-300 border-white/20 flex-shrink-0"
                >
                  {match.league_name}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

const StreamButtons = ({ match }: { match: MatchWithStreamUrls }) => {
  if (match.stream_urls.length === 0) {
    return null;
  }

  const handleStreamClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const firstStreamUrl = match.stream_urls[0];
  if (match.stream_urls.length === 1 && firstStreamUrl) {
    return (
      <Button
        size="sm"
        className="bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 text-white px-3 py-2 h-auto font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-0 text-sm min-h-[36px] w-full"
        asChild
      >
        <Link
          className="flex items-center gap-2"
          href={firstStreamUrl}
          onClick={handleStreamClick}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
          </svg>
          <span>Watch</span>
          <ExternalLink className="h-4 w-4" />
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {match.stream_urls.map((url, index) => (
        <Button
          key={url}
          size="sm"
          className="bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 text-white px-3 py-2 h-auto font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-0 text-sm min-h-[36px] w-full"
          asChild
        >
          <Link
            className="flex items-center gap-2"
            href={url}
            onClick={handleStreamClick}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
            </svg>
            <span>Stream {index + 1}</span>
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
      ))}
    </div>
  );
};

const AllMatchesTab = ({ matches }: { matches: MatchWithStreamUrls[] }) => {
  if (matches.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <p className="text-lg text-white mb-2">
            No upcoming matches this week
          </p>
          <p className="text-sm text-slate-400">
            Check back later for new matches
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-600 hover:scrollbar-thumb-slate-500">
      {matches.map((match) => (
        <MatchCard key={match.match_id} match={match} />
      ))}
    </div>
  );
};

const StreamedMatchesTab = ({
  matches
}: {
  matches: MatchWithStreamUrls[];
}) => {
  if (matches.length === 0) {
    return (
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <p className="text-lg text-white mb-2">No streamed matches found</p>
          <p className="text-sm text-slate-400">
            Try viewing all matches instead
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-600 hover:scrollbar-thumb-slate-500">
      {matches.map((match) => {
        return (
          <Card
            key={match.match_id}
            className="bg-gradient-to-r from-purple-500/10 via-orange-500/10 to-red-500/10 border-purple-500/30 hover:from-purple-500/15 hover:via-orange-500/15 hover:to-red-500/15 ring-1 ring-purple-500/20 transition-all duration-300 cursor-pointer group relative overflow-hidden"
            onClick={() => window.open(`/matches/${match.match_id}`, "_blank")}
          >
            {/* Twitch-style gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-orange-600/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Stream indicator badge - only show when match is ongoing */}
            {match.match_status === MatchStatus.ONGOING && (
              <div className="absolute top-3 left-3 z-10">
                <div className="flex items-center gap-1.5 bg-red-500/90 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  LIVE
                </div>
              </div>
            )}

            <CardContent className="p-3 sm:p-4 relative z-0">
              {/* Two-column layout: content on left, buttons on right */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {/* Left column: Match info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                      style={{
                        backgroundColor: DIVISIONS[match.league_tier]?.color
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm lg:text-base mb-1 sm:mb-2 group-hover:text-purple-300 transition-colors break-words leading-tight text-white line-clamp-2">
                        {match.title}
                      </h3>

                      <div className="flex items-center gap-2 text-slate-300 text-xs mb-2 sm:mb-3">
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
                          className="text-xs bg-white/20 text-white border-white/30 flex-shrink-0"
                        >
                          {match.league_name}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right column: Stream buttons */}
                <div className="flex-shrink-0 w-full sm:w-auto sm:min-w-[120px]">
                  <StreamButtons match={match} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// Loading skeleton component
function MatchesLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="bg-white/5 border-white/10 animate-pulse">
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
  );
}

export default function HeroSection({ device: _device }: HeroSectionProps) {
  const router = useRouter();

  // Get current season (CS2 app ID is typically 1)
  const { signupOrActiveSeason } = useActiveSignupOrActiveSeasonForApp(730);
  const currentSeasonId = signupOrActiveSeason?.season_id?.toString() || "16"; // fallback to season 16

  // Determine season status based on dates - only calculate on client to avoid hydration mismatch
  const seasonStatus = useMemo(() => {
    if (!signupOrActiveSeason) {
      return {
        isSeasonLive: false,
        isSignupOpen: false,
        seasonName: null,
        seasonNumber: null
      };
    }

    const now = new Date();
    const startDate = signupOrActiveSeason.start_date
      ? new Date(signupOrActiveSeason.start_date)
      : null;
    const endDate = signupOrActiveSeason.end_date
      ? new Date(signupOrActiveSeason.end_date)
      : null;
    const signupStartDate = signupOrActiveSeason.signup_start_date
      ? new Date(signupOrActiveSeason.signup_start_date)
      : null;
    const signupEndDate = signupOrActiveSeason.signup_end_date
      ? new Date(signupOrActiveSeason.signup_end_date)
      : null;

    // Season is live if: start_date <= now AND (end_date is null OR end_date >= now)
    const isSeasonLive =
      startDate && startDate <= now && (endDate === null || endDate >= now);

    // Signup is open if: signup_start_date <= now AND signup_end_date >= now AND start_date > now
    const isSignupOpen =
      signupStartDate &&
      signupStartDate <= now &&
      signupEndDate &&
      signupEndDate >= now &&
      startDate &&
      startDate > now;

    // Extract season number from full_name (e.g., "CS2 Season 4" -> "4")
    const seasonName =
      signupOrActiveSeason.full_name ||
      `Season ${signupOrActiveSeason.season_id ?? "Unknown"}`;
    const seasonNumberMatch = seasonName.match(/Season\s+(\d+)/i);
    const seasonNumber = seasonNumberMatch
      ? seasonNumberMatch[1]
      : (signupOrActiveSeason.season_id?.toString() ?? "Unknown");

    return { isSeasonLive, isSignupOpen, seasonName, seasonNumber };
  }, [signupOrActiveSeason]);

  // Get upcoming matches for all divisions
  const { data: calendarMatches, isLoading: isLoadingMatches } =
    useSeasonCalendarMatches(currentSeasonId, "all");

  // Get upcoming matches sorted by date/time first, then by tier
  const allUpcomingMatches = getUpcomingMatchesSorted(
    calendarMatches || [],
    10,
    100
  );

  const allUpcomingStreamedMatches = getUpcomingStreamedMatchesSorted(
    calendarMatches || [],
    20,
    20
  );

  // Check if there are any streamed matches
  const hasStreamedMatches = useMemo(() => {
    return allUpcomingStreamedMatches.some(
      (match) =>
        (match.stream_urls && match.stream_urls.length > 0) ||
        match.match_status === "ONGOING"
    );
  }, [allUpcomingStreamedMatches]);

  // Set smart default: streamed if available, otherwise all
  // Use useMemo for derived state and initialize matchFilter with it
  const derivedMatchFilter = useMemo(() => {
    return hasStreamedMatches ? "streamed" : "all";
  }, [hasStreamedMatches]);

  // Use derived value as initial state, but allow user to override
  // No sync effect needed - user can change it, and it will default to derived value on remount
  const [matchFilter, setMatchFilter] = useState<"all" | "streamed">(
    derivedMatchFilter
  );

  // Filter matches based on selection
  const upcomingMatches = useMemo(() => {
    if (matchFilter === "streamed") {
      return allUpcomingStreamedMatches.filter(
        (match) =>
          (match.stream_urls && match.stream_urls.length > 0) ||
          match.match_status === "ONGOING"
      );
    }
    return allUpcomingMatches;
  }, [allUpcomingMatches, allUpcomingStreamedMatches, matchFilter]);

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
              {seasonStatus.isSeasonLive ? (
                <Badge
                  variant="secondary"
                  className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-sm sm:text-base lg:text-lg 2xl:text-xl"
                >
                  CS2 Season {seasonStatus.seasonNumber} • Live Now
                </Badge>
              ) : seasonStatus.isSignupOpen ? (
                <Link
                  href={createNextUrl(`/seasons/${currentSeasonId}/signup`)}
                >
                  <Badge
                    variant="secondary"
                    className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-sm sm:text-base lg:text-lg 2xl:text-xl hover:bg-orange-500/30 cursor-pointer transition-colors"
                  >
                    Registration for Season {seasonStatus.seasonNumber} Open →
                  </Badge>
                </Link>
              ) : (
                <Badge
                  variant="secondary"
                  className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-sm sm:text-base lg:text-lg 2xl:text-xl"
                >
                  CS2 Corporate League
                </Badge>
              )}

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
                  85
                </div>
                <div className="text-sm sm:text-base lg:text-base 2xl:text-lg text-slate-400">
                  Organizations
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="text-2xl sm:text-3xl lg:text-3xl 2xl:text-4xl font-bold text-orange-400">
                  700+
                </div>
                <div className="text-sm sm:text-base lg:text-base 2xl:text-lg text-slate-400">
                  Players
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="text-2xl sm:text-3xl lg:text-3xl 2xl:text-4xl font-bold text-orange-400">
                  96
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
                View Calendar
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
                📺 Streamed ({allUpcomingStreamedMatches.length})
              </Button>
            </div>

            {/* Match Content */}
            {isLoadingMatches ? (
              <MatchesLoadingSkeleton />
            ) : matchFilter === "streamed" ? (
              <StreamedMatchesTab matches={upcomingMatches} />
            ) : (
              <AllMatchesTab matches={upcomingMatches} />
            )}
          </div>
        </div>

        {/* Bottom Section - Quick Links */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="grid md:grid-cols-4 gap-6">
            <Link href={createNextUrl("/teams")} className="group">
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
              href={createNextUrl(`/seasons/${currentSeasonId}/standings`)}
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

            <Link href={createNextUrl("/matches")} className="group">
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

            <Link href={createNextUrl("/organizations")} className="group">
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
