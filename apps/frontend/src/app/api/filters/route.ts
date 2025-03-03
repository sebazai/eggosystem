import { envConfig } from "@/configs/env";
import { NextRequest, NextResponse } from "next/server";
import _ from "lodash";

const fetchPossibleIdsWithIndividualParam = async (
  ids: string[],
  key: string
) => {
  const params = new URLSearchParams();

  ids.forEach((id) => params.append(key, id));

  const queryString = params.toString();

  const response = await fetch(
    `${envConfig.API_URL}/api/v1/filters?${queryString}`
  );
  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch matches" },
      { status: 500 }
    );
  }
  const data = await response.json();
  return data;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const seasons = searchParams.getAll("seasons");
  const leagues = searchParams.getAll("leagues");
  const stages = searchParams.getAll("stages");
  const teams = searchParams.getAll("teams");
  const maps = searchParams.getAll("maps");

  const [
    withSeasonsParam,
    withLeaguesParam,
    withStagesParam,
    withTeamsParam,
    withMapsParam
  ] = await Promise.all([
    fetchPossibleIdsWithIndividualParam(seasons, "season_ids[]"),
    fetchPossibleIdsWithIndividualParam(leagues, "league_ids[]"),
    fetchPossibleIdsWithIndividualParam(stages, "stages[]"),
    fetchPossibleIdsWithIndividualParam(teams, "team_ids[]"),
    fetchPossibleIdsWithIndividualParam(maps, "map_ids[]")
  ]);

  const season_ids = _.intersection(
    withLeaguesParam.season_ids,
    withStagesParam.season_ids,
    withTeamsParam.season_ids,
    withMapsParam.season_ids
  );

  const league_ids = _.intersection(
    withSeasonsParam.league_ids,
    withStagesParam.league_ids,
    withTeamsParam.league_ids,
    withMapsParam.league_ids
  );

  const stage_ids = _.intersection(
    withSeasonsParam.stage_ids,
    withLeaguesParam.stage_ids,
    withTeamsParam.stage_ids,
    withMapsParam.stage_ids
  );

  const team_ids = _.intersection(
    withSeasonsParam.team_ids,
    withLeaguesParam.team_ids,
    withStagesParam.team_ids,
    withMapsParam.team_ids
  );

  const map_ids = _.intersection(
    withSeasonsParam.map_ids,
    withLeaguesParam.map_ids,
    withStagesParam.map_ids,
    withTeamsParam.map_ids
  );

  const data = {
    season_ids,
    league_ids,
    team_ids,
    stages: stage_ids,
    map_ids
  };

  return NextResponse.json(data, { status: 200 });
}
