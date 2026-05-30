"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { NextImageFallback } from "@/components/layout/NextImageFallback";
import { createTeamLogoUrl } from "@/lib/utils";
import { useFlashMatrix, type FlashPair } from "@/hooks/data/useFlashMatrix";
import {
  useMatchGameKillMatrix,
  type KillMatrixFilters
} from "@/hooks/data/useMatchGameKillMatrix";
import { useEntryKills, type EntryKill } from "@/hooks/data/useEntryKills";
import type {
  MatchInfo,
  MatchPlayerStats
} from "@eggosystem/types";
import { orderMatchParticipantsBySideHomeLeft } from "@/lib/order-match-teams-home-left-away";

/* ─────────────────────────────────────────── */
/*  Types                                      */
/* ─────────────────────────────────────────── */

interface KillMatrixTabProps {
  matchGameId: number;
  playerStats: MatchPlayerStats[];
  teams: MatchInfo["teams"];
}

type PlayerInfo = {
  steamId: string;
  name: string;
  teamId: number;
};

/* ─────────────────────────────────────────── */
/*  Flash duration heat cell                   */
/* ─────────────────────────────────────────── */

const FlashCell = ({
  pair,
  maxDuration,
  isEnemy,
  showMode
}: {
  pair: FlashPair | undefined;
  maxDuration: number;
  isEnemy: boolean;
  showMode: "enemy" | "all";
}) => {
  if (!pair || pair.flash_count === 0) {
    return (
      <td
        className="text-center align-middle border border-border/20 rounded"
        style={{ width: 44, height: 38, background: "transparent" }}
      />
    );
  }

  const dimmed = showMode === "enemy" && !isEnemy;
  const intensity =
    maxDuration > 0 ? pair.total_duration_seconds / maxDuration : 0;
  const bg = dimmed
    ? `rgba(251,191,36,${0.05 + intensity * 0.15})`
    : isEnemy
      ? `rgba(56,189,248,${0.1 + intensity * 0.72})`
      : `rgba(251,191,36,${0.08 + intensity * 0.5})`;

  const textColor = dimmed
    ? "rgba(253,230,138,0.3)"
    : isEnemy
      ? "#bae6fd"
      : "#fde68a";

  return (
    <td
      className="text-center align-middle border border-border/20 rounded cursor-default select-none"
      style={{ width: 44, height: 38, background: bg }}
      title={`${pair.flash_count} flash${pair.flash_count !== 1 ? "es" : ""} · ${pair.total_duration_seconds.toFixed(1)}s total · avg ${pair.avg_duration_seconds.toFixed(2)}s`}
    >
      <div className="flex flex-col items-center leading-none gap-0.5">
        <span className="text-[11px] font-bold" style={{ color: textColor }}>
          {pair.flash_count}
        </span>
        <span className="text-[9px] opacity-80" style={{ color: textColor }}>
          {pair.total_duration_seconds.toFixed(1)}s
        </span>
      </div>
    </td>
  );
};

/* ─────────────────────────────────────────── */
/*  Unified flash grid (team1 first)           */
/* ─────────────────────────────────────────── */

interface FlashGroup {
  teamId: number;
  color: string;
  name: string;
  players: PlayerInfo[];
}

const FlashGrid = ({
  teamGroups,
  pairMap,
  maxDuration,
  showMode
}: {
  teamGroups: FlashGroup[];
  pairMap: Map<string, FlashPair>;
  maxDuration: number;
  showMode: "enemy" | "all";
}) => {
  const allPlayers = teamGroups.flatMap((g) => g.players);
  const teamIdOf = useMemo(() => {
    const m = new Map<string, number>();
    for (const g of teamGroups)
      for (const p of g.players) m.set(p.steamId, g.teamId);
    return m;
  }, [teamGroups]);

  return (
    <div className="overflow-x-auto">
      <table style={{ borderCollapse: "separate", borderSpacing: 3 }}>
        <thead>
          {/* Team group labels for columns */}
          <tr>
            <th style={{ minWidth: 80 }} />
            {teamGroups.map((g) => (
              <React.Fragment key={g.teamId}>
                <th
                  colSpan={g.players.length}
                  className="text-center text-[10px] font-bold tracking-wide"
                  style={{ color: g.color, paddingBottom: 2 }}
                >
                  {g.name}
                </th>
                <th style={{ width: 6 }} />
              </React.Fragment>
            ))}
          </tr>
          {/* Player column headers (rotated) */}
          <tr>
            <th
              className="text-left text-[10px] text-muted-foreground font-normal align-bottom pr-2"
              style={{ minWidth: 80, paddingBottom: 6 }}
            >
              <span className="opacity-60">Flasher ↓ / Victim →</span>
            </th>
            {teamGroups.map((g) => (
              <React.Fragment key={g.teamId}>
                {g.players.map((p) => (
                  <th
                    key={p.steamId}
                    className="text-center"
                    style={{ minWidth: 44 }}
                  >
                    <div
                      style={{
                        height: 84,
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        paddingBottom: 4
                      }}
                    >
                      <span
                        className="text-[11px] font-semibold whitespace-nowrap block"
                        style={{
                          writingMode: "vertical-rl",
                          transform: "rotate(180deg)",
                          color: g.color
                        }}
                        title={p.name}
                      >
                        {p.name}
                      </span>
                    </div>
                  </th>
                ))}
                <th style={{ width: 6 }} />
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {teamGroups.map((throwerGroup, tgi) => (
            <React.Fragment key={throwerGroup.teamId}>
              {throwerGroup.players.map((thrower) => (
                <tr key={thrower.steamId}>
                  <td
                    className="pr-3 text-[11px] font-semibold whitespace-nowrap align-middle"
                    style={{ color: throwerGroup.color }}
                  >
                    {thrower.name}
                  </td>
                  {teamGroups.map((victimGroup) => (
                    <React.Fragment key={victimGroup.teamId}>
                      {victimGroup.players.map((victim) => {
                        const isEnemy =
                          teamIdOf.get(thrower.steamId) !==
                          teamIdOf.get(victim.steamId);
                        const pair = pairMap.get(
                          `${thrower.steamId}:${victim.steamId}`
                        );
                        return (
                          <FlashCell
                            key={victim.steamId}
                            pair={pair}
                            maxDuration={maxDuration}
                            isEnemy={isEnemy}
                            showMode={showMode}
                          />
                        );
                      })}
                      <td style={{ width: 6 }} />
                    </React.Fragment>
                  ))}
                </tr>
              ))}
              {/* Spacer row between teams */}
              {tgi < teamGroups.length - 1 && (
                <tr>
                  <td
                    colSpan={allPlayers.length + teamGroups.length + 1}
                    style={{ height: 6 }}
                  />
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const HeatCell = ({
  value,
  maxValue,
  accent
}: {
  value: number;
  maxValue: number;
  accent: "sky" | "amber" | "violet";
}) => {
  // alpha: 0 kills = transparent, scales up to 0.7
  const alpha = value > 0 ? 0.1 + (value / Math.max(maxValue, 1)) * 0.65 : 0;

  const bg =
    value === 0
      ? undefined
      : accent === "sky"
        ? `rgba(125,211,252,${alpha.toFixed(2)})`
        : accent === "amber"
          ? `rgba(252,211,77,${alpha.toFixed(2)})`
          : `rgba(167,139,250,${alpha.toFixed(2)})`;

  const textClass =
    value === 0
      ? "text-muted-foreground/25"
      : value >= 4
        ? "text-white font-bold"
        : "text-foreground font-semibold";

  return (
    <td
      className="text-center align-middle text-sm transition-colors select-none border border-border/30 rounded"
      style={{
        width: 36,
        height: 32,
        background: bg,
        fontSize: value >= 4 ? 14 : 12
      }}
    >
      {value === 0 ? (
        <span className="text-muted-foreground/20 text-xs">—</span>
      ) : (
        <span className={textClass}>{value}</span>
      )}
    </td>
  );
};

const TotalCell = ({ value, isRow }: { value: number; isRow?: boolean }) => (
  <td
    className={cn(
      "text-center align-middle text-xs font-bold text-muted-foreground",
      isRow ? "border-l border-border/60" : "border-t border-border/60"
    )}
    style={{ width: 32, height: 32 }}
  >
    {value > 0 ? value : ""}
  </td>
);

/* ─────────────────────────────────────────── */
/*  Matrix table                               */
/* ─────────────────────────────────────────── */

const MatrixTable = ({
  rowPlayers,
  colPlayers,
  rowTeamColor,
  colTeamColor,
  cellAccent,
  getCellValue,
  getRowTotal,
  getColTotal,
  killerLabel,
  victimLabel
}: {
  rowPlayers: PlayerInfo[];
  colPlayers: PlayerInfo[];
  rowTeamColor: string;
  colTeamColor: string;
  cellAccent: "sky" | "amber" | "violet";
  getCellValue: (rowId: string, colId: string) => number;
  getRowTotal: (rowId: string) => number;
  getColTotal: (colId: string) => number;
  killerLabel: string;
  victimLabel: string;
}) => {
  const allValues = rowPlayers.flatMap((r) =>
    colPlayers.map((c) => getCellValue(r.steamId, c.steamId))
  );
  const maxValue = Math.max(...allValues, 1);

  return (
    <div className="overflow-x-auto">
      <table style={{ borderCollapse: "separate", borderSpacing: 3 }}>
        <thead>
          <tr>
            {/* Corner label */}
            <th
              className="text-left text-[10px] text-muted-foreground font-normal pb-1 align-bottom pr-2"
              style={{ minWidth: 72 }}
            >
              <span className={rowTeamColor}>{killerLabel}</span>
              <span className="text-muted-foreground/40"> / </span>
              <span className={colTeamColor}>{victimLabel}</span>
            </th>
            {colPlayers.map((p) => (
              <th
                key={p.steamId}
                className="text-center align-bottom pb-1"
                style={{ minWidth: 36 }}
              >
                <div
                  className="text-[11px] font-semibold whitespace-nowrap"
                  style={{
                    writingMode: "vertical-rl",
                    transform: "rotate(180deg)",
                    maxHeight: 80,
                    color: "inherit"
                  }}
                >
                  <span className={colTeamColor}>{p.name}</span>
                </div>
              </th>
            ))}
            <th
              className="text-center align-bottom pb-1 border-l border-border/60 text-[10px] text-muted-foreground font-normal"
              style={{ minWidth: 32 }}
            >
              ∑
            </th>
          </tr>
        </thead>
        <tbody>
          {rowPlayers.map((row) => (
            <tr key={row.steamId}>
              <td
                className={cn(
                  "pr-3 text-sm font-semibold whitespace-nowrap align-middle",
                  rowTeamColor
                )}
              >
                {row.name}
              </td>
              {colPlayers.map((col) => (
                <HeatCell
                  key={col.steamId}
                  value={getCellValue(row.steamId, col.steamId)}
                  maxValue={maxValue}
                  accent={cellAccent}
                />
              ))}
              <TotalCell value={getRowTotal(row.steamId)} isRow />
            </tr>
          ))}
          {/* Column totals row */}
          <tr>
            <td className="text-[10px] text-muted-foreground font-semibold pt-1 border-t border-border/60">
              ∑
            </td>
            {colPlayers.map((col) => (
              <TotalCell key={col.steamId} value={getColTotal(col.steamId)} />
            ))}
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
};

/* ─────────────────────────────────────────── */
/*  Top matchups leaderboard                   */
/* ─────────────────────────────────────────── */

const TopMatchups = ({
  entries,
  nameMap,
  teamAIds,
  label
}: {
  entries: { aId: string; bId: string; count: number }[];
  nameMap: Map<string, string>;
  teamAIds: Set<string>;
  label: string;
}) => {
  const top = [...entries]
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  if (top.length === 0) return null;
  const maxCount = top[0]!.count;

  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm font-semibold mb-3">{label}</p>
      <div className="space-y-2">
        {top.map((e, i) => {
          const aIsTeamA = teamAIds.has(e.aId);
          const aColor = aIsTeamA ? "text-sky-300/80" : "text-amber-300/80";
          const bColor = aIsTeamA ? "text-amber-300/80" : "text-sky-300/80";
          const barBg = aIsTeamA ? "bg-sky-300/40" : "bg-amber-300/40";
          return (
            <div
              key={i}
              className="flex items-center gap-2 py-1.5 border-b border-border/40 last:border-0"
            >
              <span className="w-5 text-[11px] text-muted-foreground font-bold">
                #{i + 1}
              </span>
              <span
                className={cn("font-semibold text-sm w-24 truncate", aColor)}
              >
                {nameMap.get(e.aId) ?? e.aId}
              </span>
              <span className="text-[11px] text-muted-foreground">→</span>
              <span
                className={cn("font-semibold text-sm w-24 truncate", bColor)}
              >
                {nameMap.get(e.bId) ?? e.bId}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full", barBg)}
                  style={{ width: `${(e.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-sm font-bold w-6 text-right">
                {e.count}×
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────── */
/*  Entry kills section                        */
/* ─────────────────────────────────────────── */

const EntryKillsSection = ({
  entryKills,
  nameMap
}: {
  entryKills: EntryKill[];
  nameMap: Map<string, string>;
}) => {
  if (entryKills.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        No entry kill data for this game.
      </div>
    );
  }

  const withFlash = entryKills.filter((e) => e.setup_flash_thrower !== null).length;
  const traded = entryKills.filter((e) => e.was_victim_traded === true).length;
  const tEntries = entryKills.filter((e) => e.killer_team === "T").length;
  const ctEntries = entryKills.filter((e) => e.killer_team === "CT").length;

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "T-side entries", value: tEntries, color: "text-amber-300/80" },
          { label: "CT-side entries", value: ctEntries, color: "text-sky-300/80" },
          { label: "Flash-assisted", value: withFlash, color: "text-violet-400/80" },
          { label: "Entry traded", value: traded, color: "text-emerald-400/80" }
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg border bg-card p-3 space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={cn("text-2xl font-bold", color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card overflow-hidden">
        <p className="text-[10px] text-muted-foreground/60 px-4 pt-3 pb-1 uppercase tracking-wide font-semibold">
          First death per round
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/40 text-muted-foreground/60 uppercase tracking-wide text-[10px]">
                <th className="text-left py-2 px-4 font-semibold w-14">Round</th>
                <th className="text-left py-2 px-2 font-semibold w-12">Time</th>
                <th className="text-left py-2 px-2 font-semibold">Killer</th>
                <th className="text-left py-2 px-2 font-semibold">Victim</th>
                <th className="text-center py-2 px-2 font-semibold w-14">Side</th>
                <th className="text-left py-2 px-2 font-semibold">Flash assist</th>
                <th className="text-center py-2 px-2 font-semibold w-16">Traded</th>
              </tr>
            </thead>
            <tbody>
              {entryKills.map((e) => {
                const killerName = nameMap.get(e.killer_steam_id) ?? e.killer_steam_id;
                const victimName = nameMap.get(e.victim_steam_id) ?? e.victim_steam_id;
                const flashThrowerName = e.setup_flash_thrower
                  ? (nameMap.get(e.setup_flash_thrower) ?? e.setup_flash_thrower)
                  : null;
                const sideColor =
                  e.killer_team === "T" ? "text-amber-300/80" : "text-sky-300/80";
                const sideBg =
                  e.killer_team === "T"
                    ? "bg-amber-300/10 text-amber-300/80"
                    : "bg-sky-300/10 text-sky-300/80";
                return (
                  <tr
                    key={e.round_number}
                    className="border-b border-border/20 hover:bg-muted/20"
                  >
                    <td className="py-2 px-4 font-mono font-bold text-muted-foreground/60">
                      R{e.round_number}
                    </td>
                    <td className="py-2 px-2 tabular-nums text-muted-foreground/50">
                      {Math.round(e.time_in_round)}s
                    </td>
                    <td className={cn("py-2 px-2 font-semibold", sideColor)}>
                      {killerName}
                    </td>
                    <td className="py-2 px-2 text-foreground/70">{victimName}</td>
                    <td className="py-2 px-2 text-center">
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded",
                          sideBg
                        )}
                      >
                        {e.killer_team}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      {flashThrowerName ? (
                        <span
                          title={`${flashThrowerName} flashed the victim${e.victim_blind_seconds != null && e.victim_blind_seconds > 0 ? ` for ${e.victim_blind_seconds.toFixed(1)}s` : ""}`}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-violet-400/10 text-violet-400 font-medium border border-violet-400/20"
                        >
                          ⚡ {flashThrowerName}
                          {e.victim_blind_seconds != null && e.victim_blind_seconds > 0 && (
                            <span className="text-violet-400/60">
                              {e.victim_blind_seconds.toFixed(1)}s
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/25">—</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center">
                      {e.was_victim_traded === true ? (
                        <span
                          title="Entry was traded back"
                          className="text-emerald-400 font-bold text-sm"
                        >
                          ↺
                        </span>
                      ) : (
                        <span className="text-muted-foreground/25">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-muted-foreground/40 px-4 py-2">
          ⚡ flash = setup flash assisted the kill · ↺ = entry was traded within ~5s
        </p>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────── */
/*  Main tab                                   */
/* ─────────────────────────────────────────── */

export const KillMatrixTab = ({
  matchGameId,
  playerStats,
  teams
}: KillMatrixTabProps) => {
  const [tab, setTab] = useState<"kills" | "flashes" | "entry">("kills");
  const [filters, setFilters] = useState<KillMatrixFilters>({
    excludeExitKills: false,
    postPlantOnly: false,
    excludeEcoKills: false
  });

  const toggleFilter = (key: keyof KillMatrixFilters) =>
    setFilters((prev) => ({ ...prev, [key]: !prev[key] }));

  const { killMatrix: matrix, isLoading: isLoadingMatrix } =
    useMatchGameKillMatrix(matchGameId, filters);
  const { flashMatrix, playerStats: flashPlayerStats } =
    useFlashMatrix(matchGameId);
  const { entryKills } = useEntryKills(matchGameId);

  const teamList = useMemo(
    () => orderMatchParticipantsBySideHomeLeft(Object.values(teams)),
    [teams]
  );
  const teamA = teamList[0]!;
  const teamB = teamList[1]!;

  const nameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const ps of playerStats) m.set(String(ps.steam_id), ps.nickname);
    return m;
  }, [playerStats]);

  const teamAPlayers = useMemo(
    (): PlayerInfo[] =>
      playerStats
        .filter((ps) => ps.team_id === teamA.id)
        .map((ps) => ({
          steamId: String(ps.steam_id),
          name: ps.nickname,
          teamId: ps.team_id
        })),
    [playerStats, teamA]
  );
  const teamBPlayers = useMemo(
    (): PlayerInfo[] =>
      playerStats
        .filter((ps) => ps.team_id === teamB.id)
        .map((ps) => ({
          steamId: String(ps.steam_id),
          name: ps.nickname,
          teamId: ps.team_id
        })),
    [playerStats, teamB]
  );

  const teamAIds = useMemo(
    () => new Set(teamAPlayers.map((p) => p.steamId)),
    [teamAPlayers]
  );

  // Kill lookup maps
  const killMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const k of matrix?.kills ?? []) {
      m.set(`${k.killer_steam_id}|${k.victim_steam_id}`, k.count);
    }
    return m;
  }, [matrix?.kills]);

  const flashMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of matrix?.flash_assists ?? []) {
      m.set(`${f.assister_steam_id}|${f.victim_steam_id}`, f.count);
    }
    return m;
  }, [matrix?.flash_assists]);

  const getKill = (killer: string, victim: string) =>
    killMap.get(`${killer}|${victim}`) ?? 0;
  const getFlash = (assister: string, victim: string) =>
    flashMap.get(`${assister}|${victim}`) ?? 0;

  const killRowTotal = (killerId: string, victims: PlayerInfo[]) =>
    victims.reduce((s, v) => s + getKill(killerId, v.steamId), 0);
  const killColTotal = (victimId: string, killers: PlayerInfo[]) =>
    killers.reduce((s, k) => s + getKill(k.steamId, victimId), 0);
  const flashRowTotal = (assisterId: string, victims: PlayerInfo[]) =>
    victims.reduce((s, v) => s + getFlash(assisterId, v.steamId), 0);
  const _flashColTotal = (victimId: string, assisters: PlayerInfo[]) =>
    assisters.reduce((s, a) => s + getFlash(a.steamId, victimId), 0);

  // Summary totals
  const teamAKillTotal = teamAPlayers.reduce(
    (s, p) => s + killRowTotal(p.steamId, teamBPlayers),
    0
  );
  const teamBKillTotal = teamBPlayers.reduce(
    (s, p) => s + killRowTotal(p.steamId, teamAPlayers),
    0
  );
  const teamAFlashTotal = teamAPlayers.reduce(
    (s, p) => s + flashRowTotal(p.steamId, teamBPlayers),
    0
  );
  const teamBFlashTotal = teamBPlayers.reduce(
    (s, p) => s + flashRowTotal(p.steamId, teamAPlayers),
    0
  );

  // Top matchup data
  const topKills = useMemo(
    () =>
      (matrix?.kills ?? []).map((k) => ({
        aId: k.killer_steam_id,
        bId: k.victim_steam_id,
        count: k.count
      })),
    [matrix?.kills]
  );
  const _topFlashes = useMemo(
    () =>
      (matrix?.flash_assists ?? []).map((f) => ({
        aId: f.assister_steam_id,
        bId: f.victim_steam_id,
        count: f.count
      })),
    [matrix?.flash_assists]
  );

  // Rich flash matrix data (from /flash-matrix endpoint, all pairs including self/friendly)
  const flashPairMap = useMemo(() => {
    const m = new Map<string, FlashPair>();
    for (const pair of flashMatrix) {
      m.set(`${pair.thrower_steam_id}:${pair.victim_steam_id}`, pair);
    }
    return m;
  }, [flashMatrix]);

  const maxFlashDuration = useMemo(
    () => Math.max(...flashMatrix.map((p) => p.total_duration_seconds), 0.1),
    [flashMatrix]
  );

  // Team groups for unified flash grid: team A first, team B second
  const flashTeamGroups = useMemo(
    (): FlashGroup[] => [
      {
        teamId: teamA.id,
        name: teamA.name,
        color: "#7dd3fc",
        players: teamAPlayers
      },
      {
        teamId: teamB.id,
        name: teamB.name,
        color: "#fcd34d",
        players: teamBPlayers
      }
    ],
    [teamA, teamB, teamAPlayers, teamBPlayers]
  );

  // Per-player flash stat map
  const flashStatMap = useMemo(() => {
    const m = new Map<string, (typeof flashPlayerStats)[number]>();
    for (const s of flashPlayerStats) m.set(String(s.steam_id), s);
    return m;
  }, [flashPlayerStats]);

  return (
    <div className="space-y-5">
      {/* ── Summary ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: `${teamA.name} kills on ${teamB.name}`,
            value: teamAKillTotal,
            color: "text-sky-300/80"
          },
          {
            label: `${teamB.name} kills on ${teamA.name}`,
            value: teamBKillTotal,
            color: "text-amber-300/80"
          },
          {
            label: `${teamA.name} flash assists`,
            value: teamAFlashTotal,
            color: "text-sky-300/80"
          },
          {
            label: `${teamB.name} flash assists`,
            value: teamBFlashTotal,
            color: "text-amber-300/80"
          }
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg border bg-card p-3 space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={cn("text-2xl font-bold", color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Tab selector + chip filters ── */}
      <div className="space-y-2">
        <div className="flex gap-2">
          {(
            [
              { key: "kills", label: "Kill matrix" },
              { key: "flashes", label: "Flash matrix" },
              { key: "entry", label: "Entry kills" }
            ] as const
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                tab === key
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Chip filter bar — only on kill matrix tab */}
        {tab === "kills" && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-muted-foreground/60">Filter:</span>
            {(
              [
                { key: "excludeExitKills", label: "Exclude exit kills" },
                { key: "postPlantOnly", label: "Post-plant only" },
                { key: "excludeEcoKills", label: "Eco kills only" }
              ] as const
            ).map(({ key, label }) => {
              const active = !!filters[key];
              return (
                <button
                  key={key}
                  onClick={() => toggleFilter(key)}
                  className={cn(
                    "px-3 py-1 text-[11px] rounded-full border transition-colors",
                    active
                      ? "border-accent bg-accent/15 text-accent font-semibold"
                      : "border-border text-muted-foreground hover:border-foreground/30"
                  )}
                >
                  {active && "✓ "}
                  {label}
                </button>
              );
            })}
            {isLoadingMatrix && (
              <span className="text-[11px] text-muted-foreground/40 animate-pulse">
                loading…
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Kill matrix ── */}
      {tab === "kills" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground bg-muted/40 border border-border/50 rounded-lg px-3 py-2">
            Row = killer · Column = victim · Darker cell = more kills in that
            matchup
          </p>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <NextImageFallback
                  src={createTeamLogoUrl(teamA.logo)}
                  alt={teamA.name}
                  width={18}
                  height={18}
                  className="rounded-sm"
                />
                <p className="text-sm font-semibold text-sky-300/80">
                  {teamA.name}
                </p>
                <span className="text-muted-foreground text-xs">→</span>
                <NextImageFallback
                  src={createTeamLogoUrl(teamB.logo)}
                  alt={teamB.name}
                  width={18}
                  height={18}
                  className="rounded-sm"
                />
                <p className="text-sm font-semibold text-amber-300/80">
                  {teamB.name}
                </p>
              </div>
              <MatrixTable
                rowPlayers={teamAPlayers}
                colPlayers={teamBPlayers}
                rowTeamColor="text-sky-300/80"
                colTeamColor="text-amber-300/80"
                cellAccent="sky"
                getCellValue={(r, c) => getKill(r, c)}
                getRowTotal={(r) => killRowTotal(r, teamBPlayers)}
                getColTotal={(c) => killColTotal(c, teamAPlayers)}
                killerLabel={teamA.name}
                victimLabel={teamB.name}
              />
            </div>

            <div className="rounded-lg border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <NextImageFallback
                  src={createTeamLogoUrl(teamB.logo)}
                  alt={teamB.name}
                  width={18}
                  height={18}
                  className="rounded-sm"
                />
                <p className="text-sm font-semibold text-amber-300/80">
                  {teamB.name}
                </p>
                <span className="text-muted-foreground text-xs">→</span>
                <NextImageFallback
                  src={createTeamLogoUrl(teamA.logo)}
                  alt={teamA.name}
                  width={18}
                  height={18}
                  className="rounded-sm"
                />
                <p className="text-sm font-semibold text-sky-300/80">
                  {teamA.name}
                </p>
              </div>
              <MatrixTable
                rowPlayers={teamBPlayers}
                colPlayers={teamAPlayers}
                rowTeamColor="text-amber-300/80"
                colTeamColor="text-sky-300/80"
                cellAccent="amber"
                getCellValue={(r, c) => getKill(r, c)}
                getRowTotal={(r) => killRowTotal(r, teamAPlayers)}
                getColTotal={(c) => killColTotal(c, teamBPlayers)}
                killerLabel={teamB.name}
                victimLabel={teamA.name}
              />
            </div>
          </div>

          <TopMatchups
            entries={topKills}
            nameMap={nameMap}
            teamAIds={teamAIds}
            label="Top matchups by kill count"
          />
        </div>
      )}

      {/* ── Flash matrix ── */}
      {tab === "flashes" && (
        <div className="space-y-4">
          <span className="text-[10px] text-muted-foreground/50">
            cell = flash count / total blind time (s) · hover for avg duration
          </span>

          {/* Unified grid */}
          <div className="rounded-lg border bg-card p-4">
            <FlashGrid
              teamGroups={flashTeamGroups}
              pairMap={flashPairMap}
              maxDuration={maxFlashDuration}
              showMode="all"
            />
          </div>

          {/* Per-player summary */}
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Player summary
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/40 text-muted-foreground/70 uppercase tracking-wide text-[10px]">
                    <th className="text-left py-2 pr-3 font-semibold">
                      Player
                    </th>
                    <th className="text-right py-2 px-2 font-semibold">
                      Enemy flashes
                    </th>
                    <th className="text-right py-2 px-2 font-semibold">
                      Avg blind (s)
                    </th>
                    <th className="text-right py-2 px-2 font-semibold">
                      Team flashes
                    </th>
                    <th className="text-right py-2 pl-2 font-semibold">
                      Self-flashes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {flashTeamGroups.flatMap((g) =>
                    g.players.map((p) => {
                      const s = flashStatMap.get(p.steamId);
                      return (
                        <tr
                          key={p.steamId}
                          className="border-b border-border/20 hover:bg-muted/30"
                        >
                          <td
                            className="py-2 pr-3 font-semibold"
                            style={{ color: g.color }}
                          >
                            {p.name}
                          </td>
                          <td className="text-right py-2 px-2 tabular-nums">
                            {s?.enemy_flashes ?? 0}
                          </td>
                          <td className="text-right py-2 px-2 tabular-nums">
                            {s ? s.avg_duration_seconds.toFixed(2) : "–"}
                          </td>
                          <td className="text-right py-2 px-2 tabular-nums text-muted-foreground">
                            {s?.teammate_flashes ?? 0}
                          </td>
                          <td className="text-right py-2 pl-2 tabular-nums text-muted-foreground">
                            {s?.self_flashes ?? 0}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Entry Kills tab ── */}
      {tab === "entry" && (
        <EntryKillsSection
          entryKills={entryKills}
          nameMap={nameMap}
        />
      )}
    </div>
  );
};
