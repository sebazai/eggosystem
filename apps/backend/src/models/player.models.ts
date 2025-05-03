import {
  generateQueryWithFilters as _generateQueryWithFilters,
  generateQueryWithFilters
} from "../utils/queryFilter";
import { runQuery } from "../db/mysqlRunQuery";
import {
  type SteamPlayer,
  type ParsedParams,
  type PlayerDetailsBySteamId,
  type PlayerStatsResult,
  type MatchHistoryResult,
  PlayerGameDetailsByFilters,
  PlayerTeamDetailsByFilters,
  PlayerStatsTable
} from "@eggosystem/types";

export const getPlayerBySteamId = async (steam_id: string) => {
  return runQuery<Array<SteamPlayer | undefined>>(
    "SELECT nickname, steam_id FROM SteamPlayers WHERE steam_id = ?",
    [steam_id]
  );
};

export const getPlayerDetailsBySteamId = async (steam_id: string) => {
  const results = await runQuery<PlayerDetailsBySteamId[]>(
    `SELECT
      p.steam_id, 
      p.nickname,
      a.id as account_id,
      a.discord,
      CASE 
          WHEN a.work_email IS NULL THEN FALSE
          WHEN a.work_email LIKE '%@%' AND a.work_email_verified = 1 THEN TRUE
          ELSE FALSE
      END AS is_valid_work_email,
      CASE 
          WHEN a.full_name LIKE '% %' THEN TRUE 
          ELSE FALSE 
      END AS is_valid_full_name,
      CASE 
          WHEN upa.accepted_privacy_policy = TRUE AND upa.privacy_policy_version = ? THEN TRUE 
          ELSE FALSE 
      END AS has_accepted_latest_privacy_policy
    FROM SteamPlayers p 
    JOIN Accounts a ON a.id = p.account_id
    LEFT JOIN UserPolicyAcceptances upa ON upa.account_id = a.id
    WHERE p.steam_id = ?`,
    [process.env.PRIVACY_POLICY_VERSION!, steam_id]
  );

  return results.length > 0 ? results[0] : undefined;
};

export const getPlayersByFilters = async ({
  season_ids,
  league_ids,
  team_ids,
  stages,
  map_ids,
  playerName
}: ParsedParams) => {
  const { query, queryParams } = generateQueryWithFilters([
    {
      column: "stp.team_id",
      value: team_ids
    },
    {
      column: "m.season_id",
      value: season_ids
    },
    {
      column: "l.id",
      value: league_ids
    },
    { column: "m.stage", value: stages },
    { column: "mg.map_id", value: map_ids }
  ]);

  const whereClause = playerName
    ? `WHERE ${query} AND p.nickname LIKE ?`
    : `WHERE ${query}`;

  if (playerName) {
    queryParams.push(`%${playerName}%`);
  }
  // Use INNER JOIN for team-related tables when filtering by team_id,
  // otherwise use LEFT JOIN to include all players
  const teamJoinType = team_ids && team_ids.length ? "INNER" : "LEFT";

  const baseQuery = `
    SELECT 
      p.steam_id,
      p.nickname, 
      COUNT(DISTINCT ps.game_id) as matches_played,
      SUM(ps.kills) as kills,
      SUM(ps.assists) as assists,
      SUM(ps.deaths) as deaths,
      SUM(ps.flash_assists) as flash_assists,
      SUM(ps.awp_kills) as awp_kills,
      SUM(ps.utility_damage) as utility_damage,
      SUM(ps.headshots) as headshots,
      SUM(ps.first_kills) as first_kills,
      SUM(ps.first_deaths) as first_deaths,
      AVG(ps.adr) as adr,
      AVG(ps.kana_rating) as kana_rating,
      AVG(ps.hs_percent) as hs_percent,
      ROUND(SUM(ps.kills) / NULLIF(SUM(ps.deaths), 0), 2) as kd
    FROM PlayerStats ps
    INNER JOIN SteamPlayers p ON p.steam_id = ps.steam_id
    INNER JOIN MatchGames mg ON mg.id = ps.game_id
    INNER JOIN Matches m ON m.id = mg.match_id
    INNER JOIN Leagues l ON m.league_id = l.id
    ${teamJoinType} JOIN SeasonTeamPlayers stp ON stp.steam_id = p.steam_id AND stp.season_id = m.season_id
    ${teamJoinType} JOIN Teams t ON t.id = stp.team_id
    ${whereClause}
    GROUP BY p.steam_id, p.nickname
    ORDER BY kana_rating DESC
  `;

  return runQuery<Array<PlayerStatsTable>>(baseQuery, queryParams);
};

export const getPlayerMatchHistoryByFilters = async (
  steam_id: string,
  { season_ids, league_ids, team_ids, stages, map_ids }: ParsedParams
) => {
  const { query, queryParams } = generateQueryWithFilters([
    {
      column: "stp.team_id",
      value: team_ids
    },
    {
      column: "m.season_id",
      value: season_ids
    },
    {
      column: "l.id",
      value: league_ids
    },
    { column: "m.stage", value: stages },
    { column: "mg.map_id", value: map_ids },
    { column: "p.steam_id", value: [steam_id] }
  ]);

  const matchHistoryQuery = `
    WITH RelevantGames AS (
      SELECT DISTINCT mg.id AS game_id
      FROM SteamPlayers p
      INNER JOIN PlayerStats ps ON ps.steam_id = p.steam_id
      INNER JOIN MatchGames mg ON mg.id = ps.game_id
      INNER JOIN Matches m ON m.id = mg.match_id
      INNER JOIN Maps maps ON maps.id = mg.map_id
      INNER JOIN Seasons s ON s.id = m.season_id
      INNER JOIN Leagues l ON l.id = m.league_id
      INNER JOIN SeasonTeamPlayers stp ON stp.steam_id = ps.steam_id AND stp.season_id = m.season_id
      WHERE ${query}
    ),
    Team1 AS (
      SELECT 
        game_id, team_id AS team1_id, score AS team1_score
      FROM (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY game_id ORDER BY team_id) AS rn
        FROM TeamGameScores
        WHERE game_id IN (SELECT game_id FROM RelevantGames)
      ) ranked
      WHERE rn = 1
    ),
    Team2 AS (
      SELECT 
        game_id, team_id AS team2_id, score AS team2_score
      FROM (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY game_id ORDER BY team_id) AS rn
        FROM TeamGameScores
        WHERE game_id IN (SELECT game_id FROM RelevantGames)
      ) ranked
      WHERE rn = 2
    ),
    TeamScores AS (
      SELECT 
        t1.game_id,
        t1.team1_id,
        t1.team1_score,
        t2.team2_id,
        t2.team2_score
      FROM Team1 t1
      JOIN Team2 t2 ON t1.game_id = t2.game_id
    ),
    MatchData AS (
      SELECT 
        m.id as match_id,
        m.best_of,
        m.match_date,
        m.season_id,
        s.name as season_name,
        l.id as league_id,
        l.name as league_name,
        m.stage,
        mg.id as game_id,
        mg.map_id,
        maps.name as map_name,
        ps.team as player_team,
        ps.kills,
        ps.deaths,
        ps.assists,
        ps.flash_assists,
        ps.awp_kills,
        ps.utility_damage,
        ps.headshots,
        ps.first_kills,
        ps.first_deaths,
        ps.kast,
        ps.adr,
        ps.hs_percent,
        ps.kana_rating,
        ts.team1_id,
        t1.name as team1_name,
        t1.team_logo as team1_logo,
        ts.team2_id,
        t2.name as team2_name,
        t2.team_logo as team2_logo,
        ts.team1_score,
        ts.team2_score,
        CASE 
          WHEN stp.team_id = ts.team1_id THEN ts.team1_id
          WHEN stp.team_id = ts.team2_id THEN ts.team2_id
          WHEN ps.team = 1 THEN ts.team1_id
          ELSE ts.team2_id
        END as player_team_id
      FROM SteamPlayers p
      INNER JOIN PlayerStats ps ON ps.steam_id = p.steam_id
      INNER JOIN MatchGames mg ON mg.id = ps.game_id
      INNER JOIN Matches m ON m.id = mg.match_id
      INNER JOIN Maps maps ON maps.id = mg.map_id
      INNER JOIN Seasons s ON s.id = m.season_id
      INNER JOIN Leagues l ON l.id = m.league_id
      INNER JOIN TeamScores ts ON ts.game_id = mg.id
      INNER JOIN Teams t1 ON t1.id = ts.team1_id
      INNER JOIN Teams t2 ON t2.id = ts.team2_id
      INNER JOIN SeasonTeamPlayers stp ON stp.steam_id = p.steam_id AND stp.season_id = m.season_id
      WHERE ${query}
    )

    SELECT 
      match_id,
      season_id,
      season_name,
      league_id,
      league_name,
      stage,
      match_date,
      MAX(map_name) as map_name,
      MAX(CASE WHEN player_team_id = team1_id THEN team1_id ELSE team2_id END) as team_id,
      MAX(CASE WHEN player_team_id = team1_id THEN team1_name ELSE team2_name END) as team_name,
      MAX(CASE WHEN player_team_id = team1_id THEN team1_logo ELSE team2_logo END) as team_logo,
      MAX(CASE WHEN player_team_id = team1_id THEN team2_id ELSE team1_id END) as opponent_id,
      MAX(CASE WHEN player_team_id = team1_id THEN team2_name ELSE team1_name END) as opponent_name,
      MAX(CASE WHEN player_team_id = team1_id THEN team2_logo ELSE team1_logo END) as opponent_logo,
      CASE 
        WHEN best_of = 1 THEN 
          MAX(CASE WHEN player_team_id = team1_id THEN team1_score ELSE team2_score END)
        ELSE 
          SUM(CASE 
            WHEN (player_team_id = team1_id AND team1_score > team2_score) OR 
                (player_team_id = team2_id AND team2_score > team1_score) 
            THEN 1 ELSE 0 END)
      END as score,
      CASE 
        WHEN best_of = 1 THEN 
          MAX(CASE WHEN player_team_id = team1_id THEN team2_score ELSE team1_score END)
        ELSE 
          SUM(CASE 
            WHEN (player_team_id = team1_id AND team1_score < team2_score) OR 
                (player_team_id = team2_id AND team2_score < team1_score) 
            THEN 1 ELSE 0 END)
      END as opponent_score,
      SUM(kills) as kills,
      SUM(deaths) as deaths,
      SUM(assists) as assists,
      SUM(flash_assists) as flash_assists,
      SUM(awp_kills) as awp_kills,
      SUM(utility_damage) as utility_damage,
      SUM(headshots) as headshots,
      SUM(first_kills) as first_kills,
      SUM(first_deaths) as first_deaths,
      AVG(kast) as kast,
      AVG(adr) as adr,
      AVG(hs_percent) as hs_percent,
      AVG(kana_rating) as kana_rating,
      ROUND(SUM(kills) / NULLIF(SUM(deaths), 0), 2) as kd
    FROM MatchData
    GROUP BY match_id, season_id, season_name, league_id, league_name, stage, match_date, best_of
    ORDER BY match_date DESC;
  `;

  const matchHistory = await runQuery<MatchHistoryResult[]>(matchHistoryQuery, [
    ...queryParams,
    ...queryParams
  ]);
  return matchHistory;
};

export const getPlayerTeamDetailsWithFilters = async (
  steam_id: string,
  { season_ids, league_ids, team_ids }: ParsedParams
) => {
  const { query, queryParams } = generateQueryWithFilters([
    {
      column: "stp.team_id",
      value: team_ids
    },
    {
      column: "s.id",
      value: season_ids
    },
    {
      column: "l.id",
      value: league_ids
    },
    { column: "p.steam_id", value: [steam_id] }
  ]);

  const baseQuery = `
    SELECT 
      p.steam_id,
      p.nickname,
      t.name AS team_name,
      t.id AS team_id,
      CONCAT('/teams/', COALESCE(t.team_logo, 'nologo.svg')) AS team_logo
    FROM SteamPlayers p
    JOIN SeasonTeamPlayers stp ON stp.steam_id = p.steam_id
    JOIN Seasons s ON s.id = stp.season_id
    JOIN SeasonLeagueTeams slt ON slt.season_id = s.id AND stp.team_id = slt.team_id
    JOIN Leagues l ON l.id = slt.league_id
    JOIN Teams t ON t.id = slt.team_id
    WHERE ${query}
    GROUP BY p.steam_id, p.nickname, team_name;
  `;

  const playerTeamDetails = await runQuery<PlayerTeamDetailsByFilters[]>(
    baseQuery,
    queryParams
  );

  return playerTeamDetails;
};

export const getPlayerGameDetailsWithFilters = async (
  steam_id: string,
  { season_ids, league_ids, team_ids, stages, map_ids }: ParsedParams
) => {
  const { query, queryParams } = generateQueryWithFilters([
    {
      column: "stp.team_id",
      value: team_ids
    },
    {
      column: "m.season_id",
      value: season_ids
    },
    {
      column: "l.id",
      value: league_ids
    },
    { column: "m.stage", value: stages },
    { column: "mg.map_id", value: map_ids },
    { column: "p.steam_id", value: [steam_id] }
  ]);

  const baseQuery = `
    WITH TeamScores AS (
      SELECT 
        t1.game_id,
        t1.team_id AS team1_id,
        t1.score AS team1_score,
        t2.team_id AS team2_id,
        t2.score AS team2_score
      FROM TeamGameScores t1
      JOIN TeamGameScores t2 ON t1.game_id = t2.game_id AND t1.team_id < t2.team_id
    )
    SELECT 
      COUNT(DISTINCT mg.id) AS matches_played,
      COUNT(DISTINCT CASE 
        WHEN ps.team = 1 AND ts.team1_score > ts.team2_score THEN mg.id
        WHEN ps.team = 2 AND ts.team2_score > ts.team1_score THEN mg.id
      END) AS wins,
      COUNT(DISTINCT CASE 
        WHEN ps.team = 1 AND ts.team1_score < ts.team2_score THEN mg.id
        WHEN ps.team = 2 AND ts.team2_score < ts.team1_score THEN mg.id
      END) AS losses,
      COUNT(DISTINCT CASE 
        WHEN ts.team1_score = ts.team2_score THEN mg.id
      END) AS draws
    FROM SteamPlayers p
    JOIN PlayerStats ps ON ps.steam_id = p.steam_id
    JOIN MatchGames mg ON mg.id = ps.game_id
    JOIN Matches m ON m.id = mg.match_id
    JOIN Leagues l ON l.id = m.league_id
    JOIN TeamScores ts ON ts.game_id = mg.id
    JOIN SeasonTeamPlayers stp ON stp.steam_id = p.steam_id AND stp.season_id = m.season_id
    JOIN Teams t ON t.id = stp.team_id
    WHERE ${query}
  `;
  const playerDetails = await runQuery<
    Array<PlayerGameDetailsByFilters | undefined>
  >(baseQuery, queryParams);

  return playerDetails;
};

export const getPlayerStatsWithFilters = async (
  steam_id: string,
  { season_ids, league_ids, team_ids, stages, map_ids }: ParsedParams
) => {
  const { query, queryParams } = generateQueryWithFilters([
    {
      column: "stp.team_id",
      value: team_ids
    },
    {
      column: "m.season_id",
      value: season_ids
    },
    {
      column: "l.id",
      value: league_ids
    },
    { column: "m.stage", value: stages },
    { column: "mg.map_id", value: map_ids },
    { column: "p.steam_id", value: [steam_id] }
  ]);

  // Get player's aggregate statistics
  const statsQuery = `
    SELECT 
      p.steam_id,
      p.nickname,
      COUNT(DISTINCT mg.id) as matches_played,
      SUM(ps.kills) as kills,
      SUM(ps.assists) as assists,
      SUM(ps.deaths) as deaths,
      SUM(ps.flash_assists) as flash_assists,
      SUM(ps.awp_kills) as awp_kills,
      SUM(ps.utility_damage) as utility_damage,
      SUM(ps.headshots) as headshots,
      SUM(ps.first_kills) as first_kills,
      SUM(ps.first_deaths) as first_deaths,
      AVG(ps.adr) as adr,
      AVG(ps.kana_rating) as kana_rating,
      AVG(ps.hs_percent) as hs_percent,
      SUM(ps.clutches_won) as clutches_won,
      SUM(ps.clutches) - SUM(ps.clutches_won) as clutches_lost,
      AVG(ps.kast) as kast,
      SUM(ps.enemies_flashed) as enemies_flashed,
      SUM(ps.mates_flashed) as mates_flashed,
      SUM(ps.self_flashes) as self_flashes,
      SUM(ps.total_damage) as total_damage,
      SUM(ps.flashes_thrown) as flashes_thrown,
      SUM(ps.total_ef_duration) as total_ef_duration,
      ROUND(SUM(ps.kills) / NULLIF(SUM(ps.deaths), 0), 2) as kd,
      SUM(CASE WHEN ps.kills = 2 THEN 1 ELSE 0 END) as multikill_2k,
      SUM(CASE WHEN ps.kills = 3 THEN 1 ELSE 0 END) as multikill_3k,
      SUM(CASE WHEN ps.kills = 4 THEN 1 ELSE 0 END) as multikill_4k,
      SUM(CASE WHEN ps.kills = 5 THEN 1 ELSE 0 END) as multikill_5k,
      COUNT(DISTINCT ps.id) as rounds_played
    FROM SteamPlayers p
    INNER JOIN PlayerStats ps ON ps.steam_id = p.steam_id
    INNER JOIN MatchGames mg ON mg.id = ps.game_id
    INNER JOIN Matches m ON m.id = mg.match_id
    INNER JOIN Leagues l ON l.id = m.league_id
    INNER JOIN SeasonTeamPlayers stp ON stp.steam_id = p.steam_id AND stp.season_id = m.season_id
    WHERE ${query}
    GROUP BY p.steam_id
  `;

  const [playerStats] = await runQuery<Array<PlayerStatsResult | undefined>>(
    statsQuery,
    queryParams
  );

  return playerStats;
};
