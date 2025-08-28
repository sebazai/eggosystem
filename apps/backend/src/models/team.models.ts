import {
  type TeamMatchHistory,
  type TeamStats,
  type Team,
  type TopTeamsByFiltersRaw,
  type ParsedParams,
  type TeamMapStats,
  type TeamHeaderDetails,
  type TeamKeyPlayers,
  type TeamPlayers,
  type TeamsByLeague,
  type TeamCaptain
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import { type PoolConnection } from "mysql2/promise";
import { buildInsertQueryParts } from "../db/utils";
import { generateQueryWithFilters } from "../utils/queryFilter";
import { BadRequestError } from "../utils/errors";

export const getTeams = async () => {
  return runQuery<Team[]>(
    "SELECT id, organization_id, name, team_logo FROM Teams"
  );
};

export const getTeamById = async (teamId: number) => {
  return runQuery<[Team | undefined]>(
    "SELECT id, organization_id, name, team_logo FROM Teams WHERE id = ? LIMIT 1",
    [teamId]
  );
};

/**
 * Fetches the team name, id, logo and the latest season/league based on filters.
 */
export const getOneTeamByFilters = async (
  teamId: number,
  season_ids: ParsedParams["season_ids"],
  league_ids: ParsedParams["league_ids"]
) => {
  const { query, queryParams } = generateQueryWithFilters([
    { column: "s.id", value: season_ids },
    { column: "l.id", value: league_ids },
    { column: "slt.team_id", value: [teamId] }
  ]);
  const baseQuery = `
      SELECT
        t.name,
        t.team_logo,
        t.id,
        s.name AS latest_season_name,
        l.name AS latest_league_name
      FROM SeasonLeagueTeams slt
      JOIN Seasons s ON s.id = slt.season_id
      JOIN Leagues l ON l.id = slt.league_id
      JOIN Teams t ON t.id = slt.team_id
      WHERE ${query}
      ORDER BY s.id DESC
      LIMIT 1;
    `;
  return runQuery<Array<TeamHeaderDetails | undefined>>(baseQuery, queryParams);
};

/**
 * Can be used to fetch one or more teams by filters
 */
export const getTeamsByFilters = async ({
  season_ids,
  league_ids,
  team_ids,
  map_ids,
  stages
}: ParsedParams) => {
  const { query: season, queryParams: querySeason } = generateQueryWithFilters([
    { column: "s.id", value: season_ids },
    { column: "l.id", value: league_ids },
    { column: "slt.team_id", value: team_ids }
  ]);
  const { query, queryParams } = generateQueryWithFilters([
    { column: "m.season_id", value: season_ids },
    { column: "m.league_id", value: league_ids },
    {
      column: [{ column: "team1.team_id" }, { column: "team2.team_id" }],
      value: team_ids
    },
    { column: "mg.map_id", value: map_ids },
    { column: "m.stage", value: stages }
  ]);

  // If we filter by any filter, we only want those teams in result,
  // otherwise we also want teams that have not played any matches to be present matches.
  const filtersPresent = queryParams.length > 0;

  const mapFilterPresent = map_ids && map_ids.length > 0;

  const baseQuery = `
    WITH latest_team_season AS (
      SELECT
        slt.team_id,
        slt.season_id,
        s.name AS season_name,
        slt.league_id,
        l.name AS league_name,
        ROW_NUMBER() OVER (PARTITION BY slt.team_id ORDER BY slt.season_id DESC) AS rn
      FROM SeasonLeagueTeams slt
      JOIN Seasons s ON s.id = slt.season_id
      JOIN Leagues l ON l.id = slt.league_id
      WHERE ${season}
    ),
    match_results AS (
      SELECT 
        m.id AS match_id,
        m.league_id,
        m.season_id,
        team1.team_id AS team1_id,
        team2.team_id AS team2_id,
        m.best_of,
        CASE
          WHEN ${!mapFilterPresent ? "m.best_of = 1 AND" : ""} team1_score.score > team2_score.score THEN team1.team_id
          WHEN ${!mapFilterPresent ? "m.best_of = 1 AND" : ""} team2_score.score > team1_score.score THEN team2.team_id
          ${!mapFilterPresent ? "WHEN m.best_of > 1 AND SUM(CASE WHEN team1_score.score > team2_score.score THEN 1 ELSE 0 END) >= CEILING(m.best_of / 2.0) THEN team1.team_id" : ""}
          ${!mapFilterPresent ? "WHEN m.best_of > 1 AND SUM(CASE WHEN team2_score.score > team1_score.score THEN 1 ELSE 0 END) >= CEILING(m.best_of / 2.0) THEN team2.team_id" : ""}
          ELSE NULL
        END AS winning_team_id,
        CASE
          WHEN ${!mapFilterPresent ? "m.best_of = 1 AND" : ""} team1_score.score > team2_score.score THEN team2.team_id
          WHEN ${!mapFilterPresent ? "m.best_of = 1 AND" : ""} team2_score.score > team1_score.score THEN team1.team_id
          ${!mapFilterPresent ? "WHEN m.best_of > 1 AND SUM(CASE WHEN team1_score.score > team2_score.score THEN 1 ELSE 0 END) >= CEILING(m.best_of / 2.0) THEN team2.team_id" : ""}
          ${!mapFilterPresent ? "WHEN m.best_of > 1 AND SUM(CASE WHEN team2_score.score > team1_score.score THEN 1 ELSE 0 END) >= CEILING(m.best_of / 2.0) THEN team1.team_id" : ""}
          ELSE NULL
        END AS losing_team_id
      FROM Matches m
      JOIN MatchTeams team1 ON m.id = team1.match_id
      JOIN MatchTeams team2 ON m.id = team2.match_id AND team2.team_id < team1.team_id
      LEFT JOIN MatchGames mg ON m.id = mg.match_id
      LEFT JOIN TeamGameScores team1_score ON mg.id = team1_score.game_id AND team1_score.team_id = team1.team_id
      LEFT JOIN TeamGameScores team2_score ON mg.id = team2_score.game_id AND team2_score.team_id = team2.team_id
      WHERE ${query}
      ${!mapFilterPresent ? "GROUP BY m.id, team1.team_id, team2.team_id, m.best_of, m.league_id, m.season_id" : "GROUP BY mg.id, team1.team_id, team2.team_id"}
    )
    SELECT
      t.id,
      t.name,
      t.team_logo,
      COUNT(CASE WHEN mr.winning_team_id = t.id THEN 1 END) AS wins,
      COUNT(CASE WHEN mr.losing_team_id = t.id THEN 1 END) AS losses,
      COUNT(*) AS matches_played,
      ROUND(
        100.0 * COUNT(CASE WHEN mr.winning_team_id = t.id THEN 1 END) /
        NULLIF(COUNT(CASE WHEN mr.winning_team_id = t.id OR mr.losing_team_id = t.id THEN 1 END), 0), 1
      ) AS win_percentage,
      lts.season_name AS latest_season_name,
      lts.league_name AS latest_league_name
    FROM Teams t
    ${filtersPresent ? "INNER" : "LEFT"} JOIN match_results mr ON t.id = mr.winning_team_id OR t.id = mr.losing_team_id
    ${filtersPresent ? "INNER" : "LEFT"} JOIN latest_team_season lts ON t.id = lts.team_id AND lts.rn = 1
    GROUP BY t.id
    ORDER BY win_percentage DESC, wins DESC, t.name ASC;
  `;

  return runQuery<TeamStats[]>(baseQuery, [...querySeason, ...queryParams]);
};

// Get match history for a team
export const getTeamMatchesByFilters = async ({
  season_ids,
  league_ids,
  stages,
  team_ids,
  map_ids
}: ParsedParams) => {
  if (!team_ids || team_ids.length > 1) {
    throw new BadRequestError("Too many team ids present");
  }
  const [teamId] = team_ids;
  if (!teamId) {
    throw new BadRequestError("Please provide team id to filter matches for");
  }

  const { query, queryParams } = generateQueryWithFilters([
    {
      column: "m.season_id",
      value: season_ids
    },
    {
      column: "m.league_id",
      value: league_ids
    },
    {
      column: "mg.map_id",
      value: map_ids
    },
    { column: "m.stage", value: stages }
  ]);

  const withoutMapFilters = `
    WITH match_map_names AS (
      SELECT 
        m.id AS match_id,
        GROUP_CONCAT(DISTINCT maps.name ORDER BY mg.id SEPARATOR ', ') AS maps
      FROM Matches m
      JOIN MatchGames mg ON m.id = mg.match_id
      JOIN Maps maps ON mg.map_id = maps.id
      WHERE ${query}
      GROUP BY m.id
    ),
   match_game_scores AS (
    SELECT 
      m.id AS match_id,
      CASE
        WHEN m.best_of = 1 THEN mg.id
        ELSE NULL
      END AS game_id,
      m.season_id,
      m.league_id,
      m.match_date,
      m.best_of,
      team.team_id,
      opponent.team_id AS opponent_id,
      t1.name AS team_name,
      t1.team_logo as team_logo,
      t2.name AS opponent_name,
      t2.team_logo as opponent_logo,
      COUNT(CASE WHEN tgs1.score > tgs2.score THEN 1 END) AS team_game_wins,
      COUNT(CASE WHEN tgs2.score > tgs1.score THEN 1 END) AS opponent_game_wins,
      
      -- For Bo1: pull actual game scores
      MAX(CASE WHEN m.best_of = 1 THEN tgs1.score END) AS team_score_bo1,
      MAX(CASE WHEN m.best_of = 1 THEN tgs2.score END) AS opponent_score_bo1
    FROM Matches m
    JOIN MatchTeams team ON m.id = team.match_id AND team.team_id = ?
    JOIN MatchTeams opponent ON m.id = opponent.match_id AND opponent.team_id != team.team_id
    JOIN Teams t1 ON team.team_id = t1.id
    JOIN Teams t2 ON opponent.team_id = t2.id
    JOIN MatchGames mg ON m.id = mg.match_id
    JOIN TeamGameScores tgs1 ON mg.id = tgs1.game_id AND tgs1.team_id = team.team_id
    JOIN TeamGameScores tgs2 ON mg.id = tgs2.game_id AND tgs2.team_id = opponent.team_id
    WHERE ${query}
    GROUP BY m.id, m.match_date, m.best_of, team.team_id, opponent.team_id, t1.name, t1.team_logo, t2.name, t2.team_logo
  )
    SELECT 
      mgs.match_id,
      s.full_name AS season_name,
      l.name AS league_name,
      mgs.match_date AS date,
      CASE
        WHEN mgs.best_of = 1 THEN mgs.game_id
        ELSE NULL
      END AS game_id,
      mmn.maps, 
      mgs.team_id, 
      mgs.team_name, 
      mgs.team_logo, 
      mgs.opponent_id, 
      mgs.opponent_name, 
      mgs.opponent_logo,
      CASE
        WHEN best_of = 1 THEN 
          CASE 
            WHEN team_score_bo1 > opponent_score_bo1 THEN 'won'
            WHEN team_score_bo1 < opponent_score_bo1 THEN 'lost'
            ELSE '-'
          END
        ELSE
          CASE
            WHEN team_game_wins > opponent_game_wins THEN 'won'
            WHEN team_game_wins < opponent_game_wins THEN 'lost'
            ELSE '-'
          END
        END AS result,
      CASE
        WHEN best_of = 1 THEN team_score_bo1
        ELSE team_game_wins
      END AS team_score,
      CASE
        WHEN best_of = 1 THEN opponent_score_bo1
        ELSE opponent_game_wins
      END AS opponent_score
    FROM match_game_scores mgs
    LEFT JOIN match_map_names mmn ON mgs.match_id = mmn.match_id
    JOIN Seasons s ON s.id = mgs.season_id
    JOIN Leagues l ON l.id = mgs.league_id
    ORDER BY match_date DESC, mgs.match_id, mgs.game_id
    `;

  const withMapFilters = `
    SELECT
      mg.id AS game_id,
      s.full_name AS season_name,
      l.name AS league_name,
      m.id AS match_id,
      m.match_date AS date,
      maps.name AS maps,
      m.best_of,
      team.team_id,
      opponent.team_id AS opponent_id,
      t1.name AS team_name,
      t1.team_logo as team_logo,
      t2.name AS opponent_name,
      t2.team_logo as opponent_logo,
      tgs1.score AS team_score,
      tgs2.score AS opponent_score,
      CASE
        WHEN tgs1.score > tgs2.score THEN 'won'
        WHEN tgs1.score < tgs2.score THEN 'lost'
        ELSE '-'
      END AS result
    FROM Matches m
    JOIN MatchTeams team ON m.id = team.match_id AND team.team_id = ?
    JOIN MatchTeams opponent ON m.id = opponent.match_id AND opponent.team_id != team.team_id
    JOIN MatchGames mg ON m.id = mg.match_id
    JOIN Teams t1 ON team.team_id = t1.id
    JOIN Teams t2 ON opponent.team_id = t2.id
    JOIN Maps maps ON mg.map_id = maps.id
    JOIN TeamGameScores tgs1 ON mg.id = tgs1.game_id AND tgs1.team_id = team.team_id
    JOIN TeamGameScores tgs2 ON mg.id = tgs2.game_id AND tgs2.team_id = opponent.team_id
    JOIN Seasons s ON s.id = m.season_id
    JOIN Leagues l ON l.id = m.league_id
    WHERE ${query}
    ORDER BY m.match_date DESC, mg.id;
  `;

  if (map_ids && map_ids.length > 0) {
    return runQuery<TeamMatchHistory[]>(withMapFilters, [
      teamId,
      ...queryParams
    ]);
  }

  return runQuery<TeamMatchHistory[]>(withoutMapFilters, [
    ...queryParams,
    teamId,
    ...queryParams
  ]);
};

export const insertTeam = async (
  team: Partial<Team>,
  connection?: PoolConnection
) => {
  const { columns, placeholders, values } = buildInsertQueryParts(team);
  return runQuery<{ insertId: number }>(
    `INSERT INTO Teams (${columns.join(", ")}) VALUES (${placeholders})`,
    values,
    connection
  );
};

export const getTeamMapStats = async (
  teamId: number,
  { season_ids, league_ids, map_ids, stages }: ParsedParams
) => {
  const { query, queryParams } = generateQueryWithFilters([
    {
      column: "m.season_id",
      value: season_ids
    },
    {
      column: "m.league_id",
      value: league_ids
    },
    {
      column: "mg.map_id",
      value: map_ids
    },
    { column: "m.stage", value: stages }
  ]);
  const baseQuery = `
    SELECT 
      mg.map_id,
      maps.name as map_name,
      COUNT(DISTINCT mg.id) as maps_played,
      SUM(CASE WHEN tgs.score > opponent_score.score THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN tgs.score < opponent_score.score THEN 1 ELSE 0 END) as losses,
      ROUND(AVG(tgs.score), 1) as avg_score,
      ROUND(AVG(opponent_score.score), 1) as avg_opponent_score,
      ROUND(
        100.0 * COUNT(CASE WHEN tgs.score > opponent_score.score THEN 1 END) /
        NULLIF(COUNT(CASE WHEN tgs.score > opponent_score.score OR tgs.score < opponent_score.score THEN 1 END), 0), 1
      ) AS win_percentage
    FROM MatchGames mg
    JOIN Maps maps ON mg.map_id = maps.id
    JOIN TeamGameScores tgs ON mg.id = tgs.game_id AND tgs.team_id = ?
    JOIN Matches m ON mg.match_id = m.id
    JOIN MatchTeams mt ON m.id = mt.match_id AND mt.team_id = tgs.team_id
    JOIN MatchTeams opponent_mt ON m.id = opponent_mt.match_id AND opponent_mt.team_id != tgs.team_id
    JOIN TeamGameScores opponent_score ON mg.id = opponent_score.game_id AND opponent_score.team_id = opponent_mt.team_id
    WHERE ${query}
    GROUP BY mg.map_id, maps.name
  `;

  const params = [teamId, ...queryParams];

  return runQuery<TeamMapStats[]>(baseQuery, params);
};

export const getFilteredTopTeams = async ({
  stages,
  map_ids,
  league_ids,
  season_ids
}: ParsedParams) => {
  const { query, queryParams } = generateQueryWithFilters([
    { column: "m.season_id", value: season_ids },
    { column: "m.league_id", value: league_ids },
    { column: "m.stage", value: stages },
    { column: "mmp.map_id", value: map_ids }
  ]);

  const baseQuery = `
    WITH TeamAverages AS (
      SELECT 
        t.id as team_id,
        t.name as team_name,
        t.team_logo,
        l.name as league_name,
        l.id as league_id,
        l.sort_priority as league_sort_priority,
        m.stage as stage,
        COUNT(DISTINCT mmp.id) as matches_played,
        AVG(ps.kana_rating) as avg_kana_rating,
        ROW_NUMBER() OVER (PARTITION BY l.id, m.stage ORDER BY AVG(ps.kana_rating) DESC) as rank
      FROM Teams t
      JOIN MatchTeams mt ON mt.team_id = t.id
      JOIN Matches m ON m.id = mt.match_id
      JOIN Leagues l ON l.id = m.league_id
      JOIN MatchGames mmp ON mmp.match_id = m.id
      JOIN PlayerStats ps ON ps.game_id = mmp.id
      JOIN SeasonTeamPlayers stp ON stp.steam_id = ps.steam_id 
        AND stp.team_id = t.id 
        AND stp.season_id = m.season_id
      WHERE ${query}
      GROUP BY t.id, t.name, t.team_logo, l.id, l.name, m.stage
    )
    SELECT 
      league_id,
      league_name,
      league_sort_priority,
      stage,
      CONCAT('[', GROUP_CONCAT(
        JSON_OBJECT(
          'team_id', team_id,
          'team_name', team_name,
          'team_logo', team_logo,
          'matches_played', matches_played,
          'kana', ROUND(avg_kana_rating, 3),
          'rank', rank
        ) ORDER BY rank, team_name
      ), ']') AS teams
    FROM TeamAverages
    WHERE rank <= 5
    GROUP BY league_id, league_name, league_sort_priority, stage
    ORDER BY league_sort_priority, stage;
  `;

  const results = await runQuery<TopTeamsByFiltersRaw[]>(
    baseQuery,
    queryParams
  );

  return results;
};

export const getTeamsWithoutOrgs = () => {
  return runQuery<Array<Team>>(
    "SELECT * FROM Teams WHERE organization_id IS NULL;"
  );
};

export const getTeamWithIdWithoutOrg = (
  teamId: number,
  connection?: PoolConnection
) => {
  return runQuery<Array<Team | undefined>>(
    "SELECT * FROM Teams WHERE id = ? AND organization_id IS NULL;",
    [teamId],
    connection
  );
};

const getTeamLatestSeason = async (teamId: number) => {
  const seasonQuery = `
    SELECT DISTINCT m.season_id 
    FROM Matches m
    JOIN MatchTeams mt ON m.id = mt.match_id
    WHERE mt.team_id = ?
    ORDER BY m.season_id DESC
    LIMIT 1
  `;
  const [seasonResult] = await runQuery<{ season_id: number }[]>(seasonQuery, [
    teamId
  ]);
  if (!seasonResult) {
    return undefined;
  }
  return seasonResult.season_id;
};

export const getTeamKeyPlayers = async (
  teamId: number,
  seasonId?: number
): Promise<TeamKeyPlayers[]> => {
  const targetSeasonId = seasonId ?? (await getTeamLatestSeason(teamId));

  if (!targetSeasonId) {
    return [];
  }

  // Get key players with aggregated stats
  const keyPlayersQuery = `
    SELECT 
      sp.steam_id,
      sp.nickname,
      COUNT(ps.id) as games_played,
      ROUND(SUM(ps.kills)/SUM(ps.deaths), 2) as kdr,
      SUM(ps.kills) - SUM(ps.deaths) as kdiff,
      ROUND(AVG(ps.adr), 1) as adr,
      ROUND(AVG(ps.kana_rating), 2) as kana_rating
    FROM SteamPlayers sp
    JOIN SeasonTeamPlayers stp ON sp.steam_id = stp.steam_id
    JOIN PlayerStats ps ON ps.steam_id = sp.steam_id
    JOIN MatchGames mg ON ps.game_id = mg.id
    JOIN Matches m ON mg.match_id = m.id
    WHERE stp.team_id = ? 
      AND stp.season_id = ?
      AND m.season_id = ?
    GROUP BY sp.steam_id, sp.nickname
    ORDER BY games_played DESC, kana_rating DESC
    LIMIT 5
  `;

  return runQuery<TeamKeyPlayers[]>(keyPlayersQuery, [
    teamId,
    targetSeasonId,
    targetSeasonId
  ]);
};

export const getTeamPlayers = async (
  teamId: number,
  seasonId?: number
): Promise<TeamPlayers[]> => {
  const targetSeasonId = seasonId ?? (await getTeamLatestSeason(teamId));

  if (!targetSeasonId) {
    return [];
  }

  // Get all players for the team in the specified season
  const playersQuery = `
    SELECT 
      sp.steam_id,
      sp.nickname,
      stp.is_captain,
      stp.is_co_captain
    FROM SteamPlayers sp
    JOIN SeasonTeamPlayers stp ON sp.steam_id = stp.steam_id
    WHERE stp.team_id = ? 
      AND stp.season_id = ?
    ORDER BY stp.is_captain DESC, stp.is_co_captain DESC, sp.nickname ASC
  `;

  return runQuery<TeamPlayers[]>(playersQuery, [teamId, targetSeasonId]);
};

export const getTeamsByLeague = async (
  leagueId: number,
  seasonId?: number
): Promise<TeamsByLeague[]> => {
  const { query, queryParams } = generateQueryWithFilters([
    { column: "slt.season_id", value: seasonId ? [seasonId] : undefined },
    { column: "slt.league_id", value: [leagueId] }
  ]);

  const teamsQuery = `
    SELECT 
      t.id,
      t.name,
      slt.league_id,
      slt.season_id,
      t.team_logo
    FROM Teams t
    JOIN SeasonLeagueTeams slt ON t.id = slt.team_id
    WHERE ${query}
    ORDER BY t.name ASC
  `;

  return runQuery<TeamsByLeague[]>(teamsQuery, queryParams);
};

/**
 * Get team captains for a specific season
 */
export const getTeamCaptainsBySeasonId = async (
  seasonId: number
): Promise<TeamCaptain[]> => {
  const results = await runQuery<TeamCaptain[]>(
    `SELECT 
      t.id AS team_id,
      t.name AS team_name,
      captain_account.discord AS captain_discord,
      co_captain_account.discord AS co_captain_discord
    FROM Teams t
    JOIN SeasonLeagueTeams str ON t.id = str.team_id
    JOIN SeasonTeamPlayers strp_captain ON 
      strp_captain.season_id = str.season_id AND 
      strp_captain.team_id = str.team_id AND 
      strp_captain.is_captain = 1
    JOIN SteamPlayers sp_captain ON strp_captain.steam_id = sp_captain.steam_id
    JOIN Accounts captain_account ON sp_captain.account_id = captain_account.id
    LEFT JOIN SeasonTeamPlayers strp_co_captain ON 
      strp_co_captain.season_id = str.season_id AND 
      strp_co_captain.team_id = str.team_id AND 
      strp_co_captain.is_co_captain = 1
    LEFT JOIN SteamPlayers sp_co_captain ON strp_co_captain.steam_id = sp_co_captain.steam_id
    LEFT JOIN Accounts co_captain_account ON sp_co_captain.account_id = co_captain_account.id
    WHERE str.season_id = ?
    ORDER BY t.name`,
    [seasonId]
  );

  return results;
};
