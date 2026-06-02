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
import { useLandingSeasonContext } from "@/hooks/data/useLandingSeasonContext";
import { useSeasonResultsSeasons } from "@/hooks/data/useSeasonResults";
import { SeasonHighlightsPanel } from "@/components/landing/SeasonHighlightsPanel";
import { MatchStatus, type MatchWithStreamUrls } from "@eggosystem/types";
import {
  getUpcomingMatchesSorted,
  getUpcomingStreamedMatchesSorted
} from "@/lib/calendar-utils";
import Link from "next/link";
import { createNextUrl, cn } from "@/lib/utils";
import { isOfficialKanaliigaStream } from "@/lib/official-kanaliiga-stream";
import { calendarMatchVersusTitle } from "@/lib/order-match-teams-home-left-away";
import { TwitchIcon, StreamPulseCard, TierDot } from "@/components/kanaliiga";

type HeroSectionProps = {
  device?: string;
};

const MatchCard = ({ match }: { match: MatchWithStreamUrls }) => {
  return (
    <Link href={createNextUrl(`/matches/${match.match_id}`)} className="block">
      <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer group relative">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <TierDot tier={match.league_tier} className="size-3 mt-1" />
            <div className="flex-1 min-w-0 overflow-hidden">
              <h3 className="text-sm lg:text-base mb-1 group-hover:text-kanaliiga-orange transition-colors break-words leading-tight">
                {calendarMatchVersusTitle(match)}
              </h3>
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">
                  {formatInTimezone(match.match_start, "MMM d 'at' HH:mm")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <Badge
                  variant="secondary"
                  className="text-xs bg-white/10 text-muted-foreground border-white/20 flex-shrink-0"
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
        className="bg-kanaliiga-orange hover:bg-kanaliiga-orange/90 text-white px-3 py-2 h-auto font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-0 text-sm min-h-[36px] w-full"
        asChild
      >
        <Link
          className="flex items-center gap-2"
          href={firstStreamUrl}
          onClick={handleStreamClick}
        >
          <TwitchIcon size={16} />
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
          className="bg-kanaliiga-orange hover:bg-kanaliiga-orange/90 text-white px-3 py-2 h-auto font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 border-0 text-sm min-h-[36px] w-full"
          asChild
        >
          <Link
            className="flex items-center gap-2"
            href={url}
            onClick={handleStreamClick}
          >
            <TwitchIcon size={16} />
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
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg mb-2">No upcoming matches this week</p>
          <p className="text-sm text-muted-foreground">
            Check back later for new matches
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted hover:scrollbar-thumb-muted-foreground">
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
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg mb-2">No streamed matches found</p>
          <p className="text-sm text-muted-foreground">
            Try viewing all matches instead
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted hover:scrollbar-thumb-muted-foreground">
      {matches.map((match) => {
        const official = isOfficialKanaliigaStream(match);
        return (
          <StreamPulseCard
            key={match.match_id}
            isLive={match.match_status === MatchStatus.ONGOING}
            className={cn(
              "bg-gradient-to-r from-purple-500/10 via-kanaliiga-orange/10 to-red-500/10 hover:from-purple-500/15 hover:via-kanaliiga-orange/15 hover:to-red-500/15 ring-1 transition-all duration-300 cursor-pointer group relative",
              official
                ? "border-kanaliiga-orange/50 ring-kanaliiga-orange/35 hover:border-kanaliiga-orange/60"
                : "border-purple-500/30 ring-purple-500/20"
            )}
            onClick={() => window.open(`/matches/${match.match_id}`, "_blank")}
          >
            {/* Twitch-style gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-kanaliiga-orange/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {match.match_status === MatchStatus.ONGOING && (
              <div className="absolute top-3 left-3 z-10">
                <div className="flex items-center gap-1.5 bg-status-live/90 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                  <div className="w-2 h-2 bg-status-live rounded-full animate-pulse" />
                  LIVE
                </div>
              </div>
            )}

            {official && (
              <div className="absolute top-3 right-3 z-10">
                <Badge
                  variant="secondary"
                  className="text-xs font-medium shadow-lg bg-kanaliiga-orange/95 text-white border-kanaliiga-orange/60 hover:bg-kanaliiga-orange/95"
                >
                  KanaliigaTV
                </Badge>
              </div>
            )}

            <CardContent className="p-3 sm:p-4 relative z-0">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <TierDot tier={match.league_tier} className="size-3 mt-1" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm lg:text-base mb-1 sm:mb-2 group-hover:text-purple-300 transition-colors break-words leading-tight line-clamp-2">
                        {calendarMatchVersusTitle(match)}
                      </h3>

                      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2 sm:mb-3">
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

                <div className="flex-shrink-0 w-full sm:w-auto sm:min-w-[120px]">
                  <StreamButtons match={match} />
                </div>
              </div>
            </CardContent>
          </StreamPulseCard>
        );
      })}
    </div>
  );
};

function MatchesLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="bg-white/5 border-white/10 animate-pulse">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
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

  const { seasonPhase, referenceSeasonId } = useLandingSeasonContext();
  const { seasons } = useSeasonResultsSeasons();
  const currentSeasonId = referenceSeasonId?.toString();
  const isSeasonConcluded = seasonPhase.phase === "concluded";
  const showLiveHero = !isSeasonConcluded && Boolean(currentSeasonId);

  const concludedSeasonLabel = useMemo(() => {
    if (seasonPhase.seasonName) {
      return seasonPhase.seasonName;
    }

    const latestSeason = seasons.find(
      (season) => season.season_id === referenceSeasonId
    );
    return latestSeason?.season_name ?? null;
  }, [referenceSeasonId, seasonPhase.seasonName, seasons]);

  const { data: calendarMatches, isLoading: isLoadingMatches } =
    useSeasonCalendarMatches(showLiveHero ? currentSeasonId : null, "all");

  const allUpcomingMatches = getUpcomingMatchesSorted(
    calendarMatches || [],
    10,
    25
  );

  const allUpcomingStreamedMatches = getUpcomingStreamedMatchesSorted(
    calendarMatches || [],
    20,
    20
  );

  const hasStreamedMatches = useMemo(() => {
    return allUpcomingStreamedMatches.some(
      (match) =>
        (match.stream_urls && match.stream_urls.length > 0) ||
        match.match_status === "ONGOING"
    );
  }, [allUpcomingStreamedMatches]);

  const derivedMatchFilter = useMemo(() => {
    return hasStreamedMatches ? "streamed" : "all";
  }, [hasStreamedMatches]);

  const [matchFilter, setMatchFilter] = useState<"all" | "streamed">(
    derivedMatchFilter
  );

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
      <div className="absolute inset-0 bg-center opacity-10"></div>

      <div className="relative z-10 max-w-[1920px] mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-12 lg:py-24 2xl:py-32 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-start">
          {/* Left Side - Hero Content */}
          <div className="space-y-6">
            <div className="space-y-3">
              {seasonPhase.phase === "live" ? (
                <Badge
                  variant="secondary"
                  className="bg-kanaliiga-orange/20 text-kanaliiga-orange border-kanaliiga-orange/30 text-sm sm:text-base lg:text-lg 2xl:text-xl"
                >
                  CS2 Season {seasonPhase.seasonNumber} • Live Now
                </Badge>
              ) : seasonPhase.phase === "signup" ? (
                <Link
                  href={createNextUrl(`/seasons/${currentSeasonId}/signup`)}
                >
                  <Badge
                    variant="secondary"
                    className="bg-kanaliiga-orange/20 text-kanaliiga-orange border-kanaliiga-orange/30 text-sm sm:text-base lg:text-lg 2xl:text-xl hover:bg-kanaliiga-orange/30 cursor-pointer transition-colors"
                  >
                    Registration for Season {seasonPhase.seasonNumber} Open →
                  </Badge>
                </Link>
              ) : (
                <Badge
                  variant="secondary"
                  className="bg-kanaliiga-orange/20 text-kanaliiga-orange border-kanaliiga-orange/30 text-sm sm:text-base lg:text-lg 2xl:text-xl"
                >
                  {concludedSeasonLabel
                    ? `${concludedSeasonLabel} Concluded`
                    : "CS2 Corporate League"}
                </Badge>
              )}

              <h1 className="text-3xl sm:text-4xl lg:text-5xl 2xl:text-6xl leading-tight">
                Finland&apos;s Premier
                <span className="block text-kanaliiga-orange">
                  Corporate Esports League
                </span>
              </h1>

              <p className="text-lg sm:text-xl 2xl:text-2xl text-muted-foreground leading-relaxed">
                {isSeasonConcluded
                  ? "The latest season has wrapped. Explore final standings, season highlights, and match history while we prepare the next registration window."
                  : "Finland's corporate CS2 league. Watch live matches, follow your team, and compete across multiple divisions."}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="text-2xl sm:text-3xl 2xl:text-4xl font-bold text-kanaliiga-orange">
                  85
                </div>
                <div className="text-sm sm:text-base 2xl:text-lg text-muted-foreground">
                  Organizations
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="text-2xl sm:text-3xl 2xl:text-4xl font-bold text-kanaliiga-orange">
                  700+
                </div>
                <div className="text-sm sm:text-base 2xl:text-lg text-muted-foreground">
                  Players
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="text-2xl sm:text-3xl 2xl:text-4xl font-bold text-kanaliiga-orange">
                  96
                </div>
                <div className="text-sm sm:text-base 2xl:text-lg text-muted-foreground">
                  Teams
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {isSeasonConcluded ? (
                <>
                  <Button
                    size="lg"
                    className="bg-kanaliiga-orange hover:bg-kanaliiga-orange/90 text-white px-6 sm:px-8 py-3 text-sm sm:text-base 2xl:text-lg h-auto"
                    onClick={() =>
                      router.push(
                        currentSeasonId
                          ? `/season-results?season=${currentSeasonId}`
                          : "/season-results"
                      )
                    }
                  >
                    <TrendingUp className="mr-2 h-4 w-4 sm:h-5 sm:w-5 2xl:h-6 2xl:w-6" />
                    View Season Results
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/20 px-6 sm:px-8 py-3 text-sm sm:text-base 2xl:text-lg h-auto"
                    onClick={() => router.push("/matches")}
                  >
                    <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5 2xl:h-6 2xl:w-6" />
                    Browse Past Matches
                  </Button>
                </>
              ) : (
                <Button
                  size="lg"
                  className="bg-kanaliiga-orange hover:bg-kanaliiga-orange/90 text-white px-6 sm:px-8 py-3 text-sm sm:text-base 2xl:text-lg h-auto"
                  onClick={() =>
                    router.push(`/seasons/${currentSeasonId}/calendar`)
                  }
                >
                  <Calendar className="mr-2 h-4 w-4 sm:h-5 sm:w-5 2xl:h-6 2xl:w-6" />
                  View Match Calendar
                </Button>
              )}
            </div>
          </div>

          {/* Right Side - Upcoming Matches or Season Highlights */}
          {isSeasonConcluded ? (
            <SeasonHighlightsPanel />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl 2xl:text-3xl flex items-center gap-2">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 2xl:h-7 2xl:w-7 text-kanaliiga-orange" />
                  Upcoming Matches
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-kanaliiga-orange hover:text-kanaliiga-orange/80 text-sm sm:text-base 2xl:text-lg h-auto px-2 sm:px-4"
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
                      ? "bg-kanaliiga-orange text-white hover:bg-kanaliiga-orange/90"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/10"
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
                      ? "bg-kanaliiga-orange text-white hover:bg-kanaliiga-orange/90"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                  } ${!hasStreamedMatches ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() =>
                    hasStreamedMatches && setMatchFilter("streamed")
                  }
                  disabled={!hasStreamedMatches}
                >
                  <TwitchIcon size={14} className="mr-1.5" />
                  Streamed ({allUpcomingStreamedMatches.length})
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
          )}
        </div>

        {/* Bottom Section - Quick Links */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="grid md:grid-cols-4 gap-6">
            <Link href={createNextUrl("/teams")} className="group">
              <div className="p-6 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300 min-h-[120px] md:min-h-[140px] lg:min-h-[160px] 2xl:min-h-[180px] flex flex-col">
                <Users className="h-8 w-8 lg:h-10 lg:w-10 2xl:h-12 2xl:w-12 text-kanaliiga-orange mb-3 flex-shrink-0" />
                <div className="flex flex-col flex-grow">
                  <h3 className="text-lg lg:text-xl 2xl:text-2xl mb-2">
                    Browse Teams
                  </h3>
                  <p className="text-sm lg:text-base 2xl:text-lg text-muted-foreground">
                    Discover teams and their players
                  </p>
                </div>
              </div>
            </Link>

            {currentSeasonId ? (
              <Link
                href={createNextUrl(
                  isSeasonConcluded
                    ? `/season-results?season=${currentSeasonId}`
                    : `/seasons/${currentSeasonId}/standings`
                )}
                className="group"
              >
                <div className="p-6 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300 min-h-[120px] md:min-h-[140px] lg:min-h-[160px] 2xl:min-h-[180px] flex flex-col">
                  <TrendingUp className="h-8 w-8 lg:h-10 lg:w-10 2xl:h-12 2xl:w-12 text-kanaliiga-orange mb-3 flex-shrink-0" />
                  <div className="flex flex-col flex-grow">
                    <h3 className="text-lg lg:text-xl 2xl:text-2xl mb-2">
                      {isSeasonConcluded
                        ? "Season Results"
                        : "View Standings"}
                    </h3>
                    <p className="text-sm lg:text-base 2xl:text-lg text-muted-foreground">
                      {isSeasonConcluded
                        ? "See final placements and champions"
                        : "Check current league rankings"}
                    </p>
                  </div>
                </div>
              </Link>
            ) : (
              <Link href={createNextUrl("/past-seasons")} className="group">
                <div className="p-6 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300 min-h-[120px] md:min-h-[140px] lg:min-h-[160px] 2xl:min-h-[180px] flex flex-col">
                  <TrendingUp className="h-8 w-8 lg:h-10 lg:w-10 2xl:h-12 2xl:w-12 text-kanaliiga-orange mb-3 flex-shrink-0" />
                  <div className="flex flex-col flex-grow">
                    <h3 className="text-lg lg:text-xl 2xl:text-2xl mb-2">
                      Past Seasons
                    </h3>
                    <p className="text-sm lg:text-base 2xl:text-lg text-muted-foreground">
                      Explore previous season archives
                    </p>
                  </div>
                </div>
              </Link>
            )}

            <Link href={createNextUrl("/matches")} className="group">
              <div className="p-6 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300 min-h-[120px] md:min-h-[140px] lg:min-h-[160px] 2xl:min-h-[180px] flex flex-col">
                <Play className="h-8 w-8 lg:h-10 lg:w-10 2xl:h-12 2xl:w-12 text-kanaliiga-orange mb-3 flex-shrink-0" />
                <div className="flex flex-col flex-grow">
                  <h3 className="text-lg lg:text-xl 2xl:text-2xl mb-2">
                    All Matches
                  </h3>
                  <p className="text-sm lg:text-base 2xl:text-lg text-muted-foreground">
                    Browse complete match history
                  </p>
                </div>
              </div>
            </Link>

            <Link href={createNextUrl("/organizations")} className="group">
              <div className="p-6 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300 min-h-[120px] md:min-h-[140px] lg:min-h-[160px] 2xl:min-h-[180px] flex flex-col">
                <Users className="h-8 w-8 lg:h-10 lg:w-10 2xl:h-12 2xl:w-12 text-kanaliiga-orange mb-3 flex-shrink-0" />
                <div className="flex flex-col flex-grow">
                  <h3 className="text-lg lg:text-xl 2xl:text-2xl mb-2">
                    Organizations
                  </h3>
                  <p className="text-sm lg:text-base 2xl:text-lg text-muted-foreground">
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
