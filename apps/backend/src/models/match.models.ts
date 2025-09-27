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
  type MatchTeamStats,
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
  type SeasonLeague
} from "@eggosystem/types";
import {
  fetchPlayerStatsForMatchOrGame,
  matchTopStats
} from "../shared/fetch-stat";
import { getConnection } from "../db/mysqlConnection";
import { logger } from "../utils/app-logger";
import {
  adjustMatchDateTime,
  convertISOToTime,
  getMatchDateTime
} from "../utils/date-utils";
import { type PoolConnection } from "mysql2/promise";
import { getSeasonLeagueExternalIdByExternalIdWithSeasonSettings } from "./season-league-external-id.models";
import { getSeasonLeagueTeamByExternalId } from "./season-league-team.models";

export const getMatches = (): Promise<Match[]> => {
  return runQuery("SELECT * FROM Matches");
};

export const getMatchesWithTeamDataBySeasonId = async (
  seasonId: number,
  leagueId: number | null
): Promise<MatchesWithTeamDataQuery[]> => {
  const query = `
    SELECT 
      m.id AS match_id,
      m.match_date,
      m.start_time,
      m.end_time,
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
          'logo', t.team_logo
        )
      ) AS teams
    FROM Matches m
    JOIN MatchTeams mt ON m.id = mt.match_id
    JOIN Teams t ON mt.team_id = t.id
    JOIN Seasons s ON s.id = m.season_id
    JOIN Leagues l ON l.id = m.league_id
    WHERE m.season_id = ? AND (? IS NULL OR m.league_id = ?) AND m.status NOT IN ('FINISHED', 'CANCELLED', 'FORFEIT', 'ABORTED')
    GROUP BY m.id, m.match_date, m.start_time, m.end_time, m.external_match_room_id, 
             m.league_id, l.name, m.season_id, s.full_name, s.platform, m.best_of, m.stage
    ORDER BY m.match_date DESC
  `;
  return runQuery<MatchesWithTeamDataQuery[]>(query, [
    seasonId,
    leagueId,
    leagueId
  ]);
};

export const getMatch = (matchId: number) => {
  return runQuery<Array<Match | undefined>>(
    "SELECT * FROM Matches WHERE id = ?",
    [matchId]
  );
};

export const getMatchWithBreadcrumbInfo = (matchId: number) => {
  return runQuery<Array<(Match & Stage) | undefined>>(
    "SELECT * FROM Matches m JOIN Stages s ON m.stage = s.id WHERE m.id = ?",
    [matchId]
  );
};

export const getMatchGame = (matchId: number, gameId: number) => {
  return runQuery<Array<MatchGame | undefined>>(
    "SELECT * FROM MatchGames WHERE match_id = ? AND id = ?",
    [matchId, gameId]
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
  let statFields = "";
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
      INNER JOIN MatchGames mg ON mg.id = ps.game_id
      INNER JOIN Matches m ON m.id = mg.match_id
      INNER JOIN SeasonTeamPlayers stp ON stp.season_id = m.season_id AND stp.steam_id = p.steam_id
      INNER JOIN MatchTeams mt ON mt.match_id = m.id AND mt.team_id = stp.team_id
      WHERE mg.match_id = ?
      GROUP BY p.steam_id, p.nickname, stp.team_id
      ORDER BY stp.team_id, kills DESC, deaths ASC;`;

  return runQuery<MatchPlayerStats[]>(query, [match_id]);
};

export const getMatchTeamStats = async (match_id: number) => {
  // For all maps in a match, handle both BO1 and BO3
  const query = `
      SELECT 
        stp.team_id,
        t.name,
        SUM(ps.first_kills) as first_kills,
        SUM(ps.clutches_won) as clutches_won,
        SUM(ps.plants) as plants,
        SUM(ps.trades) as trades
      FROM PlayerStats ps
      INNER JOIN SteamPlayers p ON p.steam_id = ps.steam_id
      INNER JOIN MatchGames mg ON mg.id = ps.game_id
      INNER JOIN Matches m ON m.id = mg.match_id
      INNER JOIN SeasonTeamPlayers stp ON stp.season_id = m.season_id AND stp.steam_id = p.steam_id
      INNER JOIN MatchTeams mt ON mt.match_id = m.id AND mt.team_id = stp.team_id
      INNER JOIN Teams t ON t.id = stp.team_id
      WHERE m.id = ?
      GROUP BY stp.team_id`;

  return runQuery<MatchTeamStats[]>(query, [match_id]);
};

export const getRoundInfo = async (id: number): Promise<Match | undefined> => {
  const result = await runQuery<Match[]>(
    `SELECT round_info from MatchStats WHERE match_id=? ORDER BY round_number;`,
    [id]
  );
  return result.length > 0 ? result[0] : undefined;
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

export const getMatchesByFilters = async ({
  season_ids,
  league_ids,
  team_ids,
  stages,
  map_ids
}: ParsedParams) => {
  // Base query
  const { query, queryParams } = generateQueryWithFilters([
    { column: "m.season_id", value: season_ids },
    { column: "m.league_id", value: league_ids },
    { column: [{ column: "t1.id" }, { column: "t2.id" }], value: team_ids },
    { column: "m.stage", value: stages },
    { column: "mmp.map_id", value: map_ids }
  ]);

  const mapFilterPresent = map_ids && map_ids.length > 0;

  const baseQuery = `
      SELECT 
          m.id AS match_id,
          m.match_date,
          l.name AS league_name,
          m.stage,
          ${!mapFilterPresent ? "GROUP_CONCAT(DISTINCT map.name SEPARATOR ',') AS map_name," : "map.name AS map_name,"}
          t1.name AS team1_name,
          t1.team_logo AS team1_logo,
          t2.name AS team2_name,
          t2.team_logo AS team2_logo,
          CASE
            WHEN m.best_of = 1 THEN mmp.id
            ELSE NULL
          END AS game_id,
          CASE 
              ${!mapFilterPresent ? "WHEN m.best_of != 1 THEN SUM(CASE WHEN tms1.score > tms2.score THEN 1 ELSE 0 END)" : "WHEN 1=1 THEN tms1.score"}
              ELSE tms1.score
          END AS team1_score,
          CASE 
              ${!mapFilterPresent ? "WHEN m.best_of != 1 THEN SUM(CASE WHEN tms1.score < tms2.score THEN 1 ELSE 0 END)" : "WHEN 1=1 THEN tms2.score"}
              ELSE tms2.score
          END AS team2_score
      FROM Matches m
      JOIN MatchGames mmp ON m.id = mmp.match_id
      JOIN Maps map ON map.id = mmp.map_id
      JOIN Leagues l ON m.league_id = l.id
      JOIN TeamGameScores tms1 ON mmp.id = tms1.game_id
      JOIN Teams t1 ON tms1.team_id = t1.id
      JOIN TeamGameScores tms2 ON mmp.id = tms2.game_id AND tms1.team_id < tms2.team_id
      JOIN Teams t2 ON tms2.team_id = t2.id
      WHERE ${query}
      GROUP BY 
          ${!mapFilterPresent ? "m.id, m.match_date, l.name, m.stage, t1.name, t1.team_logo, t2.name, t2.team_logo" : "mmp.id, l.name, m.stage, t1.name, t1.team_logo, t2.name, t2.team_logo"}
      ORDER BY 
          m.match_date DESC ${query === "1=1" ? "LIMIT 500" : "LIMIT 100"}`;
  return runQuery<MatchesByFilters[]>(baseQuery, queryParams);
};

export const getMatchGames = async (match_id: number) => {
  const query = `
    SELECT 
      mmp.id,
      maps.name as map_name,
      mmp.demofile,
      tgs1.score as team1_score,
      tgs2.score as team2_score
    FROM MatchGames mmp
    JOIN Maps maps ON maps.id = mmp.map_id
    JOIN TeamGameScores tgs1 ON tgs1.game_id = mmp.id
    JOIN TeamGameScores tgs2 ON tgs2.game_id = mmp.id AND tgs1.team_id < tgs2.team_id
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
              m.match_date,
              m.league_id,
              m.season_id,
              m.stage,
              m.best_of,
              m.start_time,
              m.end_time,
              m.external_match_room_id,
              t.id AS team_id,
              t.name AS team_name,
              t.team_logo,
              mg.id AS game_id,
              tgs1.score AS team_score,
              tgs2.score AS opponent_score,
              m.status
          FROM Matches m
          JOIN MatchTeams mt ON m.id = mt.match_id
          JOIN Teams t ON mt.team_id = t.id
          LEFT JOIN MatchGames mg ON m.id = mg.match_id
          LEFT JOIN TeamGameScores tgs1 ON mg.id = tgs1.game_id AND mt.team_id = tgs1.team_id
          LEFT JOIN TeamGameScores tgs2 ON mg.id = tgs2.game_id AND tgs1.team_id != tgs2.team_id
          WHERE m.id = ?
      ),
      AggregatedScores AS (
          SELECT
              match_id,
              team_id,
              team_name,
              team_logo,
              best_of,
              CASE 
                  WHEN best_of = 1 THEN COALESCE(MAX(team_score), 0)
                  ELSE COALESCE(SUM(team_score > opponent_score), 0)
              END AS team_final_score,
              CASE
                WHEN best_of = 1 THEN game_id
                ELSE NULL
              END AS game_id
          FROM MatchData
          GROUP BY match_id, team_id, team_name, team_logo, best_of
      ),
      GameIds AS (
          SELECT
              match_id,
              CASE
                  WHEN best_of = 1 THEN 
                      CASE 
                          WHEN COUNT(DISTINCT game_id) > 0 THEN MAX(game_id)
                          ELSE NULL
                      END
                  ELSE 
                      CASE 
                          WHEN COUNT(DISTINCT game_id) > 0 THEN JSON_ARRAYAGG(DISTINCT game_id)
                          ELSE NULL
                      END
              END AS game_ids
          FROM MatchData
          WHERE game_id IS NOT NULL
          GROUP BY match_id, best_of
      )
      SELECT 
          a.match_id,
          m.match_date,
          m.start_time,
          m.end_time,
          m.external_match_room_id,
          m.league_id,
          l.name AS league_name,
          m.season_id,
          s.full_name AS season_name,
          s.platform AS season_platform,
          m.best_of,
          m.stage,
          g.game_ids,
          m.status,
          JSON_OBJECTAGG(
              a.team_id, 
              JSON_OBJECT(
                  'id', a.team_id,
                  'name', a.team_name,
                  'logo', a.team_logo,
                  'score', a.team_final_score
              )
          ) AS teams
      FROM AggregatedScores a
      JOIN Matches m ON a.match_id = m.id
      JOIN Seasons s ON s.id = m.season_id
      JOIN Leagues l ON l.id = m.league_id
      LEFT JOIN GameIds g ON a.match_id = g.match_id
      GROUP BY a.match_id, m.match_date, m.league_id, m.season_id, m.stage, g.game_ids;
  `;

  const [match] = await runQuery<MatchInfoQuery[]>(query, [matchId]);

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
      DATE_FORMAT(m.match_date, '%Y-%m-%d') as match_date,
      m.league_id,
      m.season_id,
      mg.id as game_id,
      map.name as map_name,
      map.id as map_id,
      mg.map_order,
      COALESCE(tgs_t.score, 0) as team1_score,
      COALESCE(tgs_ct.score, 0) as team2_score
    FROM Matches m
    JOIN MatchTeams mt1 ON m.id = mt1.match_id
    JOIN MatchTeams mt2 ON m.id = mt2.match_id AND mt2.team_id != mt1.team_id
    JOIN MatchGames mg ON m.id = mg.match_id
    JOIN Maps map ON map.id = mg.map_id
    JOIN TeamGameScores tgs_t ON mg.id = tgs_t.game_id AND tgs_t.starting_side = 'T'
    JOIN TeamGameScores tgs_ct ON mg.id = tgs_ct.game_id AND tgs_ct.starting_side = 'CT'
    JOIN Teams t_t ON tgs_t.team_id = t_t.id
    JOIN Teams t_ct ON tgs_ct.team_id = t_ct.id
    WHERE (mt1.team_id = ? OR mt2.team_id = ?)
    ${seasonFilter}
    ORDER BY m.match_date DESC, m.id DESC, mg.map_order ASC
  `;

  return runQuery<MatchGamesByTeam[]>(matchGamesQuery, queryParams);
};

const addTeamToMatch = async (
  matchId: number,
  seasonId: number,
  leagueId: number,
  teamId: number,
  connection?: PoolConnection
): Promise<void> => {
  const addMatchTeamsQuery = `INSERT INTO MatchTeams (match_id, season_id, league_id, team_id) VALUES (?, ?, ?, ?)`;
  await runQuery(
    addMatchTeamsQuery,
    [matchId, seasonId, leagueId, teamId],
    connection
  );
};

export const getHubMatchesByExternalMatchRoomId = async (
  externalMatchRoomId: string,
  connection?: PoolConnection
) => {
  const query = `SELECT id FROM Matches WHERE external_match_room_id = ? ORDER BY id ASC`;
  const matches = await runQuery<Array<{ id: Match["id"] }> | undefined>(
    query,
    [externalMatchRoomId],
    connection
  );
  if (!matches || matches.length === 0) {
    return null;
  }
  return matches;
};

export const updateMatchDateAndStartTime = async (
  matchId: number,
  matchDate: string,
  startTime: string
): Promise<void> => {
  await runQuery(
    "UPDATE Matches SET match_date = ?, start_time = ? WHERE id = ?",
    [matchDate, startTime, matchId]
  );
};

export const getMatchesByExternalId = async (
  externalMatchRoomId: string
): Promise<Match[]> => {
  const query = `
    SELECT *
    FROM Matches 
    WHERE external_match_room_id = ?
    ORDER BY id, start_time ASC
  `;

  const matches = await runQuery<Match[]>(query, [externalMatchRoomId]);
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
      connection
    );
    const teamTwo = await getSeasonLeagueTeamByExternalId(
      teamTwoExternalId,
      connection
    );

    if (!teamOne || !teamTwo) {
      throw new Error(
        `No SeasonLeagueTeam entry found for external_id: ${teamOneExternalId} or ${teamTwoExternalId}`
      );
    }
    const { league_id, season_id, stage_id } = seasonLeagueExternalRoom;

    const { is_round_robin_bo2_as_2xbo1 } = seasonLeagueExternalRoom;

    const { match_date, start_time } = getMatchDateTime(
      matchDetails.scheduled_at
    );

    const realBestOf =
      matchDetails.best_of === 2 && is_round_robin_bo2_as_2xbo1
        ? 1
        : matchDetails.best_of;

    const params = [
      league_id,
      season_id,
      stage_id,
      realBestOf,
      match_date,
      start_time,
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
        match_date,
        start_time,
        end_time,
        external_match_room_id,
        status,
        round,
        \`group\`
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    if (is_round_robin_bo2_as_2xbo1) {
      const firstMatch = await runQuery<{ insertId: number }>(
        matchQuery,
        params,
        connection
      );
      const firstMatchId = firstMatch.insertId;

      const { match_date: secondMatchDate, start_time: secondMatchTime } =
        adjustMatchDateTime(match_date, start_time, {
          hours: 1
        });

      // Create new params array for second match with adjusted date/time
      const secondMatchParams = [
        league_id,
        season_id,
        stage_id,
        realBestOf,
        secondMatchDate,
        secondMatchTime,
        null,
        matchDetails.match_id,
        matchDetails.status,
        matchDetails.round,
        seasonLeagueExternalRoom.manual_group ?? matchDetails.group
      ];

      const secondMatch = await runQuery<{ insertId: number }>(
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
          connection
        ),
        addTeamToMatch(
          firstMatchId,
          season_id,
          league_id,
          teamTwo.team_id,
          connection
        ),
        addTeamToMatch(
          secondMatchId,
          season_id,
          league_id,
          teamOne.team_id,
          connection
        ),
        addTeamToMatch(
          secondMatchId,
          season_id,
          league_id,
          teamTwo.team_id,
          connection
        )
      ]);

      await connection.commit();

      return {
        matchIds: [firstMatchId, secondMatchId],
        is_round_robin_bo2_as_2xbo1
      };
    } else {
      const match = await runQuery<{ insertId: number }>(
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
          connection
        ),
        addTeamToMatch(
          matchId,
          season_id,
          league_id,
          teamTwo.team_id,
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

  const startTime = convertISOToTime(startedAt);
  const endTime = convertISOToTime(finishedAt);

  await runQuery(
    "UPDATE Matches SET start_time = ?, end_time = ?, status = ? WHERE external_match_room_id = ?",
    [startTime, endTime, MatchStatus.FINISHED, externalMatchRoomId]
  );
  logger.info(
    `Updated start_time to ${startTime} and end_time to ${endTime} for ${matches.length} match(es) with external_match_room_id: ${externalMatchRoomId}`
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

  const endTime = convertISOToTime(finishedAt);

  await runQuery(
    "UPDATE Matches SET end_time = ? WHERE external_match_room_id = ?",
    [endTime, externalMatchRoomId]
  );

  logger.info(
    `Updated end_time to ${endTime} for ${matches.length} match(es) with external_match_room_id: ${externalMatchRoomId}`
  );
};

export const updateMatchStatus = async (
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
      m.match_date,
      m.start_time,
      m.end_time,
      m.best_of,
      m.external_match_room_id,
      m.status,
      m.round,
      m.group,
      l.name as league_name,
      sl.tier as league_tier,
      GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ' vs ') as team_names,
      JSON_ARRAYAGG(DISTINCT CASE WHEN r.stream_url IS NOT NULL THEN r.stream_url END) as stream_urls
    FROM Matches m
    LEFT JOIN Leagues l ON m.league_id = l.id
    LEFT JOIN SeasonLeagues sl ON m.season_id = sl.season_id AND m.league_id = sl.league_id
    LEFT JOIN Seasons s ON m.season_id = s.id
    LEFT JOIN MatchTeams mt ON m.id = mt.match_id
    LEFT JOIN Teams t ON mt.team_id = t.id
    LEFT JOIN Reservations r ON m.id = r.match_id AND m.status NOT IN ('FINISHED', 'CANCELLED', 'FORFEIT', 'ABORTED')
    WHERE m.season_id = ? AND (? IS NULL OR m.league_id = ?)
    GROUP BY m.id, m.league_id, m.season_id, m.stage, m.match_date, m.start_time, m.end_time, m.best_of, m.external_match_room_id, m.status, m.round, m.group, l.name, sl.tier
    ORDER BY m.match_date ASC, COUNT(CASE WHEN r.stream_url IS NOT NULL THEN r.stream_url END) DESC, sl.tier ASC
  `;

  const results = await runQuery<
    Array<{
      id: Match["id"];
      league_id: League["id"];
      season_id: Season["id"];
      platform: Season["platform"];
      stage: Match["stage"];
      match_date: Match["match_date"];
      start_time: Match["start_time"];
      end_time: Match["end_time"];
      best_of: Match["best_of"];
      external_match_room_id: Match["external_match_room_id"];
      status: Match["status"];
      round: Match["round"];
      group: Match["group"];
      league_name: League["name"];
      league_tier: SeasonLeague["tier"];
      team_names: string | null;
      stream_urls: string | null;
    }>
  >(query, [seasonId, leagueId, leagueId]);

  return results.map((match) => {
    const teamNames = match.team_names || "Unknown vs Unknown";
    const teams = teamNames.split(" vs ");

    // Calculate end time if it's null
    let endTime = match.end_time;
    if (!endTime) {
      // Assume each best_of game takes 1 hour
      const hoursToAdd = match.best_of || 1;
      const startTime = new Date(`${match.match_date}T${match.start_time}`);
      const endDate = new Date(
        startTime.getTime() + hoursToAdd * 60 * 60 * 1000
      );

      // If the calculated end time goes to the next day, cap it at 23:59:00
      const startDate = new Date(`${match.match_date}T00:00:00`);
      const nextDay = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);

      if (endDate >= nextDay) {
        endTime = "23:59:00";
      } else {
        endTime = endDate.toTimeString().split(" ")[0]; // Get HH:MM:SS format
      }
    }

    return {
      match_id: match.id.toString(),
      title: teamNames,
      match_start: `${match.match_date}T${match.start_time}Z`,
      match_end: `${match.match_date}T${endTime}Z`,
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
      JOIN MatchGames mg ON ps.game_id = mg.id
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
      JOIN MatchGames mg ON ps.game_id = mg.id
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
        ROW_NUMBER() OVER (PARTITION BY t.id ORDER BY COALESCE(pgc.games_played, lpmc.maps_played, 0) DESC, sp.nickname) as player_rank
      FROM Matches m
      JOIN MatchTeams mt ON m.id = mt.match_id
      JOIN Teams t ON mt.team_id = t.id
      JOIN SeasonTeamPlayers stp ON stp.team_id = t.id AND stp.season_id = m.season_id
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
      steam_id,
      player_name,
      player_nickname,
      cs2_rank,
      faceit_level,
      faceit_elo,
      cs_hours,
      games_played,
      maps_played
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
