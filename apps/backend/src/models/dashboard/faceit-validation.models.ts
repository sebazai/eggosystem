import { runQuery } from "../../db/mysqlRunQuery";
import JSONBig from "json-bigint";

interface HubTeamPlayer {
  steam_id: string;
  nickname: string;
  is_captain: boolean;
  is_co_captain: boolean;
  role: "primary" | "substitute";
}

interface SeasonTeamWithExternalId {
  team_id: number;
  team_name: string;
  external_platform_id: string | null;
  league_id: number;
  league_name: string;
  players: string; // JSON string
}

/**
 * Gets all players for a team in a season from HUB database
 */
export const getHubTeamRoster = async (
  season_id: number,
  team_id: number
): Promise<HubTeamPlayer[]> => {
  const query = `
    SELECT 
      stp.steam_id,
      sp.nickname,
      stp.is_captain,
      stp.is_co_captain,
      stp.role
    FROM SeasonTeamPlayers stp
    JOIN SteamPlayers sp ON stp.steam_id = sp.steam_id
    WHERE stp.season_id = ? AND stp.team_id = ? AND stp.discarded_at IS NULL
  `;

  return runQuery<HubTeamPlayer[]>(query, [season_id, team_id]);
};

/**
 * Gets all championship external IDs for a season
 */
export const getSeasonChampionshipIds = async (
  season_id: number
): Promise<string[]> => {
  const query = `
    SELECT DISTINCT slei.external_id
    FROM SeasonLeagueExternalIds slei
    WHERE slei.season_id = ?
  `;

  const results = await runQuery<Array<{ external_id: string }>>(query, [
    season_id
  ]);

  return results.map((r) => r.external_id);
};

/**
 * Gets all teams in a season with their external platform IDs and roster
 */
export const getSeasonTeamsWithRoster = async (
  season_id: number
): Promise<
  Array<{
    team_id: number;
    team_name: string;
    external_platform_id: string | null;
    league_id: number;
    league_name: string;
    players: HubTeamPlayer[];
  }>
> => {
  const query = `
    SELECT 
      t.id as team_id,
      t.name as team_name,
      str.external_platform_id,
      l.id as league_id,
      l.name as league_name,
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'steam_id', stp.steam_id,
            'nickname', sp.nickname,
            'is_captain', stp.is_captain,
            'is_co_captain', stp.is_co_captain,
            'role', stp.role
          )
        )
        FROM SeasonTeamPlayers stp
        JOIN SteamPlayers sp ON stp.steam_id = sp.steam_id
        WHERE stp.team_id = t.id AND stp.season_id = str.season_id AND stp.discarded_at IS NULL
      ) as players
    FROM Teams t
    JOIN SeasonTeamRegistrations str ON t.id = str.team_id
    JOIN SeasonLeagueTeams slt ON t.id = slt.team_id AND slt.season_id = str.season_id
    JOIN Leagues l ON slt.league_id = l.id
    WHERE str.season_id = ?
    GROUP BY t.id, t.name, str.external_platform_id, l.id, l.name
    ORDER BY l.sort_priority, t.name
  `;

  const results = await runQuery<SeasonTeamWithExternalId[]>(query, [
    season_id
  ]);

  return results.map((row) => ({
    team_id: row.team_id,
    team_name: row.team_name,
    external_platform_id: row.external_platform_id,
    league_id: row.league_id,
    league_name: row.league_name,
    players: row.players
      ? JSONBig({ storeAsString: true }).parse(row.players)
      : []
  }));
};

/**
 * Gets all championships for a season with stage information
 */
export const getSeasonChampionships = async (
  season_id: number
): Promise<
  Array<{
    championship_id: string;
    championship_name: string;
    stage_id: number;
    stage_name: string;
    type: string;
  }>
> => {
  const query = `
    SELECT 
      slei.external_id as championship_id,
      slei.external_league_name as championship_name,
      slei.stage_id,
      st.name as stage_name,
      slei.type
    FROM SeasonLeagueExternalIds slei
    JOIN Stages st ON slei.stage_id = st.id
    WHERE slei.season_id = ?
    ORDER BY slei.stage_id ASC, slei.id ASC
  `;

  return runQuery(query, [season_id]);
};
