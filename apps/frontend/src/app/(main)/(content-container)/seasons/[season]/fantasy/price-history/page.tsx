"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import useSWR from "swr";
import { expressFetcher } from "@/lib/utils";
import { AutoBreadcrumbs } from "@/components/layout/AutoBreadcrumbs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/loading";
import { Skeleton } from "@/components/ui/skeleton";

interface PriceHistoryEntry {
  player_id: string;
  nickname: string;
  team_name: string;
  current_value: number;
  current_tier: string;
  previous_value: number | null;
  value_change: number;
  value_change_percent: number;
  value_history: Array<{
    week_number: number;
    value: number;
    tier: string;
  }>;
}

type SortOption = "change" | "value" | "name";
type TierFilter = "all" | "gold" | "silver" | "bronze";

export default function FantasyPriceHistoryPage() {
  const params = useParams();
  const seasonId = params.season as string;
  const leagueId = 1; // You may want to add league selection

  const [sortBy, setSortBy] = useState<SortOption>("change");
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");

  const { data, error, isLoading } = useSWR<PriceHistoryEntry[]>(
    `/api/v1/seasons/${seasonId}/fantasy/leagues/${leagueId}/price-history`,
    expressFetcher
  );

  const formatCurrency = (value: number) => {
    return `$${(value / 1000).toFixed(0)}K`;
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case "gold":
        return "bg-yellow-500 text-white";
      case "silver":
        return "bg-slate-400 text-white";
      case "bronze":
        return "bg-amber-600 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  if (isLoading) {
    return (
      <>
        <AutoBreadcrumbs />
        <div className="fantasy-content-scale">
          <div className="container mx-auto py-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl font-bold">
                  Fantasy Price History
                </CardTitle>
                <CardDescription>
                  Track player value changes throughout the season
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <Skeleton className="h-4 w-16 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="flex-1">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <TableSkeleton rows={10} columns={7} showHeader={false} />
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <AutoBreadcrumbs />
        <div className="fantasy-content-scale">
          <div className="container mx-auto py-8">
            <Card>
              <CardHeader>
                <CardTitle>Fantasy Price History</CardTitle>
                <CardDescription className="text-red-500">
                  Error loading price history
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </>
    );
  }

  // Filter and sort data
  let filteredData = [...data];

  // Apply tier filter
  if (tierFilter !== "all") {
    filteredData = filteredData.filter(
      (player) => player.current_tier.toLowerCase() === tierFilter
    );
  }

  // Apply sort
  filteredData.sort((a, b) => {
    switch (sortBy) {
      case "change":
        return Math.abs(b.value_change) - Math.abs(a.value_change);
      case "value":
        return b.current_value - a.current_value;
      case "name":
        return a.nickname.localeCompare(b.nickname);
      default:
        return 0;
    }
  });

  return (
    <>
      <AutoBreadcrumbs />
      <div className="fantasy-content-scale">
        <div className="container mx-auto py-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold">
                Fantasy Price History
              </CardTitle>
              <CardDescription>
                Track player value changes throughout the season
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">
                    Sort By
                  </label>
                  <Select
                    value={sortBy}
                    onValueChange={(v) => setSortBy(v as SortOption)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="change">Biggest Change</SelectItem>
                      <SelectItem value="value">Current Value</SelectItem>
                      <SelectItem value="name">Player Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">
                    Filter by Tier
                  </label>
                  <Select
                    value={tierFilter}
                    onValueChange={(v) => setTierFilter(v as TierFilter)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="gold">Gold</SelectItem>
                      <SelectItem value="silver">Silver</SelectItem>
                      <SelectItem value="bronze">Bronze</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Table>
                <TableCaption>
                  Showing {filteredData.length} player
                  {filteredData.length !== 1 && "s"}
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead className="text-right">Current Value</TableHead>
                    <TableHead className="text-right">Previous Value</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                    <TableHead className="text-right">% Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((player) => (
                    <TableRow key={player.player_id}>
                      <TableCell className="font-medium">
                        {player.nickname}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {player.team_name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "uppercase text-xs",
                            getTierBadgeColor(player.current_tier)
                          )}
                        >
                          {player.current_tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(player.current_value)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-muted-foreground">
                        {player.previous_value
                          ? formatCurrency(player.previous_value)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {getChangeIcon(player.value_change)}
                          <span
                            className={cn(
                              "font-mono",
                              player.value_change > 0 &&
                                "text-green-600 dark:text-green-400",
                              player.value_change < 0 &&
                                "text-red-600 dark:text-red-400"
                            )}
                          >
                            {player.value_change > 0 && "+"}
                            {formatCurrency(Math.abs(player.value_change))}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={cn(
                            "font-mono",
                            player.value_change_percent > 0 &&
                              "text-green-600 dark:text-green-400",
                            player.value_change_percent < 0 &&
                              "text-red-600 dark:text-red-400"
                          )}
                        >
                          {player.value_change_percent > 0 && "+"}
                          {player.value_change_percent.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
