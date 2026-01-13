"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import useSWR from "swr";
import { expressFetcher, cn, createTeamLogoUrl } from "@/lib/utils";
import { AutoBreadcrumbs } from "@/components/layout/AutoBreadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useSeasonLeagues } from "@/hooks/data/useSeasonLeagues";
import { useState } from "react";
import { Trophy, TrendingUp } from "lucide-react";
import { NextImageFallback } from "@/components/layout/NextImageFallback";

type PlayerTier = "bronze" | "silver" | "gold";

interface TopPerformingPlayer {
  steam_id: string;
  nickname: string;
  team_name: string;
  team_logo: string | null;
  total_points: number;
  current_value: number;
  tier: PlayerTier;
  kana_rating: number;
  kd: number;
}

const getTierColor = (tier: PlayerTier) => {
  switch (tier) {
    case "gold":
      return "border-gold-500 bg-gold-500/10 text-gold-400";
    case "silver":
      return "border-silver-500 bg-silver-500/10 text-silver-400";
    case "bronze":
      return "border-bronze-500 bg-bronze-500/10 text-bronze-400";
  }
};

export default function TopPlayersPage() {
  const params = useParams();
  const seasonId = params.season as string;

  const { seasonLeagues, isLoading: isLoadingLeagues } =
    useSeasonLeagues(seasonId);

  // Auto-select first league when loaded
  // Use useMemo for derived state
  const defaultLeagueId = useMemo(() => {
    if (!isLoadingLeagues && seasonLeagues && seasonLeagues.length > 0) {
      return String(seasonLeagues[0]!.id);
    }
    return null;
  }, [seasonLeagues, isLoadingLeagues]);

  // Initialize with defaultLeagueId - use derived value when available
  const [selectedLeagueId, setSelectedLeagueId] = useState<string | undefined>(
    defaultLeagueId || undefined
  );

  const {
    data: players,
    error,
    isLoading
  } = useSWR<TopPerformingPlayer[]>(
    selectedLeagueId
      ? `/api/v1/seasons/${seasonId}/fantasy/leagues/${selectedLeagueId}/top-players`
      : null,
    expressFetcher
  );

  const _selectedLeague = seasonLeagues?.find(
    (l: { id: number }) => String(l.id) === selectedLeagueId
  );

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <AutoBreadcrumbs />
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-destructive">
              Error loading top players: {error.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <AutoBreadcrumbs />
      <div className="fantasy-content-scale">
        <div className="container mx-auto py-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Trophy className="h-8 w-8 text-gold-400" />
                Top Performing Players
              </h1>
              <p className="text-muted-foreground mt-1">
                Players ranked by total fantasy points earned
              </p>
            </div>

            {/* League Selector */}
            {seasonLeagues && seasonLeagues.length > 0 && (
              <Select
                value={selectedLeagueId}
                onValueChange={setSelectedLeagueId}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select league" />
                </SelectTrigger>
                <SelectContent>
                  {seasonLeagues.map((league: { id: number; name: string }) => (
                    <SelectItem key={league.id} value={String(league.id)}>
                      {league.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Players Table */}
          {!isLoading && players && players.length > 0 && (
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16 text-center">Rank</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead className="text-center">Tier</TableHead>
                      <TableHead className="text-right">Total Points</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Rating</TableHead>
                      <TableHead className="text-right">K/D</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {players.map((player, index) => (
                      <TableRow
                        key={player.steam_id}
                        className="hover:bg-neutral-800/50 transition-colors"
                      >
                        {/* Rank */}
                        <TableCell className="text-center">
                          {index < 3 ? (
                            <div
                              className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm mx-auto",
                                index === 0 &&
                                  "bg-gold-500/20 text-gold-400 border-2 border-gold-500",
                                index === 1 &&
                                  "bg-silver-500/20 text-silver-400 border-2 border-silver-500",
                                index === 2 &&
                                  "bg-bronze-500/20 text-bronze-400 border-2 border-bronze-500"
                              )}
                            >
                              {index + 1}
                            </div>
                          ) : (
                            <span className="text-muted-foreground font-medium">
                              {index + 1}
                            </span>
                          )}
                        </TableCell>

                        {/* Player Name */}
                        <TableCell>
                          <div className="font-semibold">{player.nickname}</div>
                        </TableCell>

                        {/* Team */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <NextImageFallback
                              src={
                                player.team_logo
                                  ? createTeamLogoUrl(player.team_logo)
                                  : createTeamLogoUrl(
                                      player.team_name
                                        .toLowerCase()
                                        .replace(/\s+/g, "-") + ".png"
                                    )
                              }
                              alt={player.team_name}
                              width={20}
                              height={20}
                              className="rounded"
                            />
                            <span className="text-sm text-muted-foreground">
                              {player.team_name}
                            </span>
                          </div>
                        </TableCell>

                        {/* Tier */}
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={cn("text-xs", getTierColor(player.tier))}
                          >
                            {player.tier.toUpperCase()}
                          </Badge>
                        </TableCell>

                        {/* Total Points */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <span className="font-bold text-lg text-primary">
                              {player.total_points}
                            </span>
                          </div>
                        </TableCell>

                        {/* Value */}
                        <TableCell className="text-right">
                          <span className="font-semibold text-green-400">
                            €{(player.current_value / 1000).toFixed(0)}K
                          </span>
                        </TableCell>

                        {/* Rating */}
                        <TableCell className="text-right">
                          <span className="font-medium">
                            {player.kana_rating.toFixed(2)}
                          </span>
                        </TableCell>

                        {/* K/D */}
                        <TableCell className="text-right">
                          <span className="font-medium">
                            {player.kd.toFixed(2)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          {/* Loading State */}
          {isLoading && (
            <Card>
              <CardContent className="py-8">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="text-muted-foreground">
                    Loading players...
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {!isLoading && players && players.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground">
                  No player data available yet
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Players will appear here once fantasy points are earned
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
