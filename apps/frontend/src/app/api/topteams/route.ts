import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "@/configs/env";

interface BackendTeamStats {
  team_id: number;
  team_name: string;
  team_logo: string;
  league_name: string;
  matches_played: number;
  kana: number;
  rank: number;
  stage: number;
}

interface RawBackendTeamStats {
  team_id: number;
  team_name: string;
  team_logo: string;
  league_name: string;
  matches_played: number;
  kana: string | number;
  rank: number;
  stage: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const seasons = searchParams.getAll("seasons");
  const leagues = searchParams.getAll("leagues");
  const stages = searchParams.getAll("stages");
  const maps = searchParams.getAll("maps");
  const availableLeagues = searchParams.getAll("availableLeagues");

  // If no leagues selected, fetch all available leagues
  const leaguesToQuery = leagues.length > 0 ? leagues : availableLeagues;
  const seasonsToQuery = seasons.length > 0 ? seasons : [];

  // If no stages selected, default to regular season (stage 1)
  const stagesToQuery = stages.length > 0 ? stages : ["1"];

  const allResults: BackendTeamStats[] = [];

  // Fetch data for each combination of league and season
  for (const leagueId of leaguesToQuery) {
    for (const seasonId of seasonsToQuery) {
      const url = new URL(`${envConfig.API_URL}/api/v1/topteams`);
      url.searchParams.append("league_id", leagueId);
      url.searchParams.append("season_id", seasonId);

      // Add each stage as a separate parameter
      stagesToQuery.forEach((stage) => {
        url.searchParams.append("stage", stage);
      });

      if (maps.length > 0) {
        maps.forEach((mapId) => {
          url.searchParams.append("map_id", mapId);
        });
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        return NextResponse.json(
          { error: "Failed to fetch top teams" },
          { status: 500 }
        );
      }

      const data = (await response.json()) as RawBackendTeamStats[];
      // Ensure kana is a number
      const processedData = data.map((team) => ({
        ...team,
        kana: Number(team.kana)
      }));
      allResults.push(...processedData);
    }
  }

  return NextResponse.json(allResults, { status: 200 });
}
