"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { NextImageFallback } from "@/components/layout/NextImageFallback";
import { createTeamLogoUrl } from "@/lib/utils";
import type {
  MatchGameKillMatrix,
  MatchInfo,
  MatchPlayerStats
} from "@eggosystem/types";
import { orderMatchParticipantsBySideHomeLeft } from "@/lib/order-match-teams-home-left-away";

/* ─────────────────────────────────────────── */
/*  Types                                      */
/* ─────────────────────────────────────────── */

interface KillMatrixTabProps {
  matrix: MatchGameKillMatrix;
  playerStats: MatchPlayerStats[];
  teams: MatchInfo["teams"];
}

type PlayerInfo = {
  steamId: string;
  name: string;
  teamId: number;
};

/* ─────────────────────────────────────────── */
/*  Heat cell                                  */
/* ─────────────────────────────────────────── */

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
/*  Main tab                                   */
/* ─────────────────────────────────────────── */

export const KillMatrixTab = ({
  matrix,
  playerStats,
  teams
}: KillMatrixTabProps) => {
  const [tab, setTab] = useState<"kills" | "flashes">("kills");

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
    for (const k of matrix.kills) {
      m.set(`${k.killer_steam_id}|${k.victim_steam_id}`, k.count);
    }
    return m;
  }, [matrix.kills]);

  const flashMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of matrix.flash_assists) {
      m.set(`${f.assister_steam_id}|${f.victim_steam_id}`, f.count);
    }
    return m;
  }, [matrix.flash_assists]);

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
  const flashColTotal = (victimId: string, assisters: PlayerInfo[]) =>
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
      matrix.kills.map((k) => ({
        aId: k.killer_steam_id,
        bId: k.victim_steam_id,
        count: k.count
      })),
    [matrix.kills]
  );
  const topFlashes = useMemo(
    () =>
      matrix.flash_assists.map((f) => ({
        aId: f.assister_steam_id,
        bId: f.victim_steam_id,
        count: f.count
      })),
    [matrix.flash_assists]
  );

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

      {/* ── Tab selector ── */}
      <div className="flex gap-2">
        {(
          [
            { key: "kills", label: "Kill matrix" },
            { key: "flashes", label: "Flash matrix" }
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
          <p className="text-xs text-muted-foreground bg-muted/40 border border-border/50 rounded-lg px-3 py-2">
            Row = flasher · Column = enemy blinded &amp; killed · Shows how much
            each player contributes flash utility that leads to kills
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
                <span className="text-xs text-muted-foreground">flashes →</span>
                <p className="text-sm font-semibold text-amber-300/80">
                  {teamB.name}
                </p>
                <span className="text-xs text-muted-foreground">kills</span>
              </div>
              <MatrixTable
                rowPlayers={teamAPlayers}
                colPlayers={teamBPlayers}
                rowTeamColor="text-sky-300/80"
                colTeamColor="text-amber-300/80"
                cellAccent="violet"
                getCellValue={(r, c) => getFlash(r, c)}
                getRowTotal={(r) => flashRowTotal(r, teamBPlayers)}
                getColTotal={(c) => flashColTotal(c, teamAPlayers)}
                killerLabel={`${teamA.name} flasher`}
                victimLabel={`${teamB.name} victim`}
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
                <span className="text-xs text-muted-foreground">flashes →</span>
                <p className="text-sm font-semibold text-sky-300/80">
                  {teamA.name}
                </p>
                <span className="text-xs text-muted-foreground">kills</span>
              </div>
              <MatrixTable
                rowPlayers={teamBPlayers}
                colPlayers={teamAPlayers}
                rowTeamColor="text-amber-300/80"
                colTeamColor="text-sky-300/80"
                cellAccent="violet"
                getCellValue={(r, c) => getFlash(r, c)}
                getRowTotal={(r) => flashRowTotal(r, teamAPlayers)}
                getColTotal={(c) => flashColTotal(c, teamBPlayers)}
                killerLabel={`${teamB.name} flasher`}
                victimLabel={`${teamA.name} victim`}
              />
            </div>
          </div>

          <TopMatchups
            entries={topFlashes}
            nameMap={nameMap}
            teamAIds={teamAIds}
            label="Top flash setups by assist count"
          />
        </div>
      )}
    </div>
  );
};
