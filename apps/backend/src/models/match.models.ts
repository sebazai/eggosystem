import { generateQueryWithFilters } from "../utils/queryFilter";
import { runQuery } from "../db/mysqlRunQuery";
import {
  type League,
  type Season,
  type Match,
  type MatchesByFilters,
  type ParsedParams,
  type MatchMapsPlayed,
  type MatchOrGameTopPlayerAwards,
  type MatchGame,
  type MatchPlayerStats,
  type TeamStatsResponse,
  type MatchMapVetoes,
  type Stage,
  type MatchTeamLineup,
  type MatchTeamLineupRaw,
  MatchStatus,
  type MatchInfoQuery,
  type MatchesWithTeamDataQuery,
  type ChampionshipDetailsObjectCreated,
  FaceitMatchStatus,
  type MatchGamesByTeam,
  type MatchWithStreamUrls,
  type SeasonLeague,
  type UnfinishedMatch,
  type UnfinishedMatchQuery,
  type CalendarMatchTeamsBySide,
  type MatchTeamSide,
  type MatchMvp
} from "@eggosystem/types";
import {
  fetchPlayerStatsForMatchOrGame,
  matchTopStats
} from "../shared/fetch-stat";
import { getConnection } from "../db/mysqlConnection";
import { BadRequestError } from "../utils/errors";
import { logger } from "../utils/app-logger";
import {
  adjustMatchDateTime,
  formatDateForDatabase,
  getFaceitMatchDateTime
} from "../utils/date-utils";
import { type PoolConnection, type ResultSetHeader } from "mysql2/promise";
import { getSeasonLeagueExternalIdByExternalIdWithSeasonSettings } from "./season-league-external-id.models";
import { getSeasonLeagueTeamByExternalId } from "./season-league-team.models";
import { redisClient } from "../utils/redisClient";

function normalizeMatchTeamSide(value: unknown): MatchTeamSide {
  if (value === "home" || value === "away") return value;
  return null;
}

export const getMatches = async (): Promise<Match[]> => {
  const matches = await runQuery<Match[]>("SELECT * FROM Matches");
  return matches;
};

export const getMatchesWithTeamDataBySeasonId = async (
  seasonId: number,
  leagueId: number | null
): Promise<MatchesWithTeamDataQuery[]> => {
  const query = `
    SELECT 
      m.id AS match_id,
      m.start_timestamp,
      m.end_timestamp,
      m.external_match_room_id,
      m.league_id,
      l.name AS league_name,
      m.season_id,
      s.full_name AS season_name,
      s.platform AS season_platform,
      m.best_of,
      m.stage,
      JSON_OBJECTAGG(
        t.id, 
        JSON_OBJECT(
          'id', t.id,
          'name', t.name,
          'logo', t.team_logo,
          'side', mt.match_side
        )
      ) AS teams
    FROM Matches m
    JOIN MatchTeams mt ON m.id = mt.match_id
    JOIN Teams t ON mt.team_id = t.id
    JOIN Seasons s ON s.id = m.season_id
    JOIN Leagues l ON l.id = m.league_id
    WHERE m.season_id = ? AND (? IS NULL OR m.league_id = ?) AND m.status NOT IN ('FINISHED', 'CANCELLED', 'FORFEIT', 'ABORTED')
    GROUP BY m.id, m.start_timestamp, m.end_timestamp, m.external_match_room_id, 
             m.league_id, l.name, m.season_id, s.full_name, s.platform, m.best_of, m.stage
    ORDER BY m.start_timestamp DESC
  `;
  const results = await runQuery<MatchesWithTeamDataQuery[]>(query, [
    seasonId,
    leagueId,
    leagueId
  ]);

  return results;
};

export const getMatch = async (matchId: number) => {
  const matches = await runQuery<Match[]>(
    "SELECT * FROM Matches WHERE id = ?",
    [matchId]
  );
  return matches;
};

export const getMatchWithBreadcrumbInfo = async (matchId: number) => {
  const matches = await runQuery<(Match & Stage)[]>(
    "SELECT * FROM Matches m JOIN Stages s ON m.stage = s.id WHERE m.id = ?",
    [matchId]
  );
  return matches;
};

export const getMatchGame = (matchId: number, matchGameId: number) => {
  return runQuery<Array<MatchGame | undefined>>(
    "SELECT * FROM MatchGames WHERE match_id = ? AND id = ?",
    [matchId, matchGameId]
  );
};

export const getMatchPlayerStats = async (
  match_id: number,
  stat?: "CT" | "T"
) => {
  // Base fields that are always included
  const baseFields = `
    p.steam_id,
    p.nickname,
    stp.team_id as team_id
  `;

  // Fields that change based on stat parameter
  let statFields: string;
  if (stat === "CT") {
    statFields = `
      SUM(ps.kills_ct) as kills,
      SUM(ps.headshots) as headshots,
      SUM(ps.assists_ct) as assists,
      SUM(ps.flash_assists_ct) as flash_assists,
      SUM(ps.deaths_ct) as deaths,
      Round(AVG(ps.kast),0) as kast_percentage,
      Round(AVG(ps.adr_ct),1) as adr,
      SUM(ps.enemies_flashed_ct) as enemies_flashed,
      Round(AVG(ps.hs_percent),0) as hs_percent,
      SUM(ps.first_kills_ct) as first_kills,
      SUM(ps.first_deaths_ct) as first_deaths,
      SUM(ps.utility_damage_ct) as utility_damage
    `;
  } else if (stat === "T") {
    statFields = `
      SUM(ps.kills_t) as kills,
      SUM(ps.headshots) as headshots,
      SUM(ps.assists_t) as assists,
      SUM(ps.flash_assists_t) as flash_assists,
      SUM(ps.deaths_t) as deaths,
      Round(AVG(ps.kast),0) as kast_percentage,
      Round(AVG(ps.adr_t),1) as adr,
      SUM(ps.enemies_flashed_t) as enemies_flashed,
      Round(AVG(ps.hs_percent),0) as hs_percent,
      SUM(ps.first_kills_t) as first_kills,
      SUM(ps.first_deaths_t) as first_deaths,
      SUM(ps.utility_damage_t) as utility_damage
    `;
  } else {
    // Default: all stats combined
    statFields = `
      SUM(ps.kills) as kills,
      SUM(ps.headshots) as headshots,
      SUM(ps.assists) as assists,
      SUM(ps.flash_assists) as flash_assists,
      SUM(ps.deaths) as deaths,
      Round(AVG(ps.kast),0) as kast_percentage,
      Round(AVG(ps.adr),1) as adr,
      SUM(ps.enemies_flashed) as enemies_flashed,
      Round(AVG(ps.hs_percent),0) as hs_percent,
      Round(AVG(ps.kana_rating),2) as kana_rating,
      SUM(ps.first_kills) as first_kills,
      SUM(ps.first_deaths) as first_deaths
    `;
  }

  const query = `SELECT
        ${baseFields},
        ${statFields}
      FROM PlayerStats ps
      INNER JOIN SteamPlayers p ON p.steam_id = ps.steam_id
      INNER JOIN MatchGames mg ON mg.id = ps.match_game_id
      INNER JOIN Matches m ON m.id = mg.match_id
      INNER JOIN SeasonTeamPlayers stp ON stp.season_id = m.season_id
        AND stp.steam_id = p.steam_id
        AND stp.discarded_at IS NULL
        AND (
          stp.match_id = m.id
          OR (
            stp.match_id IS NULL
            AND NOT EXISTS (
              SELECT 1
              FROM SeasonTeamPlayers stp2
              WHERE stp2.season_id = m.season_id
                AND stp2.steam_id = p.steam_id
                AND stp2.team_id = stp.team_id
                AND stp2.discarded_at IS NULL
                AND stp2.match_id = m.id
            )
          )
        )
      INNER JOIN MatchTeams mt ON mt.match_id = m.id AND mt.team_id = stp.team_id
      WHERE mg.match_id = ?
      GROUP BY p.steam_id, p.nickname, stp.team_id
      ORDER BY stp.team_id, kills DESC, deaths ASC;`;

  return runQuery<MatchPlayerStats[]>(query, [match_id]);
};

/**
 * Fetches team statistics for a match or specific game
 * @param params - Object with either match_id or match_game_id (one must be provided)
 * @returns Array of team statistics with aggregated player stats
 */
export const getTeamStats = async (params: {
  match_id?: number;
  match_game_id?: number;
}): Promise<TeamStatsResponse[]> => {
  const { match_id, match_game_id } = params;

  if (!match_id && !match_game_id) {
    throw new Error("Either match_id or match_game_id must be provided");
  }

  // Determine WHERE clause and parameter based on what's provided
  const whereClause = match_game_id ? "WHERE mg.id = ?" : "WHERE m.id = ?";
  const queryParam = match_game_id ?? match_id;

  const query = `
      SELECT 
          mt.team_id,
          t.name,
          COALESCE(SUM(ps.first_kills), 0) as first_kills,
          COALESCE(SUM(ps.clutches_won), 0) as clutches_won,
          COALESCE(SUM(ps.plants), 0) as plants,
          COALESCE(SUM(ps.trades), 0) as trades
      FROM MatchGames mg
      INNER JOIN Matches m ON m.id = mg.match_id
      INNER JOIN MatchTeams mt ON mt.match_id = m.id
      INNER JOIN Teams t ON t.id = mt.team_id
      LEFT JOIN SeasonTeamPlayers stp ON stp.season_id = m.season_id AND stp.team_id = mt.team_id
      LEFT JOIN PlayerStats ps ON ps.match_game_id = mg.id AND ps.steam_id = stp.steam_id
      ${whereClause}
      GROUP BY mt.team_id, t.name
      ORDER BY mt.team_id`;

  return runQuery<TeamStatsResponse[]>(query, [queryParam!]);
};

export const getMatchTopPlayers = async (
  match_id: number
): Promise<MatchOrGameTopPlayerAwards | null> => {
  const queries = matchTopStats.map((stat) =>
    fetchPlayerStatsForMatchOrGame(match_id, "m.id = ?", stat, stat.sqlFunction)
  );
  const queryResults = await Promise.all(queries);

  if (
    Object.entries(queryResults[0]).every(([_, value]) => value === undefined)
  ) {
    return null;
  }

  return Object.assign(
    {},
    ...queryResults
  ) satisfies MatchOrGameTopPlayerAwards;
};

export const MATCH_MVP_BATCH_LIMIT = 50;

const MVP_CACHE_KEY = (id: number) => `mvp:match:${id}`;

type MatchMvpWithStatus = MatchMvp & { match_status: string };

export const getMatchMvps = async (
  match_ids: number[]
): Promise<MatchMvp[]> => {
  if (match_ids.length === 0) {
    return [];
  }

  const uniqueIds = [...new Set(match_ids)];
  if (uniqueIds.length > MATCH_MVP_BATCH_LIMIT) {
    throw new BadRequestError(
      `match_ids accepts at most ${MATCH_MVP_BATCH_LIMIT} unique IDs per request`
    );
  }

  const cacheKeys = uniqueIds.map(MVP_CACHE_KEY);
  const cached = await redisClient.mget(cacheKeys);

  const resultMap = new Map<number, MatchMvp>();
  const missIds: number[] = [];

  uniqueIds.forEach((id, i) => {
    const hit = cached[i];
    if (hit) {
      resultMap.set(id, JSON.parse(hit) as MatchMvp);
    } else {
      missIds.push(id);
    }
  });

  if (missIds.length > 0) {
    const placeholders = missIds.map(() => "?").join(", ");

    const query = `
      WITH player_scores AS (
        SELECT
          m.id AS match_id,
          m.status AS match_status,
          p.steam_id,
          p.nickname,
          p.avatar,
          stp.team_id,
          CASE
            WHEN m.best_of = 1 THEN MAX(ps.kana_rating)
            ELSE ROUND(AVG(ps.kana_rating), 2)
          END AS mvp_score
        FROM PlayerStats ps
        JOIN SteamPlayers p ON p.steam_id = ps.steam_id
        JOIN MatchGames mg ON mg.id = ps.match_game_id
        JOIN Matches m ON m.id = mg.match_id
        JOIN MatchTeams mt ON mt.match_id = m.id
        JOIN SeasonTeamPlayers stp ON stp.steam_id = p.steam_id
          AND stp.season_id = m.season_id
          AND stp.team_id = mt.team_id
          AND stp.discarded_at IS NULL
          AND (stp.match_id = m.id OR stp.match_id IS NULL)
        LEFT JOIN SeasonTeamPlayers stp2 ON stp.match_id IS NULL
          AND stp2.steam_id = p.steam_id
          AND stp2.season_id = m.season_id
          AND stp2.team_id = mt.team_id
          AND stp2.discarded_at IS NULL
          AND stp2.match_id = m.id
        WHERE m.id IN (${placeholders})
          AND (stp2.steam_id IS NULL OR stp.match_id IS NOT NULL)
        GROUP BY m.id, m.status, m.best_of, p.steam_id, p.nickname, p.avatar, stp.team_id
      ),
      ranked AS (
        SELECT
          match_id,
          match_status,
          steam_id,
          nickname,
          avatar,
          team_id,
          mvp_score,
          ROW_NUMBER() OVER (
            PARTITION BY match_id
            ORDER BY mvp_score DESC, nickname ASC, steam_id ASC
          ) AS rn
        FROM player_scores
      )
      SELECT
        match_id,
        match_status,
        steam_id,
        nickname,
        avatar,
        team_id,
        mvp_score AS kana_rating
      FROM ranked
      WHERE rn = 1
    `;

    const fresh = await runQuery<MatchMvpWithStatus[]>(query, missIds);

    const pipeline = redisClient.pipeline();
    let hasCacheable = false;

    for (const row of fresh) {
      const { match_status, ...mvp } = row;
      resultMap.set(mvp.match_id, mvp);
      if (match_status === MatchStatus.FINISHED) {
        pipeline.set(MVP_CACHE_KEY(mvp.match_id), JSON.stringify(mvp));
        hasCacheable = true;
      }
    }

    if (hasCacheable) {
      await pipeline.exec();
    }
  }

  return uniqueIds.flatMap((id) => {
    const mvp = resultMap.get(id);
    return mvp ? [mvp] : [];
  });
};

export const getMatchMvp = async (
  match_id: number
): Promise<MatchMvp | null> => {
  const [mvp] = await getMatchMvps([match_id]);
  return mvp ?? null;
};

export const getMatchesByFilters = async ({
  season_ids,
  league_ids,
  team_ids,
  stages,
  map_ids
}: ParsedParams) => {
  const { query, queryParams } = generateQueryWithFilters([
    { column: "m.season_id", value: season_ids },
    { column: "m.league_id", value: league_ids },
    { column: [{ column: "t1.id" }, { column: "t2.id" }], value: team_ids },
    { column: "m.stage", value: stages }
  ]);

  // Map filter uses EXISTS so all maps are aggregated into maps_json regardless
  let mapFilterClause = "";
  const mapFilterParams: number[] = [];
  if (map_ids && map_ids.length > 0) {
    const placeholders = map_ids.map(() => "?").join(", ");
    mapFilterClause = `AND EXISTS (
      SELECT 1 FROM MatchGames mg_f
      WHERE mg_f.match_id = m.id AND mg_f.map_id IN (${placeholders})
    )`;
    mapFilterParams.push(...map_ids);
  }

  const hasFilters = query !== "1=1" || mapFilterParams.length > 0;

  const baseQuery = `
      SELECT
          m.id AS match_id,
          m.\`group\` AS match_group,
          m.round AS match_round,
          m.best_of,
          m.season_id,
          DATE(m.start_timestamp) AS match_date,
          m.start_timestamp,
          m.end_timestamp,
          l.name AS league_name,
          m.stage,
          JSON_ARRAYAGG(JSON_OBJECT(
              'name', map.name,
              'home_score', CASE
                  WHEN mt1.match_side = 'home' THEN tms1.score
                  WHEN mt2.match_side = 'home' THEN tms2.score
                  WHEN mt1.match_side = 'away' THEN tms2.score
                  WHEN mt2.match_side = 'away' THEN tms1.score
                  ELSE tms1.score
              END,
              'away_score', CASE
                  WHEN mt1.match_side = 'home' THEN tms2.score
                  WHEN mt2.match_side = 'home' THEN tms1.score
                  WHEN mt1.match_side = 'away' THEN tms1.score
                  WHEN mt2.match_side = 'away' THEN tms2.score
                  ELSE tms2.score
              END
          ) ORDER BY mmp.map_order ASC) AS maps_json,
          CASE
              WHEN MAX(mt1.match_side) = 'home' THEN MAX(t1.name)
              WHEN MAX(mt2.match_side) = 'home' THEN MAX(t2.name)
              WHEN MAX(mt1.match_side) = 'away' THEN MAX(t2.name)
              WHEN MAX(mt2.match_side) = 'away' THEN MAX(t1.name)
              ELSE MAX(t1.name)
          END AS home_team_name,
          CASE
              WHEN MAX(mt1.match_side) = 'home' THEN MAX(t1.team_logo)
              WHEN MAX(mt2.match_side) = 'home' THEN MAX(t2.team_logo)
              WHEN MAX(mt1.match_side) = 'away' THEN MAX(t2.team_logo)
              WHEN MAX(mt2.match_side) = 'away' THEN MAX(t1.team_logo)
              ELSE MAX(t1.team_logo)
          END AS home_team_logo,
          CASE
              WHEN MAX(mt1.match_side) = 'home' THEN MAX(t2.name)
              WHEN MAX(mt2.match_side) = 'home' THEN MAX(t1.name)
              WHEN MAX(mt1.match_side) = 'away' THEN MAX(t1.name)
              WHEN MAX(mt2.match_side) = 'away' THEN MAX(t2.name)
              ELSE MAX(t2.name)
          END AS away_team_name,
          CASE
              WHEN MAX(mt1.match_side) = 'home' THEN MAX(t2.team_logo)
              WHEN MAX(mt2.match_side) = 'home' THEN MAX(t1.team_logo)
              WHEN MAX(mt1.match_side) = 'away' THEN MAX(t1.team_logo)
              WHEN MAX(mt2.match_side) = 'away' THEN MAX(t2.team_logo)
              ELSE MAX(t2.team_logo)
          END AS away_team_logo,
          CASE WHEN m.best_of = 1 THEN MAX(mmp.id) ELSE NULL END AS match_game_id,
          CASE
              WHEN m.best_of != 1 THEN
                  CASE
                      WHEN MAX(mt1.match_side) = 'home' THEN SUM(CASE WHEN tms1.score > tms2.score THEN 1 ELSE 0 END)
                      WHEN MAX(mt2.match_side) = 'home' THEN SUM(CASE WHEN tms2.score > tms1.score THEN 1 ELSE 0 END)
                      WHEN MAX(mt1.match_side) = 'away' THEN SUM(CASE WHEN tms2.score > tms1.score THEN 1 ELSE 0 END)
                      WHEN MAX(mt2.match_side) = 'away' THEN SUM(CASE WHEN tms1.score > tms2.score THEN 1 ELSE 0 END)
                      ELSE SUM(CASE WHEN tms1.score > tms2.score THEN 1 ELSE 0 END)
                  END
              ELSE
                  CASE
                      WHEN MAX(mt1.match_side) = 'home' THEN MAX(tms1.score)
                      WHEN MAX(mt2.match_side) = 'home' THEN MAX(tms2.score)
                      WHEN MAX(mt1.match_side) = 'away' THEN MAX(tms2.score)
                      WHEN MAX(mt2.match_side) = 'away' THEN MAX(tms1.score)
                      ELSE MAX(tms1.score)
                  END
          END AS home_score,
          CASE
              WHEN m.best_of != 1 THEN
                  CASE
                      WHEN MAX(mt1.match_side) = 'home' THEN SUM(CASE WHEN tms1.score < tms2.score THEN 1 ELSE 0 END)
                      WHEN MAX(mt2.match_side) = 'home' THEN SUM(CASE WHEN tms2.score < tms1.score THEN 1 ELSE 0 END)
                      WHEN MAX(mt1.match_side) = 'away' THEN SUM(CASE WHEN tms2.score < tms1.score THEN 1 ELSE 0 END)
                      WHEN MAX(mt2.match_side) = 'away' THEN SUM(CASE WHEN tms1.score < tms2.score THEN 1 ELSE 0 END)
                      ELSE SUM(CASE WHEN tms1.score < tms2.score THEN 1 ELSE 0 END)
                  END
              ELSE
                  CASE
                      WHEN MAX(mt1.match_side) = 'home' THEN MAX(tms2.score)
                      WHEN MAX(mt2.match_side) = 'home' THEN MAX(tms1.score)
                      WHEN MAX(mt1.match_side) = 'away' THEN MAX(tms1.score)
                      WHEN MAX(mt2.match_side) = 'away' THEN MAX(tms2.score)
                      ELSE MAX(tms2.score)
                  END
          END AS away_score
      FROM Matches m
      JOIN MatchGames mmp ON m.id = mmp.match_id
      JOIN Maps map ON map.id = mmp.map_id
      JOIN Leagues l ON m.league_id = l.id
      JOIN TeamGameScores tms1 ON mmp.id = tms1.match_game_id
      JOIN Teams t1 ON tms1.team_id = t1.id
      JOIN TeamGameScores tms2 ON mmp.id = tms2.match_game_id AND tms1.team_id < tms2.team_id
      JOIN Teams t2 ON tms2.team_id = t2.id
      LEFT JOIN (
          SELECT match_id, team_id, MAX(match_side) AS match_side
          FROM MatchTeams
          GROUP BY match_id, team_id
      ) mt1 ON m.id = mt1.match_id AND mt1.team_id = t1.id
      LEFT JOIN (
          SELECT match_id, team_id, MAX(match_side) AS match_side
          FROM MatchTeams
          GROUP BY match_id, team_id
      ) mt2 ON m.id = mt2.match_id AND mt2.team_id = t2.id
      WHERE ${query} AND m.status = 'FINISHED' ${mapFilterClause}
      GROUP BY
          m.id, m.\`group\`, m.round, m.best_of, m.season_id,
          m.start_timestamp, m.end_timestamp,
          DATE(m.start_timestamp), l.name, m.stage,
          t1.name, t1.team_logo, t2.name, t2.team_logo
      ORDER BY
          m.start_timestamp DESC ${hasFilters ? "LIMIT 100" : "LIMIT 500"}`;

  type RawRow = {
    match_id: MatchesByFilters["match_id"];
    match_game_id: MatchesByFilters["match_game_id"];
    match_group: MatchesByFilters["match_group"];
    match_round: MatchesByFilters["match_round"];
    best_of: MatchesByFilters["best_of"];
    season_id: MatchesByFilters["season_id"];
    match_date: MatchesByFilters["match_date"];
    start_timestamp: MatchesByFilters["start_timestamp"];
    end_timestamp: MatchesByFilters["end_timestamp"];
    stage: MatchesByFilters["stage"];
    league_name: MatchesByFilters["league_name"];
    maps_json: string;
    home_team_name: MatchesByFilters["home_team"]["name"];
    home_team_logo: MatchesByFilters["home_team"]["logo"];
    home_score: MatchesByFilters["home_team"]["score"];
    away_team_name: MatchesByFilters["away_team"]["name"];
    away_team_logo: MatchesByFilters["away_team"]["logo"];
    away_score: MatchesByFilters["away_team"]["score"];
  };
  const rows = await runQuery<RawRow[]>(baseQuery, [
    ...queryParams,
    ...mapFilterParams
  ]);
  return rows.map((row) => ({
    match_id: row.match_id,
    match_game_id: row.match_game_id,
    match_group: row.match_group,
    match_round: row.match_round,
    best_of: row.best_of,
    season_id: row.season_id,
    match_date: row.match_date,
    start_timestamp: row.start_timestamp,
    end_timestamp: row.end_timestamp,
    stage: row.stage,
    league_name: row.league_name,
    home_team: {
      name: row.home_team_name,
      logo: row.home_team_logo,
      score: row.home_score
    },
    away_team: {
      name: row.away_team_name,
      logo: row.away_team_logo,
      score: row.away_score
    },
    maps_json: (typeof row.maps_json === "string"
      ? JSON.parse(row.maps_json)
      : row.maps_json) as MatchesByFilters["maps_json"]
  }));
};

export const getMatchGames = async (match_id: number) => {
  const query = `
    SELECT 
      mmp.id,
      mmp.match_id,
      mmp.map_order,
      maps.name as map_name,
      mmp.demofile,
      tgs1.team_id as team1_id,
      tgs2.team_id as team2_id,
      tgs1.score as team1_score,
      tgs2.score as team2_score,
      mts1.match_side AS team1_side,
      mts2.match_side AS team2_side
    FROM MatchGames mmp
    JOIN Maps maps ON maps.id = mmp.map_id
    JOIN TeamGameScores tgs1 ON tgs1.match_game_id = mmp.id
    JOIN TeamGameScores tgs2 ON tgs2.match_game_id = mmp.id AND tgs1.team_id < tgs2.team_id
    LEFT JOIN MatchTeams mts1 ON mmp.match_id = mts1.match_id AND mts1.team_id = tgs1.team_id
    LEFT JOIN MatchTeams mts2 ON mmp.match_id = mts2.match_id AND mts2.team_id = tgs2.team_id
    WHERE mmp.match_id = ?
    ORDER BY mmp.map_order ASC`;

  return runQuery<MatchMapsPlayed[]>(query, [match_id]);
};

export const getMatchInfo = async (
  matchId: number
): Promise<MatchInfoQuery | null> => {
  const query = `
      WITH MatchData AS (
          SELECT 
              m.id AS match_id,
              m.league_id,
              m.season_id,
              m.stage,
              m.best_of,
              m.external_match_room_id,
              m.start_timestamp,
              m.end_timestamp,
              t.id AS team_id,
              t.name AS team_name,
              t.team_logo,
              mg.id AS match_game_id,
              tgs1.score AS team_score,
              tgs2.score AS opponent_score,
              m.status,
              mt.match_side AS team_match_side
          FROM Matches m
          JOIN MatchTeams mt ON m.id = mt.match_id
          JOIN Teams t ON mt.team_id = t.id
          LEFT JOIN MatchGames mg ON m.id = mg.match_id
          LEFT JOIN TeamGameScores tgs1 ON mg.id = tgs1.match_game_id AND mt.team_id = tgs1.team_id
          LEFT JOIN TeamGameScores tgs2 ON mg.id = tgs2.match_game_id AND tgs1.team_id != tgs2.team_id
          WHERE m.id = ?
      ),
      AggregatedScores AS (
          SELECT
              match_id,
              team_id,
              team_name,
              team_logo,
              best_of,
              MAX(team_match_side) AS team_match_side,
              CASE 
                  WHEN best_of = 1 THEN COALESCE(MAX(team_score), 0)
                  ELSE COALESCE(SUM(team_score > opponent_score), 0)
              END AS team_final_score,
              CASE
                WHEN best_of = 1 THEN match_game_id
                ELSE NULL
              END AS match_game_id
          FROM MatchData
          GROUP BY match_id, team_id, team_name, team_logo, best_of
      ),
      GameIds AS (
          SELECT
              match_id,
              CASE
                  WHEN best_of = 1 THEN 
                      CASE 
                          WHEN COUNT(DISTINCT match_game_id) > 0 THEN MAX(match_game_id)
                          ELSE NULL
                      END
                  ELSE 
                      CASE 
                          WHEN COUNT(DISTINCT match_game_id) > 0 THEN JSON_ARRAYAGG(DISTINCT match_game_id)
                          ELSE NULL
                      END
              END AS match_game_ids
          FROM MatchData
          WHERE match_game_id IS NOT NULL
          GROUP BY match_id, best_of
      )
      SELECT 
          a.match_id,
          m.start_timestamp,
          m.end_timestamp,
          m.external_match_room_id,
          m.league_id,
          l.name AS league_name,
          m.season_id,
          s.full_name AS season_name,
          s.platform AS season_platform,
          m.best_of,
          m.stage,
          g.match_game_ids,
          m.status,
          JSON_OBJECTAGG(
              a.team_id, 
              JSON_OBJECT(
                  'id', a.team_id,
                  'name', a.team_name,
                  'logo', a.team_logo,
                  'score', a.team_final_score,
                  'side', a.team_match_side
              )
          ) AS teams
      FROM AggregatedScores a
      JOIN Matches m ON a.match_id = m.id
      JOIN Seasons s ON s.id = m.season_id
      JOIN Leagues l ON l.id = m.league_id
      LEFT JOIN GameIds g ON a.match_id = g.match_id
      GROUP BY a.match_id, m.start_timestamp, m.end_timestamp, m.league_id, m.season_id, m.stage, g.match_game_ids;
  `;

  const [match] = await runQuery<MatchInfoQuery[]>(query, [matchId]);

  if (!match) {
    return null;
  }

  return match;
};

export const getMatchMapVetoes = async (match_id: number) => {
  const query = `
    SELECT 
      v.*,
      m.name as map_name
    FROM MatchTeamMapVetoes v
    JOIN Maps m ON v.map_id = m.id
    WHERE v.match_id = ?
    ORDER BY v.veto_order ASC
  `;
  return runQuery<MatchMapVetoes[]>(query, [match_id]);
};

export const getMatchGamesByTeam = async (
  teamId: number,
  seasonId?: number
): Promise<MatchGamesByTeam[]> => {
  let seasonFilter = "";
  const queryParams: (number | string)[] = [teamId, teamId];

  if (seasonId) {
    seasonFilter = "AND m.season_id = ?";
    queryParams.push(seasonId);
  }

  const matchGamesQuery = `
    SELECT DISTINCT
      m.id as match_id,
      tgs_t.team_id as team1_id,
      tgs_ct.team_id as team2_id,
      t_t.name as team1_name,
      t_ct.name as team2_name,
      DATE(m.start_timestamp) as match_date,
      m.league_id,
      m.season_id,
      mg.id as match_game_id,
      map.name as map_name,
      map.id as map_id,
      mg.map_order,
      COALESCE(tgs_t.score, 0) as team1_score,
      COALESCE(tgs_ct.score, 0) as team2_score,
      mt_side_t.match_side AS team1_side,
      mt_side_ct.match_side AS team2_side
    FROM Matches m
    JOIN MatchTeams mt1 ON m.id = mt1.match_id
    JOIN MatchTeams mt2 ON m.id = mt2.match_id AND mt2.team_id != mt1.team_id
    JOIN MatchGames mg ON m.id = mg.match_id
    JOIN Maps map ON map.id = mg.map_id
    JOIN TeamGameScores tgs_t ON mg.id = tgs_t.match_game_id AND tgs_t.starting_side = 'T'
    JOIN TeamGameScores tgs_ct ON mg.id = tgs_ct.match_game_id AND tgs_ct.starting_side = 'CT'
    JOIN Teams t_t ON tgs_t.team_id = t_t.id
    JOIN Teams t_ct ON tgs_ct.team_id = t_ct.id
    LEFT JOIN MatchTeams mt_side_t ON mt_side_t.match_id = m.id AND mt_side_t.team_id = tgs_t.team_id
    LEFT JOIN MatchTeams mt_side_ct ON mt_side_ct.match_id = m.id AND mt_side_ct.team_id = tgs_ct.team_id
    WHERE (mt1.team_id = ? OR mt2.team_id = ?)
    ${seasonFilter}
    ORDER BY m.start_timestamp DESC, m.id DESC, mg.map_order ASC
  `;

  return runQuery<MatchGamesByTeam[]>(matchGamesQuery, queryParams);
};

const addTeamToMatch = async (
  matchId: number,
  seasonId: number,
  leagueId: number,
  teamId: number,
  matchSide: "home" | "away",
  connection?: PoolConnection
): Promise<void> => {
  const addMatchTeamsQuery = `INSERT INTO MatchTeams (match_id, season_id, league_id, team_id, match_side) VALUES (?, ?, ?, ?, ?)`;
  await runQuery(
    addMatchTeamsQuery,
    [matchId, seasonId, leagueId, teamId, matchSide],
    connection
  );
};

export const getHubMatchesByExternalMatchRoomId = async (
  externalMatchRoomId: string,
  connection?: PoolConnection
) => {
  const query = `SELECT id, status FROM Matches WHERE external_match_room_id = ? ORDER BY id ASC`;
  const matches = await runQuery<
    Array<{ id: Match["id"]; status: Match["status"] }> | undefined
  >(query, [externalMatchRoomId], connection);
  if (!matches || matches.length === 0) {
    return null;
  }
  return matches;
};

/**
 * Returns a map keyed by "{min_team_id}-{max_team_id}" -> our Match.id for playoff matches.
 * Used when the bracket API's match IDs differ from the external_match_room_id stored in our DB
 * (e.g. the FaceIT web bracket API uses internal IDs that do not match the open API format).
 * Takes the lowest match id for each team pair (handles 2xBO1 by linking to the first match).
 */
export const getPlayoffMatchIdsByTeamPairs = async (
  seasonId: number,
  leagueId: number
): Promise<Map<string, number>> => {
  const query = `
    SELECT mt1.match_id,
           LEAST(mt1.team_id, mt2.team_id)    AS min_team_id,
           GREATEST(mt1.team_id, mt2.team_id) AS max_team_id,
           m.\`group\`                          AS grp
    FROM MatchTeams mt1
    JOIN MatchTeams mt2
      ON mt1.match_id = mt2.match_id AND mt1.team_id < mt2.team_id
    JOIN Matches m
      ON m.id = mt1.match_id
    WHERE m.season_id = ? AND m.league_id = ? AND m.stage = 2
    ORDER BY mt1.match_id ASC
  `;
  const rows = await runQuery<
    Array<{
      match_id: Match["id"];
      min_team_id: number;
      max_team_id: number;
      grp: number;
    }>
  >(query, [seasonId, leagueId]);
  const map = new Map<string, number>();
  for (const row of rows) {
    const key = `${row.grp}-${row.min_team_id}-${row.max_team_id}`;
    if (!map.has(key)) {
      map.set(key, row.match_id);
    }
  }
  return map;
};

/**
 * Updates a match's start timestamp using an ISO 8601 timestamp string
 *
 * **Timezone Handling:**
 * - Assumes timestamp is in UTC (ISO string with 'Z' suffix or UTC Date)
 * - Result is stored in database as UTC
 *
 * @param matchId - The match ID to update
 * @param timestamp - ISO 8601 timestamp string (UTC) or Date object
 */
export const updateMatchStartTimestamp = async (
  matchId: number,
  timestamp: string | Date,
  connection?: PoolConnection
): Promise<void> => {
  await runQuery(
    "UPDATE Matches SET start_timestamp = ? WHERE id = ?",
    [formatDateForDatabase(timestamp), matchId],
    connection
  );
};

export const updateMatchStartAndEndTimestamp = async (
  matchId: number,
  startTimestamp: string | Date,
  endTimestamp: string | Date | null,
  connection?: PoolConnection
): Promise<void> => {
  await runQuery(
    "UPDATE Matches SET start_timestamp = ?, end_timestamp = ? WHERE id = ?",
    [
      formatDateForDatabase(startTimestamp),
      endTimestamp ? formatDateForDatabase(endTimestamp) : null,
      matchId
    ],
    connection
  );
};

/**
 * Updates a single match's end timestamp (for 2xBO1: only the second game on match_status_finished).
 *
 * @param matchId - The match ID to update
 * @param timestamp - ISO 8601 timestamp string (UTC) or Date object
 */
export const updateMatchEndTimestamp = async (
  matchId: number,
  timestamp: string | Date,
  connection?: PoolConnection
): Promise<void> => {
  await runQuery(
    "UPDATE Matches SET end_timestamp = ? WHERE id = ?",
    [formatDateForDatabase(timestamp), matchId],
    connection
  );
};

export const getMatchesByExternalId = async (
  externalMatchRoomId: string,
  connection?: PoolConnection
): Promise<Match[]> => {
  const query = `
    SELECT *
    FROM Matches 
    WHERE external_match_room_id = ?
    ORDER BY id, start_timestamp ASC
  `;

  const matches = await runQuery<Match[]>(
    query,
    [externalMatchRoomId],
    connection
  );
  return matches;
};

export const addMatchToDatabase = async (
  matchDetails: ChampionshipDetailsObjectCreated,
  externalLeagueId: string
) => {
  if (matchDetails.status === FaceitMatchStatus.CHECK_IN) {
    logger.info(
      `Match ${matchDetails.match_id} is in check-in status, skipping`,
      matchDetails
    );
    return;
  }

  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    const matches = await getHubMatchesByExternalMatchRoomId(
      matchDetails.match_id,
      connection
    );
    if (matches && matches.length > 0) {
      logger.info(
        `${matches.length} matches with external_match_room_id ${matchDetails.match_id} already exists, skipping`,
        matchDetails
      );
      return;
    }

    const seasonLeagueExternalRoom =
      await getSeasonLeagueExternalIdByExternalIdWithSeasonSettings(
        externalLeagueId,
        connection
      );
    if (!seasonLeagueExternalRoom) {
      throw new Error(
        `No SeasonLeagueExternalId entry found for external_id: ${externalLeagueId}`
      );
    }

    const teamOneExternalId = matchDetails.teams.faction1.faction_id;
    const teamTwoExternalId = matchDetails.teams.faction2.faction_id;

    const teamOne = await getSeasonLeagueTeamByExternalId(
      teamOneExternalId,
      seasonLeagueExternalRoom.season_id,
      connection
    );
    const teamTwo = await getSeasonLeagueTeamByExternalId(
      teamTwoExternalId,
      seasonLeagueExternalRoom.season_id,
      connection
    );

    if (!teamOne || !teamTwo) {
      throw new Error(
        `No SeasonLeagueTeam entry found for external_id: ${teamOneExternalId} or ${teamTwoExternalId}`
      );
    }
    const { league_id, season_id, stage_id } = seasonLeagueExternalRoom;

    const { is_round_robin_bo2_as_2xbo1 } = seasonLeagueExternalRoom;

    const startTimestamp = getFaceitMatchDateTime(matchDetails.scheduled_at);

    const realBestOf =
      matchDetails.best_of === 2 && is_round_robin_bo2_as_2xbo1
        ? 1
        : matchDetails.best_of;

    const params = [
      league_id,
      season_id,
      stage_id,
      realBestOf,
      formatDateForDatabase(startTimestamp),
      null,
      matchDetails.match_id,
      matchDetails.status,
      matchDetails.round,
      seasonLeagueExternalRoom.manual_group ?? matchDetails.group
    ];

    const matchQuery = `
      INSERT INTO Matches (
        league_id,
        season_id,
        stage,
        best_of,
        start_timestamp,
        end_timestamp,
        external_match_room_id,
        status,
        round,
        \`group\`
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    if (is_round_robin_bo2_as_2xbo1 && matchDetails.best_of === 2) {
      const firstMatch = await runQuery<ResultSetHeader>(
        matchQuery,
        params,
        connection
      );
      const firstMatchId = firstMatch.insertId;

      const secondStartTimestamp = adjustMatchDateTime(startTimestamp, {
        hours: 1
      });

      // Create new params array for second match with adjusted timestamp
      const secondMatchParams = [
        league_id,
        season_id,
        stage_id,
        realBestOf,
        formatDateForDatabase(secondStartTimestamp),
        null,
        matchDetails.match_id,
        matchDetails.status,
        matchDetails.round,
        seasonLeagueExternalRoom.manual_group ?? matchDetails.group
      ];

      const secondMatch = await runQuery<ResultSetHeader>(
        matchQuery,
        secondMatchParams,
        connection
      );
      const secondMatchId = secondMatch.insertId;

      await Promise.all([
        addTeamToMatch(
          firstMatchId,
          season_id,
          league_id,
          teamOne.team_id,
          "home",
          connection
        ),
        addTeamToMatch(
          firstMatchId,
          season_id,
          league_id,
          teamTwo.team_id,
          "away",
          connection
        ),
        addTeamToMatch(
          secondMatchId,
          season_id,
          league_id,
          teamOne.team_id,
          "away",
          connection
        ),
        addTeamToMatch(
          secondMatchId,
          season_id,
          league_id,
          teamTwo.team_id,
          "home",
          connection
        )
      ]);

      await connection.commit();

      return {
        matchIds: [firstMatchId, secondMatchId],
        is_round_robin_bo2_as_2xbo1
      };
    } else {
      const match = await runQuery<ResultSetHeader>(
        matchQuery,
        params,
        connection
      );
      const matchId = match.insertId;

      await Promise.all([
        addTeamToMatch(
          matchId,
          season_id,
          league_id,
          teamOne.team_id,
          "home",
          connection
        ),
        addTeamToMatch(
          matchId,
          season_id,
          league_id,
          teamTwo.team_id,
          "away",
          connection
        )
      ]);

      await connection.commit();
      return { matchIds: [matchId], is_round_robin_bo2_as_2xbo1 };
    }
  } catch (error) {
    await connection.rollback();
    logger.error(
      `Failed to insert match ${matchDetails.match_id} into database`,
      error
    );
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Sets end time and FINISHED status without changing `start_timestamp`.
 * Used for championship BO3+ hubs after `match_status_ready` established the start.
 */
export const updateMatchFinishedEndOnly = async (
  externalMatchRoomId: string,
  finishedAt: string
): Promise<void> => {
  const matches = await runQuery<Array<{ id: Match["id"] }>>(
    "SELECT id FROM Matches WHERE external_match_room_id = ?",
    [externalMatchRoomId]
  );

  if (matches.length === 0) {
    logger.warn(
      `No matches found with external_match_room_id: ${externalMatchRoomId}`
    );
    return;
  }

  const endTimestamp = formatDateForDatabase(finishedAt);

  await runQuery(
    "UPDATE Matches SET end_timestamp = ?, status = ? WHERE external_match_room_id = ?",
    [endTimestamp, MatchStatus.FINISHED, externalMatchRoomId]
  );
  logger.info(
    `Updated end_timestamp to ${endTimestamp} and status FINISHED for ${matches.length} match(es) with external_match_room_id: ${externalMatchRoomId} (start_timestamp unchanged)`
  );
};

export const updateMatchFinished = async (
  externalMatchRoomId: string,
  startedAt: string,
  finishedAt: string
): Promise<void> => {
  const matches = await runQuery<Array<{ id: Match["id"] }>>(
    "SELECT id FROM Matches WHERE external_match_room_id = ?",
    [externalMatchRoomId]
  );

  if (matches.length === 0) {
    logger.warn(
      `No matches found with external_match_room_id: ${externalMatchRoomId}`
    );
    return;
  }

  const startTimestamp = formatDateForDatabase(startedAt);
  const endTimestamp = formatDateForDatabase(finishedAt);

  await runQuery(
    "UPDATE Matches SET start_timestamp = ?, end_timestamp = ?, status = ? WHERE external_match_room_id = ?",
    [startTimestamp, endTimestamp, MatchStatus.FINISHED, externalMatchRoomId]
  );
  logger.info(
    `Updated start_timestamp to ${startTimestamp} and end_timestamp to ${endTimestamp} for ${matches.length} match(es) with external_match_room_id: ${externalMatchRoomId}`
  );
};

export const updateMatchEndTime = async (
  externalMatchRoomId: string,
  finishedAt: string
): Promise<void> => {
  const matches = await runQuery<Array<{ id: Match["id"] }>>(
    "SELECT id FROM Matches WHERE external_match_room_id = ?",
    [externalMatchRoomId]
  );

  if (matches.length === 0) {
    logger.warn(
      `No matches found with external_match_room_id: ${externalMatchRoomId}`
    );
    return;
  }

  const endTimestamp = formatDateForDatabase(finishedAt);

  await runQuery(
    "UPDATE Matches SET end_timestamp = ? WHERE external_match_room_id = ?",
    [endTimestamp, externalMatchRoomId]
  );

  logger.info(
    `Updated end_timestamp to ${endTimestamp} for ${matches.length} match(es) with external_match_room_id: ${externalMatchRoomId}`
  );
};

export const getMatchesStatusByExternalMatchroomId = async (
  externalMatchRoomId: string
): Promise<Match["status"][]> => {
  const matches = await runQuery<Array<{ status: Match["status"] }>>(
    "SELECT status FROM Matches WHERE external_match_room_id = ?",
    [externalMatchRoomId]
  );
  return matches.map((match) => match.status);
};

export const updateMatchStatusByExternalMatchroomId = async (
  externalMatchRoomId: string,
  status: keyof typeof MatchStatus,
  connection?: PoolConnection
): Promise<void> => {
  await runQuery(
    "UPDATE Matches SET status = ? WHERE external_match_room_id = ?",
    [status, externalMatchRoomId],
    connection
  );
};

export const updateMatchStatusByMatchId = async (
  matchId: number,
  status: keyof typeof MatchStatus,
  connection?: PoolConnection
) => {
  await runQuery(
    "UPDATE Matches SET status = ? WHERE id = ?",
    [status, matchId],
    connection
  );
};

export const getMatchesBySeasonAndLeagueWithStreamUrls = async (
  seasonId: number,
  leagueId: number | null
) => {
  const query = `
    SELECT 
      m.id,
      m.league_id,
      m.season_id,
      s.platform,
      m.stage,
      m.start_timestamp,
      m.end_timestamp,
      m.best_of,
      m.external_match_room_id,
      m.status,
      m.round,
      m.group,
      l.name as league_name,
      sl.tier as league_tier,
      GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ' vs ') as team_names,
      MAX(CASE WHEN mt.match_side = 'home' THEN t.id END) AS home_team_id,
      MAX(CASE WHEN mt.match_side = 'away' THEN t.id END) AS away_team_id,
      MAX(CASE WHEN mt.match_side = 'home' THEN t.name END) AS home_team_name,
      MAX(CASE WHEN mt.match_side = 'away' THEN t.name END) AS away_team_name,
      JSON_ARRAYAGG(DISTINCT CASE WHEN r.stream_url IS NOT NULL THEN r.stream_url END) as stream_urls
    FROM Matches m
    LEFT JOIN Leagues l ON m.league_id = l.id
    LEFT JOIN SeasonLeagues sl ON m.season_id = sl.season_id AND m.league_id = sl.league_id
    LEFT JOIN Seasons s ON m.season_id = s.id
    LEFT JOIN MatchTeams mt ON m.id = mt.match_id
    LEFT JOIN Teams t ON mt.team_id = t.id
    LEFT JOIN Reservations r ON m.id = r.match_id AND m.status NOT IN ('CANCELLED', 'FORFEIT', 'ABORTED')
    WHERE m.season_id = ? AND (? IS NULL OR m.league_id = ?) AND m.status NOT IN ('CANCELLED', 'ABORTED')
    GROUP BY m.id, m.league_id, m.season_id, m.stage, m.start_timestamp, m.end_timestamp, m.best_of, m.external_match_room_id, m.status, m.round, m.group, l.name, sl.tier
    ORDER BY m.start_timestamp ASC, COUNT(CASE WHEN r.stream_url IS NOT NULL THEN r.stream_url END) DESC, sl.tier ASC
  `;

  const results = await runQuery<
    Array<{
      id: Match["id"];
      league_id: League["id"];
      season_id: Season["id"];
      platform: Season["platform"];
      stage: Match["stage"];
      start_timestamp: Match["start_timestamp"];
      end_timestamp: Match["end_timestamp"];
      best_of: Match["best_of"];
      external_match_room_id: Match["external_match_room_id"];
      status: Match["status"];
      round: Match["round"];
      group: Match["group"];
      league_name: League["name"];
      league_tier: SeasonLeague["tier"];
      team_names: string | null;
      home_team_id: number | null;
      away_team_id: number | null;
      home_team_name: string | null;
      away_team_name: string | null;
      stream_urls: string | null;
    }>
  >(query, [seasonId, leagueId, leagueId]);

  return results.map((match) => {
    const teamNames = match.team_names || "Unknown vs Unknown";
    const teams = teamNames.split(" vs ");

    const teamsBySide: CalendarMatchTeamsBySide =
      match.home_team_id != null &&
      match.home_team_name != null &&
      match.away_team_id != null &&
      match.away_team_name != null
        ? {
            home: { id: match.home_team_id, name: match.home_team_name },
            away: { id: match.away_team_id, name: match.away_team_name }
          }
        : { home: null, away: null };

    const startTimestampISO = new Date(match.start_timestamp);

    // Calculate end timestamp if it's null
    let endTimestamp = match.end_timestamp
      ? new Date(match.end_timestamp)
      : null;
    if (!endTimestamp && startTimestampISO) {
      // Assume each best_of game takes 1 hour
      const hoursToAdd = match.best_of || 1;

      // Check if date is valid before using it
      if (!isNaN(startTimestampISO.getTime())) {
        const endDate = new Date(
          startTimestampISO.getTime() + hoursToAdd * 60 * 60 * 1000
        );
        endTimestamp = endDate;
      } else {
        // If start date is invalid, set endTimestamp to null
        endTimestamp = null;
      }
    }

    return {
      match_id: match.id.toString(),
      title: teamNames,
      match_start: startTimestampISO.toISOString(),
      match_end: endTimestamp ? endTimestamp.toISOString() : "",
      match_status: match.status,
      league_name: match.league_name,
      league_tier: match.league_tier,
      stream_urls: match.stream_urls
        ? JSON.parse(match.stream_urls).filter(
            (url: string | null) => url !== null
          )
        : [],
      match_team1: teams[0] || "Unknown",
      match_team2: teams[1] || "Unknown",
      teams: teamsBySide,
      external_match_room_id: match.external_match_room_id,
      season_platform: match.platform
    } satisfies MatchWithStreamUrls;
  });
};

export const getMatchIs2xBO1 = async (matchId: number) => {
  const [match] = await getMatch(matchId);
  if (!match) {
    return false;
  }
  if (!match.external_match_room_id) {
    return false;
  }
  const getMatchByExternalMatchRoomId =
    await getHubMatchesByExternalMatchRoomId(match.external_match_room_id);
  return getMatchByExternalMatchRoomId?.length === 2;
};

export const getMatchIdsWithSameExternalMatchRoomId = async (
  matchId: number
) => {
  const [match] = await getMatch(matchId);
  if (!match) {
    return [];
  }
  if (!match.external_match_room_id) {
    return [];
  }
  return getHubMatchesByExternalMatchRoomId(match.external_match_room_id);
};

export const getMatchTeamLineups = async (matchId: number) => {
  const query = `
    WITH PlayerGameCounts AS (
      SELECT 
        ps.steam_id,
        COUNT(DISTINCT mg.id) as games_played,
        AVG(ps.kana_rating) as kana_rating
      FROM PlayerStats ps
      JOIN MatchGames mg ON ps.match_game_id = mg.id
      JOIN Matches m2 ON mg.match_id = m2.id
      WHERE m2.season_id = (SELECT season_id FROM Matches WHERE id = ?)
      GROUP BY ps.steam_id
    ),
    LatestPlayerRanks AS (
      -- Get latest season data for each player as fallback
      SELECT 
        spr.steam_id,
        spr.cs2_rank,
        spr.faceit_level,
        spr.faceit_elo,
        spr.cs_hours,
        ROW_NUMBER() OVER (PARTITION BY spr.steam_id ORDER BY spr.season_id DESC) as rank_recency
      FROM SeasonPlayerRanks spr
    ),
    LatestPlayerMapCounts AS (
      -- Get map counts from latest season as fallback
      SELECT 
        ps.steam_id,
        COUNT(DISTINCT mg.id) as maps_played,
        ROW_NUMBER() OVER (PARTITION BY ps.steam_id ORDER BY m2.season_id DESC) as map_recency
      FROM PlayerStats ps
      JOIN MatchGames mg ON ps.match_game_id = mg.id
      JOIN Matches m2 ON mg.match_id = m2.id
      GROUP BY ps.steam_id, m2.season_id
    ),
    RankedPlayers AS (
      SELECT 
        t.id as team_id,
        t.name as team_name,
        t.team_logo,
        sp.steam_id,
        sp.nickname as player_name,
        sp.nickname as player_nickname,
        -- Use current season data if available, otherwise use latest season data
        COALESCE(spr_current.cs2_rank, spr_latest.cs2_rank) as cs2_rank,
        COALESCE(spr_current.faceit_level, spr_latest.faceit_level) as faceit_level,
        COALESCE(spr_current.faceit_elo, spr_latest.faceit_elo) as faceit_elo,
        COALESCE(spr_current.cs_hours, spr_latest.cs_hours) as cs_hours,
        COALESCE(pgc.games_played, 0) as games_played,
        COALESCE(pgc.games_played, lpmc.maps_played, 0) as maps_played,
        COALESCE(pgc.kana_rating, 0) as kana_rating,
        ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY COALESCE(pgc.games_played, lpmc.maps_played, 0) DESC, sp.nickname) as player_rank,
        mt.match_side AS match_side
      FROM Matches m
      JOIN MatchTeams mt ON m.id = mt.match_id
      JOIN Teams t ON mt.team_id = t.id
      JOIN SeasonTeamPlayers stp ON stp.team_id = t.id AND stp.season_id = m.season_id AND stp.discarded_at IS NULL
      JOIN SteamPlayers sp ON stp.steam_id = sp.steam_id
      LEFT JOIN SeasonPlayerRanks spr_current ON spr_current.steam_id = sp.steam_id AND spr_current.season_id = m.season_id
      LEFT JOIN LatestPlayerRanks spr_latest ON spr_latest.steam_id = sp.steam_id AND spr_latest.rank_recency = 1
      LEFT JOIN PlayerGameCounts pgc ON sp.steam_id = pgc.steam_id
      LEFT JOIN LatestPlayerMapCounts lpmc ON lpmc.steam_id = sp.steam_id AND lpmc.map_recency = 1
      WHERE m.id = ?
    )
    SELECT 
      team_id,
      team_name,
      team_logo,
      match_side,
      steam_id,
      player_name,
      player_nickname,
      cs2_rank,
      faceit_level,
      faceit_elo,
      cs_hours,
      games_played,
      maps_played,
      kana_rating
    FROM RankedPlayers
    WHERE player_rank <= 5
    ORDER BY team_id, player_rank
  `;

  const results = await runQuery<MatchTeamLineupRaw[]>(query, [
    matchId,
    matchId
  ]);

  // Handle case where runQuery returns an object or empty result
  if (!results || !Array.isArray(results) || results.length === 0) {
    return null;
  }

  // Group players by team
  const teams: Record<string, MatchTeamLineup> = {};

  results.forEach((row: MatchTeamLineupRaw) => {
    const teamKey = row.team_id.toString();

    if (!teams[teamKey]) {
      teams[teamKey] = {
        id: row.team_id,
        name: row.team_name,
        logo: row.team_logo,
        side: normalizeMatchTeamSide(row.match_side),
        players: []
      } satisfies MatchTeamLineup;
    }

    teams[teamKey].players.push({
      steam_id: row.steam_id,
      name: row.player_name,
      nickname: row.player_nickname,
      cs2_rank: row.cs2_rank,
      faceit_level: row.faceit_level,
      faceit_elo: row.faceit_elo,
      cs_hours: row.cs_hours,
      games_played: row.games_played,
      maps_played: row.maps_played,
      kana_rating: row.kana_rating
    });
  });

  return teams;
};

export const getUnfinishedMatchesBySeason = async (
  seasonId: number
): Promise<UnfinishedMatch[]> => {
  const query = `
    SELECT
      m.id AS match_id,
      l.name AS league_name,
      t1.name AS team1_name,
      t2.name AS team2_name,
      m.best_of,
      m.status,
      m.start_timestamp
    FROM Matches m
    JOIN Leagues l ON l.id = m.league_id
    JOIN MatchTeams mt1 ON mt1.match_id = m.id
    JOIN Teams t1 ON t1.id = mt1.team_id
    JOIN MatchTeams mt2 ON mt2.match_id = m.id AND mt2.team_id > mt1.team_id
    JOIN Teams t2 ON t2.id = mt2.team_id
    WHERE m.season_id = ?
      AND NOT EXISTS (
        SELECT 1 FROM MatchTeamMapVetoes v WHERE v.match_id = m.id
      )
    ORDER BY m.start_timestamp ASC
  `;

  const rows = await runQuery<UnfinishedMatchQuery[]>(query, [seasonId]);

  return rows.map((row) => ({
    match_id: row.match_id,
    label: `${row.league_name} ${row.team1_name} vs. ${row.team2_name}`,
    best_of: row.best_of,
    status: row.status,
    start_timestamp: row.start_timestamp
  }));
};

export const ensureMatchIdAndTeamIdMatches = async (
  matchId: number,
  teamId: number
) => {
  const query = `SELECT COUNT(*) as count FROM MatchTeams WHERE match_id = ? AND team_id = ?`;
  const results = await runQuery<Array<{ count: number }>>(query, [
    matchId,
    teamId
  ]);
  const result = results[0];
  if (!result || result.count === 0) {
    throw new Error(
      `Match with id ${matchId} does not match team with id ${teamId}`
    );
  }
};

export const getMatchTeamIdsByMatchId = async (
  matchId: number,
  connection?: PoolConnection
): Promise<number[]> => {
  const rows = await runQuery<Array<{ team_id: number }>>(
    `SELECT team_id FROM MatchTeams WHERE match_id = ?`,
    [matchId],
    connection
  );
  return rows.map((r) => r.team_id);
};

export const getGrandFinalMatchBySeasonAndLeague = async (
  seasonId: number,
  leagueId: number,
  connection?: PoolConnection
): Promise<Match[]> => {
  return runQuery<Match[]>(
    `SELECT m.* FROM Matches m
     JOIN Seasons s ON m.season_id = s.id
     WHERE m.season_id = ? AND m.league_id = ? AND m.\`group\` = 3
       AND m.round = CASE WHEN s.grand_final_round_one_only = 1 THEN 1 ELSE 2 END
     ORDER BY m.id ASC
     LIMIT 1`,
    [seasonId, leagueId],
    connection
  );
};

export const getLowerBracketFinalMatch = async (
  seasonId: number,
  leagueId: number,
  stageId: number,
  connection?: PoolConnection
): Promise<{ id: number } | null> => {
  const rows = await runQuery<Array<{ id: number }>>(
    `SELECT id FROM Matches
     WHERE season_id = ? AND league_id = ? AND stage = ? AND \`group\` = 2
     ORDER BY round DESC LIMIT 1`,
    [seasonId, leagueId, stageId],
    connection
  );
  return rows[0] ?? null;
};
