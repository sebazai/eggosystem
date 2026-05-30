"use client";

import React, { useState, useMemo } from "react";
import { cn, mapToReadableNameCapitalFirst } from "@/lib/utils";
import { format } from "date-fns";
import type { MatchInfo, MatchGameOpeningDuel } from "@eggosystem/types";
import {
  useMatchGamePlayerStats,
  useMatchGameRoundInfo,
  useMatchGameOpeningDuels,
  useMatchGameTradeStats,
  useMatchGameWeaponStats,
  useMatchGameHitStats,
  useMatchGameRoundEvents,
  useMatchGameUtilityStats,
  type WeaponStat,
  type HitGroupCount,
  type RoundKillEvent,
  type RoundDeathEvent,
  type RoundFlashEvent,
  type RoundUtilityEvent,
  type PlayerGameUtilityStats
} from "@/hooks/data/useMatchGameData";
import { Skeleton } from "@/components/ui/skeleton";

/* ─────────────────────────────────────────────────────── types ── */

interface MapTab {
  id: number;
  name: string;
}

interface PlayerMatchGameViewProps {
  matchId: number;
  matchGameId: number;
  steamId: string;
  mapName: string;
  matchInfo: MatchInfo;
  bestOf: number;
  maps?: MapTab[];
  selectedMapIdx?: number;
  onMapSelect?: (idx: number) => void;
}

interface ExtendedPlayerStats {
  steam_id: string;
  nickname: string;
  team_id: number;
  kills: number;
  deaths: number;
  assists: number;
  flash_assists: number;
  headshots: number;
  kast_percentage: number;
  adr: number;
  enemies_flashed: number;
  hs_percent: number;
  kana_rating: number | null;
  first_kills?: number;
  first_deaths?: number;
}

type RoundOutcome = "win" | "loss" | "unknown";

interface RoundRow {
  round_number: number;
  outcome: RoundOutcome;
  side: "CT" | "T";
  fkfd: "fk" | "fd" | null;
  plant_site: string | null | undefined;
  round_end_reason: string;
  openingDuel: MatchGameOpeningDuel | null;
}

/* ─────────────────────────────────────────── primitive helpers ── */

function pct(n: number, d: number) {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function ratingColor(r: number) {
  if (r >= 1.3) return "text-emerald-400";
  if (r >= 1.0) return "text-amber-400";
  return "text-red-400";
}

function pctColor(v: number, hi = 60, lo = 35) {
  if (v >= hi) return "text-emerald-400";
  if (v >= lo) return "text-amber-400";
  return "text-red-400";
}

/* ─────────────────────────────────────────── SectionCard ── */

function SectionCard({
  icon,
  title,
  accent,
  children
}: {
  icon: React.ReactNode;
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-card border border-border overflow-hidden mb-3">
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b border-border"
        style={{ background: `color-mix(in srgb, ${accent} 6%, transparent)` }}
      >
        <span className="text-base">{icon}</span>
        <span
          className="text-xs font-bold tracking-widest uppercase"
          style={{ color: accent }}
        >
          {title}
        </span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────── StatChip ── */

function StatChip({
  value,
  label,
  valueClass,
  note
}: {
  value: string | number;
  label: string;
  valueClass?: string;
  note?: string;
}) {
  return (
    <div className="flex flex-col px-3 py-3 rounded-md bg-muted/30 border border-border/60 min-w-[60px]">
      <span className={cn("text-xl font-black leading-none", valueClass)}>
        {value}
      </span>
      <span className="text-[11px] text-muted-foreground uppercase tracking-wide mt-1.5">
        {label}
      </span>
      {note && (
        <span className="text-xs text-muted-foreground/60 mt-0.5">{note}</span>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────── HBar ── */

function HBar({
  label,
  value,
  max,
  color,
  note
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  note?: string;
}) {
  const w = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <div className="flex gap-2">
          {note && (
            <span className="text-muted-foreground/60 text-xs">{note}</span>
          )}
          <span className="font-semibold" style={{ color }}>
            {value}
          </span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-muted/40 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${w}%`, background: color }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── WeaponDonut ── */

const WEAPON_COLORS = [
  "#38bdf8",
  "#fb923c",
  "#a78bfa",
  "#f472b6",
  "#4ade80",
  "#fbbf24",
  "#f87171",
  "#2dd4bf"
];

function polarPoint(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(
  cx: number,
  cy: number,
  oR: number,
  iR: number,
  a1: number,
  a2: number
) {
  if (a2 - a1 >= 359.9) a2 = a1 + 359.9;
  const p1 = polarPoint(cx, cy, oR, a1),
    p2 = polarPoint(cx, cy, oR, a2);
  const p3 = polarPoint(cx, cy, iR, a2),
    p4 = polarPoint(cx, cy, iR, a1);
  const lg = a2 - a1 > 180 ? 1 : 0;
  return `M${p1.x.toFixed(1)},${p1.y.toFixed(1)} A${oR},${oR},0,${lg},1,${p2.x.toFixed(1)},${p2.y.toFixed(1)} L${p3.x.toFixed(1)},${p3.y.toFixed(1)} A${iR},${iR},0,${lg},0,${p4.x.toFixed(1)},${p4.y.toFixed(1)}Z`;
}

function WeaponDonut({ weapons }: { weapons: WeaponStat[] }) {
  const total = weapons.reduce((s, w) => s + w.kills, 0);
  if (total === 0)
    return <p className="text-sm text-muted-foreground">No kill data.</p>;
  const size = 144;
  const cx = size / 2,
    cy = size / 2,
    oR = size / 2 - 6,
    iR = oR * 0.58;
  const sweeps = weapons.map((w) => (w.kills / total) * 360);
  const startAngles = sweeps.reduce<number[]>(
    (acc, s) => [...acc, (acc[acc.length - 1] ?? 0) + s],
    [0]
  );
  const segments = weapons.map((w, i) => {
    const start = startAngles[i] ?? 0;
    const sweep = sweeps[i] ?? 0;
    return {
      ...w,
      path: arcPath(cx, cy, oR, iR, start, start + sweep - 1.5),
      color: WEAPON_COLORS[i % WEAPON_COLORS.length] ?? "#888"
    };
  });

  return (
    <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          {segments.map((s) => (
            <path
              key={s.weapon}
              d={s.path}
              fill={`${s.color}bb`}
              stroke={`${s.color}30`}
              strokeWidth={1}
            />
          ))}
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            fontSize={20}
            fontWeight={900}
            fill="rgba(255,255,255,0.86)"
          >
            {total}
          </text>
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            fontSize={11}
            fill="rgba(255,255,255,0.4)"
          >
            kills
          </text>
        </svg>
      </div>
      <div className="flex-1 w-full space-y-2.5">
        {segments.map((s) => {
          const p = pct(s.kills, total);
          return (
            <div key={s.weapon}>
              <div className="flex justify-between text-sm mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-sm inline-block shrink-0"
                    style={{ background: s.color }}
                  />
                  <span className="text-foreground/80">{s.weapon}</span>
                </div>
                <div className="flex gap-3 text-xs">
                  <span className="text-muted-foreground">{p}%</span>
                  <span className="font-bold" style={{ color: s.color }}>
                    {s.kills}k
                  </span>
                  {s.total_damage > 0 && (
                    <span className="text-muted-foreground hidden sm:inline">
                      {s.total_damage}dmg
                    </span>
                  )}
                  {s.kills > 0 && (
                    <span className="text-muted-foreground">
                      {pct(s.headshot_kills, s.kills)}%HS
                    </span>
                  )}
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${p}%`, background: `${s.color}80` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── FK/FD section ── */

function FKFDSection({
  openingDuels,
  tradeStats,
  steamId,
  rounds
}: {
  openingDuels: MatchGameOpeningDuel[];
  tradeStats: {
    first_deaths: number;
    first_death_traded: number;
    first_death_trade_opportunities: number;
  } | null;
  steamId: string;
  rounds: RoundRow[];
}) {
  const fkRounds = openingDuels
    .filter((d) => String(d.killer_steam_id) === String(steamId))
    .map((d) => d.round_number);
  const fdRounds = openingDuels
    .filter((d) => String(d.victim_steam_id) === String(steamId))
    .map((d) => d.round_number);

  const fdTradeable = tradeStats?.first_death_trade_opportunities ?? 0;
  const fdTraded = tradeStats?.first_death_traded ?? 0;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        <StatChip
          value={fkRounds.length}
          label="First Kills"
          valueClass="text-emerald-400"
          note={`${pct(fkRounds.length, rounds.length)}% of rounds`}
        />
        <StatChip
          value={fdRounds.length}
          label="First Deaths"
          valueClass="text-red-400"
          note={`${pct(fdRounds.length, rounds.length)}% of rounds`}
        />
        <StatChip
          value={`${fdTradeable}/${fdRounds.length}`}
          label="FD Tradeable"
          valueClass="text-amber-400"
          note={
            fdRounds.length > 0
              ? `${pct(fdTradeable, fdRounds.length)}% tradeable`
              : undefined
          }
        />
        <StatChip
          value={`${fdTraded}/${fdTradeable}`}
          label="FD Traded"
          valueClass={pctColor(pct(fdTraded, fdTradeable))}
          note={
            fdTradeable > 0
              ? `${pct(fdTraded, fdTradeable)}% converted`
              : undefined
          }
        />
      </div>
      <p className="text-xs text-muted-foreground/60 mb-2">Round-by-round</p>
      <div className="flex flex-wrap gap-1.5">
        {rounds.map((r) => {
          const isFk = fkRounds.includes(r.round_number);
          const isFd = fdRounds.includes(r.round_number);
          return (
            <div
              key={r.round_number}
              className={cn(
                "w-9 h-10 rounded-md flex flex-col items-center justify-center gap-0.5 border font-bold",
                isFk &&
                  "bg-emerald-700/20 border-emerald-600/50 text-emerald-400",
                isFd && "bg-red-900/20 border-red-600/40 text-red-400",
                !isFk &&
                  !isFd &&
                  "bg-muted/20 border-border/40 text-muted-foreground"
              )}
            >
              {isFk && <span className="text-[10px]">FK</span>}
              {isFd && <span className="text-[10px]">FD</span>}
              <span
                className={cn(
                  "text-[11px]",
                  isFk || isFd ? "text-foreground/50" : ""
                )}
              >
                {r.round_number}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-4 mt-3">
        {[
          { col: "#4ade80", label: "FK — First Kill" },
          { col: "#f87171", label: "FD — First Death" }
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: l.col }}
            />
            <span className="text-xs text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── body hit heatmap ── */

const BODY_ZONES = [
  { id: "head", kind: "e" as const, cx: 80, cy: 34, rx: 26, ry: 30 },
  { id: "neck", kind: "r" as const, x: 72, y: 62, w: 16, h: 14, rx: 3 },
  { id: "chest", kind: "r" as const, x: 36, y: 74, w: 88, h: 64, rx: 6 },
  { id: "stomach", kind: "r" as const, x: 44, y: 136, w: 72, h: 46, rx: 6 },
  { id: "left_arm", kind: "r" as const, x: 4, y: 74, w: 30, h: 92, rx: 10 },
  { id: "right_arm", kind: "r" as const, x: 126, y: 74, w: 30, h: 92, rx: 10 },
  { id: "left_leg", kind: "r" as const, x: 44, y: 180, w: 32, h: 118, rx: 10 },
  { id: "right_leg", kind: "r" as const, x: 84, y: 180, w: 32, h: 118, rx: 10 }
];

const ZONE_LABELS: Record<string, string> = {
  head: "Head",
  neck: "Neck",
  chest: "Chest",
  stomach: "Stomach",
  left_arm: "L. Arm",
  right_arm: "R. Arm",
  left_leg: "L. Leg",
  right_leg: "R. Leg"
};

function heatFill(n: number, max: number) {
  if (max === 0 || n === 0) return "rgba(255,255,255,0.04)";
  const r = n / max;
  if (r < 0.3) return `rgba(99,102,241,${(0.2 + r * 0.7).toFixed(2)})`;
  if (r < 0.65) return `rgba(251,146,60,${(0.3 + r * 0.5).toFixed(2)})`;
  return `rgba(239,68,68,${(0.55 + r * 0.4).toFixed(2)})`;
}

function BodyHeatmap({ rows, mode }: { rows: HitGroupCount[]; mode: string }) {
  const dataMap = Object.fromEntries(rows.map((r) => [r.hit_group, r]));
  const values = rows.map((r) => r.hits);
  const max = Math.max(...values, 1);
  const total = rows.reduce((s, r) => s + r.hits, 0);

  return (
    <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
      <svg viewBox="0 0 160 310" width={120} height={230} className="shrink-0">
        {BODY_ZONES.map((z) => {
          const n = dataMap[z.id]?.hits ?? 0;
          const fill = heatFill(n, max);
          const cx = z.kind === "e" ? z.cx : z.x + z.w / 2;
          const cy = z.kind === "e" ? z.cy : z.y + z.h / 2;
          return (
            <g key={z.id}>
              {z.kind === "e" ? (
                <ellipse
                  cx={z.cx}
                  cy={z.cy}
                  rx={z.rx}
                  ry={z.ry}
                  fill={fill}
                  stroke="rgba(255,255,255,0.09)"
                  strokeWidth={1}
                />
              ) : (
                <rect
                  x={z.x}
                  y={z.y}
                  width={z.w}
                  height={z.h}
                  rx={z.rx}
                  fill={fill}
                  stroke="rgba(255,255,255,0.09)"
                  strokeWidth={1}
                />
              )}
              {n > 0 && (
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  fontSize={z.id === "head" ? 11 : 9}
                  fontWeight={800}
                  fill="rgba(255,255,255,0.9)"
                >
                  {n}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className="flex-1">
        <p className="text-xs text-muted-foreground mb-3">
          {total} hits ·{" "}
          {mode === "dealt" ? "dealt to opponents" : "received from opponents"}
        </p>
        {BODY_ZONES.filter((z) => (dataMap[z.id]?.hits ?? 0) > 0)
          .sort(
            (a, b) => (dataMap[b.id]?.hits ?? 0) - (dataMap[a.id]?.hits ?? 0)
          )
          .map((z) => {
            const n = dataMap[z.id]?.hits ?? 0;
            const p = pct(n, total);
            return (
              <div key={z.id} className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-foreground/80">
                    {ZONE_LABELS[z.id]}
                  </span>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground">{p}%</span>
                    <span className="font-semibold">{n}</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${p}%`, background: heatFill(n, max) }}
                  />
                </div>
              </div>
            );
          })}
        {total === 0 && (
          <p className="text-sm text-muted-foreground">No data.</p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── utility/flash section ── */

function FlashSection({
  utilityStats,
  playerStats,
  flashesByRound,
  utilityByRound
}: {
  utilityStats: PlayerGameUtilityStats | null;
  playerStats: ExtendedPlayerStats | undefined;
  flashesByRound: Map<number, RoundFlashEvent[]>;
  utilityByRound: Map<number, RoundUtilityEvent>;
}) {
  const us = utilityStats;

  const roundsWithFlashes = useMemo(() => {
    return Array.from(flashesByRound.entries())
      .map(([round, flashes]) => ({ round, flashes }))
      .sort((a, b) => a.round - b.round);
  }, [flashesByRound]);

  const { totalEnemyFlashCount, totalFlashDuration } = useMemo(() => {
    let count = 0;
    let dur = 0;
    for (const [, flashes] of flashesByRound) {
      for (const f of flashes) {
        if (f.is_enemy_flash) {
          count++;
          dur += f.duration_seconds;
        }
      }
    }
    return { totalEnemyFlashCount: count, totalFlashDuration: dur };
  }, [flashesByRound]);

  const hasData = (us?.flashes_thrown ?? 0) > 0 || roundsWithFlashes.length > 0;
  const smokes = us?.smokes_thrown ?? 0;
  const utilDmg = us?.utility_damage ?? 0;
  const wasted = us?.wasted_utility ?? 0;
  const teammates = us?.teammates_flashed ?? 0;
  const flashAssists = playerStats?.flash_assists ?? 0;

  return (
    <div>
      {/* ── 4 summary chips ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        <StatChip value={us?.flashes_thrown ?? 0} label="Flashes Thrown" />
        <StatChip
          value={totalEnemyFlashCount}
          label="Enemies Blinded"
          valueClass="text-cyan-400"
          note={
            totalEnemyFlashCount > 0
              ? `${(totalFlashDuration / totalEnemyFlashCount).toFixed(1)}s avg`
              : undefined
          }
        />
        <StatChip
          value={teammates}
          label="Teammates Hit"
          valueClass={
            teammates > 2
              ? "text-red-400"
              : teammates > 0
                ? "text-amber-400"
                : ""
          }
        />
        <StatChip
          value={`${utilDmg} HP`}
          label="Utility Damage"
          valueClass="text-orange-400"
        />
      </div>

      {/* ── utility bars ── */}
      {hasData && (
        <div className="mb-5">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
            Utility usage
          </p>
          {smokes > 0 && (
            <HBar
              label="Smokes thrown"
              value={smokes}
              max={Math.max(smokes, 1)}
              color="#a78bfa"
            />
          )}
          <HBar
            label="Utility damage (HE / molotov)"
            value={utilDmg}
            max={Math.max(utilDmg, 1)}
            color="#fb923c"
          />
          {wasted > 0 && (
            <HBar
              label="Wasted utility"
              value={wasted}
              max={Math.max(wasted, 1)}
              color="rgba(248,113,113,0.6)"
              note="grenades that dealt 0 dmg"
            />
          )}
          {flashAssists > 0 && (
            <HBar
              label="Flash assists"
              value={flashAssists}
              max={Math.max(flashAssists, 1)}
              color="#2dd4bf"
            />
          )}
        </div>
      )}

      {/* ── per-round flash events ── */}
      {roundsWithFlashes.length > 0 && (
        <>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
            Per-round flash events
          </p>
          <div className="space-y-2">
            {roundsWithFlashes.map(({ round, flashes }) => {
              const enemies = flashes.filter((f) => f.is_enemy_flash);
              const mates = flashes.filter((f) => !f.is_enemy_flash);
              const hasBad = mates.length > 0;
              const enemyDur = enemies.reduce(
                (s, f) => s + f.duration_seconds,
                0
              );
              const utilRow = utilityByRound.get(round);
              const utilDmg = utilRow?.utility_damage ?? 0;
              const smokes = utilRow?.smokes_thrown ?? 0;
              return (
                <div
                  key={round}
                  className={cn(
                    "rounded-lg p-3 border",
                    hasBad
                      ? "bg-red-950/20 border-red-800/30"
                      : "bg-muted/20 border-border/40"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">Round {round}</span>
                      {hasBad && (
                        <span className="text-[10px] font-bold text-red-400 bg-red-900/30 border border-red-600/30 rounded px-1.5 py-0.5">
                          ⚠ Teammate flash
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {utilDmg > 0 && (
                        <span className="font-semibold text-orange-400">
                          {utilDmg} HP dmg
                        </span>
                      )}
                      {smokes > 0 && (
                        <span className="text-purple-400">
                          {smokes} smoke{smokes > 1 ? "s" : ""}
                        </span>
                      )}
                      {enemies.length > 0 && (
                        <span>
                          {enemies.length} enem
                          {enemies.length === 1 ? "y" : "ies"} ·{" "}
                          <span className="text-cyan-400 font-semibold">
                            {enemyDur.toFixed(1)}s
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {flashes.map((f, i) => {
                      const col = f.is_enemy_flash ? "#2dd4bf" : "#f87171";
                      const durCol = f.is_enemy_flash
                        ? f.duration_seconds >= 2.5
                          ? "#4ade80"
                          : f.duration_seconds >= 1.5
                            ? "#2dd4bf"
                            : "#fb923c"
                        : "#f87171";
                      return (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border text-sm"
                          style={{
                            background: `${col}10`,
                            borderColor: `${col}28`
                          }}
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: col }}
                          />
                          <span
                            className={cn(
                              "font-medium",
                              f.is_enemy_flash
                                ? "text-foreground/90"
                                : "text-foreground/50"
                            )}
                          >
                            {f.victim_nickname}
                          </span>
                          <span
                            className="text-xs"
                            style={{
                              color: f.is_enemy_flash ? "#7dd3fc" : "#fcd34d"
                            }}
                          >
                            {f.is_enemy_flash ? "enemy" : "teammate"}
                          </span>
                          <span
                            className="text-sm font-bold"
                            style={{ color: durCol }}
                          >
                            {f.duration_seconds.toFixed(1)}s
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!hasData && (
        <p className="text-sm text-muted-foreground">
          No flash/utility data recorded.
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────── round drill-down ── */

function RoundTimeline({
  rounds,
  steamId,
  killsByRound,
  deathsByRound,
  flashesByRound,
  utilityByRound
}: {
  rounds: RoundRow[];
  steamId: string;
  killsByRound: Map<number, RoundKillEvent[]>;
  deathsByRound: Map<number, RoundDeathEvent[]>;
  flashesByRound: Map<number, RoundFlashEvent[]>;
  utilityByRound: Map<number, RoundUtilityEvent>;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  function impactColor(r: RoundRow) {
    const kills = killsByRound.get(r.round_number)?.length ?? 0;
    if (kills >= 3) return "#f87171";
    if (kills >= 2) return "#fb923c";
    if (kills === 1 && r.outcome === "win") return "#4ade80";
    if (r.fkfd === "fd") return "rgba(248,113,113,0.5)";
    if (r.outcome === "win") return "rgba(74,222,128,0.4)";
    return "rgba(255,255,255,0.08)";
  }

  const selectedKills =
    selected !== null ? (killsByRound.get(selected) ?? []) : [];
  const selectedDeath =
    selected !== null ? (deathsByRound.get(selected)?.[0] ?? null) : null;
  const selectedFlashes =
    selected !== null ? (flashesByRound.get(selected) ?? []) : [];
  const selectedUtility =
    selected !== null ? (utilityByRound.get(selected) ?? null) : null;
  const selectedRound =
    selected !== null ? rounds.find((r) => r.round_number === selected) : null;

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">
        Click a round to expand · CT rounds first · T rounds after halftime
      </p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {rounds.map((r) => {
          const kills = killsByRound.get(r.round_number)?.length ?? 0;
          const ic = impactColor(r);
          const sideCol = r.side === "CT" ? "#7dd3fc" : "#fcd34d";
          const isSelected = selected === r.round_number;
          return (
            <button
              key={r.round_number}
              onClick={() => setSelected(isSelected ? null : r.round_number)}
              className={cn(
                "relative w-10 h-12 rounded-md flex flex-col items-center justify-center gap-0.5 border transition-all",
                isSelected ? "ring-2 ring-primary scale-105" : "hover:scale-105"
              )}
              style={{
                background: isSelected ? `${ic}25` : "rgba(255,255,255,0.04)",
                borderColor: isSelected
                  ? ic
                  : r.outcome === "win"
                    ? "rgba(74,222,128,0.2)"
                    : "rgba(248,113,113,0.2)"
              }}
            >
              <div
                className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full"
                style={{ background: sideCol }}
              />
              {r.fkfd === "fk" && (
                <div className="absolute top-0.5 right-0.5 text-[9px] font-black text-emerald-400">
                  FK
                </div>
              )}
              {r.fkfd === "fd" && (
                <div className="absolute top-0.5 right-0.5 text-[9px] font-black text-red-400">
                  FD
                </div>
              )}
              {kills > 0 ? (
                <span className="text-sm font-black" style={{ color: ic }}>
                  {kills}
                </span>
              ) : deathsByRound.get(r.round_number)?.length ? (
                <span className="text-xs text-red-400/50">☠</span>
              ) : (
                <span className="text-xs text-muted-foreground/40">—</span>
              )}
              <span className="text-[10px] text-muted-foreground/40">
                R{r.round_number}
              </span>
            </button>
          );
        })}
      </div>

      {selectedRound && (
        <div className="rounded-lg bg-muted/20 border border-border p-4 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm">
              Round {selectedRound.round_number}
            </span>
            <span
              className={cn(
                "px-2 py-0.5 rounded text-xs font-bold",
                selectedRound.side === "CT"
                  ? "bg-sky-800/50 text-sky-200"
                  : "bg-amber-800/50 text-amber-200"
              )}
            >
              {selectedRound.side}
            </span>
            <span
              className={cn(
                "px-2 py-0.5 rounded text-xs font-bold",
                selectedRound.outcome === "win"
                  ? "bg-emerald-800/50 text-emerald-200"
                  : "bg-red-800/50 text-red-200"
              )}
            >
              {selectedRound.outcome === "win" ? "Won" : "Lost"}
            </span>
            {selectedRound.fkfd === "fk" && (
              <span className="px-2 py-0.5 rounded text-xs bg-emerald-800/30 text-emerald-300">
                First Kill
              </span>
            )}
            {selectedRound.fkfd === "fd" && (
              <span className="px-2 py-0.5 rounded text-xs bg-red-800/30 text-red-300">
                First Death
              </span>
            )}
            {selectedRound.plant_site && (
              <span className="px-2 py-0.5 rounded text-xs bg-muted/60 text-muted-foreground">
                Plant {selectedRound.plant_site}
              </span>
            )}
            <span className="ml-auto text-xs text-muted-foreground capitalize">
              {selectedRound.round_end_reason.replace(/_/g, " ")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Kills */}
            <div>
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">
                Kills
              </p>
              {selectedKills.length === 0 ? (
                <p className="text-muted-foreground">No kills</p>
              ) : (
                selectedKills.map((k, i) => (
                  <div
                    key={i}
                    className="flex justify-between py-1 border-b border-border/20"
                  >
                    <div>
                      <span className="font-semibold text-sky-300">
                        {k.victim_nickname}
                      </span>
                      <span className="text-muted-foreground ml-1.5">
                        {k.weapon}
                      </span>
                    </div>
                    <div className="flex gap-2 text-muted-foreground">
                      {k.is_headshot && (
                        <span className="text-amber-400 font-bold">HS</span>
                      )}
                      <span>{k.time_in_round.toFixed(1)}s</span>
                    </div>
                  </div>
                ))
              )}
              {selectedDeath && (
                <div className="mt-2">
                  <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">
                    Death
                  </p>
                  <div className="flex justify-between py-1">
                    <div>
                      <span className="font-semibold text-amber-300">
                        {selectedDeath.killer_nickname}
                      </span>
                      <span className="text-muted-foreground ml-1.5">
                        {selectedDeath.weapon}
                      </span>
                    </div>
                    <div className="flex gap-2 text-muted-foreground">
                      {selectedDeath.is_headshot && (
                        <span className="text-amber-400 font-bold">HS</span>
                      )}
                      <span>{selectedDeath.time_in_round.toFixed(1)}s</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Flashes */}
            <div>
              <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2">
                Flashes thrown
              </p>
              {selectedFlashes.length === 0 ? (
                <p className="text-muted-foreground">No flashes</p>
              ) : (
                selectedFlashes.map((f, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-between px-2 py-1 rounded mb-1",
                      f.is_enemy_flash
                        ? "bg-cyan-900/20 border border-cyan-800/30"
                        : "bg-red-900/20 border border-red-800/30"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          f.is_enemy_flash ? "bg-cyan-400" : "bg-red-400"
                        )}
                      />
                      <span
                        className={
                          f.is_enemy_flash
                            ? "text-foreground/80"
                            : "text-foreground/50"
                        }
                      >
                        {f.victim_nickname}
                      </span>
                      <span
                        className={cn(
                          "text-xs",
                          f.is_enemy_flash ? "text-sky-400" : "text-amber-400"
                        )}
                      >
                        {f.is_enemy_flash ? "enemy" : "teammate"}
                      </span>
                    </div>
                    <span
                      className={cn(
                        "font-bold text-sm",
                        f.duration_seconds >= 2
                          ? "text-emerald-400"
                          : "text-cyan-400"
                      )}
                    >
                      {f.duration_seconds.toFixed(1)}s
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Opening duel + utility context */}
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                  Opening duel
                </p>
                {selectedRound.openingDuel ? (
                  <div className="text-sm">
                    {String(selectedRound.openingDuel.killer_steam_id) ===
                    String(steamId) ? (
                      <span className="text-emerald-400 font-semibold">
                        FK with {selectedRound.openingDuel.weapon}
                        {selectedRound.openingDuel.is_headshot ? " (HS)" : ""}
                        {selectedRound.openingDuel.trade !== "isolated"
                          ? ` · ${selectedRound.openingDuel.trade}`
                          : ""}
                      </span>
                    ) : String(selectedRound.openingDuel.victim_steam_id) ===
                      String(steamId) ? (
                      <span className="text-red-400 font-semibold">
                        FD by {selectedRound.openingDuel.weapon}
                        {selectedRound.openingDuel.is_headshot ? " (HS)" : ""}
                        {" · "}
                        {selectedRound.openingDuel.trade === "converted"
                          ? "traded"
                          : selectedRound.openingDuel.trade}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        {selectedRound.openingDuel.killer_team} →{" "}
                        {selectedRound.openingDuel.victim_team} with{" "}
                        {selectedRound.openingDuel.weapon}
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No opening duel data.
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                  Utility
                </p>
                {selectedUtility ? (
                  <div className="flex flex-col gap-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Utility damage
                      </span>
                      <span
                        className={cn(
                          "font-bold",
                          selectedUtility.utility_damage > 0
                            ? "text-orange-400"
                            : "text-muted-foreground/40"
                        )}
                      >
                        {selectedUtility.utility_damage > 0
                          ? `${selectedUtility.utility_damage} HP`
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Smokes thrown
                      </span>
                      <span
                        className={cn(
                          "font-semibold",
                          selectedUtility.smokes_thrown > 0
                            ? "text-purple-400"
                            : "text-muted-foreground/40"
                        )}
                      >
                        {selectedUtility.smokes_thrown > 0
                          ? selectedUtility.smokes_thrown
                          : "—"}
                      </span>
                    </div>
                    {selectedUtility.enemies_flashed > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Enemies blinded
                        </span>
                        <span className="font-semibold text-cyan-400">
                          {selectedUtility.enemies_flashed}
                        </span>
                      </div>
                    )}
                    {selectedUtility.teammates_flashed > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Teammates blinded
                        </span>
                        <span className="font-semibold text-red-400">
                          {selectedUtility.teammates_flashed}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No utility data.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════ ROOT ═══ */

export function PlayerMatchGameView({
  matchGameId,
  steamId,
  mapName,
  matchInfo,
  bestOf,
  maps,
  selectedMapIdx,
  onMapSelect
}: PlayerMatchGameViewProps) {
  const [hitMode, setHitMode] = useState<"dealt" | "received">("dealt");

  const { data: allPlayerStats, isLoading: loadingStats } =
    useMatchGamePlayerStats(matchGameId);
  const { data: roundInfo, isLoading: loadingRounds } =
    useMatchGameRoundInfo(matchGameId);
  const { data: openingDuels, isLoading: loadingDuels } =
    useMatchGameOpeningDuels(matchGameId);
  const { data: tradeStats, isLoading: loadingTrades } =
    useMatchGameTradeStats(matchGameId);
  const { data: weaponStats, isLoading: loadingWeapons } =
    useMatchGameWeaponStats(matchGameId, steamId);
  const { data: hitStats, isLoading: loadingHits } = useMatchGameHitStats(
    matchGameId,
    steamId
  );
  const { data: roundEvents, isLoading: loadingEvents } =
    useMatchGameRoundEvents(matchGameId, steamId);
  const { data: utilityStats } = useMatchGameUtilityStats(matchGameId, steamId);

  const isLoading =
    loadingStats ||
    loadingRounds ||
    loadingDuels ||
    loadingTrades ||
    loadingWeapons ||
    loadingHits ||
    loadingEvents;

  const playerStats = useMemo(
    () =>
      allPlayerStats.find((p) => String(p.steam_id) === String(steamId)) as
        | ExtendedPlayerStats
        | undefined,
    [allPlayerStats, steamId]
  );

  const playerTradeStats = useMemo(
    () =>
      tradeStats?.players.find((p) => String(p.steam_id) === String(steamId)),
    [tradeStats, steamId]
  );

  const duelByRound = useMemo(() => {
    const map = new Map<number, MatchGameOpeningDuel>();
    for (const d of openingDuels) map.set(d.round_number, d);
    return map;
  }, [openingDuels]);

  const rounds: RoundRow[] = useMemo(() => {
    if (!playerStats) return [];
    const teamId = playerStats.team_id;
    return roundInfo.map((r) => {
      const side: "CT" | "T" = r.ct_team_id === teamId ? "CT" : "T";
      const outcome: RoundOutcome = r.winner
        ? r.winner === side
          ? "win"
          : "loss"
        : "unknown";
      const duel = duelByRound.get(r.round_number) ?? null;
      let fkfd: "fk" | "fd" | null = null;
      if (duel) {
        if (String(duel.killer_steam_id) === String(steamId)) fkfd = "fk";
        else if (String(duel.victim_steam_id) === String(steamId)) fkfd = "fd";
      }
      return {
        round_number: r.round_number,
        outcome,
        side,
        fkfd,
        plant_site: r.plant_site,
        round_end_reason: String(r.round_end_reason_info),
        openingDuel: duel
      };
    });
  }, [roundInfo, playerStats, duelByRound, steamId]);

  // Per-round event maps
  const killsByRound = useMemo(() => {
    const m = new Map<number, RoundKillEvent[]>();
    for (const k of roundEvents.kills) {
      const arr = m.get(k.round_number) ?? [];
      arr.push(k);
      m.set(k.round_number, arr);
    }
    return m;
  }, [roundEvents.kills]);

  const deathsByRound = useMemo(() => {
    const m = new Map<number, RoundDeathEvent[]>();
    for (const d of roundEvents.deaths) {
      const arr = m.get(d.round_number) ?? [];
      arr.push(d);
      m.set(d.round_number, arr);
    }
    return m;
  }, [roundEvents.deaths]);

  const flashesByRound = useMemo(() => {
    const m = new Map<number, RoundFlashEvent[]>();
    for (const f of roundEvents.flashes) {
      const arr = m.get(f.round_number) ?? [];
      arr.push(f);
      m.set(f.round_number, arr);
    }
    return m;
  }, [roundEvents.flashes]);

  const utilityByRound = useMemo(() => {
    const m = new Map<number, RoundUtilityEvent>();
    for (const u of roundEvents.utility) m.set(u.round_number, u);
    return m;
  }, [roundEvents.utility]);

  const teamsArray = Object.values(matchInfo.teams);
  const playerTeam = teamsArray.find((t) => t.id === playerStats?.team_id);
  const opponentTeam = teamsArray.find((t) => t.id !== playerStats?.team_id);
  const matchDate = matchInfo.start_timestamp
    ? format(new Date(matchInfo.start_timestamp), "dd.MM.yyyy")
    : null;
  const matchResult = useMemo(() => {
    if (!playerTeam) return null;
    return {
      won: playerTeam.score > (opponentTeam?.score ?? 0),
      score: playerTeam.score,
      opponentScore: opponentTeam?.score ?? 0
    };
  }, [playerTeam, opponentTeam]);

  const mapDisplayName = mapToReadableNameCapitalFirst(mapName);
  const hitRows =
    hitMode === "dealt" ? (hitStats?.dealt ?? []) : (hitStats?.received ?? []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-16 w-full rounded-lg" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!playerStats) {
    return (
      <div className="bg-card rounded-lg p-6 text-muted-foreground text-center">
        No stats found for this player in game {matchGameId}.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* ── HEADER ── */}
      <div className="bg-card rounded-lg border border-border p-4 mb-3">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
              Match Performance
            </p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-2xl font-black text-amber-400">
                {playerStats.nickname}
              </span>
              <span className="text-xs text-muted-foreground">
                {playerTeam?.name}
              </span>
              <span className="text-sm text-muted-foreground">vs</span>
              <span className="text-lg font-bold">
                {opponentTeam?.name ?? "—"}
              </span>
              {matchDate && (
                <span className="text-xs text-muted-foreground">
                  · {matchDate}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-right">
            {[
              {
                v:
                  playerStats.kana_rating != null
                    ? playerStats.kana_rating.toFixed(2)
                    : "—",
                l: "Rating",
                c:
                  playerStats.kana_rating != null
                    ? ratingColor(playerStats.kana_rating)
                    : ""
              },
              { v: playerStats.adr.toFixed(1), l: "ADR", c: "" },
              {
                v: `${playerStats.kast_percentage.toFixed(0)}%`,
                l: "KAST",
                c: pctColor(playerStats.kast_percentage, 73, 60)
              },
              {
                v: `${playerStats.kills}/${playerStats.deaths}/${playerStats.assists}`,
                l: "K/D/A",
                c: ""
              }
            ].map((s) => (
              <div key={s.l}>
                <div className={cn("text-2xl font-black leading-none", s.c)}>
                  {s.v}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* score + map info row */}
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-muted/60 text-xs font-mono uppercase tracking-widest">
              {mapDisplayName}
            </span>
            {bestOf > 1 && (
              <span className="px-2 py-0.5 rounded bg-muted/40 text-xs text-muted-foreground">
                BO{bestOf}
              </span>
            )}
          </div>
          {matchResult && (
            <span
              className={cn(
                "px-3 py-0.5 rounded text-sm font-bold",
                matchResult.won
                  ? "bg-emerald-700/30 text-emerald-300"
                  : "bg-red-800/30 text-red-300"
              )}
            >
              {playerTeam?.name} {matchResult.score} –{" "}
              {matchResult.opponentScore} {opponentTeam?.name}
            </span>
          )}
        </div>

        {/* map tabs (BO3) */}
        {maps && maps.length > 1 && onMapSelect && (
          <div className="flex rounded-md overflow-hidden border border-border">
            {maps.map((map, i) => {
              const isActive = selectedMapIdx === i;
              return (
                <button
                  key={map.id}
                  onClick={() => onMapSelect(i)}
                  className={cn(
                    "flex-1 py-2 px-3 text-xs font-semibold transition-colors",
                    i < maps.length - 1 && "border-r border-border",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  {mapToReadableNameCapitalFirst(map.name)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── WEAPON USAGE ── */}
      <SectionCard icon="🔫" title="Weapon Usage" accent="#fb923c">
        {weaponStats.length > 0 ? (
          <WeaponDonut weapons={weaponStats} />
        ) : (
          <p className="text-sm text-muted-foreground">
            No weapon data recorded.
          </p>
        )}
      </SectionCard>

      {/* ── FK / FD ── */}
      <SectionCard
        icon="🎯"
        title="First Kills & First Deaths"
        accent="#4ade80"
      >
        <FKFDSection
          openingDuels={openingDuels}
          tradeStats={playerTradeStats ?? null}
          steamId={steamId}
          rounds={rounds}
        />
      </SectionCard>

      {/* ── AIM & IMPACT ── */}
      <SectionCard icon="👁️" title="Aim & Impact" accent="#38bdf8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <StatChip
                value={`${playerStats.hs_percent.toFixed(0)}%`}
                label="Headshot %"
              />
              <StatChip
                value={`${playerStats.kast_percentage.toFixed(0)}%`}
                label="KAST"
              />
              <StatChip value={playerStats.adr.toFixed(1)} label="ADR" />
              <StatChip
                value={playerStats.enemies_flashed}
                label="Enemies Flashed"
              />
            </div>
            <HBar
              label="HS%"
              value={playerStats.hs_percent}
              max={100}
              color="#fbbf24"
            />
            <HBar
              label="KAST"
              value={playerStats.kast_percentage}
              max={100}
              color="#38bdf8"
            />
            <HBar
              label="ADR"
              value={playerStats.adr}
              max={150}
              color="#a78bfa"
            />
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <StatChip
                value={weaponStats.find((w) => w.weapon === "AWP")?.kills ?? 0}
                label="AWP Kills"
                valueClass="text-sky-400"
              />
              <StatChip
                value={playerStats.flash_assists}
                label="Flash Assists"
              />
              <StatChip
                value={playerStats.first_kills ?? 0}
                label="First Kills"
                valueClass="text-emerald-400"
              />
              <StatChip
                value={playerStats.first_deaths ?? 0}
                label="First Deaths"
                valueClass="text-red-400"
              />
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── TRADE PERFORMANCE ── */}
      <SectionCard icon="⚡" title="Trade Performance" accent="#4ade80">
        {playerTradeStats ? (
          (() => {
            const p = playerTradeStats;
            const attRate = pct(p.trade_attempts, p.trade_opportunities);
            const convRate = pct(p.trades, p.trade_attempts);
            const deathTradedRate = pct(p.traded, p.deaths);
            const fdTradedRate = pct(
              p.first_death_traded,
              p.first_death_trade_opportunities
            );
            const ignored = p.trade_opportunities - p.trade_attempts;
            const failed = p.trade_attempts - p.trades;
            const fdIgnored =
              p.first_deaths - p.first_death_trade_opportunities;
            const fdFailed =
              p.first_death_trade_opportunities - p.first_death_traded;

            function FunnelBar({
              opp,
              att,
              conv
            }: {
              opp: number;
              att: number;
              conv: number;
            }) {
              if (opp === 0)
                return <div className="h-2 rounded-full bg-muted/30" />;
              const fail = att - conv;
              const ign = opp - att;
              return (
                <div className="h-2 rounded-full bg-muted/30 overflow-hidden flex">
                  {conv > 0 && (
                    <div className="bg-emerald-400/60" style={{ flex: conv }} />
                  )}
                  {fail > 0 && (
                    <div className="bg-amber-300/50" style={{ flex: fail }} />
                  )}
                  {ign > 0 && (
                    <div className="bg-red-300/30" style={{ flex: ign }} />
                  )}
                </div>
              );
            }

            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* ── When a teammate dies nearby ── */}
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground/70">
                      When a teammate is killed nearby →
                    </p>
                    {/* headline row */}
                    <div className="flex gap-3">
                      {[
                        {
                          v: p.trade_opportunities,
                          l: "opportunities",
                          c: "text-foreground/80"
                        },
                        {
                          v: p.trade_attempts,
                          l: "attempted",
                          c: "text-amber-300/80"
                        },
                        {
                          v: p.trades,
                          l: "converted",
                          c: "text-emerald-400/90"
                        },
                        {
                          v: ignored,
                          l: "ignored",
                          c:
                            ignored > 0
                              ? "text-red-400/80"
                              : "text-muted-foreground/40"
                        }
                      ].map((s) => (
                        <div key={s.l} className="text-center flex-1">
                          <div
                            className={cn(
                              "text-xl font-black leading-none",
                              s.c
                            )}
                          >
                            {s.v}
                          </div>
                          <div className="text-[10px] text-muted-foreground/50 mt-1">
                            {s.l}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* funnel legend + bar */}
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-emerald-400/70">
                          Success ({p.trades})
                        </span>
                        <span className="text-amber-300/70">
                          Failed ({failed})
                        </span>
                        <span className="text-red-300/60">
                          Ignored ({ignored})
                        </span>
                      </div>
                      <FunnelBar
                        opp={p.trade_opportunities}
                        att={p.trade_attempts}
                        conv={p.trades}
                      />
                    </div>
                    {/* rate chips */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <StatChip
                        value={`${attRate}%`}
                        label="Attempt rate"
                        valueClass={pctColor(attRate)}
                        note={`${p.trade_attempts}/${p.trade_opportunities} opp`}
                      />
                      <StatChip
                        value={`${convRate}%`}
                        label="Conversion rate"
                        valueClass={pctColor(convRate)}
                        note={`${p.trades}/${p.trade_attempts} attempts`}
                      />
                    </div>
                  </div>

                  {/* ── When you die ── */}
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground/70">
                      When you die →
                    </p>
                    {/* death bar */}
                    <div>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-emerald-400/70">
                          Traded ({p.traded})
                        </span>
                        <span className="text-red-300/60">
                          Not traded ({p.deaths - p.traded})
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted/30 overflow-hidden flex">
                        {p.traded > 0 && (
                          <div
                            className="bg-emerald-400/60"
                            style={{ flex: p.traded }}
                          />
                        )}
                        {p.deaths - p.traded > 0 && (
                          <div
                            className="bg-red-300/30"
                            style={{ flex: p.deaths - p.traded }}
                          />
                        )}
                      </div>
                    </div>
                    {/* death rate chips */}
                    <div className="grid grid-cols-2 gap-2">
                      <StatChip
                        value={`${deathTradedRate}%`}
                        label="Deaths traded"
                        valueClass={pctColor(deathTradedRate, 45, 65)}
                        note={`${p.traded}/${p.deaths} deaths avenged`}
                      />
                      <StatChip
                        value={`${fdTradedRate}%`}
                        label="FD traded rate"
                        valueClass={pctColor(fdTradedRate, 40, 60)}
                        note={`${p.first_death_traded}/${p.first_death_trade_opportunities} tradeable`}
                      />
                    </div>
                  </div>
                </div>

                {/* ── First death analysis — full width below grid ── */}
                {p.first_deaths > 0 && (
                  <div className="rounded-md bg-muted/20 border border-border/40 p-3 space-y-2 sm:col-span-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      First death analysis
                    </p>
                    <div className="flex gap-3">
                      {[
                        {
                          v: p.first_deaths,
                          l: "total FDs",
                          c: "text-red-400"
                        },
                        {
                          v: p.first_death_trade_opportunities,
                          l: "tradeable pos.",
                          c: "text-amber-400"
                        },
                        {
                          v: p.first_death_traded,
                          l: "traded",
                          c: "text-emerald-400"
                        },
                        {
                          v: fdIgnored,
                          l: "not tradeable",
                          c:
                            fdIgnored > 0
                              ? "text-red-300/60"
                              : "text-muted-foreground/40"
                        }
                      ].map((s) => (
                        <div key={s.l} className="text-center flex-1">
                          <div
                            className={cn(
                              "text-lg font-black leading-none",
                              s.c
                            )}
                          >
                            {s.v}
                          </div>
                          <div className="text-[10px] text-muted-foreground/50 mt-1 leading-tight">
                            {s.l}
                          </div>
                        </div>
                      ))}
                    </div>
                    {p.first_death_trade_opportunities > 0 && (
                      <div>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-emerald-400/70">
                            Traded ({p.first_death_traded})
                          </span>
                          <span className="text-amber-300/70">
                            Failed ({fdFailed})
                          </span>
                          <span className="text-red-300/60">
                            Not tradeable ({fdIgnored})
                          </span>
                        </div>
                        <FunnelBar
                          opp={p.first_deaths}
                          att={p.first_death_trade_opportunities}
                          conv={p.first_death_traded}
                        />
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          })()
        ) : (
          <p className="text-sm text-muted-foreground">
            No trade data available.
          </p>
        )}
      </SectionCard>

      {/* ── HIT MAP ── */}
      <SectionCard icon="🫁" title="Hit Map" accent="#f87171">
        <div className="flex gap-2 mb-4">
          {(["dealt", "received"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setHitMode(m)}
              className={cn(
                "text-sm font-semibold px-3 py-1.5 rounded border transition-colors",
                hitMode === m
                  ? "bg-red-900/30 border-red-600/50 text-red-300"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {m === "dealt" ? "Hits Dealt" : "Hits Received"}
            </button>
          ))}
        </div>
        <BodyHeatmap rows={hitRows} mode={hitMode} />
      </SectionCard>

      {/* ── UTILITY & FLASHES ── */}
      <SectionCard icon="🔥" title="Utility & Flashes" accent="#2dd4bf">
        <FlashSection
          utilityStats={utilityStats}
          playerStats={playerStats}
          flashesByRound={flashesByRound}
          utilityByRound={utilityByRound}
        />
      </SectionCard>

      {/* ── ROUND DRILL-DOWN ── */}
      <SectionCard icon="📋" title="Round-by-Round Drill Down" accent="#a78bfa">
        {rounds.length > 0 ? (
          <RoundTimeline
            rounds={rounds}
            steamId={steamId}
            killsByRound={killsByRound}
            deathsByRound={deathsByRound}
            flashesByRound={flashesByRound}
            utilityByRound={utilityByRound}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            No round data available.
          </p>
        )}
      </SectionCard>
    </div>
  );
}
