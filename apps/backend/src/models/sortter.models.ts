import { runQuery } from "../db/mysqlRunQuery";
import {
  type TeamSortterValues,
  type TeamSortterValuesRaw,
  type PlayerSortterValues
} from "@eggosystem/types";

/**
 * Gets team values for sorter functionality:
 * - Team name
 * - Sum of kanaelo for top 5 players in the team
 * - Average of kanaelo for top 4 players in the team
 * - Team league
 * - Kanaelo values for top 5 players as an array
 *
 * @param seasonId The season ID to filter teams by
 * @returns Array of team values
 */
export const getTeamValuesForSorter = async (
  seasonId: number
): Promise<TeamSortterValues[]> => {
  const query = `
    WITH TeamPlayersKanaElo AS (
      SELECT
        t.id AS team_id,
        t.name AS team_name,
        t.team_logo,
        l.name AS league_name,
        spr.steam_id,
        spr.kana_elo,
        ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY spr.kana_elo DESC) AS player_rank
      FROM Teams t
      JOIN SeasonLeagueTeams slt ON slt.team_id = t.id
      JOIN SeasonTeamPlayers stp ON stp.team_id = t.id AND stp.season_id = slt.season_id
      JOIN SeasonPlayerRanks spr ON spr.steam_id = stp.steam_id AND spr.season_id = slt.season_id
      JOIN Leagues l ON l.id = slt.league_id
      WHERE slt.season_id = ?
      ORDER BY t.id, spr.kana_elo DESC
    ),
    TeamTop5Players AS (
      SELECT
        team_id,
        team_name,
        team_logo,
        league_name,
        player_rank,
        kana_elo
      FROM TeamPlayersKanaElo
      WHERE player_rank <= 5
    ),
    TeamValues AS (
      SELECT
        team_id,
        team_name,
        team_logo,
        league_name,
        SUM(kana_elo) AS top5_sum,
        ROUND(AVG(CASE WHEN player_rank <= 4 THEN kana_elo ELSE NULL END), 3) AS avg4,
        JSON_ARRAYAGG(kana_elo ORDER BY player_rank) AS top5_values
      FROM TeamTop5Players
      GROUP BY team_id, team_name, team_logo, league_name
    )
    SELECT
      team_id,
      team_name,
      team_logo,
      league_name,
      top5_sum,
      avg4,
      top5_values
    FROM TeamValues
    ORDER BY top5_sum DESC
  `;

  const rawResults = await runQuery<TeamSortterValuesRaw[]>(query, [seasonId]);

  // Convert results to the expected format
  const results = rawResults.map((team) => {
    // Parse the JSON string and ensure all values are numbers
    const parsedValues = JSON.parse(team.top5_values);

    // Map each value to ensure they're all numbers
    const top5_values = Array.isArray(parsedValues)
      ? parsedValues.map((val) => Number(val))
      : [];

    return {
      ...team,
      top5_values
    };
  }) satisfies TeamSortterValues[];

  return results;
};

/**
 * Gets player values for a specific team and season for sorter functionality:
 * - Player name
 * - Steam ID
 * - CS2 rank
 * - Faceit level
 * - Faceit ELO
 * - CS hours
 * - Kana rating (average from all games player played)
 * - FKD (Faceit K/D ratio)
 *
 * @param seasonId The season ID to filter by
 * @param teamId The team ID to filter by
 * @returns Array of player values
 */
export const getTeamPlayerValuesForSortter = async (
  seasonId: number,
  teamId: number
): Promise<PlayerSortterValues[]> => {
  const query = `
    SELECT
      sp.nickname AS name,
      sp.steam_id AS steamid,
      spr.cs2_rank,
      spr.faceit_level,
      spr.faceit_elo,
      spr.cs_hours AS hours,
      ROUND(AVG(ps.kana_rating), 6) AS kanarating,
      spr.faceit_kd AS fkd
    FROM Teams t
    JOIN SeasonLeagueTeams slt ON slt.team_id = t.id
    JOIN SeasonTeamPlayers stp ON stp.team_id = t.id AND stp.season_id = slt.season_id
    JOIN SteamPlayers sp ON sp.steam_id = stp.steam_id
    JOIN SeasonPlayerRanks spr ON spr.steam_id = stp.steam_id AND spr.season_id = slt.season_id
    LEFT JOIN PlayerStats ps ON ps.steam_id = sp.steam_id
    LEFT JOIN MatchGames mg ON mg.id = ps.game_id
    LEFT JOIN Matches m ON m.id = mg.match_id AND m.season_id = slt.season_id
    WHERE slt.season_id = ?
      AND slt.team_id = ?
    GROUP BY
      sp.nickname,
      sp.steam_id,
      spr.cs2_rank,
      spr.faceit_level,
      spr.faceit_elo,
      spr.cs_hours,
      spr.faceit_kd
    ORDER BY
      spr.kana_elo DESC
  `;

  const results = await runQuery<PlayerSortterValues[]>(query, [
    seasonId,
    teamId
  ]);

  return results;
};
