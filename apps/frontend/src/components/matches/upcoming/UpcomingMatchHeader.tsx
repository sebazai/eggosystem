"use client";

import { NextImageFallback } from "@/components/layout/NextImageFallback";
import {
  cn,
  createExternalMatchRoomUrl,
  createNextUrl,
  createTeamLogoUrl
} from "@/lib/utils";
import type { MatchInfo } from "@eggosystem/types";

import Link from "next/link";
import { Tv } from "lucide-react";
import { useMatchStreamUrls } from "@/hooks/data/useMatchStreamUrls";
import { FaceitLink } from "../../ui/FaceitLink";

interface UpcomingMatchHeaderProps {
  matchId: number;
  matchInfo: MatchInfo;
}

export function UpcomingMatchHeader({
  matchId,
  matchInfo
}: UpcomingMatchHeaderProps) {
  // Get teams data safely (teams is now an array)
  // Fetch stream URLs for this match
  const { streamUrls } = useMatchStreamUrls(matchId);
  const teams = Object.values(matchInfo.teams);
  const team1 = teams?.[0] ?? {
    id: 0,
    name: "Team 1",
    logo: "",
    rank: null,
    organization_name: ""
  };

  const team2 = teams?.[1] ?? {
    id: 0,
    name: "Team 2",
    logo: "",
    rank: null,
    organization_name: ""
  };

  const matchDate = matchInfo.match_date || "";
  const seasonName = matchInfo.season_name;
  const seasonId = matchInfo.season_id;
  const leagueName = matchInfo.league_name;
  const leagueId = matchInfo.league_id;
  const externalMatchRoomId = matchInfo.external_match_room_id;
  const seasonPlatform = matchInfo.season_platform;

  const faceitMatchRoomUrl = createExternalMatchRoomUrl(
    externalMatchRoomId,
    seasonPlatform
  );

  // Parse date for formatting
  const date = matchDate ? new Date(matchDate) : new Date();

  const formatDate = (date: Date) =>
    date
      .toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "2-digit"
      })
      .toUpperCase(); // MMM DD, YY

  const formattedDate = formatDate(date);

  // For upcoming matches, we use a placeholder for the score
  const placeholderScore = "?";

  // Check if we have any stream URLs available
  const hasStreamUrls = streamUrls && streamUrls.length > 0;
  const primaryStreamUrl = hasStreamUrls ? streamUrls[0] : null;

  return (
    <div
      className={cn(
        "w-full dark:bg-kanaliiga-orange/30 bg-kanaliiga-orange/50"
      )}
    >
      <div className="mx-auto px-4 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-4">
        {/* Team 1 */}
        <div className="flex flex-col-reverse md:flex-row items-center gap-2 text-center md:text-left justify-self-start md:justify-self-end">
          <div className="flex flex-col items-center md:items-start">
            <Link
              href={createNextUrl(
                `/teams/${team1.id}?seasons=${seasonId}&leagues=${leagueId}`
              )}
              className="text-md md:text-xl font-bold px-2 py-1 break-words max-w-50 lg:max-w-full"
            >
              {team1.name}
            </Link>
            {team1.rank && (
              <span className="text-xs md:text-sm text-muted-foreground px-2">
                Ranking #{team1.rank}
              </span>
            )}
          </div>
          <Link
            href={createNextUrl(
              `/teams/${team1.id}?seasons=${seasonId}&leagues=${leagueId}`
            )}
            className="h-10 w-10 md:h-14 md:w-14 relative"
          >
            <NextImageFallback
              src={
                team1.logo
                  ? createTeamLogoUrl(team1.logo)
                  : "/team-images/nologo.png"
              }
              alt={`${team1.name} logo`}
              fill
              className="object-contain"
            />
          </Link>
        </div>

        {/* Score (centered) - For upcoming matches */}
        <div className="flex flex-col items-center gap-1 justify-self-center text-center">
          {/* Score with question marks */}
          <div className="flex items-center gap-1 justify-self-center text-center">
            <div className="flex items-center justify-center px-2 py-4">
              <span className="font-extrabold text-4xl md:text-5xl text-pink-500">
                {placeholderScore}
              </span>
            </div>
            {/* Info */}
            <div className="hidden xs:flex flex-col items-center justify-center px-4 py-6 text-xxs md:text-xs text-muted-foreground space-y-0.5">
              <span>UPCOMING</span>
              <span>{formattedDate}</span>
              <span>
                {seasonName} {leagueName}
              </span>
              {hasStreamUrls && primaryStreamUrl && (
                <Link
                  href={primaryStreamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center mt-1 text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <Tv className="w-3 h-3 mr-1" />
                  <span>ON TWITCH</span>
                </Link>
              )}
              {faceitMatchRoomUrl && (
                <div className="flex items-center mt-1 text-blue-400 hover:text-blue-300">
                  <FaceitLink href={faceitMatchRoomUrl} iconSize="sm">
                    <span className="font-semibold">MATCH ROOM</span>
                  </FaceitLink>
                </div>
              )}
            </div>
            <div className="xs:hidden">-</div>
            {/* Score 2 */}
            <div className="flex items-center justify-center px-2 py-4">
              <span className="font-extrabold text-4xl md:text-5xl text-green-400">
                {placeholderScore}
              </span>
            </div>
          </div>
          <div className="block xs:hidden text-xxs md:text-xs text-muted-foreground space-y-0.5">
            <div>
              {seasonName} {leagueName}
            </div>
            {hasStreamUrls && primaryStreamUrl && (
              <Link
                href={primaryStreamUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center mt-1 text-purple-400 hover:text-purple-300 transition-colors"
              >
                <Tv className="w-3 h-3 mr-1" />
                <span>ON TWITCH</span>
              </Link>
            )}
            {faceitMatchRoomUrl && (
              <div className="flex items-center justify-center mt-1 text-blue-400 hover:text-blue-300">
                <FaceitLink href={faceitMatchRoomUrl} iconSize="sm">
                  <span className="font-semibold">MATCH ROOM</span>
                </FaceitLink>
              </div>
            )}
          </div>
        </div>

        {/* Team 2 */}
        <div className="flex flex-col-reverse md:flex-row-reverse items-center gap-2 text-center md:text-left justify-self-end md:justify-self-start">
          <div className="flex flex-col items-center md:items-start">
            <Link
              href={createNextUrl(
                `/teams/${team2.id}?seasons=${seasonId}&leagues=${leagueId}`
              )}
              className="text-md md:text-xl font-bold px-2 py-1 break-words max-w-50 lg:max-w-full"
            >
              {team2.name}
            </Link>
            {team2.rank && (
              <span className="text-xs md:text-sm text-muted-foreground px-2">
                Ranking #{team2.rank}
              </span>
            )}
          </div>
          <Link
            href={createNextUrl(
              `/teams/${team2.id}?seasons=${seasonId}&leagues=${leagueId}`
            )}
            className="h-10 w-10 md:h-14 md:w-14 relative"
          >
            <NextImageFallback
              src={
                team2.logo
                  ? createTeamLogoUrl(team2.logo)
                  : "/team-images/nologo.png"
              }
              alt={`${team2.name} logo`}
              fill
              className="object-contain"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
