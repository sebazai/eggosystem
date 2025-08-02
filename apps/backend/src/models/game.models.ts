import {
  type GameTeamStats,
  type MapRoundInfo,
  type GameTeamRoundBreakdown,
  type GamePlayerStats,
  type MatchOrGameTopPlayerAwards,
  type GameClip,
  type MatchDemoReadyWebhook,
  type ChampionshipDetailsDemoReady
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";
import {
  fetchPlayerStatsForMatchOrGame,
  matchTopStats
} from "../shared/fetch-stat";
import { getHubMatchesByExternalMatchRoomId } from "./match.models";
import { getSeasonLeagueExternalIdByExternalId } from "./season-league-external-id.models";
import { getConnection } from "../db/mysqlConnection";
import { type PoolConnection } from "mysql2/promise";
import { parseDemoUrl } from "../utils/demo-url-parser";
import { sendDemoForAllStarPOTGClip } from "../services/allstar.services";
import {
  publishToParseQueue,
  createDemoProcessingRequest
} from "../services/parse-queue.services";
import { logger } from "../utils/app-logger";
import { type ParsedPayload } from "../types/parse-queue.types";
import { generateQueryWithFilters } from "../utils/queryFilter";
import { insertTeamGameScore } from "./team-game-score.models";
import { insertPlayerStatsForGame } from "./player-stats.models";
import { insertPlayerTradesForGame } from "./player-trades.models";
import { insertMapRoundStats } from "./map-round-stat.models";
import { getMatchTeamMapVetoPicksAndDeciders } from "./match-team-map-veto.models";
import { hasDemoProcessingRequest } from "./match-game-clip.models";

export const getGameTeamRoundBreakdown = async (game_id: number) => {
  const query = `
   SELECT 
    tgs.team_id,
    tgs.starting_side,
    COALESCE(SUM(CASE WHEN rw.round_number <= mg.regulation_rounds / 2 THEN 1 ELSE 0 END), 0) AS rounds_won_first_half,
    COALESCE(SUM(CASE WHEN rw.round_number > mg.regulation_rounds / 2 AND rw.round_number <= mg.regulation_rounds THEN 1 ELSE 0 END), 0) AS rounds_won_second_half,
    COALESCE(SUM(CASE WHEN rw.round_number <= mg.regulation_rounds THEN 1 ELSE 0 END), 0) AS total_rounds_won,
    COALESCE(SUM(CASE WHEN rw.round_number > mg.regulation_rounds THEN 1 ELSE 0 END), 0) AS total_overtime_rounds_won,
    COALESCE(SUM(CASE WHEN rw.round_number > mg.regulation_rounds AND rw.side = 'CT' THEN 1 ELSE 0 END), 0) AS overtime_rounds_won_ct,
    COALESCE(SUM(CASE WHEN rw.round_number > mg.regulation_rounds AND rw.side = 'T' THEN 1 ELSE 0 END), 0) AS overtime_rounds_won_t
  FROM TeamGameScores tgs
  JOIN MatchGames mg ON mg.id = tgs.game_id
  LEFT JOIN (
    SELECT
      mrs.game_id,
      mrs.round_number,
      CASE 
        WHEN mrs.round_end_reason_info IN ('bomb_defused', 'target_saved', 'ct_win') THEN mrs.ct_team_id
        WHEN mrs.round_end_reason_info IN ('target_bombed', 't_win') THEN mrs.t_team_id
      END AS team_id,
      CASE 
        WHEN mrs.round_end_reason_info IN ('bomb_defused', 'target_saved', 'ct_win') THEN 'CT'
        WHEN mrs.round_end_reason_info IN ('target_bombed', 't_win') THEN 'T'
      END AS side
    FROM MapRoundStats mrs
    WHERE mrs.game_id = ?
  ) rw ON rw.game_id = tgs.game_id AND rw.team_id = tgs.team_id
  WHERE tgs.game_id = ?
  GROUP BY tgs.team_id, mg.regulation_rounds, tgs.starting_side
  ORDER BY tgs.team_id;
  `;

  const data = await runQuery<Array<GameTeamRoundBreakdown>>(query, [
    game_id,
    game_id
  ]);
  return data;
};

export const getGameRoundInfo = async (game_id: number) => {
  const query = `
      SELECT 
        mrs.*,
        mg.regulation_rounds,
        ct.name AS ct_name,
        t.name AS t_name,
        ct.team_logo AS ct_logo,
        t.team_logo AS t_logo
      FROM MapRoundStats mrs
      JOIN MatchGames mg ON mg.id = mrs.game_id
      JOIN Teams ct ON ct.id = mrs.ct_team_id
      JOIN Teams t ON t.id = mrs.t_team_id
      WHERE mrs.game_id = ?
      ORDER BY round_number ASC
    `;
  return runQuery<MapRoundInfo[]>(query, [game_id]);
};

export const getGameTeamStats = async (game_id: number) => {
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
      WHERE ps.game_id = ?
      GROUP BY stp.team_id`;
  return runQuery<GameTeamStats[]>(query, [game_id]);
};

export const getGamePlayerStats = async (game_id: number) => {
  const query = `SELECT
        p.steam_id,
        p.nickname,
        stp.team_id,
        ps.kills,
        ps.headshots,
        ps.assists,
        ps.flash_assists,
        ps.deaths,
        ps.kast as kast_percentage,
        ps.adr,
        ps.enemies_flashed,
        ps.hs_percent,
        ps.kana_rating
      FROM PlayerStats ps
      INNER JOIN SteamPlayers p ON p.steam_id = ps.steam_id
      INNER JOIN MatchGames mg ON mg.id = ps.game_id
      INNER JOIN Matches m ON m.id = mg.match_id
      INNER JOIN SeasonTeamPlayers stp ON stp.season_id = m.season_id AND stp.steam_id = p.steam_id
      INNER JOIN MatchTeams mt ON mt.match_id = m.id AND mt.team_id = stp.team_id
      WHERE ps.game_id = ?
      ORDER BY stp.team_id, ps.kills DESC, ps.deaths ASC`;

  return runQuery<GamePlayerStats[]>(query, [game_id]);
};

export const getGameTopPlayers = async (game_id: number) => {
  const queries = matchTopStats.map((stat) =>
    fetchPlayerStatsForMatchOrGame(game_id, "mg.id = ?", stat)
  );
  const queryResults = await Promise.all(queries);

  if (
    Object.entries(queryResults[0]).every(([_, value]) => value === undefined)
  ) {
    return null;
  }

  return Object.assign({}, ...queryResults) as MatchOrGameTopPlayerAwards;
};

export const getGameClip = async (game_id: number) => {
  const query = `
    SELECT mgc.*, sp.nickname FROM MatchGameClips mgc 
      JOIN SteamPlayers sp ON mgc.clip_steam_id = sp.steam_id 
      WHERE game_id = ?
  `;
  return runQuery<GameClip[]>(query, [game_id]);
};

/**
 * Publish demo processing request to parse_queue
 */
const publishDemoProcessingRequest = async (
  gameId: number,
  demoUrl: string
): Promise<void> => {
  try {
    const isDemoProcessingRequest = await hasDemoProcessingRequest(gameId);
    if (isDemoProcessingRequest) {
      logger.info(
        `Demo processing request already exists for game ${gameId} with demo url ${demoUrl}`
      );
      return;
    }
    const demoProcessingRequest = createDemoProcessingRequest(
      gameId,
      demoUrl,
      5, // Medium priority for demo processing
      "game-processor"
    );

    await publishToParseQueue(demoProcessingRequest);

    logger.info("Demo processing request published to parse_queue", {
      gameId,
      demoUrl,
      queue: "parse_queue",
      request: demoProcessingRequest
    });
  } catch (error) {
    logger.error("Failed to publish demo processing request to parse_queue", {
      gameId,
      demoUrl,
      queue: "parse_queue",
      error
    });
    // Don't throw - this is a non-critical operation
  }
};

export const addMatchGameToDatabaseAndProcessDemo = async (
  webhookData: MatchDemoReadyWebhook,
  matchDetails: ChampionshipDetailsDemoReady,
  externalLeagueId: string
) => {
  const { demo_url } = webhookData.payload;
  const parsedDemoUrl = parseDemoUrl(demo_url);

  if (!parsedDemoUrl) {
    throw new Error(`Invalid demo url: ${demo_url}`);
  }

  const { match_id } = matchDetails;
  // We can have multiple matches for the same external match room id, so we need to get all of them
  const matches = await getHubMatchesByExternalMatchRoomId(match_id);

  if (!matches || matches.length === 0) {
    throw new Error(
      `No matches found when adding match games for external_id: ${externalLeagueId}`
    );
  }

  const seasonLeague =
    await getSeasonLeagueExternalIdByExternalId(externalLeagueId);

  if (!seasonLeague) {
    throw new Error(
      `No SeasonLeagueExternalId entry found when adding match games for external_id: ${externalLeagueId}`
    );
  }

  const { isBO2PlayedAs2xBO1 } = seasonLeague;

  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    const mapPlayedIn = parsedDemoUrl.mapNumber;
    const matchMapVetoes = await getMatchTeamMapVetoPicksAndDeciders(
      matches[0].id,
      connection
    );
    const mapPlayedVoteObject = matchMapVetoes[mapPlayedIn - 1];

    if (
      isBO2PlayedAs2xBO1 &&
      matchDetails.best_of === 2 &&
      matches.length === 2
    ) {
      // We should receive 2 picks, as both 2xBO1 matches have the same picks.
      if (matchMapVetoes.length !== 2) {
        throw new Error("Something is very wrong with this 2xBO1");
      }

      const matchObject = matches[mapPlayedIn - 1];

      if (!matchObject) {
        throw new Error("Could not find match object for 2xBO1 matches");
      }

      const insertedRow = await addMatchGameForMatch({
        match_id: matchObject.id,
        map_id: mapPlayedVoteObject.map_id,
        map_order: mapPlayedIn,
        demo_file: demo_url,
        connection
      });
      await connection.commit();

      await Promise.all([
        sendDemoForAllStarPOTGClip(demo_url, insertedRow.insertId),
        publishDemoProcessingRequest(insertedRow.insertId, demo_url)
      ]);

      // Publish demo processing request after successful commit
    } else {
      const match = matches[0];

      if (!match) {
        throw new Error(
          `Could not find match object for external match room id: ${match_id}`
        );
      }

      if (!mapPlayedVoteObject) {
        logger.error(
          `Could not find map played vote object for match ${match_id}, map played in: ${mapPlayedIn - 1}, matchMapVetoes: ${JSON.stringify(matchMapVetoes)}`
        );
        throw new Error(
          `Could not find map played vote object for match_id: ${match_id}`
        );
      }

      const insertedRow = await addMatchGameForMatch({
        match_id: match.id,
        map_id: mapPlayedVoteObject.map_id,
        map_order: mapPlayedIn,
        demo_file: demo_url,
        connection
      });

      await connection.commit();

      await Promise.all([
        sendDemoForAllStarPOTGClip(demo_url, insertedRow.insertId),
        publishDemoProcessingRequest(insertedRow.insertId, demo_url)
      ]);
    }
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getMatchIdByGameId = async (
  gameId: number,
  connection?: PoolConnection
) => {
  const query = `SELECT match_id FROM MatchGames WHERE id = ?`;
  return runQuery<Array<{ match_id: number } | undefined>>(
    query,
    [gameId],
    connection
  );
};

const addMatchGameForMatch = async ({
  match_id,
  map_id,
  map_order,
  demo_file,
  regulation_rounds,
  connection
}: {
  match_id: number;
  map_id: number;
  map_order: number;
  demo_file: string;
  regulation_rounds?: number;
  connection?: PoolConnection;
}) => {
  const query = `
    INSERT INTO MatchGames (match_id, map_id, map_order, demofile, regulation_rounds) VALUES (?, ?, ?, ?, ?)
  `;

  return runQuery<{ insertId: number }>(
    query,
    [match_id, map_id, map_order, demo_file, regulation_rounds ?? 24],
    connection
  );
};

const getTeamIdByPlayerSteamIdsAndGameId = async (
  playerSteamIds: string[],
  gameId: number,
  connection?: PoolConnection
) => {
  const { query, queryParams } = generateQueryWithFilters([
    {
      column: "mg.id",
      value: [gameId]
    },
    {
      column: "stp.steam_id",
      value: playerSteamIds
    }
  ]);
  const baseQuery = `SELECT DISTINCT mt.team_id FROM MatchGames mg 
      JOIN Matches m ON mg.match_id = m.id 
      JOIN MatchTeams mt ON m.id = mt.match_id 
      JOIN SeasonTeamPlayers stp ON mt.team_id = stp.team_id AND mt.season_id = stp.season_id 
      WHERE ${query}`;
  return runQuery<Array<{ team_id: number } | undefined>>(
    baseQuery,
    queryParams,
    connection
  );
};

export const saveParsedDemoDataForGame = async (
  game_id: string,
  parsed_payload: ParsedPayload
) => {
  const {
    Score,
    Players,
    NewRoundInfo: RoundInfo,
    Trades,
    Clutches: _Clutches,
    RoundImpacts: _RoundImpacts
  } = parsed_payload;

  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const gameId = Number(game_id);
    const [match] = await getMatchIdByGameId(gameId, connection);
    if (!match) {
      throw new Error(`Could not find parent match for game ${gameId}`);
    }

    const team1PlayerSteamIds = Object.values(Players)
      .filter((player) => player.Team === 1)
      .map((player) => player.SteamID);

    const team2PlayerSteamIds = Object.values(Players)
      .filter((player) => player.Team === 2)
      .map((player) => player.SteamID);

    const terroristTeamResult = await getTeamIdByPlayerSteamIdsAndGameId(
      team1PlayerSteamIds,
      gameId,
      connection
    );
    const counterTerroristTeamResult = await getTeamIdByPlayerSteamIdsAndGameId(
      team2PlayerSteamIds,
      gameId,
      connection
    );

    const terroristTeam = terroristTeamResult[0];
    const counterTerroristTeam = counterTerroristTeamResult[0];

    if (!terroristTeam || !counterTerroristTeam) {
      throw new Error(
        `Could not find team for game ${gameId} with player steam ids for team 1: ${team1PlayerSteamIds} and team 2: ${team2PlayerSteamIds}`
      );
    }

    await Promise.all([
      insertTeamGameScore({
        match_id: match.match_id,
        team_id: terroristTeam.team_id,
        game_id: gameId,
        starting_side: "T",
        score: Score.Team1Score,
        halftime_score: Score.Team1HTScore,
        overtime_score: Score.Team1OTScore,
        connection
      }),
      insertTeamGameScore({
        match_id: match.match_id,
        team_id: counterTerroristTeam.team_id,
        game_id: gameId,
        starting_side: "CT",
        score: Score.Team2Score,
        halftime_score: Score.Team2HTScore,
        overtime_score: Score.Team2OTScore,
        connection
      }),
      ...Object.values(Players).map((player) =>
        insertPlayerStatsForGame({
          gameId,
          playerStats: player,
          connection
        })
      ),
      insertPlayerTradesForGame({
        gameId,
        playerTrades: Trades,
        connection
      }),
      insertMapRoundStats({
        gameId,
        tTeamIdTeam1: terroristTeam.team_id,
        ctTeamIdTeam2: counterTerroristTeam.team_id,
        mapRoundStats: RoundInfo.Rounds,
        connection
      })
    ]);

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
