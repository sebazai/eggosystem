"use client";

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
import Link from "next/link";

// Division definitions with darker, more readable colors
const DIVISIONS: Record<number, { color: string; borderColor: string }> = {
  1: { color: "#b91c1c", borderColor: "#991b1b" }, // Darker red
  2: { color: "#1d4ed8", borderColor: "#1e40af" }, // Darker blue
  3: { color: "#047857", borderColor: "#065f46" }, // Darker green
  4: { color: "#b45309", borderColor: "#92400e" }, // Darker orange
  5: { color: "#6d28d9", borderColor: "#5b21b6" }, // Darker purple
  6: { color: "#be185d", borderColor: "#9d174d" }, // Darker pink
  7: { color: "#0e7490", borderColor: "#155e75" }, // Darker cyan
  8: { color: "#4d7c0f", borderColor: "#365314" }, // Darker lime
  9: { color: "#c2410c", borderColor: "#9a3412" }, // Darker red-orange
  10: { color: "#7c3aed", borderColor: "#6d28d9" }, // Darker violet
  11: { color: "#0f766e", borderColor: "#134e4a" }, // Darker teal
  12: { color: "#a16207", borderColor: "#854d0e" } // Darker yellow
};

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

  // Filter to show only upcoming matches (next 7 days)
  const upcomingMatches =
    calendarMatches
      ?.filter((match) => {
        const matchDate = new Date(match.match_start);
        const now = new Date();
        const sevenDaysFromNow = new Date(
          now.getTime() + 7 * 24 * 60 * 60 * 1000
        );
        return matchDate >= now && matchDate <= sevenDaysFromNow;
      })
      .slice(0, 6) || []; // Show max 6 matches

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
      <div className="relative z-10 max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-12 lg:py-24 2xl:py-32 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Hero Content */}
          <div className="space-y-6">
            <div className="space-y-3">
              <Badge
                variant="secondary"
                className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-base lg:text-lg 2xl:text-xl"
              >
                CS2 Season 4 • Live Now
              </Badge>

              <h1 className="text-4xl lg:text-6xl 2xl:text-7xl font-bold text-white leading-tight">
                Finland&apos;s Premier
                <span className="block text-orange-400">
                  Corporate Esports League
                </span>
              </h1>

              <p className="text-xl lg:text-2xl 2xl:text-3xl text-slate-300 leading-relaxed">
                Join the most competitive CS2 corporate league in Finland. Watch
                live matches, follow your favorite teams, and be part of our
                thriving esports community.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="text-3xl lg:text-4xl 2xl:text-5xl font-bold text-orange-400">
                  100+
                </div>
                <div className="text-base lg:text-lg 2xl:text-xl text-slate-400">
                  Organizations
                </div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="text-3xl lg:text-4xl 2xl:text-5xl font-bold text-orange-400">
                  600+
                </div>
                <div className="text-base lg:text-lg 2xl:text-xl text-slate-400">
                  Players
                </div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="text-3xl lg:text-4xl 2xl:text-5xl font-bold text-orange-400">
                  110+
                </div>
                <div className="text-base lg:text-lg 2xl:text-xl text-slate-400">
                  Teams
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-base lg:text-lg 2xl:text-xl h-auto"
                onClick={() =>
                  router.push(`/seasons/${currentSeasonId}/calendar`)
                }
              >
                <Calendar className="mr-2 h-5 w-5 lg:h-6 lg:w-6 2xl:h-7 2xl:w-7" />
                View Match Calendar
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 hover:bg-white/10 px-8 py-3 text-base lg:text-lg 2xl:text-xl h-auto"
                onClick={() =>
                  window.open("https://www.twitch.tv/slougani", "_blank")
                }
              >
                <Play className="mr-2 h-5 w-5 lg:h-6 lg:w-6 2xl:h-7 2xl:w-7" />
                Watch Live
              </Button>
            </div>
          </div>

          {/* Right Side - Upcoming Matches */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl lg:text-3xl 2xl:text-4xl font-bold text-white flex items-center gap-2">
                <Calendar className="h-6 w-6 lg:h-7 lg:w-7 2xl:h-8 2xl:w-8 text-orange-400" />
                Upcoming Matches
              </h2>
              <Button
                variant="ghost"
                size="lg"
                className="text-orange-400 hover:text-orange-300 text-base lg:text-lg 2xl:text-xl h-auto"
                onClick={() =>
                  router.push(`/seasons/${currentSeasonId}/calendar`)
                }
              >
                View All
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
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {upcomingMatches.map((match) => (
                  <Card
                    key={match.match_id}
                    className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer group"
                    onClick={() => handleMatchClick(match)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                          style={{
                            backgroundColor: DIVISIONS[match.league_tier]?.color
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-sm truncate mb-1 group-hover:text-orange-400 transition-colors">
                            {match.title}
                          </h3>
                          <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                            <Clock className="h-3 w-3" />
                            <span>
                              {formatInTimezone(
                                match.match_start,
                                "MMM d 'at' HH:mm"
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge
                              variant="secondary"
                              className="text-xs bg-white/10 text-slate-300 border-white/20"
                            >
                              {match.league_name}
                            </Badge>
                            {match.streamUrl && match.streamUrl.length > 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-orange-400 hover:text-orange-300 hover:bg-orange-400/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStreamClick(match);
                                }}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
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
            )}
          </div>
        </div>

        {/* Bottom Section - Quick Links */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="grid md:grid-cols-4 gap-6">
            <Link href="/teams" className="group">
              <div className="p-6 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300">
                <Users className="h-8 w-8 lg:h-10 lg:w-10 2xl:h-12 2xl:w-12 text-orange-400 mb-3" />
                <h3 className="text-lg lg:text-xl 2xl:text-2xl font-semibold text-white mb-2">
                  Browse Teams
                </h3>
                <p className="text-sm lg:text-base 2xl:text-lg text-slate-400">
                  Discover teams and their players
                </p>
              </div>
            </Link>

            <Link
              href={`/seasons/${currentSeasonId}/standings`}
              className="group"
            >
              <div className="p-6 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300">
                <TrendingUp className="h-8 w-8 lg:h-10 lg:w-10 2xl:h-12 2xl:w-12 text-orange-400 mb-3" />
                <h3 className="text-lg lg:text-xl 2xl:text-2xl font-semibold text-white mb-2">
                  View Standings
                </h3>
                <p className="text-sm lg:text-base 2xl:text-lg text-slate-400">
                  Check current league rankings
                </p>
              </div>
            </Link>

            <Link href="/matches" className="group">
              <div className="p-6 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300">
                <Play className="h-8 w-8 lg:h-10 lg:w-10 2xl:h-12 2xl:w-12 text-orange-400 mb-3" />
                <h3 className="text-lg lg:text-xl 2xl:text-2xl font-semibold text-white mb-2">
                  All Matches
                </h3>
                <p className="text-sm lg:text-base 2xl:text-lg text-slate-400">
                  Browse complete match history
                </p>
              </div>
            </Link>

            <Link href="/organizations" className="group">
              <div className="p-6 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300">
                <Users className="h-8 w-8 lg:h-10 lg:w-10 2xl:h-12 2xl:w-12 text-orange-400 mb-3" />
                <h3 className="text-lg lg:text-xl 2xl:text-2xl font-semibold text-white mb-2">
                  Organizations
                </h3>
                <p className="text-sm lg:text-base 2xl:text-lg text-slate-400">
                  Explore participating organizations
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
