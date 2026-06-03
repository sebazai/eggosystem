import {
  type MapRoundInfo,
  type GameTeamRoundBreakdown,
  type GamePlayerStats,
  type MatchOrGameTopPlayerAwards,
  type GameClip,
  type MatchGame,
  type WeaponStat,
  type HitGroupCount,
  type HitStats,
  type RoundKillEvent,
  type RoundDeathEvent,
  type RoundFlashEvent,
  type RoundWastedUtilityEvent,
  type RoundUtilityThrowEvent,
  type RoundUtilityDamageEvent,
  type PlayerRoundEvents,
  type PlayerGameUtilityStats
} from "@eggosystem/types";

import { runQuery } from "../db/mysqlRunQuery";
import {
  fetchPlayerStatsForMatchOrGame,
  matchTopStats
} from "../shared/fetch-stat";
import { getConnection } from "../db/mysqlConnection";
import { type PoolConnection } from "mysql2/promise";
import { type ParsedPayload } from "../types/parse-queue.types";
import { generateQueryWithFilters } from "../utils/queryFilter";
import { upsertTeamGameScore } from "./team-game-score.models";
import { savePlayerStatsForGame } from "./player-stats.models";
import { savePlayerTradesForGame } from "./player-trades.models";
import { saveMapRoundStatsForGame } from "./map-round-stat.models";
import { savePlayerKillLogsForGame } from "./player-kill-logs.models";
import { savePlayerClutchesForGame } from "./player-clutches.models";
import { savePlayerRoundImpactsForGame } from "./player-round-impacts.models";
import { saveFlashEventsForGame } from "./flash-events.models";
import { saveRoundSwingEventsForGame } from "./round-swing-events.models";
import { saveSetupEventsForGame } from "./setup-events.models";
import { saveWastedUtilityEventsForGame } from "./wasted-utility-events.models";
import { saveUtilityThrowEventsForGame } from "./utility-throw-events.models";
import { saveRoundUtilitySummaryForGame } from "./round-utility-summary.models";
import { UTILITY_DAMAGE_WEAPON_SQL } from "../utils/utility-weapons";
import { savePlayerHitLogsForGame } from "./player-hit-logs.models";

export const getGameTeamRoundBreakdown = async (match_game_id: number) => {
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
  JOIN MatchGames mg ON mg.id = tgs.match_game_id
  LEFT JOIN (
    SELECT
      mrs.match_game_id,
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
    WHERE mrs.match_game_id = ?
  ) rw ON rw.match_game_id = tgs.match_game_id AND rw.team_id = tgs.team_id
  WHERE tgs.match_game_id = ?
  GROUP BY tgs.team_id, mg.regulation_rounds, tgs.starting_side
  ORDER BY tgs.team_id;
  `;

  const data = await runQuery<Array<GameTeamRoundBreakdown>>(query, [
    match_game_id,
    match_game_id
  ]);
  return data;
};

export const getGameRoundInfo = async (match_game_id: number) => {
  const query = `
      SELECT 
        mrs.*,
        mg.regulation_rounds,
        ct.name AS ct_name,
        t.name AS t_name,
        ct.team_logo AS ct_logo,
        t.team_logo AS t_logo
      FROM MapRoundStats mrs
      JOIN MatchGames mg ON mg.id = mrs.match_game_id
      JOIN Teams ct ON ct.id = mrs.ct_team_id
      JOIN Teams t ON t.id = mrs.t_team_id
      WHERE mrs.match_game_id = ?
      ORDER BY round_number ASC
    `;
  return runQuery<MapRoundInfo[]>(query, [match_game_id]);
};

export const getGamePlayerStats = async (
  match_game_id: number,
  stat?: "CT" | "T",
  steam_id?: string
) => {
  // Base fields that are always included
  const baseFields = `
    p.steam_id,
    p.nickname,
    stp.team_id
  `;

  // Fields that change based on stat parameter
  let statFields: string;
  if (stat === "CT") {
    statFields = `
      ps.kills_ct as kills,
      ps.headshots,
      ps.assists_ct as assists,
      ps.flash_assists_ct as flash_assists,
      ps.deaths_ct as deaths,
      ps.kast as kast_percentage,
      ps.adr_ct as adr,
      ps.enemies_flashed_ct as enemies_flashed,
      ps.hs_percent,
      ps.first_kills_ct as first_kills,
      ps.first_deaths_ct as first_deaths,
      ps.utility_damage_ct as utility_damage
    `;
  } else if (stat === "T") {
    statFields = `
      ps.kills_t as kills,
      ps.headshots,
      ps.assists_t as assists,
      ps.flash_assists_t as flash_assists,
      ps.deaths_t as deaths,
      ps.kast as kast_percentage,
      ps.adr_t as adr,
      ps.enemies_flashed_t as enemies_flashed,
      ps.hs_percent,
      ps.first_kills_t as first_kills,
      ps.first_deaths_t as first_deaths,
      ps.utility_damage_t as utility_damage
    `;
  } else {
    // Default: all stats combined
    statFields = `
      ps.kills,
      ps.headshots,
      ps.assists,
      ps.flash_assists,
      ps.deaths,
      ps.kast as kast_percentage,
      ps.adr,
      ps.enemies_flashed,
      ps.hs_percent,
      ps.kana_rating,
      ps.first_kills,
      ps.first_deaths,
      ps.shots,
      ps.shots_hit,
      ps.total_strafing_shots,
      ps.good_strafing_shots,
      ps.ttd,
      ps.ttf as time_to_kill,
      ps.crosshair_placement
    `;
  }

  const steamIdFilter = steam_id ? "AND ps.steam_id = ?" : "";

  const query = `SELECT
        ${baseFields},
        ${statFields}
      FROM PlayerStats ps
      INNER JOIN SteamPlayers p ON p.steam_id = ps.steam_id
      INNER JOIN MatchGames mg ON mg.id = ps.match_game_id
      INNER JOIN Matches m ON m.id = mg.match_id
      INNER JOIN SeasonTeamPlayers stp ON stp.season_id = m.season_id AND stp.steam_id = p.steam_id
      INNER JOIN MatchTeams mt ON mt.match_id = m.id AND mt.team_id = stp.team_id
      WHERE ps.match_game_id = ?
      ${steamIdFilter}
      GROUP BY p.steam_id
      ORDER BY stp.team_id, kills DESC, deaths ASC
      `;

  const params: (number | string)[] = [match_game_id];
  if (steam_id) params.push(steam_id);

  return runQuery<GamePlayerStats[]>(query, params);
};

export const getGameTopPlayers = async (match_game_id: number) => {
  const queries = matchTopStats.map((stat) =>
    fetchPlayerStatsForMatchOrGame(match_game_id, "mg.id = ?", stat)
  );
  const queryResults = await Promise.all(queries);

  if (
    Object.entries(queryResults[0]).every(([_, value]) => value === undefined)
  ) {
    return null;
  }

  return Object.assign({}, ...queryResults) as MatchOrGameTopPlayerAwards;
};

export const getGameClip = async (match_game_id: number) => {
  const query = `
    SELECT mgc.*, sp.nickname FROM MatchGameClips mgc 
      JOIN SteamPlayers sp ON mgc.clip_steam_id = sp.steam_id 
      WHERE match_game_id = ?
  `;
  return runQuery<GameClip[]>(query, [match_game_id]);
};

export const getMatchGameByDemoUrl = async (demoUrl: string) => {
  const query = `SELECT * FROM MatchGames WHERE demofile = ?`;
  const [game] = await runQuery<Array<MatchGame | undefined>>(query, [demoUrl]);
  return game;
};

export const getMatchGamesByExternalMatchRoomId = async (
  externalMatchRoomId: string,
  connection?: PoolConnection
) => {
  const query = `SELECT mg.* FROM MatchGames mg JOIN Matches m ON mg.match_id = m.id WHERE m.external_match_room_id = ?`;
  const games = await runQuery<Array<MatchGame>>(
    query,
    [externalMatchRoomId],
    connection
  );
  return games;
};

/**
 * True if the match has at least one MatchGame with a non-empty demofile (demo was ready).
 * Used to avoid overwriting a played game with FORFEIT when match_status_finished (forfeit) arrives after match_demo_ready.
 */
export const hasMatchGameWithDemo = async (
  matchId: number,
  connection?: PoolConnection
): Promise<boolean> => {
  const query = `SELECT 1 FROM MatchGames WHERE match_id = ? AND demofile IS NOT NULL AND demofile != '' LIMIT 1`;
  const rows = await runQuery<Array<{ "1": number }>>(
    query,
    [matchId],
    connection
  );
  return Array.isArray(rows) && rows.length > 0;
};

type MatchGameStaffLockRow = {
  match_id: number;
  team_game_scores_staff_lock: number | boolean;
};

/**
 * Returns parent `match_id` and `team_game_scores_staff_lock` (staff authority over
 * team scores) for a MatchGame row.
 */
export const getMatchIdByGameId = async (
  matchGameId: number,
  connection?: PoolConnection
) => {
  const query = `SELECT match_id, team_game_scores_staff_lock FROM MatchGames WHERE id = ?`;
  return runQuery<Array<MatchGameStaffLockRow | undefined>>(
    query,
    [matchGameId],
    connection
  );
};

export const isChampionshipMatchGame = async (
  matchGameId: number,
  connection?: PoolConnection
): Promise<boolean> => {
  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM MatchGames mg
      JOIN Matches m ON mg.match_id = m.id
      WHERE mg.id = ?
        AND EXISTS (
          SELECT 1 FROM SeasonLeagueExternalIds slei
          WHERE slei.season_id = m.season_id AND slei.league_id = m.league_id
        )
    ) AS is_championship
  `;
  const [row] = await runQuery<Array<{ is_championship: 0 | 1 }>>(
    query,
    [matchGameId],
    connection
  );
  return row?.is_championship === 1;
};

type MatchGameTeamScoresMeta = {
  id: number;
  match_id: number;
  regulation_rounds: number;
  team_game_scores_staff_lock: number | boolean;
};

/**
 * MatchGames row for dashboard team-score read/write: regulation rounds, staff lock, identity.
 */
export const getMatchGameMetaForTeamScores = async (
  matchGameId: number,
  connection?: PoolConnection
): Promise<MatchGameTeamScoresMeta | undefined> => {
  const query = `SELECT id, match_id, COALESCE(regulation_rounds, 24) AS regulation_rounds, team_game_scores_staff_lock FROM MatchGames WHERE id = ? LIMIT 1`;
  const rows = await runQuery<MatchGameTeamScoresMeta[]>(
    query,
    [matchGameId],
    connection
  );
  return rows[0];
};

export const upsertMatchGameForMatch = async ({
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
    INSERT INTO MatchGames (match_id, map_id, map_order, demofile, regulation_rounds) 
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      id = LAST_INSERT_ID(id),
      demofile = VALUES(demofile),
      regulation_rounds = VALUES(regulation_rounds)
  `;

  return await runQuery<{ insertId: number }>(
    query,
    [match_id, map_id, map_order, demo_file, regulation_rounds ?? 24],
    connection
  );
};

const getTeamIdByPlayerSteamIdsAndGameId = async (
  playerSteamIds: string[],
  matchGameId: number,
  connection?: PoolConnection
) => {
  const { query, queryParams } = generateQueryWithFilters([
    {
      column: "mg.id",
      value: [matchGameId]
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
      WHERE ${query} AND stp.discarded_at IS NULL`;
  return runQuery<Array<{ team_id: number } | undefined>>(
    baseQuery,
    queryParams,
    connection
  );
};

export const saveParsedDemoDataForGame = async (
  match_game_id: string,
  parsed_payload: ParsedPayload
) => {
  const {
    Score,
    Players,
    NewRoundInfo: RoundInfo,
    Trades,
    Clutches,
    RoundImpacts,
    KillLog,
    HitLog,
    FlashLog,
    RoundSwingLog,
    SetupEventLog,
    WastedUtilityLog,
    UtilityThrowLog,
    RoundUtilitySummary
  } = parsed_payload;

  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const matchGameId = Number(match_game_id);
    const [match] = await getMatchIdByGameId(matchGameId, connection);
    if (!match) {
      throw new Error(`Could not find parent match for game ${matchGameId}`);
    }

    const skipTeamGameScoreUpsert = Boolean(match.team_game_scores_staff_lock);

    const team1PlayerSteamIds = Object.values(Players)
      .filter((player) => player.Team === 1)
      .map((player) => String(player.SteamID));

    const team2PlayerSteamIds = Object.values(Players)
      .filter((player) => player.Team === 2)
      .map((player) => String(player.SteamID));

    const terroristTeamResult = await getTeamIdByPlayerSteamIdsAndGameId(
      team1PlayerSteamIds,
      matchGameId,
      connection
    );
    const counterTerroristTeamResult = await getTeamIdByPlayerSteamIdsAndGameId(
      team2PlayerSteamIds,
      matchGameId,
      connection
    );

    const terroristTeam = terroristTeamResult[0];
    const counterTerroristTeam = counterTerroristTeamResult[0];

    if (!terroristTeam || !counterTerroristTeam) {
      throw new Error(
        `Could not find team for game ${matchGameId} with player steam ids for team 1: ${team1PlayerSteamIds} and team 2: ${team2PlayerSteamIds}`
      );
    }

    // All analytics writes share one transaction: any failure rolls back every
    // delete+insert pair — no table is left empty while others commit.
    if (!skipTeamGameScoreUpsert) {
      await upsertTeamGameScore({
        match_id: match.match_id,
        team_id: terroristTeam.team_id,
        match_game_id: matchGameId,
        starting_side: "T",
        score: Score.Team1Score,
        halftime_score: Score.Team1HTScore,
        overtime_score: Score.Team1OTScore,
        connection
      });
      await upsertTeamGameScore({
        match_id: match.match_id,
        team_id: counterTerroristTeam.team_id,
        match_game_id: matchGameId,
        starting_side: "CT",
        score: Score.Team2Score,
        halftime_score: Score.Team2HTScore,
        overtime_score: Score.Team2OTScore,
        connection
      });
    }

    await savePlayerStatsForGame({
      matchGameId,
      players: Object.values(Players),
      connection
    });
    await savePlayerTradesForGame({
      matchGameId,
      playerTrades: Trades,
      connection
    });
    await savePlayerClutchesForGame({
      matchGameId,
      clutches: Clutches,
      connection
    });
    await savePlayerRoundImpactsForGame({
      matchGameId,
      roundImpacts: RoundImpacts,
      connection
    });
    await saveMapRoundStatsForGame({
      matchGameId,
      tTeamIdTeam1: terroristTeam.team_id,
      ctTeamIdTeam2: counterTerroristTeam.team_id,
      mapRoundStats: RoundInfo.Rounds,
      connection
    });
    await savePlayerKillLogsForGame({
      matchGameId,
      killLogs: KillLog ?? [],
      connection
    });
    await savePlayerHitLogsForGame({
      matchGameId,
      events: HitLog ?? [],
      connection
    });
    await saveFlashEventsForGame({
      matchGameId,
      events: FlashLog ?? [],
      connection
    });
    await saveRoundSwingEventsForGame({
      matchGameId,
      events: RoundSwingLog ?? [],
      connection
    });
    await saveSetupEventsForGame({
      matchGameId,
      events: SetupEventLog ?? [],
      connection
    });
    await saveWastedUtilityEventsForGame({
      matchGameId,
      events: WastedUtilityLog ?? [],
      connection
    });
    await saveUtilityThrowEventsForGame({
      matchGameId,
      events: UtilityThrowLog ?? [],
      connection
    });
    await saveRoundUtilitySummaryForGame({
      matchGameId,
      entries: RoundUtilitySummary ?? [],
      connection
    });

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ── Weapon stats ────────────────────────────────────────────────────────────

interface WeaponKillRow {
  weapon: string;
  kills: number;
  headshot_kills: number;
}

interface WeaponDamageRow {
  weapon: string;
  total_damage: number;
  hits: number;
}

export const getWeaponStats = async (
  match_game_id: number,
  steam_id: string
): Promise<WeaponStat[]> => {
  const [kills, damage] = await Promise.all([
    runQuery<WeaponKillRow[]>(
      `SELECT weapon,
              COUNT(*) AS kills,
              SUM(is_headshot) AS headshot_kills
       FROM PlayerKillLogs
       WHERE match_game_id = ? AND killer = ?
       GROUP BY weapon
       ORDER BY kills DESC`,
      [match_game_id, steam_id]
    ),
    runQuery<WeaponDamageRow[]>(
      `SELECT weapon,
              SUM(health_damage) AS total_damage,
              COUNT(*) AS hits
       FROM PlayerHitLogs
       WHERE match_game_id = ? AND attacker_steam_id = ?
         AND attacker_steam_id != victim_steam_id
       GROUP BY weapon`,
      [match_game_id, steam_id]
    )
  ]);

  const damageMap = new Map(damage.map((d) => [d.weapon, d]));
  return kills.map((k) => {
    const d = damageMap.get(k.weapon);
    return {
      weapon: k.weapon,
      kills: Number(k.kills),
      headshot_kills: Number(k.headshot_kills),
      total_damage: d ? Number(d.total_damage) : 0,
      hits: d ? Number(d.hits) : 0
    };
  });
};

// ── Hit-location stats ───────────────────────────────────────────────────────

export const getHitStats = async (
  match_game_id: number,
  steam_id: string
): Promise<HitStats> => {
  const [dealt, received] = await Promise.all([
    runQuery<HitGroupCount[]>(
      `SELECT hit_group,
              COUNT(*) AS hits,
              SUM(health_damage) AS damage
       FROM PlayerHitLogs
       WHERE match_game_id = ? AND attacker_steam_id = ?
         AND attacker_steam_id != victim_steam_id
       GROUP BY hit_group`,
      [match_game_id, steam_id]
    ),
    runQuery<HitGroupCount[]>(
      `SELECT hit_group,
              COUNT(*) AS hits,
              SUM(health_damage) AS damage
       FROM PlayerHitLogs
       WHERE match_game_id = ? AND victim_steam_id = ?
         AND attacker_steam_id != victim_steam_id
       GROUP BY hit_group`,
      [match_game_id, steam_id]
    )
  ]);

  return {
    dealt: dealt.map((r) => ({
      ...r,
      hits: Number(r.hits),
      damage: Number(r.damage)
    })),
    received: received.map((r) => ({
      ...r,
      hits: Number(r.hits),
      damage: Number(r.damage)
    }))
  };
};

// ── Per-round events ─────────────────────────────────────────────────────────

interface RoundFlashCount {
  round_number: number;
  enemies_flashed: number;
  teammates_flashed: number;
}

export const getPlayerRoundEvents = async (
  match_game_id: number,
  steam_id: string
): Promise<PlayerRoundEvents> => {
  const [
    kills,
    deaths,
    flashes,
    utilityBase,
    flashCounts,
    wastedUtility,
    utilityThrows,
    utilityDamageHits,
    setupUtilityDamage
  ] = await Promise.all([
    runQuery<RoundKillEvent[]>(
      `SELECT pkl.round_number,
              pkl.time_in_round,
              p.nickname AS victim_nickname,
              pkl.weapon,
              pkl.is_headshot
       FROM PlayerKillLogs pkl
       JOIN SteamPlayers p ON p.steam_id = pkl.victim
       WHERE pkl.match_game_id = ? AND pkl.killer = ?
       ORDER BY pkl.round_number, pkl.time_in_round`,
      [match_game_id, steam_id]
    ),
    runQuery<RoundDeathEvent[]>(
      `SELECT pkl.round_number,
              pkl.time_in_round,
              p.nickname AS killer_nickname,
              pkl.weapon,
              pkl.is_headshot
       FROM PlayerKillLogs pkl
       JOIN SteamPlayers p ON p.steam_id = pkl.killer
       WHERE pkl.match_game_id = ? AND pkl.victim = ?
       ORDER BY pkl.round_number, pkl.time_in_round`,
      [match_game_id, steam_id]
    ),
    runQuery<RoundFlashEvent[]>(
      `SELECT fe.round_number,
              fe.time_in_round,
              p.nickname AS victim_nickname,
              fe.duration_seconds,
              fe.is_enemy_flash
       FROM FlashEvents fe
       JOIN SteamPlayers p ON p.steam_id = fe.victim_steam_id
       WHERE fe.match_game_id = ? AND fe.thrower_steam_id = ?
       ORDER BY fe.round_number, fe.time_in_round`,
      [match_game_id, steam_id]
    ),
    runQuery<
      {
        round_number: number;
        utility_damage: number;
        smokes_thrown: number;
        flashes_thrown: number;
      }[]
    >(
      `SELECT round_number,
              utility_damage,
              smokes_thrown,
              flashes_thrown
       FROM RoundUtilitySummary
       WHERE match_game_id = ? AND steam_id = ?
       ORDER BY round_number`,
      [match_game_id, steam_id]
    ),
    runQuery<RoundFlashCount[]>(
      `SELECT round_number,
              SUM(is_enemy_flash)   AS enemies_flashed,
              SUM(is_teammate_flash) AS teammates_flashed
       FROM FlashEvents
       WHERE match_game_id = ? AND thrower_steam_id = ?
       GROUP BY round_number
       ORDER BY round_number`,
      [match_game_id, steam_id]
    ),
    runQuery<RoundWastedUtilityEvent[]>(
      `SELECT round_number,
              time_in_round,
              utility_type
       FROM WastedUtilityEvents
       WHERE match_game_id = ? AND thrower_steam_id = ?
       ORDER BY round_number, time_in_round`,
      [match_game_id, steam_id]
    ),
    runQuery<RoundUtilityThrowEvent[]>(
      `SELECT round_number,
              time_in_round,
              utility_type
       FROM UtilityThrowEvents
       WHERE match_game_id = ? AND thrower_steam_id = ?
       ORDER BY round_number, time_in_round`,
      [match_game_id, steam_id]
    ),
    runQuery<RoundUtilityDamageEvent[]>(
      `SELECT phl.round_number,
              phl.time_in_round,
              p.nickname AS victim_nickname,
              phl.weapon,
              phl.health_damage,
              (phl.attacker_team <> phl.victim_team) AS is_enemy_hit
       FROM PlayerHitLogs phl
       JOIN SteamPlayers p ON p.steam_id = phl.victim_steam_id
       WHERE phl.match_game_id = ?
         AND phl.attacker_steam_id = ?
         AND phl.attacker_steam_id <> phl.victim_steam_id
         AND ${UTILITY_DAMAGE_WEAPON_SQL}
       ORDER BY phl.round_number, phl.time_in_round`,
      [match_game_id, steam_id]
    ),
    runQuery<
      {
        round_number: number;
        time_in_round: number;
        victim_nickname: string;
        health_damage: number;
      }[]
    >(
      `SELECT se.round_number,
              se.time_in_round,
              p.nickname AS victim_nickname,
              se.damage_dealt AS health_damage
       FROM SetupEvents se
       JOIN SteamPlayers p ON p.steam_id = se.victim_steam_id
       WHERE se.match_game_id = ?
         AND se.setup_player_steam_id = ?
         AND se.setup_type = 'utility_damage'
         AND se.damage_dealt IS NOT NULL
         AND se.damage_dealt > 0
       ORDER BY se.round_number, se.time_in_round`,
      [match_game_id, steam_id]
    )
  ]);

  const flashCountByRound = new Map(
    flashCounts.map((r) => [Number(r.round_number), r])
  );

  const mergedUtilityDamageHits: RoundUtilityDamageEvent[] = [
    ...utilityDamageHits.map((r) => ({
      round_number: Number(r.round_number),
      time_in_round: Number(r.time_in_round),
      victim_nickname: r.victim_nickname,
      weapon: r.weapon,
      health_damage: Number(r.health_damage),
      is_enemy_hit: Boolean(r.is_enemy_hit)
    })),
    ...setupUtilityDamage.map((r) => ({
      round_number: Number(r.round_number),
      time_in_round: Number(r.time_in_round),
      victim_nickname: r.victim_nickname,
      weapon: "utility_setup",
      health_damage: Number(r.health_damage),
      is_enemy_hit: true
    }))
  ].sort(
    (a, b) =>
      a.round_number - b.round_number || a.time_in_round - b.time_in_round
  );

  return {
    kills: kills.map((r) => ({
      ...r,
      time_in_round: Number(r.time_in_round),
      is_headshot: Boolean(r.is_headshot)
    })),
    deaths: deaths.map((r) => ({
      ...r,
      time_in_round: Number(r.time_in_round),
      is_headshot: Boolean(r.is_headshot)
    })),
    flashes: flashes.map((r) => ({
      ...r,
      time_in_round: Number(r.time_in_round),
      duration_seconds: Number(r.duration_seconds),
      is_enemy_flash: Boolean(r.is_enemy_flash)
    })),
    utility: utilityBase.map((r) => {
      const fc = flashCountByRound.get(Number(r.round_number));
      return {
        round_number: Number(r.round_number),
        utility_damage: Number(r.utility_damage),
        smokes_thrown: Number(r.smokes_thrown),
        flashes_thrown: Number(r.flashes_thrown),
        enemies_flashed: fc ? Number(fc.enemies_flashed) : 0,
        teammates_flashed: fc ? Number(fc.teammates_flashed) : 0
      };
    }),
    wasted: wastedUtility.map((r) => ({
      round_number: Number(r.round_number),
      time_in_round: Number(r.time_in_round),
      utility_type: r.utility_type
    })),
    utility_throws: utilityThrows.map((r) => ({
      round_number: Number(r.round_number),
      time_in_round: Number(r.time_in_round),
      utility_type: r.utility_type
    })),
    utility_damage_hits: mergedUtilityDamageHits
  };
};

// ── Aggregate utility stats for a single player in a single game ──────────────

export const getPlayerGameUtilityStats = async (
  match_game_id: number,
  steam_id: string
): Promise<PlayerGameUtilityStats> => {
  const [summary, wasted, flashCounts] = await Promise.all([
    runQuery<
      {
        flashes_thrown: number;
        smokes_thrown: number;
        utility_damage: number;
      }[]
    >(
      `SELECT
        SUM(flashes_thrown) AS flashes_thrown,
        SUM(smokes_thrown)  AS smokes_thrown,
        SUM(utility_damage) AS utility_damage
       FROM RoundUtilitySummary
       WHERE match_game_id = ? AND steam_id = ?`,
      [match_game_id, steam_id]
    ),
    runQuery<{ wasted: number }[]>(
      `SELECT COUNT(*) AS wasted
       FROM WastedUtilityEvents
       WHERE match_game_id = ? AND thrower_steam_id = ?`,
      [match_game_id, steam_id]
    ),
    runQuery<{ enemies_flashed: number; teammates_flashed: number }[]>(
      `SELECT
        SUM(is_enemy_flash)    AS enemies_flashed,
        SUM(is_teammate_flash) AS teammates_flashed
       FROM FlashEvents
       WHERE match_game_id = ? AND thrower_steam_id = ?`,
      [match_game_id, steam_id]
    )
  ]);

  const s = summary[0] ?? {
    flashes_thrown: 0,
    smokes_thrown: 0,
    utility_damage: 0
  };
  return {
    flashes_thrown: Number(s.flashes_thrown ?? 0),
    enemies_flashed: Number(flashCounts[0]?.enemies_flashed ?? 0),
    teammates_flashed: Number(flashCounts[0]?.teammates_flashed ?? 0),
    smokes_thrown: Number(s.smokes_thrown ?? 0),
    utility_damage: Number(s.utility_damage ?? 0),
    wasted_utility: Number(wasted[0]?.wasted ?? 0)
  };
};
