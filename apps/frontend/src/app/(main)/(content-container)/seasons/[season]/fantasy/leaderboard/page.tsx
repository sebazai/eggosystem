"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Trophy, Medal, Award, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSeasonLeagues } from "@/hooks/data/useSeasonLeagues";
import TeamViewDialog from "@/components/fantasy/TeamViewDialog";
import type { MyFantasyTeam } from "@/hooks/data/useMyFantasyTeam";
import { useState } from "react";

interface LeaderboardEntry {
  rank: number;
  fantasy_team_id: number;
  steam_id?: string;
  team_name: string | null;
  owner_name: string;
  total_points: number;
  is_current_user: boolean;
  league_name?: string; // For overall leaderboard
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  currentUserRank: number | null;
}

export default function FantasyLeaderboardPage() {
  const params = useParams();
  const seasonId = params.season as string;

  // Fetch available leagues
  const { seasonLeagues, isLoading: isLoadingLeagues } =
    useSeasonLeagues(seasonId);

  // Try to get user's team to determine their league (optional - doesn't require auth)
  const { data: myTeam } = useSWR(
    `/api/v1/seasons/${seasonId}/fantasy/teams/me`,
    (url: string) => expressFetcher(url, { credentials: "include" }),
    {
      shouldRetryOnError: false,
      onError: () => {
        // Silently ignore auth errors - user is not logged in
      }
    }
  );

  // Determine default league: user's league if they have one, otherwise first available league
  const defaultLeagueId =
    (myTeam as { league_id?: number })?.league_id ||
    (seasonLeagues && seasonLeagues.length > 0 ? seasonLeagues[0]!.id : 1);

  const [viewMode, setViewMode] = useState<"division" | "overall">("division");
  const [selectedLeagueId, setSelectedLeagueId] =
    useState<number>(defaultLeagueId);

  // Team view dialog state
  const [selectedTeam, setSelectedTeam] = useState<MyFantasyTeam | null>(null);
  const [teamViewDialogOpen, setTeamViewDialogOpen] = useState(false);

  // Update selected league when user's league loads or when leagues are fetched
  useEffect(() => {
    if (defaultLeagueId && selectedLeagueId !== defaultLeagueId) {
      setSelectedLeagueId(defaultLeagueId);
    }
  }, [defaultLeagueId, selectedLeagueId]);

  // Fetch division-specific leaderboard
  const {
    data: divisionData,
    error: divisionError,
    isLoading: divisionLoading
  } = useSWR<LeaderboardResponse>(
    viewMode === "division"
      ? `/api/v1/seasons/${seasonId}/fantasy/leagues/${selectedLeagueId}/leaderboard`
      : null,
    expressFetcher
  );

  // Fetch overall leaderboard
  const {
    data: overallData,
    error: overallError,
    isLoading: overallLoading
  } = useSWR<LeaderboardResponse>(
    viewMode === "overall"
      ? `/api/v1/seasons/${seasonId}/fantasy/overall-leaderboard`
      : null,
    expressFetcher
  );

  const data = viewMode === "division" ? divisionData : overallData;
  const error = viewMode === "division" ? divisionError : overallError;
  const isLoading = viewMode === "division" ? divisionLoading : overallLoading;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return null;
    }
  };

  const handleViewTeam = async (entry: LeaderboardEntry) => {
    if (!entry.steam_id) {
      console.error("No steam_id in entry:", entry);
      return;
    }

    const url = `/api/v1/seasons/${seasonId}/fantasy/teams/${entry.steam_id}`;
    console.log("Fetching team details from:", url);

    try {
      const teamData = await expressFetcher<MyFantasyTeam>(url);
      console.log("Team data received:", teamData);
      setSelectedTeam(teamData);
      setTeamViewDialogOpen(true);
    } catch (error) {
      console.error("Failed to fetch team details:", error);
    }
  };

  if (isLoading) {
    return (
      <>
        <AutoBreadcrumbs />
        <div className="fantasy-content-scale">
          <div className="container mx-auto py-8">
            <Card>
              <CardHeader>
                <CardTitle>Fantasy League Leaderboard</CardTitle>
                <CardDescription>Loading...</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <AutoBreadcrumbs />
        <div className="fantasy-content-scale">
          <div className="container mx-auto py-8">
            <Card>
              <CardHeader>
                <CardTitle>Fantasy League Leaderboard</CardTitle>
                <CardDescription className="text-red-500">
                  Error loading leaderboard
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </>
    );
  }

  if (!data || data.leaderboard.length === 0) {
    return (
      <>
        <AutoBreadcrumbs />
        <div className="fantasy-content-scale">
          <div className="container mx-auto py-8">
            <Card>
              <CardHeader>
                <CardTitle>Fantasy League Leaderboard</CardTitle>
                <CardDescription>
                  No teams have been created yet. Be the first to create a
                  fantasy team!
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </>
    );
  }

  const selectedLeague = seasonLeagues?.find(
    (l: { id: number }) => l.id === selectedLeagueId
  );

  return (
    <>
      <AutoBreadcrumbs />
      <div className="fantasy-content-scale">
        <div className="container mx-auto py-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-bold">
                Fantasy League Leaderboard
              </CardTitle>
              <CardDescription>
                Top 50 fantasy teams ranked by total points
              </CardDescription>
              <div className="mt-2 text-sm text-muted-foreground">
                💡 Click on any team row to view their full roster and details
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs
                value={viewMode}
                onValueChange={(v) => setViewMode(v as "division" | "overall")}
              >
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="division">Division</TabsTrigger>
                    <TabsTrigger value="overall">
                      <Globe className="h-4 w-4 mr-2" />
                      Overall
                    </TabsTrigger>
                  </TabsList>

                  {viewMode === "division" &&
                    !isLoadingLeagues &&
                    seasonLeagues &&
                    seasonLeagues.length > 0 && (
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Division:</label>
                        <Select
                          value={selectedLeagueId.toString()}
                          onValueChange={(v) =>
                            setSelectedLeagueId(parseInt(v))
                          }
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select division" />
                          </SelectTrigger>
                          <SelectContent>
                            {seasonLeagues.map(
                              (league: { id: number; name: string }) => (
                                <SelectItem
                                  key={league.id}
                                  value={league.id.toString()}
                                >
                                  {league.name}
                                  {myTeam &&
                                  league.id ===
                                    (myTeam as { league_id?: number })
                                      ?.league_id
                                    ? " (Your Division)"
                                    : ""}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                </div>

                <TabsContent value="division" className="mt-6">
                  {divisionLoading ? (
                    <p className="text-center text-muted-foreground py-8">
                      Loading...
                    </p>
                  ) : divisionError ? (
                    <p className="text-center text-red-500 py-8">
                      Error loading leaderboard
                    </p>
                  ) : !divisionData || divisionData.leaderboard.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No teams in this division yet
                    </p>
                  ) : (
                    <>
                      {divisionData.currentUserRank &&
                        divisionData.currentUserRank > 50 && (
                          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                              Your team is ranked{" "}
                              <strong>#{divisionData.currentUserRank}</strong>{" "}
                              in {selectedLeague?.name || "this division"}
                            </p>
                          </div>
                        )}

                      <Table>
                        <TableCaption>
                          {selectedLeague?.name || "Division"} standings
                        </TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-20">Rank</TableHead>
                            <TableHead>Team Owner</TableHead>
                            <TableHead>Team Name</TableHead>
                            <TableHead className="text-right">
                              Total Points
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {divisionData.leaderboard.map((entry) => (
                            <TableRow
                              key={entry.fantasy_team_id}
                              className={cn(
                                entry.is_current_user &&
                                  "bg-blue-50 dark:bg-blue-950 font-semibold",
                                "cursor-pointer hover:bg-neutral-800/50 transition-colors"
                              )}
                              onClick={() => handleViewTeam(entry)}
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {getRankIcon(entry.rank)}
                                  <span
                                    className={cn(
                                      entry.rank <= 3 && "font-bold text-lg"
                                    )}
                                  >
                                    #{entry.rank}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {entry.owner_name}
                                  {entry.is_current_user && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      You
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {entry.team_name || (
                                  <span className="text-muted-foreground italic">
                                    Unnamed Team
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {entry.total_points.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="overall" className="mt-6">
                  {overallLoading ? (
                    <p className="text-center text-muted-foreground py-8">
                      Loading...
                    </p>
                  ) : overallError ? (
                    <p className="text-center text-red-500 py-8">
                      Error loading overall leaderboard
                    </p>
                  ) : !overallData || overallData.leaderboard.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No teams have been created yet
                    </p>
                  ) : (
                    <>
                      {overallData.currentUserRank &&
                        overallData.currentUserRank > 50 && (
                          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <p className="text-sm text-blue-900 dark:text-blue-100">
                              Your team is ranked{" "}
                              <strong>#{overallData.currentUserRank}</strong>{" "}
                              overall (across all divisions)
                            </p>
                          </div>
                        )}

                      <Table>
                        <TableCaption>
                          Overall standings across all divisions
                        </TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-20">Rank</TableHead>
                            <TableHead>Team Owner</TableHead>
                            <TableHead>Team Name</TableHead>
                            <TableHead>Division</TableHead>
                            <TableHead className="text-right">
                              Total Points
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {overallData.leaderboard.map((entry) => (
                            <TableRow
                              key={entry.fantasy_team_id}
                              className={cn(
                                entry.is_current_user &&
                                  "bg-blue-50 dark:bg-blue-950 font-semibold",
                                "cursor-pointer hover:bg-neutral-800/50 transition-colors"
                              )}
                              onClick={() => handleViewTeam(entry)}
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {getRankIcon(entry.rank)}
                                  <span
                                    className={cn(
                                      entry.rank <= 3 && "font-bold text-lg"
                                    )}
                                  >
                                    #{entry.rank}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {entry.owner_name}
                                  {entry.is_current_user && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      You
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {entry.team_name || (
                                  <span className="text-muted-foreground italic">
                                    Unnamed Team
                                  </span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs">
                                  {entry.league_name || "Unknown"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {entry.total_points.toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Team View Dialog */}
          <TeamViewDialog
            open={teamViewDialogOpen}
            onOpenChange={setTeamViewDialogOpen}
            team={selectedTeam}
          />
        </div>
      </div>
    </>
  );
}
