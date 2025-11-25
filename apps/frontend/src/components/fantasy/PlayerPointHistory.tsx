"use client";

import { useState } from "react";
import useSWR from "swr";
import { expressFetcher, cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Trophy
} from "lucide-react";
import { format } from "date-fns";

interface PointsBreakdown {
  kills: number;
  deaths: number;
  assists: number;
  flash_assists: number;
  opening_kills: number;
  opening_deaths: number;
  multi_kills: number;
  clutches: number;
  mvps: number;
  team_result: number;
  adr_bonus: number;
  kd_bonus: number;
  kast_bonus: number;
  hs_bonus: number;
  role_multiplier: number;
}

interface MatchPointHistory {
  match_game_id: number;
  match_date: string;
  opponent: string;
  opponent_logo: string | null;
  map_name: string;
  points_earned: number;
  individual_points: number;
  team_points: number;
  role_points: number;
  stats_breakdown: {
    kills: number;
    deaths: number;
    assists: number;
    flash_assists: number;
    first_kills: number;
    first_deaths: number;
    kills_3: number;
    kills_4: number;
    kills_5: number;
    clutches_won: number;
    awp_kills: number;
    mvps: number;
    kana_rating: number;
    kd: number;
    adr: number;
    kast: number;
    hs_percent: number;
    team_won: boolean;
  };
  points_breakdown: PointsBreakdown;
}

interface PlayerPointHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerId: string;
  playerName: string;
  seasonId: string;
}

export default function PlayerPointHistory({
  open,
  onOpenChange,
  playerId,
  playerName,
  seasonId
}: PlayerPointHistoryProps) {
  const [expandedMatches, setExpandedMatches] = useState<Set<number>>(
    new Set()
  );

  const authenticatedFetcher = (url: string): Promise<MatchPointHistory[]> =>
    expressFetcher<MatchPointHistory[]>(url, { credentials: "include" });

  const {
    data: history,
    error,
    isLoading
  } = useSWR<MatchPointHistory[]>(
    open && playerId
      ? `/api/v1/seasons/${seasonId}/fantasy/teams/me/players/${playerId}/points`
      : null,
    authenticatedFetcher
  );

  const toggleMatchExpanded = (matchId: number) => {
    const newExpanded = new Set(expandedMatches);
    if (newExpanded.has(matchId)) {
      newExpanded.delete(matchId);
    } else {
      newExpanded.add(matchId);
    }
    setExpandedMatches(newExpanded);
  };

  const totalPoints =
    history?.reduce((sum, match) => sum + match.points_earned, 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[720px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {playerName} - Point History
          </DialogTitle>
          <DialogDescription className="text-sm">
            Detailed breakdown of fantasy points earned per match
          </DialogDescription>
        </DialogHeader>

        {/* Total Points Summary */}
        <div className="flex items-center justify-center gap-3 p-3 bg-primary/10 rounded-lg border border-primary/20">
          <Trophy className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Total Points Earned</p>
            <p className="text-2xl font-bold text-primary">{totalPoints}</p>
          </div>
        </div>

        {/* Match History */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-20" />
                </Card>
              ))}
            </div>
          )}

          {error && (
            <Card>
              <CardContent className="py-8 text-center text-destructive">
                Error loading point history: {error.message}
              </CardContent>
            </Card>
          )}

          {!isLoading && history && history.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No match data available yet
              </CardContent>
            </Card>
          )}

          {!isLoading &&
            history &&
            history.map((match) => {
              const isExpanded = expandedMatches.has(match.match_game_id);
              const isPositive = match.points_earned >= 0;

              return (
                <Card key={match.match_game_id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Match Header - Clickable */}
                    <button
                      onClick={() => toggleMatchExpanded(match.match_game_id)}
                      className="w-full p-4 hover:bg-neutral-900/50 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div
                          className={cn(
                            "flex items-center justify-center w-12 h-12 rounded-lg font-bold text-lg",
                            isPositive
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          )}
                        >
                          {isPositive ? (
                            <TrendingUp className="h-6 w-6" />
                          ) : (
                            <TrendingDown className="h-6 w-6" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {match.map_name}
                            </span>
                            <span className="text-muted-foreground">
                              vs {match.opponent}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(match.match_date), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p
                            className={cn(
                              "text-2xl font-bold",
                              isPositive ? "text-green-400" : "text-red-400"
                            )}
                          >
                            {isPositive ? "+" : ""}
                            {match.points_earned}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            points
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3 border-t border-neutral-800">
                        {/* Individual Points */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              Individual Points
                            </span>
                            <Badge variant="outline">
                              {match.individual_points}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {/* Kills/Deaths are factored into rating, not shown as separate points */}
                            {match.points_breakdown?.assists > 0 && (
                              <div className="flex justify-between text-green-400">
                                <span>Assists:</span>
                                <span>+{match.points_breakdown.assists}</span>
                              </div>
                            )}
                            {match.points_breakdown?.flash_assists > 0 && (
                              <div className="flex justify-between text-green-400">
                                <span>Flash Assists:</span>
                                <span>
                                  +{match.points_breakdown.flash_assists}
                                </span>
                              </div>
                            )}
                            {match.points_breakdown?.opening_kills > 0 && (
                              <div className="flex justify-between text-green-400">
                                <span>Opening Kills:</span>
                                <span>
                                  +{match.points_breakdown.opening_kills}
                                </span>
                              </div>
                            )}
                            {match.points_breakdown?.opening_deaths < 0 && (
                              <div className="flex justify-between text-red-400">
                                <span>Opening Deaths:</span>
                                <span>
                                  {match.points_breakdown.opening_deaths}
                                </span>
                              </div>
                            )}
                            {match.points_breakdown?.multi_kills > 0 && (
                              <div className="flex justify-between text-green-400">
                                <span>Multi-kills:</span>
                                <span>
                                  +{match.points_breakdown.multi_kills}
                                </span>
                              </div>
                            )}
                            {match.points_breakdown?.clutches > 0 && (
                              <div className="flex justify-between text-green-400">
                                <span>Clutches:</span>
                                <span>+{match.points_breakdown.clutches}</span>
                              </div>
                            )}
                            {match.points_breakdown?.mvps > 0 && (
                              <div className="flex justify-between text-green-400">
                                <span>MVPs:</span>
                                <span>+{match.points_breakdown.mvps}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Bonuses */}
                        {(match.points_breakdown?.adr_bonus > 0 ||
                          match.points_breakdown?.kd_bonus > 0 ||
                          match.points_breakdown?.kast_bonus > 0 ||
                          match.points_breakdown?.hs_bonus > 0) && (
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">
                                Performance Bonuses
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {match.points_breakdown?.adr_bonus > 0 && (
                                <div className="flex justify-between text-blue-400">
                                  <span>ADR Bonus:</span>
                                  <span>
                                    +{match.points_breakdown.adr_bonus}
                                  </span>
                                </div>
                              )}
                              {match.points_breakdown?.kd_bonus > 0 && (
                                <div className="flex justify-between text-blue-400">
                                  <span>K/D Bonus:</span>
                                  <span>
                                    +{match.points_breakdown.kd_bonus}
                                  </span>
                                </div>
                              )}
                              {match.points_breakdown?.kast_bonus > 0 && (
                                <div className="flex justify-between text-blue-400">
                                  <span>KAST Bonus:</span>
                                  <span>
                                    +{match.points_breakdown.kast_bonus}
                                  </span>
                                </div>
                              )}
                              {match.points_breakdown?.hs_bonus > 0 && (
                                <div className="flex justify-between text-blue-400">
                                  <span>HS% Bonus:</span>
                                  <span>
                                    +{match.points_breakdown.hs_bonus}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Team Result Points */}
                        <div
                          className={cn(
                            "p-2 rounded border",
                            match.team_points > 0
                              ? "bg-green-500/10 border-green-500/20"
                              : "bg-red-500/10 border-red-500/20"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">
                              Team Result
                            </span>
                            <Badge variant="outline">{match.team_points}</Badge>
                          </div>
                          <div
                            className={cn(
                              "text-xs",
                              match.team_points > 0
                                ? "text-green-400"
                                : "text-red-400"
                            )}
                          >
                            {match.team_points > 0
                              ? "Match Won (+5)"
                              : "Match Lost (-5)"}
                          </div>
                        </div>

                        {/* Role Bonus */}
                        {match.role_points > 0 && (
                          <div className="p-2 bg-purple-500/10 rounded border border-purple-500/20">
                            <div className="flex justify-between text-purple-400">
                              <span className="font-medium">Role Bonus:</span>
                              <span className="font-bold">
                                +{match.role_points}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
