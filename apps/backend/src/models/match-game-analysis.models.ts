import JSONBig from "json-bigint";
import {
  type AfterplantKillEvent,
  type MatchGameAfterplantRound,
  type MatchGameOpeningDuel,
  type OpeningDuelTradeStatus,
  type MatchGameKillMatrix,
  type MatchGameTradeStats,
  type PlayerTradeStats,
  type TradeMatrixEntry
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

const jsonBig = JSONBig({ storeAsString: true });

const TRADE_WINDOW_SECONDS = 5;

type AfterplantRoundRow = Omit<
  MatchGameAfterplantRound,
  "ct_t" | "kills_after_plant"
> & {
  ct_t: string | null;
};

type KillLogRow = {
  round_number: number;
  victim_steam_id: string;
  victim_team: "CT" | "T";
  killer_steam_id: string;
  time_in_round: number;
};

export const getMatchGameAfterplantAnalysis = async (
  match_game_id: number
): Promise<MatchGameAfterplantRound[]> => {
  const roundsQuery = `
    SELECT
      mrs.round_number,
      mrs.plant_site,
      mrs.ct_t,
      mrs.round_end_reason_info,
      mrs.ct_team_id,
      mrs.t_team_id,
      JSON_LENGTH(mrs.ct_t, '$.T')  AS t_alive_at_plant,
      JSON_LENGTH(mrs.ct_t, '$.CT') AS ct_alive_at_plant,
      ct.name       AS ct_team_name,
      t.name        AS t_team_name,
      ct.team_logo  AS ct_team_logo,
      t.team_logo   AS t_team_logo
    FROM MapRoundStats mrs
    JOIN Teams ct ON ct.id = mrs.ct_team_id
    JOIN Teams t  ON t.id  = mrs.t_team_id
    WHERE mrs.match_game_id = ?
      AND mrs.plant_site IN ('A', 'B')
    ORDER BY mrs.round_number ASC
  `;

  // Fetch all post-plant kills for this game in one query
  const killsQuery = `
    SELECT
      pklog.round_number,
      pklog.victim  AS victim_steam_id,
      pklog.victim_team,
      pklog.killer  AS killer_steam_id,
      pklog.time_in_round
    FROM PlayerKillLogs pklog
    WHERE pklog.match_game_id = ?
      AND pklog.bomb_planted = 1
    ORDER BY pklog.round_number ASC, pklog.time_in_round ASC
  `;

  const [rows, killRows] = await Promise.all([
    runQuery<AfterplantRoundRow[]>(roundsQuery, [match_game_id]),
    runQuery<KillLogRow[]>(killsQuery, [match_game_id])
  ]);

  // Group kills by round number
  const killsByRound = new Map<number, KillLogRow[]>();
  for (const kill of killRows) {
    const rn = kill.round_number;
    if (!killsByRound.has(rn)) killsByRound.set(rn, []);
    killsByRound.get(rn)!.push(kill);
  }

  // Compute trade flag: a death is traded when the killer is themselves killed
  // within TRADE_WINDOW_SECONDS in the same round (post-plant)
  function computeKillEvents(kills: KillLogRow[]): AfterplantKillEvent[] {
    return kills.map((kill) => {
      const is_traded = kills.some(
        (other) =>
          other.victim_steam_id === kill.killer_steam_id &&
          other.time_in_round > kill.time_in_round &&
          other.time_in_round <= kill.time_in_round + TRADE_WINDOW_SECONDS
      );
      return {
        victim_steam_id: String(kill.victim_steam_id),
        victim_team: kill.victim_team,
        killer_steam_id: String(kill.killer_steam_id),
        time_in_round: kill.time_in_round,
        is_traded
      };
    });
  }

  // Set of plant-round numbers for fast lookup
  const plantRoundNumbers = new Set(rows.map((r) => r.round_number));

  return rows.map((row) => ({
    ...row,
    ct_t: row.ct_t ? jsonBig.parse(row.ct_t) : null,
    kills_after_plant: computeKillEvents(
      (killsByRound.get(row.round_number) ?? []).filter(() =>
        plantRoundNumbers.has(row.round_number)
      )
    )
  }));
};

/* ─────────────────────────────────────────────────────────
 *  Opening Duels analysis
 * ─────────────────────────────────────────────────────────*/

type OpeningKillRow = {
  round_number: number;
  killer: string;
  killer_team: "CT" | "T";
  victim: string;
  victim_team: "CT" | "T";
  weapon: string;
  time_in_round: number;
  is_headshot: number;
  winner: "CT" | "T";
};

type AllKillRow = {
  round_number: number;
  killer: string;
  victim: string;
  victim_team: "CT" | "T";
  time_in_round: number;
};

function computeTradeStatus(
  openerKillerSteamId: string,
  openerTime: number,
  openerVictimTeam: "CT" | "T",
  roundKills: AllKillRow[]
): OpeningDuelTradeStatus {
  const killerTeam: "CT" | "T" = openerVictimTeam === "CT" ? "T" : "CT";

  // Any kill where the opener's killer is the victim within the trade window
  const tradeKill = roundKills.find(
    (k) =>
      k.victim === openerKillerSteamId &&
      k.time_in_round > openerTime &&
      k.time_in_round <= openerTime + TRADE_WINDOW_SECONDS
  );
  if (tradeKill) return "converted";

  // An "attempted" trade: a kill by victim's team in the extended window (up to 10s)
  // that targets the killer's side — proxy for "they went for the trade but missed"
  const tradeAttempt = roundKills.find(
    (k) =>
      k.victim_team === killerTeam &&
      k.time_in_round > openerTime &&
      k.time_in_round <= openerTime + TRADE_WINDOW_SECONDS * 2
  );
  if (tradeAttempt) return "attempted";

  return "isolated";
}

export const getMatchGameOpeningDuels = async (
  match_game_id: number
): Promise<MatchGameOpeningDuel[]> => {
  const openingKillsQuery = `
    SELECT
      pklog.round_number,
      pklog.killer,
      pklog.killer_team,
      pklog.victim,
      pklog.victim_team,
      pklog.weapon,
      pklog.time_in_round,
      pklog.is_headshot,
      mrs.winner
    FROM PlayerKillLogs pklog
    JOIN MapRoundStats mrs
      ON mrs.match_game_id = pklog.match_game_id
     AND mrs.round_number  = pklog.round_number
    WHERE pklog.match_game_id = ?
      AND pklog.is_first_kill  = 1
    ORDER BY pklog.round_number ASC
  `;

  const allKillsQuery = `
    SELECT
      round_number,
      killer,
      victim,
      victim_team,
      time_in_round
    FROM PlayerKillLogs
    WHERE match_game_id = ?
    ORDER BY round_number ASC, time_in_round ASC
  `;

  const [openingRows, allKillRows] = await Promise.all([
    runQuery<OpeningKillRow[]>(openingKillsQuery, [match_game_id]),
    runQuery<AllKillRow[]>(allKillsQuery, [match_game_id])
  ]);

  // is_first_kill can be set on multiple rows per round (e.g. first kill per team).
  // Keep only the earliest kill per round number.
  const dedupedMap = new Map<number, OpeningKillRow>();
  for (const row of openingRows) {
    const existing = dedupedMap.get(row.round_number);
    if (!existing || row.time_in_round < existing.time_in_round) {
      dedupedMap.set(row.round_number, row);
    }
  }
  const dedupedRows = Array.from(dedupedMap.values()).sort(
    (a, b) => a.round_number - b.round_number
  );

  // Group all kills by round for trade computation
  const killsByRound = new Map<number, AllKillRow[]>();
  for (const k of allKillRows) {
    if (!killsByRound.has(k.round_number)) killsByRound.set(k.round_number, []);
    killsByRound.get(k.round_number)!.push(k);
  }

  return dedupedRows.map((row) => ({
    round_number: row.round_number,
    killer_steam_id: String(row.killer),
    killer_team: row.killer_team,
    victim_steam_id: String(row.victim),
    victim_team: row.victim_team,
    weapon: row.weapon,
    time_in_round: row.time_in_round,
    is_headshot: Boolean(row.is_headshot),
    round_won_by: row.winner,
    trade: computeTradeStatus(
      String(row.killer),
      row.time_in_round,
      row.victim_team,
      killsByRound.get(row.round_number) ?? []
    )
  }));
};

/* ─────────────────────────────────────────────────────────
 *  Kill & Flash Matrix
 * ─────────────────────────────────────────────────────────*/

type KillCountRow = {
  killer: string;
  victim: string;
  count: number;
};

type FlashAssistRow = {
  assister: string;
  victim: string;
  count: number;
};

export const getMatchGameKillMatrix = async (
  match_game_id: number
): Promise<MatchGameKillMatrix> => {
  const killsQuery = `
    SELECT
      killer,
      victim,
      COUNT(*) AS count
    FROM PlayerKillLogs
    WHERE match_game_id = ?
      AND killer_team != victim_team
    GROUP BY killer, victim
  `;

  const flashQuery = `
    SELECT
      assister,
      victim,
      COUNT(*) AS count
    FROM PlayerKillLogs
    WHERE match_game_id = ?
      AND is_flash_assist = 1
      AND assister IS NOT NULL
      AND killer_team != victim_team
    GROUP BY assister, victim
  `;

  const [killRows, flashRows] = await Promise.all([
    runQuery<KillCountRow[]>(killsQuery, [match_game_id]),
    runQuery<FlashAssistRow[]>(flashQuery, [match_game_id])
  ]);

  return {
    kills: killRows.map((r) => ({
      killer_steam_id: String(r.killer),
      victim_steam_id: String(r.victim),
      count: r.count
    })),
    flash_assists: flashRows.map((r) => ({
      assister_steam_id: String(r.assister),
      victim_steam_id: String(r.victim),
      count: r.count
    }))
  };
};

/* ─────────────────────────────────────────────────────────
 *  Trade Stats
 * ─────────────────────────────────────────────────────────*/

type PlayerTradeStatsRow = {
  steam_id: string;
  nickname: string;
  team_id: number;
  trade_opportunities: number;
  trade_attempts: number;
  trades: number;
  traded: number;
  deaths: number;
  first_death_traded: number;
  first_deaths_tradeable: number;
  first_deaths: number;
};

type TradeMatrixRow = {
  trader_steam_id: string;
  killer_steam_id: string;
  count: number;
};

export const getMatchGameTradeStats = async (
  match_game_id: number
): Promise<MatchGameTradeStats> => {
  const playerQuery = `
    SELECT
      sp.steam_id,
      sp.nickname,
      mt.team_id,
      ps.trade_opportunities,
      ps.trade_attempts,
      ps.trades,
      ps.traded,
      ps.deaths,
      ps.first_death_traded,
      ps.first_deaths_tradeable,
      ps.first_deaths
    FROM PlayerStats ps
    JOIN SteamPlayers sp ON sp.steam_id = ps.steam_id
    JOIN MatchGames mg ON mg.id = ps.match_game_id
    JOIN SeasonTeamPlayers stp ON stp.season_id = mg.season_id
      AND stp.steam_id = ps.steam_id
    JOIN MatchTeams mt ON mt.match_id = mg.match_id
      AND mt.team_id = stp.team_id
    WHERE ps.match_game_id = ?
  `;

  const matrixQuery = `
    SELECT
      pt.trader_steam_id,
      pt.killer_steam_id,
      COUNT(*) AS count
    FROM PlayerTrades pt
    WHERE pt.match_game_id = ?
      AND pt.traded = 1
    GROUP BY pt.trader_steam_id, pt.killer_steam_id
  `;

  const [playerRows, matrixRows] = await Promise.all([
    runQuery<PlayerTradeStatsRow[]>(playerQuery, [match_game_id]),
    runQuery<TradeMatrixRow[]>(matrixQuery, [match_game_id])
  ]);

  const players: PlayerTradeStats[] = playerRows.map((r) => ({
    steam_id: String(r.steam_id),
    nickname: r.nickname,
    team_id: Number(r.team_id),
    trade_opportunities: Number(r.trade_opportunities),
    trade_attempts: Number(r.trade_attempts),
    trades: Number(r.trades),
    traded: Number(r.traded),
    deaths: Number(r.deaths),
    first_death_traded: Number(r.first_death_traded),
    first_deaths_tradeable: Number(r.first_deaths_tradeable),
    first_deaths: Number(r.first_deaths)
  }));

  const matrix: TradeMatrixEntry[] = matrixRows.map((r) => ({
    trader_steam_id: String(r.trader_steam_id),
    killer_steam_id: String(r.killer_steam_id),
    count: Number(r.count)
  }));

  return { players, matrix };
};
