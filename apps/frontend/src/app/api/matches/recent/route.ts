import { NextRequest, NextResponse } from "next/server";
import { envConfig } from "../../../../configs/env";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams();

  const seasons = searchParams.getAll("seasons");
  const leagues = searchParams.getAll("leagues");
  const stages = searchParams.getAll("stages");
  const teams = searchParams.getAll("teams");
  const maps = searchParams.getAll("maps");

  if (seasons.length)
    seasons.forEach((season) => params.append("season_ids[]", season));
  if (leagues.length)
    leagues.forEach((league) => params.append("league_ids[]", league));
  if (stages.length)
    stages.forEach((stage) => params.append("stages[]", stage));
  if (teams.length) teams.forEach((team) => params.append("team_ids[]", team));
  if (maps.length) maps.forEach((map) => params.append("map_ids[]", map));

  const queryString = params.toString();

  const response = await fetch(
    `${envConfig.API_URL}/api/v1/matches/recent?${queryString}`
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }

  const data = await response.json();

  return NextResponse.json(data, { status: 200 });
}
