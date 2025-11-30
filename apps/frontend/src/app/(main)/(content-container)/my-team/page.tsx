"use client";

import { useMyTeams } from "@/hooks/data/user/useMyTeams";
import { useMyTeamsUpcomingMatches } from "@/hooks/data/user/useMyTeamsUpcomingMatches";
import { TeamChampionshipLinks } from "@/components/my-team/TeamChampionshipLinks";
import { TeamEditDialog } from "@/components/my-team/TeamEditDialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Users, CalendarDays, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { createNextUrl, createTeamLogoUrl } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";
import { SteamLoginButton } from "@/components/profile/SteamLoginButton";
import { ContentContainer } from "@/components/layout/ContentContainer";

export default function MyTeamPage() {
  const auth = useAuth();
  const { teams, isLoading: teamsLoading, isError: teamsError } = useMyTeams();
  const {
    matches,
    isLoading: matchesLoading,
    isError: matchesError
  } = useMyTeamsUpcomingMatches();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const formatMatchDateTime = (date: string, time: string) => {
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getFaceitMatchLink = (
    external_match_room_id: string | null,
    platform: string | null
  ) => {
    if (platform === "faceit" && external_match_room_id) {
      return `https://www.faceit.com/en/cs2/room/${external_match_room_id}`;
    }
    return null;
  };

  // Check authentication first
  if (auth.loading) {
    return (
      <div className="space-y-6">
        <h1 className="pb-4">My Team</h1>
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (!auth.user) {
    return (
      <ContentContainer classNames="flex-col space-y-4">
        <div>Please log in to view your team.</div>
        <SteamLoginButton />
      </ContentContainer>
    );
  }

  // Now check data loading (only if authenticated)
  if (teamsLoading || matchesLoading) {
    return (
      <div className="space-y-6">
        <h1 className="pb-4">My Team</h1>
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (teamsError || matchesError) {
    return (
      <div className="space-y-6">
        <h1 className="pb-4">My Team</h1>
        <Alert variant="destructive">
          <AlertDescription>
            Failed to load team information. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="pb-4">My Team</h1>
        <Alert>
          <AlertDescription>
            You are not currently a member of any team. Join or create a team to
            see information here.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="pb-4">My Team</h1>

      {/* Upcoming Matches Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Upcoming Matches
          </CardTitle>
          <CardDescription>Your team&apos;s scheduled matches</CardDescription>
        </CardHeader>
        <CardContent>
          {matches.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No upcoming matches scheduled
            </p>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => {
                const faceitLink = getFaceitMatchLink(
                  match.external_match_room_id,
                  match.platform
                );
                return (
                  <div
                    key={match.match_id}
                    className="border-border flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={createNextUrl(`/matches/${match.match_id}`)}
                          className="hover:underline"
                        >
                          <span className="font-semibold">
                            {match.team_name}
                          </span>
                        </Link>
                        <span className="text-muted-foreground">vs</span>
                        <span className="font-semibold">
                          {match.opponent_team_name}
                        </span>
                        <Badge variant="outline">BO{match.best_of}</Badge>
                        <Badge
                          variant={
                            match.status === "ONGOING" ? "default" : "secondary"
                          }
                        >
                          {match.status}
                        </Badge>
                      </div>
                      <div className="text-muted-foreground mt-1 text-sm">
                        {formatMatchDateTime(
                          match.match_date,
                          match.start_time
                        )}{" "}
                        • {match.season_name} - {match.league_name}
                      </div>
                    </div>
                    {faceitLink && (
                      <Button variant="ghost" size="sm" asChild>
                        <a
                          href={faceitLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                          FaceIT
                        </a>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Teams Section */}
      {teams.map((team) => {
        const isCaptain = team.players.some(
          (p) => p.is_captain || p.is_co_captain
        );
        const teamLogoUrl = createTeamLogoUrl(team.team_logo);

        return (
          <Card key={`${team.team_id}-${team.season_id}`}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="border-border flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border">
                    <Image
                      src={teamLogoUrl || "/placeholder-team.png"}
                      alt={`${team.team_name} logo`}
                      width={64}
                      height={64}
                      className="h-full w-full object-contain"
                      unoptimized
                    />
                  </div>
                  {isCaptain && (
                    <TeamEditDialog
                      teamId={team.team_id}
                      currentLogoUrl={teamLogoUrl}
                      currentTeamName={team.team_name}
                    />
                  )}
                </div>
                <div className="flex-1 flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>
                      <Link
                        href={createNextUrl(`/teams/${team.team_id}`)}
                        className="hover:underline"
                      >
                        {team.team_name}
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      {team.season_name} - {team.league_name}
                    </CardDescription>
                  </div>
                  <TeamChampionshipLinks team={team} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Users className="h-4 w-4" />
                  Team Members ({team.players.length})
                </div>
                <div className="space-y-2">
                  {team.players
                    .sort((a, b) => {
                      if (a.is_captain) return -1;
                      if (b.is_captain) return 1;
                      if (a.is_co_captain) return -1;
                      if (b.is_co_captain) return 1;
                      if (a.role === "primary" && b.role === "substitute")
                        return -1;
                      if (a.role === "substitute" && b.role === "primary")
                        return 1;
                      return 0;
                    })
                    .map((player) => (
                      <div
                        key={player.steam_id}
                        className="border-border flex items-center justify-between rounded border p-3"
                      >
                        <div className="flex items-center gap-2">
                          <Link
                            href={createNextUrl(`/players/${player.steam_id}`)}
                            className="hover:underline"
                          >
                            <span className="font-medium">
                              {player.nickname}
                            </span>
                          </Link>
                          {player.is_captain && (
                            <Badge variant="default">Captain</Badge>
                          )}
                          {player.is_co_captain && (
                            <Badge variant="secondary">Co-Captain</Badge>
                          )}
                          {player.role === "substitute" && (
                            <Badge variant="outline">Substitute</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-muted-foreground bg-muted rounded px-2 py-1 text-xs">
                            {player.steam_id}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(player.steam_id)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
