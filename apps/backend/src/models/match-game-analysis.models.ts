import JSONBig from "json-bigint";
import {
  type AfterplantKillEvent,
  type MatchGameAfterplantRound,
  type MatchGameOpeningDuel,
  type OpeningDuelTradeStatus,
  type MatchGameKillMatrix,
  type MatchGameTradeStats,
  type PlayerTradeStats,
  type TradeMatrixEntry,
  type InsightResult,
  type MatchGameInsights
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

type TradeRow = {
  trader_steam_id: string;
  killer_steam_id: string;
  round_number: number;
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

  // Fetch confirmed trades from the parser-computed PlayerTrades table.
  // trader_steam_id = who made the trade kill (killed the enemy who had just killed their teammate)
  // killer_steam_id = the enemy who made the original kill (and who the trader killed)
  const tradesQuery = `
    SELECT
      pt.trader_steam_id,
      pt.killer_steam_id,
      pt.round_number
    FROM PlayerTrades pt
    WHERE pt.match_game_id = ?
      AND pt.traded = 1
  `;

  const [rows, killRows, tradeRows] = await Promise.all([
    runQuery<AfterplantRoundRow[]>(roundsQuery, [match_game_id]),
    runQuery<KillLogRow[]>(killsQuery, [match_game_id]),
    runQuery<TradeRow[]>(tradesQuery, [match_game_id])
  ]);

  // Build a set of "round:trader:killed_enemy" for O(1) lookup.
  // A kill event (killer K, victim V, round R) is a trade when K = trader and V = killer_steam_id.
  const tradeSet = new Set<string>();
  for (const t of tradeRows) {
    tradeSet.add(
      `${t.round_number}:${String(t.trader_steam_id)}:${String(t.killer_steam_id)}`
    );
  }

  // Group kills by round number
  const killsByRound = new Map<number, KillLogRow[]>();
  for (const kill of killRows) {
    const rn = kill.round_number;
    if (!killsByRound.has(rn)) killsByRound.set(rn, []);
    killsByRound.get(rn)!.push(kill);
  }

  function computeKillEvents(kills: KillLogRow[]): AfterplantKillEvent[] {
    return kills.map((kill) => ({
      victim_steam_id: String(kill.victim_steam_id),
      victim_team: kill.victim_team,
      killer_steam_id: String(kill.killer_steam_id),
      time_in_round: kill.time_in_round,
      is_traded: tradeSet.has(
        `${kill.round_number}:${String(kill.killer_steam_id)}:${String(kill.victim_steam_id)}`
      )
    }));
  }

  return rows.map((row) => ({
    ...row,
    ct_t: row.ct_t ? jsonBig.parse(row.ct_t) : null,
    kills_after_plant: computeKillEvents(
      killsByRound.get(row.round_number) ?? []
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

export interface KillMatrixFilters {
  excludeExitKills?: boolean;
  postPlantOnly?: boolean;
  excludeEcoKills?: boolean;
}

export const getMatchGameKillMatrix = async (
  match_game_id: number,
  filters: KillMatrixFilters = {}
): Promise<MatchGameKillMatrix> => {
  const filterClauses: string[] = ["killer_team != victim_team"];
  if (filters.excludeExitKills) {
    filterClauses.push("(is_exit_kill = 0 OR is_exit_kill IS NULL)");
  }
  if (filters.postPlantOnly) {
    filterClauses.push("is_post_plant = 1");
  }
  if (filters.excludeEcoKills) {
    filterClauses.push(
      "(ct_buy_type != 'Eco' OR ct_buy_type IS NULL) AND (t_buy_type != 'Eco' OR t_buy_type IS NULL)"
    );
  }

  const whereClause = filterClauses.map((c) => `(${c})`).join(" AND ");

  const killsQuery = `
    SELECT
      killer,
      victim,
      COUNT(*) AS count
    FROM PlayerKillLogs
    WHERE match_game_id = ?
      AND ${whereClause}
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
      AND ${whereClause}
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
  first_death_trade_opportunities: number;
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
      ps.first_death_trade_opportunities,
      ps.first_deaths
    FROM PlayerStats ps
    JOIN SteamPlayers sp ON sp.steam_id = ps.steam_id
    JOIN MatchGames mg ON mg.id = ps.match_game_id
    JOIN Matches m ON m.id = mg.match_id
    JOIN SeasonTeamPlayers stp ON stp.season_id = m.season_id
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
    first_death_trade_opportunities: Number(r.first_death_trade_opportunities),
    first_deaths: Number(r.first_deaths)
  }));

  const matrix: TradeMatrixEntry[] = matrixRows.map((r) => ({
    trader_steam_id: String(r.trader_steam_id),
    killer_steam_id: String(r.killer_steam_id),
    count: Number(r.count)
  }));

  return { players, matrix };
};

/* ─────────────────────────────────────────────────────────
 *  Insights — Pattern Templating Engine
 * ─────────────────────────────────────────────────────────*/

type InsightKillRow = {
  round_number: number;
  killer: string;
  victim: string;
  assister: string | null;
  killer_team: "CT" | "T";
  victim_team: "CT" | "T";
  time_in_round: number;
  is_first_kill: number;
  is_flash_assist: number;
  bomb_planted: number;
  cts_alive_after: number;
  ts_alive_after: number;
};

type InsightRoundRow = {
  round_number: number;
  ct_team_id: number;
  t_team_id: number;
  winner: "CT" | "T" | null;
  plant_site: string | null;
  ct_t: string | null;
  ct_buy_strategy: string | null;
  t_buy_strategy: string | null;
  importance: number | null;
};

type InsightTradeRow = {
  victim_steam_id: string;
  killer_steam_id: string;
  trader_steam_id: string;
  round_number: number;
  first_death: number;
  traded: number;
  attempted: number;
  trade_denied: number;
  trade_timeout: number;
};

type InsightPlayerStatRow = {
  steam_id: string;
  nickname: string;
  team_id: number;
  kills_ct: number | null;
  kills_t: number | null;
  deaths_ct: number | null;
  deaths_t: number | null;
  first_kills_ct: number | null;
  first_kills_t: number | null;
  first_deaths_ct: number | null;
  first_deaths_t: number | null;
  first_death_traded_ct: number | null;
  first_death_traded_t: number | null;
  first_death_trade_opportunities_ct: number | null;
  first_death_trade_opportunities_t: number | null;
  mates_flashed_ct: number | null;
  mates_flashed_t: number | null;
  flash_assists_ct: number | null;
  flash_assists_t: number | null;
  trade_opportunities_ct: number | null;
  trade_opportunities_t: number | null;
  trade_attempts_ct: number | null;
  trade_attempts_t: number | null;
  trades_ct: number | null;
  trades_t: number | null;
  traded_ct: number | null;
  traded_t: number | null;
  adr_ct: number | null;
  adr_t: number | null;
  kast: number | null;
  clutches_won: number;
  clutches: number;
};

type InsightImpactRow = {
  player_steam_id: string;
  round_number: number;
  entry_kill: number;
  exit_kill: number;
  win_prob_impact: number;
  trade_denials: number;
  failed_trades: number;
  damage_dealt: number;
  first_kill: number;
  kills: number;
};

type InsightClutchRow = {
  player_steam_id: string;
  round_number: number;
  player_team: "CT" | "T";
  won: number;
  clutch_start_enemies: number;
};

type InsightTeamRow = {
  team_id: number;
  team_name: string;
  team_logo: string | null;
};

type ParsedRound = Omit<
  InsightRoundRow,
  "ct_t" | "ct_team_id" | "t_team_id" | "importance"
> & {
  ct_t: { CT: string[]; T: string[] } | null;
  ct_team_id: number;
  t_team_id: number;
  importance: number;
};

export const getMatchGameInsights = async (
  match_game_id: number
): Promise<MatchGameInsights> => {
  const killsQuery = `
    SELECT
      round_number,
      CAST(killer AS CHAR)   AS killer,
      CAST(victim AS CHAR)   AS victim,
      CAST(assister AS CHAR) AS assister,
      killer_team,
      victim_team,
      time_in_round,
      is_first_kill,
      is_flash_assist,
      bomb_planted,
      cts_alive_after,
      ts_alive_after
    FROM PlayerKillLogs
    WHERE match_game_id = ?
    ORDER BY round_number ASC, time_in_round ASC
  `;

  const roundsQuery = `
    SELECT
      round_number,
      ct_team_id,
      t_team_id,
      winner,
      plant_site,
      ct_t,
      ct_buy_strategy,
      t_buy_strategy,
      importance
    FROM MapRoundStats
    WHERE match_game_id = ?
    ORDER BY round_number ASC
  `;

  const tradesQuery = `
    SELECT
      CAST(victim_steam_id  AS CHAR) AS victim_steam_id,
      CAST(killer_steam_id  AS CHAR) AS killer_steam_id,
      CAST(trader_steam_id  AS CHAR) AS trader_steam_id,
      round_number,
      first_death,
      traded,
      attempted,
      trade_denied,
      trade_timeout
    FROM PlayerTrades
    WHERE match_game_id = ?
  `;

  const playerStatsQuery = `
    SELECT
      CAST(sp.steam_id AS CHAR) AS steam_id,
      sp.nickname,
      mt.team_id,
      ps.kills_ct,
      ps.kills_t,
      ps.deaths_ct,
      ps.deaths_t,
      ps.first_kills_ct,
      ps.first_kills_t,
      ps.first_deaths_ct,
      ps.first_deaths_t,
      ps.first_death_traded_ct,
      ps.first_death_traded_t,
      ps.first_death_trade_opportunities_ct,
      ps.first_death_trade_opportunities_t,
      ps.mates_flashed_ct,
      ps.mates_flashed_t,
      ps.flash_assists_ct,
      ps.flash_assists_t,
      ps.trade_opportunities_ct,
      ps.trade_opportunities_t,
      ps.trade_attempts_ct,
      ps.trade_attempts_t,
      ps.trades_ct,
      ps.trades_t,
      ps.traded_ct,
      ps.traded_t,
      ps.adr_ct,
      ps.adr_t,
      ps.kast,
      ps.clutches_won,
      ps.clutches
    FROM PlayerStats ps
    JOIN SteamPlayers sp ON sp.steam_id = ps.steam_id
    JOIN MatchGames mg ON mg.id = ps.match_game_id
    JOIN Matches m ON m.id = mg.match_id
    JOIN SeasonTeamPlayers stp ON stp.season_id = m.season_id
      AND stp.steam_id = ps.steam_id
    JOIN MatchTeams mt ON mt.match_id = mg.match_id
      AND mt.team_id = stp.team_id
    WHERE ps.match_game_id = ?
  `;

  const impactsQuery = `
    SELECT
      CAST(player_steam_id AS CHAR) AS player_steam_id,
      round_number,
      entry_kill,
      exit_kill,
      win_prob_impact,
      trade_denials,
      failed_trades,
      damage_dealt,
      first_kill,
      kills
    FROM PlayerRoundImpacts
    WHERE match_game_id = ?
    ORDER BY round_number ASC
  `;

  const clutchesQuery = `
    SELECT
      CAST(player_steam_id AS CHAR) AS player_steam_id,
      round_number,
      player_team,
      won,
      clutch_start_enemies
    FROM PlayerClutches
    WHERE match_game_id = ?
  `;

  const teamsQuery = `
    SELECT id AS team_id, name AS team_name, team_logo
    FROM Teams
    WHERE id IN (
      SELECT DISTINCT ct_team_id FROM MapRoundStats WHERE match_game_id = ?
      UNION
      SELECT DISTINCT t_team_id  FROM MapRoundStats WHERE match_game_id = ?
    )
  `;

  const [
    killRows,
    rawRoundRows,
    tradeRows,
    playerStatRows,
    impactRows,
    clutchRows,
    teamRows
  ] = await Promise.all([
    runQuery<InsightKillRow[]>(killsQuery, [match_game_id]),
    runQuery<InsightRoundRow[]>(roundsQuery, [match_game_id]),
    runQuery<InsightTradeRow[]>(tradesQuery, [match_game_id]),
    runQuery<InsightPlayerStatRow[]>(playerStatsQuery, [match_game_id]),
    runQuery<InsightImpactRow[]>(impactsQuery, [match_game_id]),
    runQuery<InsightClutchRow[]>(clutchesQuery, [match_game_id]),
    runQuery<InsightTeamRow[]>(teamsQuery, [match_game_id, match_game_id])
  ]);

  // ── Parse rounds, handle JSONBig for ct_t ──────────────────────────────
  const parsedRounds: ParsedRound[] = rawRoundRows.map((r) => ({
    ...r,
    ct_team_id: Number(r.ct_team_id),
    t_team_id: Number(r.t_team_id),
    importance: Number(r.importance ?? 0),
    ct_t: r.ct_t
      ? (jsonBig.parse(r.ct_t) as { CT: string[]; T: string[] })
      : null
  }));

  // ── Build lookup maps ──────────────────────────────────────────────────
  const roundImportance = new Map<number, number>();
  for (const r of parsedRounds)
    roundImportance.set(r.round_number, r.importance);

  const nicknames = new Map<string, string>();
  const playerTeamMap = new Map<string, number>();
  for (const ps of playerStatRows) {
    nicknames.set(String(ps.steam_id), ps.nickname);
    playerTeamMap.set(String(ps.steam_id), Number(ps.team_id));
  }

  const killsByRound = new Map<number, InsightKillRow[]>();
  for (const k of killRows) {
    if (!killsByRound.has(k.round_number)) killsByRound.set(k.round_number, []);
    killsByRound.get(k.round_number)!.push(k);
  }

  const tradeSet = new Set<string>(); // "round:victim" for traded=1 rows
  for (const t of tradeRows) {
    if (Number(t.traded) === 1) {
      tradeSet.add(`${t.round_number}:${String(t.victim_steam_id)}`);
    }
  }

  // ── Shared helpers ─────────────────────────────────────────────────────
  const nick = (id: string) => nicknames.get(id) ?? id.slice(-6);
  const n = (v: number | null | undefined) => Number(v ?? 0);
  const pct = (num: number, den: number) =>
    den > 0 ? Math.round((num / den) * 100) : 0;

  function severity(
    evidenceCount: number,
    totalRounds: number,
    evidenceRounds: number[]
  ): "critical" | "notable" | "info" {
    const ratio = totalRounds > 0 ? evidenceCount / totalRounds : 0;
    let base: "critical" | "notable" | "info" =
      ratio > 0.4 ? "critical" : ratio >= 0.2 ? "notable" : "info";
    // Escalate if >=50% of evidence rounds are high-importance
    if (evidenceRounds.length > 0) {
      const highImportance = evidenceRounds.filter(
        (rn) => (roundImportance.get(rn) ?? 0) > 0.6
      ).length;
      if (highImportance >= evidenceRounds.length / 2) {
        if (base === "info") base = "notable";
        else if (base === "notable") base = "critical";
      }
    }
    return base;
  }

  function makeInsight(
    partial: Omit<InsightResult, "severity"> & {
      evidenceCount: number;
      totalRounds: number;
    }
  ): InsightResult {
    const { evidenceCount, totalRounds, ...rest } = partial;
    return {
      ...rest,
      severity: severity(evidenceCount, totalRounds, rest.evidence_rounds)
    };
  }

  // ── Template runner ────────────────────────────────────────────────────
  function runTemplatesForTeamSide(
    teamId: number,
    side: "CT" | "T"
  ): InsightResult[] {
    const oppSide: "CT" | "T" = side === "CT" ? "T" : "CT";

    // Rounds where this team played this side
    const sideRounds = parsedRounds.filter((r) =>
      side === "CT" ? r.ct_team_id === teamId : r.t_team_id === teamId
    );
    const sideRoundNums = new Set(sideRounds.map((r) => r.round_number));
    const totalSideRounds = sideRounds.length;

    // Player sets
    const teamPlayers = playerStatRows.filter(
      (ps) => Number(ps.team_id) === teamId
    );
    const teamPlayerIds = new Set(teamPlayers.map((ps) => String(ps.steam_id)));

    // Kills in side rounds
    const sideKills = killRows.filter((k) => sideRoundNums.has(k.round_number));
    const teamDeaths = sideKills.filter(
      (k) => k.victim_team === side && teamPlayerIds.has(String(k.victim))
    );

    // Trades in side rounds
    const sideTrades = tradeRows.filter((t) =>
      sideRoundNums.has(t.round_number)
    );
    const teamVictimTrades = sideTrades.filter((t) =>
      teamPlayerIds.has(String(t.victim_steam_id))
    );

    // Impacts for this team's players in side rounds
    const teamImpacts = impactRows.filter(
      (i) =>
        sideRoundNums.has(i.round_number) &&
        teamPlayerIds.has(String(i.player_steam_id))
    );

    // Clutches for this team on this side
    const teamClutches = clutchRows.filter(
      (c) =>
        sideRoundNums.has(c.round_number) &&
        teamPlayerIds.has(String(c.player_steam_id)) &&
        c.player_team === side
    );

    const results: InsightResult[] = [];
    const add = (r: InsightResult | null) => {
      if (r) results.push(r);
    };

    /* ── OD-1: Opening death → fast site plant (CT side) ─────────────── */
    if (side === "CT") {
      const firstDeathRounds = sideKills.filter(
        (k) =>
          Number(k.is_first_kill) === 1 &&
          k.victim_team === "CT" &&
          teamPlayerIds.has(String(k.victim))
      );
      if (firstDeathRounds.length >= 4) {
        // Group by player
        const byPlayer = new Map<
          string,
          { rounds: number[]; plants: number[] }
        >();
        for (const k of firstDeathRounds) {
          const v = String(k.victim);
          if (!byPlayer.has(v)) byPlayer.set(v, { rounds: [], plants: [] });
          const entry = byPlayer.get(v)!;
          const round = parsedRounds.find(
            (r) => r.round_number === k.round_number
          );
          entry.rounds.push(k.round_number);
          if (round?.plant_site) entry.plants.push(k.round_number);
        }
        for (const [playerId, data] of byPlayer.entries()) {
          if (data.rounds.length < 4) continue;
          const plantRate = pct(data.plants.length, data.rounds.length);
          if (plantRate < 60) continue;
          const dominantSite = (() => {
            const sites: Record<string, number> = {};
            for (const rn of data.plants) {
              const site =
                parsedRounds.find((r) => r.round_number === rn)?.plant_site ??
                "?";
              sites[site] = (sites[site] ?? 0) + 1;
            }
            return (
              Object.entries(sites).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "?"
            );
          })();
          add(
            makeInsight({
              id: "OD-1",
              category: "openings",
              polarity: "concern",
              side,
              team_id: teamId,
              headline: `Opening Death → ${dominantSite} Plant`,
              story: `Every time ${nick(playerId)} died first, opponents planted the bomb — in ${data.plants.length} of ${data.rounds.length} rounds they went straight to ${dominantSite}. ${nick(playerId)}'s position may be opening the map directly. Consider pulling back or rotating cover.`,
              evidence_rounds: data.rounds,
              players: [playerId],
              evidenceCount: data.rounds.length,
              totalRounds: totalSideRounds
            })
          );
        }
      }
    }

    /* ── OD-2: Opening death correlates with round loss ──────────────── */
    {
      const firstDeathByPlayer = new Map<string, number[]>();
      for (const k of sideKills) {
        if (
          Number(k.is_first_kill) === 1 &&
          k.victim_team === side &&
          teamPlayerIds.has(String(k.victim))
        ) {
          const v = String(k.victim);
          if (!firstDeathByPlayer.has(v)) firstDeathByPlayer.set(v, []);
          firstDeathByPlayer.get(v)!.push(k.round_number);
        }
      }
      const totalWins = sideRounds.filter((r) => r.winner === side).length;
      const overallWinPct = pct(totalWins, totalSideRounds);

      for (const [playerId, roundNums] of firstDeathByPlayer.entries()) {
        if (roundNums.length < 4) continue;
        const winsInThoseRounds = roundNums.filter(
          (rn) =>
            parsedRounds.find((r) => r.round_number === rn)?.winner === side
        ).length;
        const playerWinPct = pct(winsInThoseRounds, roundNums.length);
        if (overallWinPct - playerWinPct < 15) continue;
        add(
          makeInsight({
            id: "OD-2",
            category: "openings",
            polarity: "concern",
            side,
            team_id: teamId,
            headline: "Opening Death Correlates with Round Loss",
            story: `When ${nick(playerId)} died first, the team won only ${playerWinPct}% of those rounds — well below their ${overallWinPct}% overall rate. Opponents are actively hunting ${nick(playerId)} as a win condition.`,
            evidence_rounds: roundNums,
            players: [playerId],
            evidenceCount: roundNums.length,
            totalRounds: totalSideRounds
          })
        );
      }
    }

    /* ── OD-3: Isolated opening deaths (no trade position) ───────────── */
    {
      const isolated: { id: string; count: number; rounds: number[] }[] = [];
      for (const ps of teamPlayers) {
        const firstDeaths = n(
          side === "CT" ? ps.first_deaths_ct : ps.first_deaths_t
        );
        const tradeOpps = n(
          side === "CT"
            ? ps.first_death_trade_opportunities_ct
            : ps.first_death_trade_opportunities_t
        );
        const count = firstDeaths - tradeOpps;
        if (count < 3) continue;
        const rounds = teamDeaths
          .filter(
            (k) =>
              Number(k.is_first_kill) === 1 &&
              String(k.victim) === String(ps.steam_id) &&
              !tradeSet.has(`${k.round_number}:${String(k.victim)}`)
          )
          .map((k) => k.round_number);
        isolated.push({ id: String(ps.steam_id), count, rounds });
      }
      if (isolated.length === 1) {
        const { id, count, rounds } = isolated[0];
        add(
          makeInsight({
            id: "OD-3",
            category: "openings",
            polarity: "concern",
            side,
            team_id: teamId,
            headline: "Isolated Opening Deaths",
            story: `${nick(id)} died in a non-tradeable position in ${count} rounds — no teammate was close enough to punish the kill. Consider safer positioning on entries or pairing ${nick(id)} with close support.`,
            evidence_rounds: rounds,
            players: [id],
            evidenceCount: count,
            totalRounds: totalSideRounds
          })
        );
      } else if (isolated.length > 1) {
        // Use unique rounds for severity — prevents summing per-player counts inflating severity
        const uniqueRounds = Array.from(
          new Set(isolated.flatMap((p) => p.rounds))
        ).sort((a, b) => a - b);
        // Require the pattern covers enough of the side (≥4 unique rounds) to be meaningful as a team pattern
        if (uniqueRounds.length >= 4) {
          const summary = isolated
            .map((p) => `${nick(p.id)} (×${p.count})`)
            .join(", ");
          add(
            makeInsight({
              id: "OD-3",
              category: "openings",
              polarity: "concern",
              side,
              team_id: teamId,
              headline: "Team-wide Isolated Opening Deaths",
              story: `Multiple players are repeatedly dying in positions their teammates cannot trade: ${summary}. This is a team-wide spacing issue — establish clearer entry pairings so no player opens alone.`,
              evidence_rounds: uniqueRounds,
              players: isolated.map((p) => p.id),
              evidenceCount: uniqueRounds.length,
              totalRounds: totalSideRounds
            })
          );
        }
      }
    }

    /* ── OD-4: Dominant opener ───────────────────────────────────────── */
    {
      const dominants: { id: string; kills: number; rounds: number[] }[] = [];
      for (const ps of teamPlayers) {
        const firstKills = n(
          side === "CT" ? ps.first_kills_ct : ps.first_kills_t
        );
        if (firstKills < 4) continue;
        const rounds = teamImpacts
          .filter(
            (i) =>
              String(i.player_steam_id) === String(ps.steam_id) &&
              Number(i.first_kill) === 1
          )
          .map((i) => i.round_number);
        dominants.push({ id: String(ps.steam_id), kills: firstKills, rounds });
      }
      if (dominants.length === 1) {
        const { id, kills, rounds } = dominants[0];
        add(
          makeInsight({
            id: "OD-4",
            category: "openings",
            polarity: "strength",
            side,
            team_id: teamId,
            headline: "Dominant Opener",
            story: `${nick(id)} won ${kills} opening duels on ${side} side, giving the team an immediate numbers advantage each time. A consistent early pressure point.`,
            evidence_rounds: rounds,
            players: [id],
            evidenceCount: kills,
            totalRounds: totalSideRounds
          })
        );
      } else if (dominants.length > 1) {
        // First kills are unique per round (two players can't both get the global first kill)
        // so dedup is mainly a safety measure here
        const uniqueRounds = Array.from(
          new Set(dominants.flatMap((p) => p.rounds))
        ).sort((a, b) => a - b);
        const summary = dominants
          .map((p) => `${nick(p.id)} (${p.kills} wins)`)
          .join(", ");
        add(
          makeInsight({
            id: "OD-4",
            category: "openings",
            polarity: "strength",
            side,
            team_id: teamId,
            headline: "Multiple Dominant Openers",
            story: `The team has multiple players winning opening duels on ${side} side: ${summary}. Opponents cannot predict who will push first — a strong positional and mental advantage at the start of each round.`,
            evidence_rounds: uniqueRounds,
            players: dominants.map((p) => p.id),
            evidenceCount: uniqueRounds.length,
            totalRounds: totalSideRounds
          })
        );
      }
    }

    /* ── SP-1: Staggered CT retake entries ───────────────────────────── */
    if (side === "CT") {
      const plantedLostRounds = sideRounds.filter(
        (r) => r.plant_site !== null && r.winner === "T"
      );
      const staggeredRounds: { roundNum: number; gap: number }[] = [];
      for (const r of plantedLostRounds) {
        const ctDeaths = (killsByRound.get(r.round_number) ?? [])
          .filter(
            (k) =>
              k.victim_team === "CT" &&
              teamPlayerIds.has(String(k.victim)) &&
              Number(k.bomb_planted) === 1
          )
          .sort((a, b) => a.time_in_round - b.time_in_round);
        if (ctDeaths.length < 2) continue;
        const gaps: number[] = [];
        for (let i = 1; i < ctDeaths.length; i++) {
          gaps.push(ctDeaths[i].time_in_round - ctDeaths[i - 1].time_in_round);
        }
        const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        if (avgGap > 7)
          staggeredRounds.push({ roundNum: r.round_number, gap: avgGap });
      }
      if (staggeredRounds.length >= 4) {
        const avgGap = Math.round(
          staggeredRounds.reduce((a, b) => a + b.gap, 0) /
            staggeredRounds.length
        );
        const evidenceRounds = staggeredRounds
          .sort((a, b) => b.gap - a.gap)
          .slice(0, 5)
          .map((r) => r.roundNum);
        add(
          makeInsight({
            id: "SP-1",
            category: "timing",
            polarity: "concern",
            side,
            team_id: teamId,
            headline: "Staggered Retake Entries",
            story: `CT players entered retakes individually — ${avgGap}s average gap between deaths in ${staggeredRounds.length} retake rounds. Opponents isolated and eliminated them one by one. Commit to retakes as a group with a designated entry order.`,
            evidence_rounds: evidenceRounds,
            players: [],
            evidenceCount: staggeredRounds.length,
            totalRounds: totalSideRounds
          })
        );
      }
    }

    /* ── SP-2: Staggered T-side execute entries ──────────────────────── */
    if (side === "T") {
      const failedExecRounds = sideRounds.filter(
        (r) => r.plant_site === null && r.winner === "CT"
      );
      const staggeredRounds: { roundNum: number; spread: number }[] = [];
      for (const r of failedExecRounds) {
        const tDeaths = (killsByRound.get(r.round_number) ?? [])
          .filter(
            (k) => k.victim_team === "T" && teamPlayerIds.has(String(k.victim))
          )
          .sort((a, b) => a.time_in_round - b.time_in_round);
        if (tDeaths.length < 2) continue;
        const spread =
          tDeaths[tDeaths.length - 1].time_in_round - tDeaths[0].time_in_round;
        if (spread > 6)
          staggeredRounds.push({ roundNum: r.round_number, spread });
      }
      if (staggeredRounds.length >= 4) {
        const avgSpread = Math.round(
          staggeredRounds.reduce((a, b) => a + b.spread, 0) /
            staggeredRounds.length
        );
        const evidenceRounds = staggeredRounds
          .sort((a, b) => b.spread - a.spread)
          .slice(0, 5)
          .map((r) => r.roundNum);
        add(
          makeInsight({
            id: "SP-2",
            category: "timing",
            polarity: "concern",
            side,
            team_id: teamId,
            headline: "Staggered T-side Execute Entries",
            story: `T-side executes are breaking apart — ${avgSpread}s average spread between deaths during ${staggeredRounds.length} failed attacks. CT side can hold and pick off players as they arrive. Synchronise execute timing.`,
            evidence_rounds: evidenceRounds,
            players: [],
            evidenceCount: staggeredRounds.length,
            totalRounds: totalSideRounds
          })
        );
      }
    }

    /* ── SP-3: Fast collapse after first death ───────────────────────── */
    {
      const fastCollapseRounds: number[] = [];
      for (const r of sideRounds.filter((r) => r.winner === oppSide)) {
        const teamDeathsInRound = (killsByRound.get(r.round_number) ?? [])
          .filter(
            (k) => k.victim_team === side && teamPlayerIds.has(String(k.victim))
          )
          .sort((a, b) => a.time_in_round - b.time_in_round);
        if (teamDeathsInRound.length < 2) continue;
        const firstDeath = teamDeathsInRound[0].time_in_round;
        const lastDeath =
          teamDeathsInRound[teamDeathsInRound.length - 1].time_in_round;
        if (lastDeath - firstDeath < 45) {
          fastCollapseRounds.push(r.round_number);
        }
      }
      if (fastCollapseRounds.length >= 5) {
        add(
          makeInsight({
            id: "SP-3",
            category: "timing",
            polarity: "concern",
            side,
            team_id: teamId,
            headline: "Fast Round Collapse After First Death",
            story: `In ${fastCollapseRounds.length} rounds, once the first player fell the round collapsed within 45 seconds — the team is not recovering from early disadvantage. Establish a reset call protocol after opening deaths.`,
            evidence_rounds: fastCollapseRounds.slice(0, 8),
            players: [],
            evidenceCount: fastCollapseRounds.length,
            totalRounds: totalSideRounds
          })
        );
      }
    }

    /* ── CP-1: Co-peek / simultaneous deaths ─────────────────────────── */
    {
      const coPeekRounds: number[] = [];
      for (const rn of sideRoundNums) {
        const teamDeathsInRound = (killsByRound.get(rn) ?? [])
          .filter(
            (k) =>
              k.victim_team === side &&
              teamPlayerIds.has(String(k.victim)) &&
              k.time_in_round <= 40
          )
          .sort((a, b) => a.time_in_round - b.time_in_round);
        let found = false;
        for (let i = 0; i < teamDeathsInRound.length - 1 && !found; i++) {
          for (let j = i + 1; j < teamDeathsInRound.length && !found; j++) {
            const gap =
              teamDeathsInRound[j].time_in_round -
              teamDeathsInRound[i].time_in_round;
            if (gap > 3) break;
            const v1 = String(teamDeathsInRound[i].victim);
            const v2 = String(teamDeathsInRound[j].victim);
            const bothUntraded =
              !tradeSet.has(`${rn}:${v1}`) && !tradeSet.has(`${rn}:${v2}`);
            if (bothUntraded) {
              coPeekRounds.push(rn);
              found = true;
            }
          }
        }
      }
      if (coPeekRounds.length >= 4) {
        add(
          makeInsight({
            id: "CP-1",
            category: "timing",
            polarity: "concern",
            side,
            team_id: teamId,
            headline: "Simultaneous Deaths (Co-peek)",
            story: `In ${coPeekRounds.length} rounds, two teammates died within 3 seconds of each other without either death being traded — likely both peeking the same angle simultaneously. This dropped the team to a 3v5 instantly. Coordinate peek timing: one player peeks, the other covers.`,
            evidence_rounds: coPeekRounds.slice(0, 8),
            players: [],
            evidenceCount: coPeekRounds.length,
            totalRounds: totalSideRounds
          })
        );
      }
    }

    /* ── TR-1: Trade attempts denied ─────────────────────────────────── */
    {
      const deniedRounds = teamVictimTrades
        .filter((t) => Number(t.trade_denied) === 1)
        .map((t) => t.round_number);
      if (deniedRounds.length >= 4) {
        add(
          makeInsight({
            id: "TR-1",
            category: "trades",
            polarity: "concern",
            side,
            team_id: teamId,
            headline: "Trade Attempts Denied",
            story: `Opponents denied ${deniedRounds.length} of the team's trade attempts on ${side} side — they are actively playing anti-trade angles. Consider varying approach routes or committing trades faster before opponents can reset.`,
            evidence_rounds: deniedRounds.slice(0, 8),
            players: [],
            evidenceCount: deniedRounds.length,
            totalRounds: totalSideRounds
          })
        );
      }
    }

    /* ── TR-2: Trade timeouts (too far away) ─────────────────────────── */
    {
      const timeoutRounds = teamVictimTrades
        .filter((t) => Number(t.trade_timeout) === 1)
        .map((t) => t.round_number);
      if (timeoutRounds.length >= 4) {
        // Find player with most isolated deaths
        const deathCounts = new Map<string, number>();
        for (const t of teamVictimTrades.filter(
          (t2) => Number(t2.trade_timeout) === 1
        )) {
          const v = String(t.victim_steam_id);
          deathCounts.set(v, (deathCounts.get(v) ?? 0) + 1);
        }
        const [mostIsolatedId] = [...deathCounts.entries()].sort(
          (a, b) => b[1] - a[1]
        )[0] ?? ["", 0];
        add(
          makeInsight({
            id: "TR-2",
            category: "trades",
            polarity: "concern",
            side,
            team_id: teamId,
            headline: "Trade Timeouts — Spacing Too Wide",
            story: `The team timed out on ${timeoutRounds.length} potential trades on ${side} side — a player died but teammates were too far away to punish within the window. Tighten spacing, especially around ${mostIsolatedId ? nick(mostIsolatedId) : "entries"}.`,
            evidence_rounds: timeoutRounds.slice(0, 8),
            players: mostIsolatedId ? [mostIsolatedId] : [],
            evidenceCount: timeoutRounds.length,
            totalRounds: totalSideRounds
          })
        );
      }
    }

    /* ── TR-3: Players consistently left untradeable (grouped) ──────────── */
    {
      const untradeables: {
        id: string;
        traded: number;
        deaths: number;
        rounds: number[];
      }[] = [];
      for (const ps of teamPlayers) {
        const traded = n(side === "CT" ? ps.traded_ct : ps.traded_t);
        const deaths = n(side === "CT" ? ps.deaths_ct : ps.deaths_t);
        if (deaths < 4) continue;
        if (traded / deaths >= 0.25) continue;
        const rounds = teamDeaths
          .filter(
            (k) =>
              String(k.victim) === String(ps.steam_id) &&
              !tradeSet.has(`${k.round_number}:${String(k.victim)}`)
          )
          .map((k) => k.round_number);
        untradeables.push({ id: String(ps.steam_id), traded, deaths, rounds });
      }
      if (untradeables.length === 1) {
        const { id, traded, deaths, rounds } = untradeables[0];
        add(
          makeInsight({
            id: "TR-3",
            category: "trades",
            polarity: "concern",
            side,
            team_id: teamId,
            headline: "Player Consistently Left Untradeable",
            story: `${nick(id)} was only traded ${traded}/${deaths} times on ${side} side. Teammates are consistently failing to punish the enemy after ${nick(id)} goes down — either spacing is too wide or ${nick(id)} is playing isolated from the group.`,
            evidence_rounds: rounds,
            players: [id],
            evidenceCount: deaths - traded,
            totalRounds: totalSideRounds
          })
        );
      } else if (untradeables.length > 1) {
        const uniqueRounds = Array.from(
          new Set(untradeables.flatMap((u) => u.rounds))
        ).sort((a, b) => a - b);
        if (uniqueRounds.length >= 4) {
          const summary = untradeables
            .map((u) => `${nick(u.id)} (${u.traded}/${u.deaths} traded)`)
            .join(", ");
          add(
            makeInsight({
              id: "TR-3",
              category: "trades",
              polarity: "concern",
              side,
              team_id: teamId,
              headline: "Multiple Players Consistently Left Untradeable",
              story: `${untradeables.length} players were consistently left in non-tradeable positions on ${side} side: ${summary}. The team's spacing is systematically too wide — establish support pairings and tighten entry formations.`,
              evidence_rounds: uniqueRounds,
              players: untradeables.map((u) => u.id),
              evidenceCount: uniqueRounds.length,
              totalRounds: totalSideRounds
            })
          );
        }
      }
    }

    /* ── TR-4: Reliable trader(s) ────────────────────────────────────── */
    {
      const traders: { id: string; ratio: number; attempts: number }[] = [];
      for (const ps of teamPlayers) {
        const opps = n(
          side === "CT" ? ps.trade_opportunities_ct : ps.trade_opportunities_t
        );
        const attempts = n(
          side === "CT" ? ps.trade_attempts_ct : ps.trade_attempts_t
        );
        if (opps < 4) continue;
        const ratio = pct(attempts, opps);
        if (ratio <= 75) continue;
        traders.push({ id: String(ps.steam_id), ratio, attempts });
      }
      if (traders.length === 1) {
        const { id, ratio, attempts } = traders[0];
        add(
          makeInsight({
            id: "TR-4",
            category: "trades",
            polarity: "strength",
            side,
            team_id: teamId,
            headline: "Reliable Trader",
            story: `${nick(id)} converted ${ratio}% of trade opportunities on ${side} side — consistently punishing opponents who make kills. A dependable support presence.`,
            evidence_rounds: [],
            players: [id],
            evidenceCount: attempts,
            totalRounds: totalSideRounds
          })
        );
      } else if (traders.length > 1) {
        const summary = traders
          .map((t) => `${nick(t.id)} (${t.ratio}%)`)
          .join(", ");
        add(
          makeInsight({
            id: "TR-4",
            category: "trades",
            polarity: "strength",
            side,
            team_id: teamId,
            headline: "Strong Team Trade Culture",
            story: `Multiple players are converting trade opportunities at a high rate on ${side} side: ${summary}. The team consistently punishes every enemy kill — opponents cannot make a free trade without risking their own player.`,
            evidence_rounds: [],
            players: traders.map((t) => t.id),
            evidenceCount: traders.reduce((s, t) => s + t.attempts, 0),
            totalRounds: totalSideRounds
          })
        );
      }
    }

    /* ── FL-1: Friendly flash enables enemy kill ─────────────────────── */
    {
      const friendlyFlashKills = sideKills.filter(
        (k) =>
          Number(k.is_flash_assist) === 1 &&
          k.victim_team === side &&
          k.killer_team === oppSide &&
          k.assister !== null &&
          teamPlayerIds.has(String(k.assister))
      );
      const byAssister = new Map<string, number[]>();
      for (const k of friendlyFlashKills) {
        const a = String(k.assister!);
        if (!byAssister.has(a)) byAssister.set(a, []);
        byAssister.get(a)!.push(k.round_number);
      }
      for (const [assisterId, rounds] of byAssister.entries()) {
        if (rounds.length < 3) continue;
        add(
          makeInsight({
            id: "FL-1",
            category: "flashes",
            polarity: "concern",
            side,
            team_id: teamId,
            headline: "Friendly Flash Enables Enemy Kill",
            story: `${nick(assisterId)} accidentally blinded a teammate before the enemy killed them in ${rounds.length} rounds. The flash created the opening for opponents instead of denying it — review timing and angle of ${nick(assisterId)}'s flashes relative to teammate positions.`,
            evidence_rounds: rounds,
            players: [assisterId],
            evidenceCount: rounds.length,
            totalRounds: totalSideRounds
          })
        );
      }
    }

    /* ── FL-2: Flash enables first kill on entry ─────────────────────── */
    {
      const flashFirstKills = sideKills.filter(
        (k) =>
          Number(k.is_flash_assist) === 1 &&
          Number(k.is_first_kill) === 1 &&
          k.killer_team === side &&
          teamPlayerIds.has(String(k.killer)) &&
          k.assister !== null &&
          teamPlayerIds.has(String(k.assister))
      );
      const byAssister = new Map<string, number[]>();
      for (const k of flashFirstKills) {
        const a = String(k.assister!);
        if (!byAssister.has(a)) byAssister.set(a, []);
        byAssister.get(a)!.push(k.round_number);
      }
      for (const [assisterId, rounds] of byAssister.entries()) {
        if (rounds.length < 3) continue;
        const wins = rounds.filter(
          (rn) =>
            parsedRounds.find((r) => r.round_number === rn)?.winner === side
        ).length;
        const winPct = pct(wins, rounds.length);
        add(
          makeInsight({
            id: "FL-2",
            category: "flashes",
            polarity: "strength",
            side,
            team_id: teamId,
            headline: "Flash Enables Opening Kill",
            story: `${nick(assisterId)}'s flashes created the opening kill in ${rounds.length} rounds. The team wins ${winPct}% of rounds where ${nick(assisterId)} gets a flash assist on the first kill — excellent entry utility.`,
            evidence_rounds: rounds,
            players: [assisterId],
            evidenceCount: rounds.length,
            totalRounds: totalSideRounds
          })
        );
      }
    }

    /* ── FL-3: High teammate flash volume ────────────────────────────── */
    {
      const flashers: { id: string; count: number }[] = [];
      for (const ps of teamPlayers) {
        const matesFlashed = n(
          side === "CT" ? ps.mates_flashed_ct : ps.mates_flashed_t
        );
        if (matesFlashed <= 5) continue;
        flashers.push({ id: String(ps.steam_id), count: matesFlashed });
      }
      if (flashers.length === 1) {
        const { id, count } = flashers[0];
        add(
          makeInsight({
            id: "FL-3",
            category: "flashes",
            polarity: "concern",
            side,
            team_id: teamId,
            headline: "High Teammate Flash Volume",
            story: `On ${side} side, ${nick(id)} blinded ${count} teammates. Check whether ${nick(id)}'s flash angles account for where teammates are positioned during ${side} setups.`,
            evidence_rounds: [],
            players: [id],
            evidenceCount: count,
            totalRounds: totalSideRounds
          })
        );
      } else if (flashers.length > 1) {
        const total = flashers.reduce((s, f) => s + f.count, 0);
        const summary = flashers
          .map((f) => `${nick(f.id)} (×${f.count})`)
          .join(", ");
        add(
          makeInsight({
            id: "FL-3",
            category: "flashes",
            polarity: "concern",
            side,
            team_id: teamId,
            headline: "Flash Communication Breakdown",
            story: `Multiple players are blinding their own teammates on ${side} side — ${total} friendly flashes total: ${summary}. The team's flash calls or default positions need to be aligned so players know when not to pop out.`,
            evidence_rounds: [],
            players: flashers.map((f) => f.id),
            evidenceCount: total,
            totalRounds: totalSideRounds
          })
        );
      }
    }

    /* ── EX-1: Over-committed to one site (T side) ───────────────────── */
    if (side === "T") {
      const plantRounds = sideRounds.filter((r) => r.plant_site !== null);
      if (plantRounds.length >= 5) {
        const siteCounts: Record<string, number[]> = {};
        for (const r of plantRounds) {
          const s = r.plant_site!;
          if (!siteCounts[s]) siteCounts[s] = [];
          siteCounts[s].push(r.round_number);
        }
        for (const [site, rounds] of Object.entries(siteCounts)) {
          const sitePct = pct(rounds.length, plantRounds.length);
          if (sitePct < 65) continue;
          add(
            makeInsight({
              id: "EX-1",
              category: "execution",
              polarity: "concern",
              side,
              team_id: teamId,
              headline: `Over-committed to ${site} Site`,
              story: `${sitePct}% of T-side plants went to ${site} site. By the second half opponents are reading this tendency and likely stacking that site. Introduce alternate executes to keep the CT side honest.`,
              evidence_rounds: rounds,
              players: [],
              evidenceCount: rounds.length,
              totalRounds: plantRounds.length
            })
          );
        }
      }
    }

    /* ── EX-2/EX-3: Entry kill converts / fails ─────────────────────── */
    {
      const entryKillRounds = teamImpacts
        .filter((i) => Number(i.entry_kill) === 1)
        .map((i) => ({
          rn: i.round_number,
          player: String(i.player_steam_id)
        }));
      if (entryKillRounds.length >= 4) {
        // Group by player for per-player insights
        const byPlayer = new Map<string, number[]>();
        for (const e of entryKillRounds) {
          if (!byPlayer.has(e.player)) byPlayer.set(e.player, []);
          byPlayer.get(e.player)!.push(e.rn);
        }
        for (const [playerId, rounds] of byPlayer.entries()) {
          if (rounds.length < 4) continue;
          const wins = rounds.filter(
            (rn) =>
              parsedRounds.find((r) => r.round_number === rn)?.winner === side
          ).length;
          const winPct = pct(wins, rounds.length);
          if (winPct > 65) {
            add(
              makeInsight({
                id: "EX-2",
                category: "execution",
                polarity: "strength",
                side,
                team_id: teamId,
                headline: "Entry Kill Converts to Round Win",
                story: `When ${nick(playerId)} got the entry kill, the team won ${winPct}% of those rounds (${wins}/${rounds.length}). Prioritise creating entry opportunities for ${nick(playerId)} — they are highly convertible.`,
                evidence_rounds: rounds,
                players: [playerId],
                evidenceCount: wins,
                totalRounds: rounds.length
              })
            );
          } else if (winPct < 40) {
            add(
              makeInsight({
                id: "EX-3",
                category: "execution",
                polarity: "concern",
                side,
                team_id: teamId,
                headline: "Entry Kill Not Converting",
                story: `The team got the entry kill in ${rounds.length} rounds but only won ${winPct}% of them. After the entry the team may be spreading out or hesitating instead of pushing the advantage immediately.`,
                evidence_rounds: rounds,
                players: [playerId],
                evidenceCount: rounds.length - wins,
                totalRounds: rounds.length
              })
            );
          }
        }
      }
    }

    /* ── NA-1: Man-advantage rounds lost ─────────────────────────────── */
    {
      const advantageLostRounds: number[] = [];
      for (const r of sideRounds.filter((rr) => rr.winner === oppSide)) {
        const roundKills = killsByRound.get(r.round_number) ?? [];
        const hadAdvantage = roundKills.some((k) => {
          if (side === "CT") return k.cts_alive_after - k.ts_alive_after >= 2;
          return k.ts_alive_after - k.cts_alive_after >= 2;
        });
        if (hadAdvantage) advantageLostRounds.push(r.round_number);
      }
      if (advantageLostRounds.length >= 4) {
        add(
          makeInsight({
            id: "NA-1",
            category: "execution",
            polarity: "concern",
            side,
            team_id: teamId,
            headline: "Man-Advantage Rounds Lost",
            story: `The team held a 2+ player advantage during ${advantageLostRounds.length} rounds but still lost them. The advantage was not converted into map control or a round win. Review how the team plays from numerical leads.`,
            evidence_rounds: advantageLostRounds.slice(0, 8),
            players: [],
            evidenceCount: advantageLostRounds.length,
            totalRounds: totalSideRounds
          })
        );
      }
    }

    /* ── SI-1: CT/T ADR imbalance ────────────────────────────────────── */
    {
      for (const ps of teamPlayers) {
        const adrCt = n(ps.adr_ct);
        const adrT = n(ps.adr_t);
        if (Math.abs(adrCt - adrT) <= 20) continue;
        const worseOnCt = adrCt < adrT;
        if ((side === "CT" && !worseOnCt) || (side === "T" && worseOnCt))
          continue;
        const story = worseOnCt
          ? `${nick(String(ps.steam_id))}'s CT-side damage is significantly lower (ADR: ${adrCt} vs T-side: ${adrT}). ${nick(String(ps.steam_id))} may suit a more aggressive role that aligns with their strengths.`
          : `${nick(String(ps.steam_id))} struggles to impact T-side rounds (ADR: ${adrT} vs CT: ${adrCt}). Support ${nick(String(ps.steam_id))} with better utility setups on T-side executes to create more opportunities.`;
        add(
          makeInsight({
            id: "SI-1",
            category: "impact",
            polarity: "concern",
            side,
            team_id: teamId,
            headline: "CT/T ADR Imbalance",
            story,
            evidence_rounds: [],
            players: [String(ps.steam_id)],
            evidenceCount: Math.round(Math.abs(adrCt - adrT)),
            totalRounds: totalSideRounds
          })
        );
      }
    }

    /* ── WP-1: Highest win-prob impact player ────────────────────────── */
    {
      const impactByPlayer = new Map<string, number>();
      for (const i of teamImpacts) {
        const p = String(i.player_steam_id);
        impactByPlayer.set(
          p,
          (impactByPlayer.get(p) ?? 0) + Number(i.win_prob_impact)
        );
      }
      const [topPlayer, topImpact] = [...impactByPlayer.entries()].sort(
        (a, b) => b[1] - a[1]
      )[0] ?? [null, 0];
      if (topPlayer && topImpact > 0) {
        const roundCount = teamImpacts.filter(
          (i) => String(i.player_steam_id) === topPlayer
        ).length;
        add(
          makeInsight({
            id: "WP-1",
            category: "impact",
            polarity: "strength",
            side,
            team_id: teamId,
            headline: "Highest Win Probability Impact",
            story: `${nick(topPlayer)} had the highest round win probability impact on ${side} side (+${topImpact.toFixed(2)} across ${roundCount} rounds). Their actions in critical moments shifted the most rounds for the team.`,
            evidence_rounds: teamImpacts
              .filter((i) => String(i.player_steam_id) === topPlayer)
              .map((i) => i.round_number)
              .slice(0, 8),
            players: [topPlayer],
            evidenceCount: roundCount,
            totalRounds: totalSideRounds
          })
        );
      }
    }

    /* ── WP-2: Negative win-prob contribution ────────────────────────── */
    {
      const impactByPlayer = new Map<
        string,
        { total: number; count: number }
      >();
      for (const i of teamImpacts) {
        const p = String(i.player_steam_id);
        if (!impactByPlayer.has(p))
          impactByPlayer.set(p, { total: 0, count: 0 });
        const entry = impactByPlayer.get(p)!;
        entry.total += Number(i.win_prob_impact);
        entry.count++;
      }
      for (const [playerId, data] of impactByPlayer.entries()) {
        if (data.count < 5) continue;
        const avg = data.total / data.count;
        if (avg >= 0) continue;
        add(
          makeInsight({
            id: "WP-2",
            category: "impact",
            polarity: "concern",
            side,
            team_id: teamId,
            headline: "Negative Round Impact",
            story: `On ${side} side, ${nick(playerId)} averaged a net negative win probability contribution (${avg.toFixed(3)} per round). Rounds where ${nick(playerId)} was the primary active player tended to go against the team. Role or position adjustment may help.`,
            evidence_rounds: [],
            players: [playerId],
            evidenceCount: data.count,
            totalRounds: totalSideRounds
          })
        );
      }
    }

    /* ── RA-1: Low retake success rate (CT side) ─────────────────────── */
    if (side === "CT") {
      const plantRounds = sideRounds.filter((r) => r.plant_site !== null);
      if (plantRounds.length >= 5) {
        const retakeWins = plantRounds.filter((r) => r.winner === "CT").length;
        const retakePct = pct(retakeWins, plantRounds.length);
        if (retakePct < 35) {
          const failedRounds = plantRounds
            .filter((r) => r.winner === "T")
            .map((r) => r.round_number);
          add(
            makeInsight({
              id: "RA-1",
              category: "retakes",
              polarity: "concern",
              side,
              team_id: teamId,
              headline: "Low Retake Success Rate",
              story: `CT side won only ${retakePct}% of retakes (${retakeWins}/${plantRounds.length}). Combined with staggered entries, this points to disorganised retake execution — designate retake roles and approach angles per site.`,
              evidence_rounds: failedRounds.slice(0, 8),
              players: [],
              evidenceCount: plantRounds.length - retakeWins,
              totalRounds: plantRounds.length
            })
          );
        }
      }
    }

    /* ── RA-2: Dominant afterplant control (T side) ──────────────────── */
    if (side === "T") {
      const plantRounds = sideRounds.filter((r) => r.plant_site !== null);
      if (plantRounds.length >= 5) {
        const tWins = plantRounds.filter((r) => r.winner === "T").length;
        const tWinPct = pct(tWins, plantRounds.length);
        if (tWinPct > 65) {
          add(
            makeInsight({
              id: "RA-2",
              category: "retakes",
              polarity: "strength",
              side,
              team_id: teamId,
              headline: "Dominant Afterplant Control",
              story: `T side won ${tWinPct}% of afterplants (${tWins}/${plantRounds.length}) — strong post-plant discipline. Opponents are failing to retake once the bomb is down.`,
              evidence_rounds: plantRounds
                .filter((r) => r.winner === "T")
                .map((r) => r.round_number)
                .slice(0, 8),
              players: [],
              evidenceCount: tWins,
              totalRounds: plantRounds.length
            })
          );
        }
      }
    }

    /* ── RA-3: Specific player death → site plant (CT side) ──────────── */
    if (side === "CT") {
      for (const ps of teamPlayers) {
        const firstDeathRounds = sideKills.filter(
          (k) =>
            Number(k.is_first_kill) === 1 &&
            k.victim_team === "CT" &&
            String(k.victim) === String(ps.steam_id)
        );
        if (firstDeathRounds.length < 4) continue;
        // Group by site
        const bySite = new Map<string, number[]>();
        for (const k of firstDeathRounds) {
          const r = parsedRounds.find(
            (rr) => rr.round_number === k.round_number
          );
          const site = r?.plant_site;
          if (!site) continue;
          if (!bySite.has(site)) bySite.set(site, []);
          bySite.get(site)!.push(k.round_number);
        }
        for (const [site, siteRoundsArr] of bySite.entries()) {
          const sitePct = pct(siteRoundsArr.length, firstDeathRounds.length);
          if (sitePct < 60) continue;
          add(
            makeInsight({
              id: "RA-3",
              category: "retakes",
              polarity: "concern",
              side,
              team_id: teamId,
              headline: `${nick(String(ps.steam_id))} Death → ${site} Plant`,
              story: `When ${nick(String(ps.steam_id))} died early, opponents planted on ${site} in ${siteRoundsArr.length} of those rounds — ${nick(String(ps.steam_id))}'s position likely controls the ${site} approach. After losing ${nick(String(ps.steam_id))} early, the team should immediately rotate toward ${site}.`,
              evidence_rounds: siteRoundsArr,
              players: [String(ps.steam_id)],
              evidenceCount: siteRoundsArr.length,
              totalRounds: firstDeathRounds.length
            })
          );
        }
      }
    }

    /* ── RA-4: Player enters retake alone (CT side) ─────────────────── */
    if (side === "CT") {
      const lostRetakes = sideRounds.filter(
        (r) => r.plant_site !== null && r.winner === "T"
      );
      const soloByPlayer = new Map<string, number[]>();

      for (const r of lostRetakes) {
        const ctDeaths = (killsByRound.get(r.round_number) ?? [])
          .filter(
            (k) =>
              k.victim_team === "CT" &&
              teamPlayerIds.has(String(k.victim)) &&
              Number(k.bomb_planted) === 1
          )
          .sort((a, b) => a.time_in_round - b.time_in_round);

        if (ctDeaths.length < 2) continue;
        const gap = ctDeaths[1].time_in_round - ctDeaths[0].time_in_round;
        if (gap < 8) continue;
        const v = String(ctDeaths[0].victim);
        if (!soloByPlayer.has(v)) soloByPlayer.set(v, []);
        soloByPlayer.get(v)!.push(r.round_number);
      }

      for (const [playerId, rounds] of soloByPlayer.entries()) {
        if (rounds.length < 3) continue;
        add(
          makeInsight({
            id: "RA-4",
            category: "retakes",
            polarity: "concern",
            side,
            team_id: teamId,
            headline: "Player Enters Retake Alone",
            story: `${nick(playerId)} entered the site alone in ${rounds.length} retake rounds — dying 8+ seconds before the next teammate arrived. This creates an immediate numbers disadvantage. Coordinate retake timing so ${nick(playerId)} has a second player entering with them.`,
            evidence_rounds: rounds,
            players: [playerId],
            evidenceCount: rounds.length,
            totalRounds: lostRetakes.length
          })
        );
      }
    }

    /* ── RA-5: Player arrives too late to retake (CT side) ───────────── */
    if (side === "CT") {
      const lostRetakes = sideRounds.filter(
        (r) => r.plant_site !== null && r.winner === "T"
      );
      const lateByPlayer = new Map<string, { rn: number; gap: number }[]>();

      for (const r of lostRetakes) {
        const ctDeaths = (killsByRound.get(r.round_number) ?? [])
          .filter(
            (k) =>
              k.victim_team === "CT" &&
              teamPlayerIds.has(String(k.victim)) &&
              Number(k.bomb_planted) === 1
          )
          .sort((a, b) => a.time_in_round - b.time_in_round);

        if (ctDeaths.length < 2) continue;
        const last = ctDeaths[ctDeaths.length - 1];
        const prev = ctDeaths[ctDeaths.length - 2];
        const gap = last.time_in_round - prev.time_in_round;
        if (gap < 10) continue;
        const v = String(last.victim);
        if (!lateByPlayer.has(v)) lateByPlayer.set(v, []);
        lateByPlayer.get(v)!.push({ rn: r.round_number, gap: Math.round(gap) });
      }

      for (const [playerId, data] of lateByPlayer.entries()) {
        if (data.length < 3) continue;
        const avgGap = Math.round(
          data.reduce((s, d) => s + d.gap, 0) / data.length
        );
        add(
          makeInsight({
            id: "RA-5",
            category: "retakes",
            polarity: "concern",
            side,
            team_id: teamId,
            headline: "Player Arrives Too Late to Retake",
            story: `${nick(playerId)} arrived to the retake ${avgGap}s after teammates in ${data.length} rounds — by the time ${nick(playerId)} entered, the outcome was already decided. Adjust ${nick(playerId)}'s rotation speed or starting position to join in time.`,
            evidence_rounds: data.map((d) => d.rn),
            players: [playerId],
            evidenceCount: data.length,
            totalRounds: lostRetakes.length
          })
        );
      }
    }

    /* ── RA-6: Tight retake execution (CT strength) ───────────────────── */
    if (side === "CT") {
      const wonRetakes = sideRounds.filter(
        (r) => r.plant_site !== null && r.winner === "CT"
      );
      const tightRounds: number[] = [];

      for (const r of wonRetakes) {
        const ctKills = (killsByRound.get(r.round_number) ?? [])
          .filter(
            (k) =>
              k.killer_team === "CT" &&
              k.victim_team === "T" &&
              Number(k.bomb_planted) === 1 &&
              teamPlayerIds.has(String(k.killer))
          )
          .sort((a, b) => a.time_in_round - b.time_in_round);

        if (ctKills.length < 2) continue;
        const spread =
          ctKills[ctKills.length - 1].time_in_round - ctKills[0].time_in_round;
        if (spread <= 5) tightRounds.push(r.round_number);
      }

      if (tightRounds.length >= 3) {
        add(
          makeInsight({
            id: "RA-6",
            category: "retakes",
            polarity: "strength",
            side,
            team_id: teamId,
            headline: "Coordinated Retake Execution",
            story: `In ${tightRounds.length} won retakes, CT cleared the site with all kills within 5 seconds — the team entered as a unit and eliminated opponents before they could react. Strong grouped retake discipline.`,
            evidence_rounds: tightRounds,
            players: [],
            evidenceCount: tightRounds.length,
            totalRounds: wonRetakes.length
          })
        );
      }
    }

    /* ── RA-7: Tight afterplant coordination (T strength) ────────────── */
    if (side === "T") {
      const wonAfterplants = sideRounds.filter(
        (r) => r.plant_site !== null && r.winner === "T"
      );
      const tightRounds: number[] = [];

      for (const r of wonAfterplants) {
        const ctDeaths = (killsByRound.get(r.round_number) ?? [])
          .filter((k) => k.victim_team === "CT" && Number(k.bomb_planted) === 1)
          .sort((a, b) => a.time_in_round - b.time_in_round);

        if (ctDeaths.length < 2) continue;
        const spread =
          ctDeaths[ctDeaths.length - 1].time_in_round -
          ctDeaths[0].time_in_round;
        if (spread <= 6) tightRounds.push(r.round_number);
      }

      if (tightRounds.length >= 3) {
        add(
          makeInsight({
            id: "RA-7",
            category: "retakes",
            polarity: "strength",
            side,
            team_id: teamId,
            headline: "Tight Afterplant Coordination",
            story: `In ${tightRounds.length} won afterplants, the T side eliminated CT players within a 6-second window — coordinated crossfire positions made retakes extremely difficult. Strong post-plant discipline.`,
            evidence_rounds: tightRounds,
            players: [],
            evidenceCount: tightRounds.length,
            totalRounds: wonAfterplants.length
          })
        );
      }
    }

    /* ── CL-1/CL-2/CL-3: Clutch performance ─────────────────────────── */
    {
      const clutchByPlayer = new Map<
        string,
        {
          won: number;
          total: number;
          byCount: Map<number, { won: number; total: number }>;
        }
      >();
      for (const c of teamClutches) {
        const p = String(c.player_steam_id);
        if (!clutchByPlayer.has(p))
          clutchByPlayer.set(p, { won: 0, total: 0, byCount: new Map() });
        const entry = clutchByPlayer.get(p)!;
        entry.total++;
        if (Number(c.won) === 1) entry.won++;
        const cnt = c.clutch_start_enemies;
        if (!entry.byCount.has(cnt))
          entry.byCount.set(cnt, { won: 0, total: 0 });
        const cEntry = entry.byCount.get(cnt)!;
        cEntry.total++;
        if (Number(c.won) === 1) cEntry.won++;
      }
      for (const [playerId, data] of clutchByPlayer.entries()) {
        const clutchPct = pct(data.won, data.total);
        if (data.total >= 2 && clutchPct > 50) {
          add(
            makeInsight({
              id: "CL-1",
              category: "clutch",
              polarity: "strength",
              side,
              team_id: teamId,
              headline: "Clutch Converter",
              story: `${nick(playerId)} won ${data.won}/${data.total} clutch situations (${clutchPct}%) on ${side} side — dependable in late-round scenarios.`,
              evidence_rounds: teamClutches
                .filter(
                  (c) =>
                    String(c.player_steam_id) === playerId &&
                    Number(c.won) === 1
                )
                .map((c) => c.round_number),
              players: [playerId],
              evidenceCount: data.won,
              totalRounds: data.total
            })
          );
        }
        if (data.total >= 3 && clutchPct < 25) {
          add(
            makeInsight({
              id: "CL-2",
              category: "clutch",
              polarity: "concern",
              side,
              team_id: teamId,
              headline: "Clutch Struggles",
              story: `${nick(playerId)} lost ${data.total - data.won} clutch situations on ${side} side. Review how ${nick(playerId)} approaches 1vX scenarios — utility usage and information gathering in late rounds are areas to work on.`,
              evidence_rounds: teamClutches
                .filter((c) => String(c.player_steam_id) === playerId)
                .map((c) => c.round_number),
              players: [playerId],
              evidenceCount: data.total - data.won,
              totalRounds: data.total
            })
          );
        }
        // CL-3: Breakdown by opponent count
        const v1 = data.byCount.get(1);
        const v2 = data.byCount.get(2);
        if (v1 && v2 && v1.total >= 2 && v2.total >= 2) {
          const v1Pct = pct(v1.won, v1.total);
          const v2Pct = pct(v2.won, v2.total);
          if (v1Pct > v2Pct + 30) {
            add(
              makeInsight({
                id: "CL-3",
                category: "clutch",
                polarity: "concern",
                side,
                team_id: teamId,
                headline: "Clutch Breakdown by Opponent Count",
                story: `${nick(playerId)} won ${v1.won}/${v1.total} 1v1 situations but only ${v2.won}/${v2.total} 1v2 situations. Focus clutch training specifically on multi-opponent reads — information usage and positioning in 1v2+ scenarios.`,
                evidence_rounds: teamClutches
                  .filter((c) => String(c.player_steam_id) === playerId)
                  .map((c) => c.round_number),
                players: [playerId],
                evidenceCount: v2.total - v2.won,
                totalRounds: v2.total
              })
            );
          }
        }
      }
    }

    /* ── FB-1/FB-2: Force buy discipline ─────────────────────────────── */
    {
      const forceRounds = sideRounds.filter((r) =>
        side === "CT"
          ? r.ct_buy_strategy === "force"
          : r.t_buy_strategy === "force"
      );
      if (forceRounds.length >= 3) {
        const wins = forceRounds.filter((r) => r.winner === side).length;
        const forcePct = pct(wins, forceRounds.length);
        const roundNums = forceRounds.map((r) => r.round_number);
        if (forcePct < 33) {
          add(
            makeInsight({
              id: "FB-1",
              category: "economy",
              polarity: "concern",
              side,
              team_id: teamId,
              headline: "Force Buys Failing",
              story: `Force buys converted only ${wins}/${forceRounds.length} rounds (${forcePct}%). Each loss extended the economic disadvantage into the next round. When fully outgunned, consider full eco to reset — a saved rifle bank recovers faster than a failed force.`,
              evidence_rounds: roundNums,
              players: [],
              evidenceCount: forceRounds.length - wins,
              totalRounds: forceRounds.length
            })
          );
        } else if (forcePct > 60) {
          add(
            makeInsight({
              id: "FB-2",
              category: "economy",
              polarity: "strength",
              side,
              team_id: teamId,
              headline: "Force Buys Effective",
              story: `Force buys won ${wins}/${forceRounds.length} rounds (${forcePct}%) — an unusually high conversion rate. The team reads the right moments to force and disrupts opponent economy cycles.`,
              evidence_rounds: roundNums,
              players: [],
              evidenceCount: wins,
              totalRounds: forceRounds.length
            })
          );
        }
      }
    }

    /* ── RC-1/RC-2: Retake odds by CT count at plant (CT side) ────────── */
    if (side === "CT") {
      const plantRounds = sideRounds.filter(
        (r) => r.plant_site !== null && r.ct_t !== null
      );
      const disadvantagedRetakes: { rn: number; won: boolean }[] = [];
      const evenRetakes: { rn: number; won: boolean }[] = [];
      for (const r of plantRounds) {
        const ctAlive = r.ct_t!.CT.length;
        const tAlive = r.ct_t!.T.length;
        const won = r.winner === "CT";
        if (ctAlive < tAlive) {
          disadvantagedRetakes.push({ rn: r.round_number, won });
        } else {
          evenRetakes.push({ rn: r.round_number, won });
        }
      }
      // RC-1: Strong retake when outnumbered
      const outnumberedWins = disadvantagedRetakes.filter((r) => r.won);
      if (outnumberedWins.length >= 3) {
        add(
          makeInsight({
            id: "RC-1",
            category: "retakes",
            polarity: "strength",
            side,
            team_id: teamId,
            headline: "Strong Retakes When Outnumbered",
            story: `CT side successfully retook the site ${outnumberedWins.length} times while outnumbered at the plant — strong individual gunfight performance in high-pressure situations.`,
            evidence_rounds: outnumberedWins.map((r) => r.rn),
            players: [],
            evidenceCount: outnumberedWins.length,
            totalRounds: disadvantagedRetakes.length || 1
          })
        );
      }
      // RC-2: Retakes failing with equal/more numbers
      const evenLosses = evenRetakes.filter((r) => !r.won);
      if (evenLosses.length >= 3) {
        add(
          makeInsight({
            id: "RC-2",
            category: "retakes",
            polarity: "concern",
            side,
            team_id: teamId,
            headline: "Retakes Failing with Numbers",
            story: `CT side lost ${evenLosses.length} retakes where they had equal or more players than the T side at plant time. The team has the numbers but is not converting — retake coordination or utility usage is the issue, not a numbers deficit.`,
            evidence_rounds: evenLosses.map((r) => r.rn),
            players: [],
            evidenceCount: evenLosses.length,
            totalRounds: evenRetakes.length || 1
          })
        );
      }
    }

    /* ── EK-1: Effective lurk presence ──────────────────────────────── */
    {
      const exitKillsByPlayer = new Map<string, number[]>();
      for (const i of teamImpacts) {
        if (Number(i.exit_kill) !== 1) continue;
        const p = String(i.player_steam_id);
        if (!exitKillsByPlayer.has(p)) exitKillsByPlayer.set(p, []);
        exitKillsByPlayer.get(p)!.push(i.round_number);
      }
      for (const [playerId, rounds] of exitKillsByPlayer.entries()) {
        if (rounds.length < 3) continue;
        add(
          makeInsight({
            id: "EK-1",
            category: "impact",
            polarity: "strength",
            side,
            team_id: teamId,
            headline: "Effective Lurk / Exit Kill Presence",
            story: `${nick(playerId)} accumulated ${rounds.length} exit kills on ${side} side — consistent lurk play cleaning up late-round situations and denying opponents a safe exit.`,
            evidence_rounds: rounds,
            players: [playerId],
            evidenceCount: rounds.length,
            totalRounds: totalSideRounds
          })
        );
      }
    }

    /* ── EK-2: Late deaths without impact ───────────────────────────── */
    {
      const lateDeaths: {
        id: string;
        avgTime: number;
        rounds: number[];
      }[] = [];
      for (const ps of teamPlayers) {
        const playerDeaths = teamDeaths.filter(
          (k) => String(k.victim) === String(ps.steam_id)
        );
        if (playerDeaths.length < 3) continue;
        const avgDeathTime =
          playerDeaths.reduce((sum, k) => sum + k.time_in_round, 0) /
          playerDeaths.length;
        if (avgDeathTime <= 80) continue;
        const exitKills = teamImpacts.filter(
          (i) =>
            String(i.player_steam_id) === String(ps.steam_id) &&
            Number(i.exit_kill) === 1
        ).length;
        const totalKills = n(side === "CT" ? ps.kills_ct : ps.kills_t);
        if (exitKills > 0 || totalKills >= 3) continue;
        lateDeaths.push({
          id: String(ps.steam_id),
          avgTime: Math.round(avgDeathTime),
          rounds: playerDeaths.map((k) => k.round_number)
        });
      }
      if (lateDeaths.length === 1) {
        const { id, avgTime, rounds } = lateDeaths[0];
        add(
          makeInsight({
            id: "EK-2",
            category: "impact",
            polarity: "concern",
            side,
            team_id: teamId,
            headline: "Late Deaths Without Impact",
            story: `${nick(id)} consistently died late in rounds on ${side} side (avg ${avgTime}s) without generating exit kills or significant damage. The lurk role is not creating value — reconsider the timing or purpose of ${nick(id)}'s late positioning.`,
            evidence_rounds: rounds,
            players: [id],
            evidenceCount: rounds.length,
            totalRounds: totalSideRounds
          })
        );
      } else if (lateDeaths.length > 1) {
        const uniqueRounds = Array.from(
          new Set(lateDeaths.flatMap((p) => p.rounds))
        ).sort((a, b) => a - b);
        if (uniqueRounds.length >= 4) {
          const summary = lateDeaths
            .map((p) => `${nick(p.id)} (avg ${p.avgTime}s)`)
            .join(", ");
          add(
            makeInsight({
              id: "EK-2",
              category: "impact",
              polarity: "concern",
              side,
              team_id: teamId,
              headline: "Multiple Players Lurking Without Impact",
              story: `Several players are consistently dying late in rounds on ${side} side without generating exit kills: ${summary}. The team's lurk/anchor protocol is not producing value — define clearer roles and timing for late-round positioning.`,
              evidence_rounds: uniqueRounds,
              players: lateDeaths.map((p) => p.id),
              evidenceCount: uniqueRounds.length,
              totalRounds: totalSideRounds
            })
          );
        }
      }
    }

    // Deduplicate and sort evidence_rounds for every insight
    for (const r of results) {
      r.evidence_rounds = Array.from(new Set(r.evidence_rounds)).sort(
        (a, b) => a - b
      );
    }

    return results;
  }

  // ── Assemble final result ──────────────────────────────────────────────
  const teamIdSet = new Set<number>();
  for (const r of parsedRounds) {
    teamIdSet.add(r.ct_team_id);
    teamIdSet.add(r.t_team_id);
  }

  const teams = Array.from(teamIdSet).map((teamId) => {
    const info = teamRows.find((t) => Number(t.team_id) === teamId);
    return {
      team_id: teamId,
      team_name: info?.team_name ?? "Unknown",
      team_logo: info?.team_logo ?? null,
      ct: runTemplatesForTeamSide(teamId, "CT"),
      t: runTemplatesForTeamSide(teamId, "T")
    };
  });

  return { teams };
};

// ── Round Swing Events ────────────────────────────────────────────────────────

interface SwingContributorParsed {
  steam_id: string;
  contribution: number;
}

export interface RoundSwingRow {
  round_number: number;
  time_in_round: number;
  event_type: string;
  pre_win_prob: number;
  post_win_prob: number;
  delta: number;
  primary_player_steam_id: string;
  contributors: SwingContributorParsed[];
}

interface GetRoundSwingEventsOptions {
  roundNumber?: number;
  limit?: number;
}

export const getRoundSwingEvents = async (
  matchGameId: number,
  { roundNumber, limit = 5 }: GetRoundSwingEventsOptions = {}
): Promise<RoundSwingRow[]> => {
  const conditions: string[] = ["match_game_id = ?"];
  const params: (number | string)[] = [matchGameId];

  if (roundNumber !== undefined) {
    conditions.push("round_number = ?");
    params.push(roundNumber);
  }

  const where = conditions.join(" AND ");
  // Order by |delta| DESC so the most impactful swings come first
  const query = `
    SELECT
      round_number,
      time_in_round,
      event_type,
      pre_win_prob,
      post_win_prob,
      delta,
      primary_player_steam_id,
      contributors
    FROM RoundSwingEvents
    WHERE ${where}
    ORDER BY ABS(delta) DESC
    LIMIT ?
  `;
  params.push(limit);

  const rows = await runQuery<
    Array<Omit<RoundSwingRow, "contributors"> & { contributors: string }>
  >(query, params);

  return rows.map((r) => ({
    ...r,
    contributors: r.contributors
      ? (jsonBig.parse(r.contributors) as SwingContributorParsed[])
      : []
  }));
};

/* ─────────────────────────────────────────────────────────
 *  Entry Kills
 * ─────────────────────────────────────────────────────────*/

export interface EntryKill {
  round_number: number;
  time_in_round: number;
  killer_steam_id: string;
  victim_steam_id: string;
  killer_team: string;
  victim_team: string;
  setup_flash_thrower: string | null;
  victim_blind_seconds: number | null;
  was_victim_traded: boolean | null;
}

export const getEntryKills = async (
  match_game_id: number
): Promise<EntryKill[]> => {
  const rows = await runQuery<
    {
      round_number: number;
      time_in_round: number;
      killer: string | number;
      victim: string | number;
      killer_team: string;
      victim_team: string;
      setup_flash_thrower: string | number | null;
      victim_blind_seconds: number | null;
      was_victim_traded: number | null;
    }[]
  >(
    `SELECT
      round_number,
      time_in_round,
      killer,
      victim,
      killer_team,
      victim_team,
      setup_flash_thrower,
      victim_blind_seconds,
      was_victim_traded
    FROM PlayerKillLogs
    WHERE match_game_id = ?
      AND is_first_death = 1
    ORDER BY round_number ASC, time_in_round ASC`,
    [match_game_id]
  );

  return rows.map((r) => ({
    round_number: r.round_number,
    time_in_round: r.time_in_round,
    killer_steam_id: String(r.killer),
    victim_steam_id: String(r.victim),
    killer_team: r.killer_team,
    victim_team: r.victim_team,
    setup_flash_thrower: r.setup_flash_thrower
      ? String(r.setup_flash_thrower)
      : null,
    victim_blind_seconds: r.victim_blind_seconds,
    was_victim_traded:
      r.was_victim_traded !== null ? r.was_victim_traded === 1 : null
  }));
};

/* ─────────────────────────────────────────────────────────
 *  Query: Cross-game player round impact
 * ─────────────────────────────────────────────────────────*/

export interface CrossGamePlayerRoundImpact {
  steam_id: string;
  games_played: number;
  total_events: number;
  total_impact_score: number;
  avg_impact_per_event: number;
  biggest_single_swing: number;
}

export const getPlayerRoundImpact = async (
  steam_id: string,
  options: { seasonId?: number } = {}
): Promise<CrossGamePlayerRoundImpact> => {
  const params: (string | number)[] = [steam_id];
  const seasonFilter = options.seasonId ? "AND m.season_id = ?" : "";
  if (options.seasonId) params.push(options.seasonId);

  const rows = await runQuery<
    {
      games_played: number;
      total_events: number;
      total_impact_score: number;
      avg_impact_per_event: number;
      biggest_single_swing: number;
    }[]
  >(
    `SELECT
      COUNT(DISTINCT rse.match_game_id) AS games_played,
      COUNT(*)                          AS total_events,
      SUM(ABS(rse.delta))               AS total_impact_score,
      AVG(ABS(rse.delta))               AS avg_impact_per_event,
      MAX(ABS(rse.delta))               AS biggest_single_swing
    FROM RoundSwingEvents rse
    JOIN MatchGames mg ON mg.id = rse.match_game_id
    JOIN Matches m     ON m.id  = mg.match_id
    WHERE rse.primary_player_steam_id = ? ${seasonFilter}`,
    params
  );

  const r = rows[0] ?? {
    games_played: 0,
    total_events: 0,
    total_impact_score: 0,
    avg_impact_per_event: 0,
    biggest_single_swing: 0
  };

  return {
    steam_id,
    games_played: Number(r.games_played),
    total_events: Number(r.total_events),
    total_impact_score: Number(Number(r.total_impact_score ?? 0).toFixed(4)),
    avg_impact_per_event: Number(
      Number(r.avg_impact_per_event ?? 0).toFixed(4)
    ),
    biggest_single_swing: Number(Number(r.biggest_single_swing ?? 0).toFixed(4))
  };
};
