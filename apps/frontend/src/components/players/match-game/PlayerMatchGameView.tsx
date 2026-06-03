"use client";

import React, { useState, useMemo } from "react";
import { cn, createNextUrl, mapToReadableName } from "@/lib/utils";
import { format } from "date-fns";
import type { LucideIcon } from "lucide-react";
import type {
  MatchGameOpeningDuel,
  MatchInfo,
  MatchMapsPlayed
} from "@eggosystem/types";
import { useMatchMaps } from "@/hooks/data/useMatchMaps";
import {
  Crosshair,
  Target,
  Zap,
  Flame,
  ListOrdered,
  Activity,
  Eye,
  Swords,
  Skull,
  ChevronDown
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
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
  type RoundWastedUtilityEvent,
  type RoundUtilityThrowEvent,
  type RoundUtilityDamageEvent,
  type PlayerGameUtilityStats
} from "@/hooks/data/useMatchGameData";
import {
  AnalysisCard,
  GOOD_COLOR,
  BAD_COLOR,
  NEUTRAL_COLOR,
  MiniBar,
  SegmentBar
} from "@/components/matches/match/game/analysis/AnalysisVizComponents";
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
  shots?: number | null;
  shots_hit?: number | null;
  total_strafing_shots?: number | null;
  good_strafing_shots?: number | null;
  ttd?: number | null;
  time_to_kill?: number | null;
  crosshair_placement?: number | null;
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

function pctColor(v: number, hi = 60, lo = 35) {
  if (v >= hi) return GOOD_COLOR;
  if (v >= lo) return "var(--kanaliiga-light-brown)";
  return BAD_COLOR;
}

/** Kanaliiga map ratings (PlayerStats, kills ≥ 10, n≈145k). p10=0.64 p25=0.75 p50=0.90 p75=1.08 mean=0.94 */
const KANA_RATING_COLORS = {
  poor: BAD_COLOR,
  weak: "var(--kanaliiga-orange)",
  average: GOOD_COLOR,
  good: "oklch(0.58 0.13 155)",
  elite: "oklch(0.45 0.10 155)"
} as const;

const KANA_RATING_BENCHMARKS = {
  gaugeMin: 0.55,
  /** Median (0.90) sits at 50% of the arc: max = median + (median − min) */
  gaugeMax: 1.25,
  leagueMedian: 0.9,
  leagueMean: 0.94,
  tiers: [
    { label: "Poor", from: 0, color: KANA_RATING_COLORS.poor },
    { label: "Weak", from: 0.65, color: KANA_RATING_COLORS.weak },
    { label: "Average", from: 0.78, color: KANA_RATING_COLORS.average },
    { label: "Good", from: 0.98, color: KANA_RATING_COLORS.good },
    { label: "Strong", from: 1.12, color: KANA_RATING_COLORS.elite }
  ] as const
};

function resolveKanaRatingTier(r: number) {
  let tier: (typeof KANA_RATING_BENCHMARKS.tiers)[number] =
    KANA_RATING_BENCHMARKS.tiers[0];
  for (const t of KANA_RATING_BENCHMARKS.tiers) {
    if (r >= t.from) tier = t;
  }
  return tier;
}

function accuracyPct(
  shotsHit: number | null | undefined,
  shots: number | null | undefined
) {
  if (!shots || !shotsHit) return null;
  return Math.round((shotsHit / shots) * 1000) / 10;
}

function counterStrafePct(
  good: number | null | undefined,
  total: number | null | undefined
) {
  if (!total) return null;
  return Math.round(((good ?? 0) / total) * 1000) / 10;
}

const ADR_GAUGE = { min: 0, max: 120, benchmark: 80 } as const;

function crosshairColor(deg: number) {
  if (deg <= 5) return GOOD_COLOR;
  if (deg <= 10) return "var(--kanaliiga-light-brown)";
  return BAD_COLOR;
}

function msColor(ms: number, good: number, ok: number) {
  if (ms <= good) return GOOD_COLOR;
  if (ms <= ok) return "var(--kanaliiga-light-brown)";
  return BAD_COLOR;
}

/** Lower raw values → higher ring fill (0–100). */
function invertGaugePct(value: number, max: number) {
  return Math.max(0, Math.min(100, 100 - (value / max) * 100));
}

function AdrGauge({ adr, size = 168 }: { adr: number; size?: number }) {
  return (
    <ArcGauge
      value={adr}
      display={adr.toFixed(1)}
      label="ADR"
      sub={`benchmark ${ADR_GAUGE.benchmark}`}
      min={ADR_GAUGE.min}
      max={ADR_GAUGE.max}
      referenceValue={ADR_GAUGE.benchmark}
      color={pctColor(adr, 90, 70)}
      size={size}
      compact
    />
  );
}

function KanaRatingGauge({
  rating,
  size = 168
}: {
  rating: number | null;
  size?: number;
}) {
  if (rating == null) return null;
  const tier = resolveKanaRatingTier(rating);
  return (
    <ArcGauge
      value={rating}
      display={rating.toFixed(2)}
      label="KanaRating"
      sub={tier.label}
      min={KANA_RATING_BENCHMARKS.gaugeMin}
      max={KANA_RATING_BENCHMARKS.gaugeMax}
      referenceValue={KANA_RATING_BENCHMARKS.leagueMedian}
      color={tier.color}
      size={size}
      compact
    />
  );
}

/* ─────────────────────────────────────────── SectionCard ── */

function SectionCard({
  icon: Icon,
  title,
  sub,
  children
}: {
  icon: LucideIcon;
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <AnalysisCard
      title={title}
      sub={sub}
      right={
        <Icon className="size-4 text-primary shrink-0" strokeWidth={1.5} />
      }
      className="mb-3"
    >
      {children}
    </AnalysisCard>
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
    <div className="flex flex-col px-3 py-2.5 rounded-[var(--radius)] bg-muted/20 border border-border/50 min-w-[60px]">
      <span
        className={cn(
          "text-lg font-bold tabular-nums leading-none text-foreground",
          valueClass
        )}
      >
        {value}
      </span>
      <span className="text-[11px] text-muted-foreground mt-1.5">{label}</span>
      {note && (
        <span className="text-[11px] text-muted-foreground/60 mt-0.5">
          {note}
        </span>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────── WeaponDonut ── */

const WEAPON_COLORS = [
  "var(--weapon-viz-1)",
  "var(--weapon-viz-2)",
  "var(--weapon-viz-3)",
  "var(--weapon-viz-4)",
  "var(--weapon-viz-5)",
  "var(--weapon-viz-6)",
  "var(--weapon-viz-7)",
  "var(--weapon-viz-8)"
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
      color: WEAPON_COLORS[i % WEAPON_COLORS.length] ?? NEUTRAL_COLOR
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
              fill={s.color}
              fillOpacity={0.82}
              stroke={s.color}
              strokeOpacity={0.35}
              strokeWidth={1}
            />
          ))}
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            fontSize={20}
            fontWeight={700}
            fill="var(--foreground)"
            opacity={0.9}
          >
            {total}
          </text>
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            fontSize={11}
            fill="var(--muted-foreground)"
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
                <div className="flex gap-3 text-xs tabular-nums">
                  <span className="text-muted-foreground">{p}%</span>
                  <span className="font-semibold" style={{ color: s.color }}>
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
              <MiniBar value={s.kills} max={total} color={s.color} height={6} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

const UTILITY_VIZ_COLORS = {
  flash: "var(--weapon-viz-1)",
  smoke: "var(--weapon-viz-5)",
  wasted: NEUTRAL_COLOR
} as const;

function UtilityDonut({
  flashesThrown,
  smokesThrown,
  wasted,
  utilityDamage,
  enemiesBlinded,
  teammatesFlashed,
  avgBlindSec
}: {
  flashesThrown: number;
  smokesThrown: number;
  wasted: number;
  utilityDamage: number;
  enemiesBlinded: number;
  teammatesFlashed: number;
  avgBlindSec: number | null;
}) {
  const segments = [
    { label: "Flashes", value: flashesThrown, color: UTILITY_VIZ_COLORS.flash },
    { label: "Smokes", value: smokesThrown, color: UTILITY_VIZ_COLORS.smoke },
    ...(wasted > 0
      ? [{ label: "Wasted", value: wasted, color: UTILITY_VIZ_COLORS.wasted }]
      : [])
  ].filter((s) => s.value > 0);

  const totalThrown = segments.reduce((sum, s) => sum + s.value, 0);

  if (totalThrown === 0 && utilityDamage === 0) {
    return (
      <p className="text-sm text-muted-foreground">No utility data recorded.</p>
    );
  }

  const size = 144;
  const cx = size / 2;
  const cy = size / 2;
  const oR = size / 2 - 6;
  const iR = oR * 0.58;

  const sweeps =
    totalThrown > 0
      ? segments.map((s) => (s.value / totalThrown) * 360)
      : [360];
  const startAngles = sweeps.reduce<number[]>(
    (acc, s) => [...acc, (acc[acc.length - 1] ?? 0) + s],
    [0]
  );
  const arcs =
    totalThrown > 0
      ? segments.map((s, i) => {
          const start = startAngles[i] ?? 0;
          const sweep = sweeps[i] ?? 0;
          return {
            ...s,
            path: arcPath(cx, cy, oR, iR, start, start + sweep - 1.5)
          };
        })
      : [
          {
            label: "Utility",
            value: 0,
            color: "var(--muted)",
            path: arcPath(cx, cy, oR, iR, 0, 359)
          }
        ];

  const extraStats = [
    {
      label: "HE / molotov damage",
      value: utilityDamage > 0 ? `${utilityDamage} HP` : "—",
      color: "var(--kanaliiga-orange)"
    },
    {
      label: "Enemies blinded",
      value: String(enemiesBlinded),
      sub: avgBlindSec != null ? `${avgBlindSec.toFixed(1)}s avg` : undefined,
      color: GOOD_COLOR
    },
    {
      label: "Teammates flashed",
      value: String(teammatesFlashed),
      color: "var(--muted-foreground)"
    }
  ];

  return (
    <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          {arcs.map((s) => (
            <path
              key={s.label}
              d={s.path}
              fill={s.color}
              fillOpacity={totalThrown > 0 ? 0.82 : 0.25}
              stroke={s.color}
              strokeOpacity={0.35}
              strokeWidth={1}
            />
          ))}
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            fontSize={20}
            fontWeight={700}
            fill="var(--foreground)"
            opacity={0.9}
          >
            {totalThrown > 0 ? totalThrown : utilityDamage}
          </text>
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            fontSize={11}
            fill="var(--muted-foreground)"
          >
            {totalThrown > 0 ? "thrown" : "HP"}
          </text>
        </svg>
      </div>
      <div className="flex-1 w-full space-y-2.5">
        {segments.map((s) => {
          const share = totalThrown > 0 ? pct(s.value, totalThrown) : 0;
          return (
            <div key={s.label}>
              <div className="flex justify-between text-sm mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-sm inline-block shrink-0"
                    style={{ background: s.color }}
                  />
                  <span className="text-foreground/80">{s.label}</span>
                </div>
                <div className="flex gap-3 text-xs tabular-nums">
                  <span className="text-muted-foreground">{share}%</span>
                  <span className="font-semibold" style={{ color: s.color }}>
                    {s.value}
                  </span>
                </div>
              </div>
              <MiniBar
                value={s.value}
                max={totalThrown}
                color={s.color}
                height={6}
              />
            </div>
          );
        })}
        {extraStats.map((stat) => (
          <div
            key={stat.label}
            className="flex justify-between items-baseline text-sm pt-1 border-t border-border/30 first:border-0 first:pt-0"
          >
            <span className="text-muted-foreground">{stat.label}</span>
            <div className="text-right">
              <span
                className="font-semibold tabular-nums"
                style={{ color: stat.color }}
              >
                {stat.value}
              </span>
              {"sub" in stat && stat.sub && (
                <span className="block text-[10px] text-muted-foreground/70 tabular-nums">
                  {stat.sub}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── aim viz ── */

interface AimMetric {
  label: string;
  value: number | null;
  display?: string;
  sub?: string;
  hi?: number;
  lo?: number;
}

function aimMetricTooltipText(metric: AimMetric) {
  const main =
    metric.display ??
    (metric.value != null ? `${Math.round(metric.value)}%` : "—");
  return metric.sub
    ? `${metric.label}: ${main} (${metric.sub})`
    : `${metric.label}: ${main}`;
}

function RadarTooltipTarget({
  leftPct,
  topPct,
  ariaLabel,
  tooltip,
  className
}: {
  leftPct: number;
  topPct: number;
  ariaLabel: string;
  tooltip: string;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "absolute -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className
          )}
          style={{ left: `${leftPct}%`, top: `${topPct}%` }}
          aria-label={ariaLabel}
        />
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function describeStrokeArc(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number
) {
  const start = polarPoint(cx, cy, r, startDeg);
  const end = polarPoint(cx, cy, r, endDeg);
  const sweep = endDeg - startDeg;
  const largeArc = Math.abs(sweep) > 180 ? 1 : 0;
  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} A ${r} ${r} 0 ${largeArc} ${sweep >= 0 ? 1 : 0} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`;
}

function RingGauge({
  label,
  value,
  display,
  sub,
  color = "var(--kanaliiga-orange)",
  size = 92,
  title
}: {
  label: string;
  value: number | null;
  display: string;
  sub?: string;
  color?: string;
  size?: number;
  title?: string;
}) {
  const stroke = size <= 72 ? 5 : 7;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const pct = value == null ? 0 : Math.min(100, Math.max(0, value)) / 100;
  const dash = circumference * pct;
  const displayClass = size <= 72 ? "text-xs font-bold" : "text-lg font-bold";

  return (
    <div
      className="flex flex-col items-center gap-0.5"
      title={title ?? sub ?? undefined}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={stroke}
          />
          {value != null && (
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-0.5">
          <span
            className={`${displayClass} tabular-nums leading-none text-center`}
          >
            {display}
          </span>
        </div>
      </div>
      <span className="text-[10px] text-muted-foreground text-center leading-tight max-w-[4.5rem]">
        {label}
      </span>
      {sub && (
        <span className="text-[9px] text-muted-foreground/60 tabular-nums leading-none">
          {sub}
        </span>
      )}
    </div>
  );
}

function AimRadar({
  metrics,
  size: inner = 260
}: {
  metrics: AimMetric[];
  size?: number;
}) {
  const pad = inner <= 220 ? 24 : 32;
  const size = inner + pad * 2;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = inner * 0.36;
  const count = Math.max(metrics.length, 3);
  const angles = Array.from({ length: count }, (_, i) => (360 / count) * i);
  const labelOffset = inner <= 220 ? 26 : 28;

  const points = metrics.map((m, i) => {
    const v = m.value ?? 0;
    const angle = angles[i] ?? 0;
    return polarPoint(cx, cy, maxR * (v / 100), angle);
  });
  const polygon = points
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  function radarLabelProps(angle: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    const x = Math.cos(rad);
    const y = Math.sin(rad);

    let textAnchor: "start" | "middle" | "end" = "middle";
    if (x > 0.35) textAnchor = "start";
    else if (x < -0.35) textAnchor = "end";

    let dominantBaseline: "auto" | "middle" | "hanging" = "middle";
    if (y < -0.35) dominantBaseline = "auto";
    else if (y > 0.35) dominantBaseline = "hanging";

    return { textAnchor, dominantBaseline };
  }

  return (
    <div
      className="relative inline-flex shrink-0"
      style={{ width: inner, height: inner }}
    >
      <svg
        width={inner}
        height={inner}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
        aria-hidden
      >
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <polygon
            key={scale}
            points={angles
              .map((a) => {
                const p = polarPoint(cx, cy, maxR * scale, a);
                return `${p.x},${p.y}`;
              })
              .join(" ")}
            fill="none"
            stroke="var(--border)"
            strokeWidth={1}
            opacity={0.55}
          />
        ))}
        {angles.map((a) => {
          const p = polarPoint(cx, cy, maxR, a);
          return (
            <line
              key={a}
              x1={cx}
              y1={cy}
              x2={p.x}
              y2={p.y}
              stroke="var(--border)"
              strokeWidth={1}
              opacity={0.45}
            />
          );
        })}
        {points.length >= 3 && (
          <polygon
            points={polygon}
            fill="color-mix(in oklab, var(--kanaliiga-orange) 28%, transparent)"
            stroke="var(--kanaliiga-orange)"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        )}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="var(--kanaliiga-orange)"
            stroke="var(--card)"
            strokeWidth={2}
          />
        ))}
        {metrics.map((m, i) => {
          const angle = angles[i] ?? 0;
          const lp = polarPoint(cx, cy, maxR + labelOffset, angle);
          return (
            <text
              key={m.label}
              x={lp.x}
              y={lp.y}
              fontSize={12}
              fontWeight={500}
              fill="var(--foreground)"
              opacity={0.85}
              pointerEvents="none"
              {...radarLabelProps(angle)}
            >
              {m.label}
            </text>
          );
        })}
      </svg>
      {metrics.map((m, i) => {
        const p = points[i];
        if (!p) return null;
        const tooltip = aimMetricTooltipText(m);
        const leftPct = (p.x / size) * 100;
        const topPct = (p.y / size) * 100;
        return (
          <RadarTooltipTarget
            key={`${m.label}-point`}
            leftPct={leftPct}
            topPct={topPct}
            ariaLabel={tooltip}
            tooltip={tooltip}
            className="size-7 cursor-help bg-transparent hover:bg-primary/10"
          />
        );
      })}
      {metrics.map((m, i) => {
        const angle = angles[i] ?? 0;
        const lp = polarPoint(cx, cy, maxR + labelOffset, angle);
        const tooltip = aimMetricTooltipText(m);
        return (
          <RadarTooltipTarget
            key={`${m.label}-label`}
            leftPct={(lp.x / size) * 100}
            topPct={(lp.y / size) * 100}
            ariaLabel={tooltip}
            tooltip={tooltip}
            className="h-5 min-w-[2.75rem] cursor-help px-1 bg-transparent hover:bg-primary/10"
          />
        );
      })}
    </div>
  );
}

function ArcGauge({
  value,
  display,
  label,
  sub,
  min,
  max,
  color = "var(--kanaliiga-orange)",
  size = 200,
  referenceValue,
  compact = false
}: {
  value: number | null;
  display: string;
  label: string;
  sub?: string;
  min: number;
  max: number;
  color?: string;
  size?: number;
  /** Draws a tick on the track (e.g. league median for context) */
  referenceValue?: number;
  /** Smaller footprint for inline header use */
  compact?: boolean;
}) {
  const pct =
    value == null ? 0 : Math.min(1, Math.max(0, (value - min) / (max - min)));
  const refPct =
    referenceValue == null
      ? null
      : Math.min(1, Math.max(0, (referenceValue - min) / (max - min)));

  const cx = size / 2;

  if (compact) {
    /** Top arch (315° → 45°): value sits under the curve, not overlapping it */
    const r = size * 0.4;
    const stroke = 5;
    const startAngle = 315;
    const endAngle = 405;
    const span = endAngle - startAngle;
    const valueEnd = startAngle + span * pct;
    const cy = r + stroke + 6;
    const svgHeight = Math.ceil(cy + stroke + 2);
    const refTick =
      refPct != null
        ? (() => {
            const a = startAngle + span * refPct;
            const inner = polarPoint(cx, cy, r - stroke * 0.55, a);
            const outer = polarPoint(cx, cy, r + stroke * 0.55, a);
            return { inner, outer };
          })()
        : null;

    return (
      <div
        className="flex flex-col items-center shrink-0"
        title={sub ?? undefined}
      >
        <svg
          width={size}
          height={svgHeight}
          viewBox={`0 0 ${size} ${svgHeight}`}
          aria-hidden
        >
          <path
            d={describeStrokeArc(cx, cy, r, startAngle, endAngle)}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={stroke}
            strokeLinecap="butt"
          />
          {refTick && (
            <line
              x1={refTick.inner.x}
              y1={refTick.inner.y}
              x2={refTick.outer.x}
              y2={refTick.outer.y}
              stroke="var(--muted-foreground)"
              strokeWidth={1.5}
              strokeLinecap="round"
              opacity={0.5}
            />
          )}
          {pct > 0 && value != null && (
            <path
              d={describeStrokeArc(cx, cy, r, startAngle, valueEnd)}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="-mt-0.5 flex flex-col items-center">
          <span
            className="font-bold tabular-nums leading-none"
            style={{ fontSize: size * 0.2, color }}
          >
            {display}
          </span>
          <span className="text-[9px] text-muted-foreground tracking-wide mt-0.5">
            {label}
          </span>
        </div>
      </div>
    );
  }

  const r = size * 0.35;
  const stroke = size * 0.055;
  /** Bottom speedometer: 135° → 225° with apex at 180° (6 o'clock) */
  const startAngle = 135;
  const endAngle = 225;
  const span = endAngle - startAngle;
  const valueEnd = startAngle + span * pct;
  const cy = r + stroke * 1.5;
  const height = cy + r + stroke * 2;
  const refTick =
    refPct != null
      ? (() => {
          const a = startAngle + span * refPct;
          const inner = polarPoint(cx, cy, r - stroke * 0.6, a);
          const outer = polarPoint(cx, cy, r + stroke * 0.6, a);
          return { inner, outer };
        })()
      : null;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height }}>
        <svg width={size} height={height} viewBox={`0 0 ${size} ${height}`}>
          <path
            d={describeStrokeArc(cx, cy, r, startAngle, endAngle)}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={stroke}
            strokeLinecap="butt"
          />
          {refTick && (
            <line
              x1={refTick.inner.x}
              y1={refTick.inner.y}
              x2={refTick.outer.x}
              y2={refTick.outer.y}
              stroke="var(--muted-foreground)"
              strokeWidth={2}
              strokeLinecap="round"
              opacity={0.55}
            />
          )}
          {pct > 0 && value != null && (
            <path
              d={describeStrokeArc(cx, cy, r, startAngle, valueEnd)}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
            />
          )}
        </svg>
        <div
          className="absolute inset-x-0 flex flex-col items-center"
          style={{ bottom: 0 }}
        >
          <span
            className="font-bold tabular-nums text-primary leading-none"
            style={{ fontSize: size * 0.2 }}
          >
            {display}
          </span>
          <span className="text-[11px] text-muted-foreground mt-1 uppercase tracking-wider">
            {label}
          </span>
          {sub && (
            <span className="text-[10px] text-muted-foreground/50 mt-0.5">
              {sub}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function AimImpactSection({
  playerStats,
  weaponStats
}: {
  playerStats: ExtendedPlayerStats;
  weaponStats: WeaponStat[];
}) {
  const acc = accuracyPct(playerStats.shots_hit, playerStats.shots);
  const strafe = counterStrafePct(
    playerStats.good_strafing_shots,
    playerStats.total_strafing_shots
  );
  const awpKills = weaponStats.find((w) => w.weapon === "AWP")?.kills ?? 0;
  const crosshair = playerStats.crosshair_placement;
  const ttd = playerStats.ttd;
  const ttk = playerStats.time_to_kill;

  const aimMetrics: AimMetric[] = [
    {
      label: "HS%",
      value: playerStats.hs_percent,
      display: `${playerStats.hs_percent.toFixed(0)}%`,
      hi: 55,
      lo: 35
    },
    {
      label: "Acc",
      value: acc,
      display: acc != null ? `${acc}%` : "—",
      sub: playerStats.shots
        ? `${playerStats.shots_hit ?? 0}/${playerStats.shots}`
        : undefined,
      hi: 25,
      lo: 15
    },
    {
      label: "Strafing",
      value: strafe,
      display: strafe != null ? `${strafe}%` : "—",
      sub: playerStats.total_strafing_shots
        ? `${playerStats.good_strafing_shots ?? 0}/${playerStats.total_strafing_shots}`
        : undefined,
      hi: 80,
      lo: 60
    },
    {
      label: "KAST",
      value: playerStats.kast_percentage,
      display: `${playerStats.kast_percentage.toFixed(0)}%`,
      hi: 73,
      lo: 60
    },
    {
      label: "Crosshair",
      value: crosshair != null ? invertGaugePct(crosshair, 15) : null,
      display: crosshair != null ? `${crosshair.toFixed(1)}°` : "—",
      sub: "lower is better"
    },
    {
      label: "TTD",
      value: ttd != null ? invertGaugePct(ttd, 800) : null,
      display: ttd != null ? `${Math.round(ttd)}ms` : "—",
      sub: "lower is better"
    }
  ];

  const ringSize = 74;
  const radarSize = 215;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end">
        <div className="flex items-end justify-center gap-4">
          <AdrGauge adr={playerStats.adr} />
          <KanaRatingGauge rating={playerStats.kana_rating} />
        </div>
        <div className="flex justify-center">
          <AimRadar metrics={aimMetrics} size={radarSize} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-border/40">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
            Round impact
          </p>
          <div className="grid grid-cols-2 gap-2">
            <ImpactTile
              icon={Eye}
              label="Enemies flashed"
              value={playerStats.enemies_flashed}
              accent="var(--weapon-viz-1)"
              compact
            />
            <ImpactTile
              icon={Zap}
              label="Flash assists"
              value={playerStats.flash_assists}
              accent="var(--weapon-viz-6)"
              compact
            />
            <ImpactTile
              icon={Crosshair}
              label="AWP kills"
              value={awpKills}
              accent="var(--weapon-viz-3)"
              compact
            />
            <ImpactTile
              icon={Activity}
              label="Headshots"
              value={playerStats.headshots}
              accent="var(--kanaliiga-light-brown)"
              compact
            />
          </div>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 text-center">
            Aim metrics
          </p>
          <div className="flex flex-col items-center gap-3">
            <div className="grid grid-cols-4 gap-x-2 gap-y-3 place-items-center">
              <RingGauge
                label="Headshot %"
                value={playerStats.hs_percent}
                display={`${playerStats.hs_percent.toFixed(0)}%`}
                color={pctColor(playerStats.hs_percent, 55, 35)}
                size={ringSize}
              />
              <RingGauge
                label="Accuracy"
                value={acc}
                display={acc != null ? `${acc}%` : "—"}
                sub={
                  playerStats.shots
                    ? `${playerStats.shots_hit ?? 0}/${playerStats.shots}`
                    : undefined
                }
                color={acc != null ? pctColor(acc, 25, 15) : NEUTRAL_COLOR}
                size={ringSize}
              />
              <RingGauge
                label="Strafing"
                value={strafe}
                display={strafe != null ? `${strafe}%` : "—"}
                sub={
                  playerStats.total_strafing_shots
                    ? `${playerStats.good_strafing_shots ?? 0}/${playerStats.total_strafing_shots}`
                    : undefined
                }
                color={
                  strafe != null ? pctColor(strafe, 80, 60) : NEUTRAL_COLOR
                }
                size={ringSize}
              />
              <RingGauge
                label="KAST"
                value={playerStats.kast_percentage}
                display={`${playerStats.kast_percentage.toFixed(0)}%`}
                color={pctColor(playerStats.kast_percentage, 73, 60)}
                size={ringSize}
              />
            </div>
            <div className="grid grid-cols-3 gap-x-2 gap-y-3 place-items-center">
              <RingGauge
                label="Crosshair"
                value={crosshair != null ? invertGaugePct(crosshair, 15) : null}
                display={crosshair != null ? `${crosshair.toFixed(1)}°` : "—"}
                title="Lower is better"
                color={
                  crosshair != null ? crosshairColor(crosshair) : NEUTRAL_COLOR
                }
                size={ringSize}
              />
              <RingGauge
                label="Time to damage"
                value={ttd != null ? invertGaugePct(ttd, 800) : null}
                display={ttd != null ? `${Math.round(ttd)}ms` : "—"}
                title="Lower is better"
                color={ttd != null ? msColor(ttd, 400, 600) : NEUTRAL_COLOR}
                size={ringSize}
              />
              <RingGauge
                label="Time to kill"
                value={ttk != null ? invertGaugePct(ttk, 800) : null}
                display={ttk != null ? `${Math.round(ttk)}ms` : "—"}
                title="Lower is better"
                color={ttk != null ? msColor(ttk, 400, 600) : NEUTRAL_COLOR}
                size={ringSize}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImpactTile({
  icon: Icon,
  label,
  value,
  accent = "var(--kanaliiga-orange)",
  compact = false
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[var(--radius)] border border-border/50 bg-gradient-to-br from-muted/25 to-muted/5 ${compact ? "p-2" : "p-3"}`}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[var(--radius)]"
        style={{ background: accent }}
      />
      <Icon
        className={`${compact ? "size-3.5 mb-1" : "size-4 mb-2"} text-muted-foreground`}
        strokeWidth={1.5}
      />
      <div
        className={`${compact ? "text-lg" : "text-xl"} font-bold tabular-nums leading-none`}
      >
        {value}
      </div>
      <div
        className={`text-[10px] text-muted-foreground ${compact ? "mt-1" : "mt-1.5"}`}
      >
        {label}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── FK/FD section ── */

function openingDuelTooltip(round: RoundRow, fkfd: "fk" | "fd" | null): string {
  const duel = round.openingDuel;
  if (!duel || !fkfd) {
    return `Round ${round.round_number} · ${round.outcome === "win" ? "Won" : round.outcome === "loss" ? "Lost" : "—"}`;
  }
  if (fkfd === "fk") {
    const hs = duel.is_headshot ? " · HS" : "";
    return `Round ${round.round_number} · First kill · ${duel.weapon} · ${duel.time_in_round.toFixed(1)}s${hs}`;
  }
  const trade =
    duel.trade === "converted"
      ? "Traded"
      : duel.trade === "attempted"
        ? "Trade attempted"
        : "Isolated";
  return `Round ${round.round_number} · First death · ${duel.weapon} · ${trade}`;
}

function OpeningDuelMetric({
  icon: Icon,
  label,
  value,
  sub,
  accent
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius)] border border-border/50 bg-gradient-to-br from-muted/25 to-muted/5 p-4">
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[var(--radius)]"
        style={{ background: accent }}
      />
      <Icon className="size-4 mb-2 text-muted-foreground" strokeWidth={1.5} />
      <div
        className="text-2xl font-bold tabular-nums leading-none"
        style={{ color: accent }}
      >
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground mt-1.5">{label}</div>
      {sub && (
        <div className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</div>
      )}
    </div>
  );
}

function FKFDSection({
  openingDuels,
  steamId,
  rounds
}: {
  openingDuels: MatchGameOpeningDuel[];
  steamId: string;
  rounds: RoundRow[];
}) {
  const fkRounds = openingDuels
    .filter((d) => String(d.killer_steam_id) === String(steamId))
    .map((d) => d.round_number);
  const playerFdDuels = openingDuels.filter(
    (d) => String(d.victim_steam_id) === String(steamId)
  );
  const fdRounds = playerFdDuels.map((d) => d.round_number);

  const fkCount = fkRounds.length;
  const fdCount = fdRounds.length;
  const neutralCount = Math.max(0, rounds.length - fkCount - fdCount);
  const fdTraded = playerFdDuels.filter((d) => d.trade === "converted").length;
  const fdFailed = playerFdDuels.filter((d) => d.trade === "attempted").length;
  const fdNotTradeable = playerFdDuels.filter(
    (d) => d.trade === "isolated"
  ).length;
  const fdTradeable = fdTraded + fdFailed;

  return (
    <div className="space-y-6">
      <div className="rounded-[var(--radius)] border border-border/50 bg-muted/10 p-4 sm:p-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3 mb-4">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Swords className="size-3.5 text-primary" strokeWidth={2} />
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                First kills
              </p>
            </div>
            <p
              className="text-4xl font-bold tabular-nums leading-none"
              style={{ color: GOOD_COLOR }}
            >
              {fkCount}
            </p>
            <p className="text-[11px] text-muted-foreground/70 mt-1.5 tabular-nums">
              {pct(fkCount, rounds.length)}% of rounds
            </p>
          </div>

          <div className="text-center px-2 pb-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Opening duels
            </p>
            <p className="text-lg font-semibold tabular-nums mt-1">
              {fkCount + fdCount}
              <span className="text-muted-foreground/50 font-normal text-sm">
                {" "}
                / {rounds.length}
              </span>
            </p>
          </div>

          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 mb-1">
              <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                First deaths
              </p>
              <Skull className="size-3.5 text-destructive" strokeWidth={2} />
            </div>
            <p
              className="text-4xl font-bold tabular-nums leading-none"
              style={{ color: BAD_COLOR }}
            >
              {fdCount}
            </p>
            <p className="text-[11px] text-muted-foreground/70 mt-1.5 tabular-nums">
              {pct(fdCount, rounds.length)}% of rounds
            </p>
          </div>
        </div>

        <SegmentBar
          height={12}
          showPct={false}
          segments={[
            { label: "First kills", value: fkCount, color: GOOD_COLOR },
            {
              label: "Other rounds",
              value: neutralCount,
              color: "var(--muted)"
            },
            { label: "First deaths", value: fdCount, color: BAD_COLOR }
          ].filter((s) => s.value > 0)}
        />
      </div>

      {fdCount > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-[var(--radius)] border border-border/50 bg-muted/10 p-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Opening duel first deaths — trade support
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { v: fdTraded, l: "Traded", c: GOOD_COLOR },
                { v: fdFailed, l: "Failed", c: "var(--kanaliiga-light-brown)" },
                { v: fdNotTradeable, l: "No trade", c: NEUTRAL_COLOR }
              ].map((s) => (
                <div key={s.l}>
                  <div
                    className="text-xl font-bold tabular-nums leading-none"
                    style={{ color: s.c }}
                  >
                    {s.v}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>
            <SegmentBar
              height={10}
              showPct={false}
              segments={[
                { label: "Traded", value: fdTraded, color: GOOD_COLOR },
                {
                  label: "Failed",
                  value: fdFailed,
                  color: "var(--kanaliiga-light-brown)"
                },
                {
                  label: "No trade",
                  value: fdNotTradeable,
                  color: NEUTRAL_COLOR
                }
              ].filter((s) => s.value > 0)}
            />
            {fdTradeable > 0 && (
              <p className="text-[11px] text-muted-foreground tabular-nums">
                {pct(fdTraded, fdTradeable)}% conversion on tradeable FDs (
                {fdTraded}/{fdTradeable})
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <OpeningDuelMetric
              icon={Target}
              label="FD tradeable"
              value={`${fdTradeable}/${fdCount}`}
              sub={
                fdCount > 0
                  ? `${pct(fdTradeable, fdCount)}% of your FDs`
                  : undefined
              }
              accent="var(--kanaliiga-light-brown)"
            />
            <OpeningDuelMetric
              icon={Zap}
              label="FD traded"
              value={fdTradeable > 0 ? `${fdTraded}/${fdTradeable}` : "—"}
              sub={
                fdTradeable > 0
                  ? `${pct(fdTraded, fdTradeable)}% converted`
                  : fdCount > 0
                    ? "No tradeable opening deaths"
                    : undefined
              }
              accent={GOOD_COLOR}
            />
          </div>
        </div>
      )}

      <div>
        <p className="text-xs text-muted-foreground mb-3">Round-by-round</p>
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-1.5 min-w-max">
            {rounds.map((r) => {
              const isFk = r.fkfd === "fk";
              const isFd = r.fkfd === "fd";
              const isWin = !isFk && !isFd && r.outcome === "win";
              const isLoss = !isFk && !isFd && r.outcome === "loss";
              return (
                <div
                  key={r.round_number}
                  title={openingDuelTooltip(r, r.fkfd)}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-md border min-w-[2.75rem] h-12 px-1 transition-colors",
                    isFk &&
                      "border-emerald-500 bg-emerald-600 text-white shadow-sm",
                    isFd && "border-red-500 bg-red-600 text-white shadow-sm",
                    isWin &&
                      "border-border/70 bg-muted/30 border-l-[3px] border-l-emerald-500 text-foreground",
                    isLoss &&
                      "border-border/70 bg-muted/30 border-l-[3px] border-l-red-500 text-foreground",
                    !isFk &&
                      !isFd &&
                      r.outcome === "unknown" &&
                      "bg-muted/20 border-border/40 text-muted-foreground"
                  )}
                >
                  {(isFk || isFd) && (
                    <span
                      className={cn(
                        "text-[9px] font-bold uppercase leading-none tracking-wide",
                        isFk || isFd ? "text-white/95" : undefined
                      )}
                    >
                      {isFk ? "FK" : "FD"}
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-xs font-semibold tabular-nums leading-none",
                      isFk || isFd ? "mt-0.5 text-white" : "mt-0"
                    )}
                  >
                    {r.round_number}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-3">
          {[
            {
              swatch: "bg-emerald-600 border-emerald-500",
              label: "First kill"
            },
            { swatch: "bg-red-600 border-red-500", label: "First death" },
            {
              swatch:
                "bg-muted/30 border-border/70 border-l-[3px] border-l-emerald-500",
              label: "Round won"
            },
            {
              swatch:
                "bg-muted/30 border-border/70 border-l-[3px] border-l-red-500",
              label: "Round lost"
            }
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className={cn("w-3.5 h-3.5 rounded-sm border", l.swatch)} />
              <span className="text-[11px] text-muted-foreground">
                {l.label}
              </span>
            </div>
          ))}
        </div>
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
  if (max === 0 || n === 0) return "var(--muted)";
  const r = n / max;
  const alpha = Math.round((12 + r * 55) * 100) / 100;
  return `color-mix(in oklab, var(--kanaliiga-orange) ${alpha}%, var(--muted))`;
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
                  stroke="var(--border)"
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
                  stroke="var(--border)"
                  strokeWidth={1}
                />
              )}
              {n > 0 && (
                <text
                  x={cx}
                  y={cy + 4}
                  textAnchor="middle"
                  fontSize={z.id === "head" ? 11 : 9}
                  fontWeight={700}
                  fill="var(--foreground)"
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
                <MiniBar
                  value={n}
                  max={total}
                  color={heatFill(n, max)}
                  height={6}
                />
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

function formatRoundTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatUtilityTypeLabel(type: string) {
  const normalized = type.trim().toLowerCase();
  if (normalized === "he") return "HE";
  if (normalized === "molotov") return "Molotov";
  if (normalized === "incendiary") return "Incendiary";
  if (normalized === "smoke") return "Smoke";
  return type;
}

function normalizeUtilityThrowType(type: string) {
  return type.trim().toLowerCase();
}

function utilityThrowChipLabel(type: string, index: number) {
  const normalized = normalizeUtilityThrowType(type);
  if (normalized === "smoke") return `Smoke ${index}`;
  if (normalized === "he") return `HE ${index}`;
  if (normalized === "molotov") return `Molotov ${index}`;
  return `${formatUtilityTypeLabel(type)} ${index}`;
}

function isMolotovWeapon(weapon: string) {
  const normalized = weapon.trim().toLowerCase();
  return (
    normalized.includes("molotov") ||
    normalized.includes("incgrenade") ||
    normalized.includes("incendiary") ||
    normalized.includes("inferno") ||
    normalized === "utility_setup"
  );
}

function isHeWeapon(weapon: string) {
  const normalized = weapon.trim().toLowerCase();
  return (
    normalized.includes("hegrenade") ||
    normalized.includes("he grenade") ||
    normalized.includes("high explosive") ||
    normalized === "he"
  );
}

interface UtilityDamageGroup {
  weapon: string;
  label: string;
  throwTime: number;
  totalDamage: number;
  victims: {
    victim_nickname: string;
    health_damage: number;
    is_enemy_hit: boolean;
  }[];
  summaryOnly?: boolean;
}

function clusterUtilityDamageHits(
  hits: RoundUtilityDamageEvent[],
  gapSec = 3
): UtilityDamageGroup[] {
  const sorted = [...hits].sort((a, b) => a.time_in_round - b.time_in_round);
  const clusters: RoundUtilityDamageEvent[][] = [];
  let current: RoundUtilityDamageEvent[] = [];

  for (const hit of sorted) {
    const prev = current[current.length - 1];
    if (
      current.length === 0 ||
      hit.time_in_round - (prev?.time_in_round ?? 0) <= gapSec
    ) {
      current.push(hit);
    } else {
      clusters.push(current);
      current = [hit];
    }
  }
  if (current.length > 0) clusters.push(current);

  const heCount = { n: 0 };
  const molotovCount = { n: 0 };

  return clusters.map((cluster) => {
    const weapon = cluster[0]?.weapon ?? "hegrenade";
    const isMolotov = isMolotovWeapon(weapon);
    const label = isMolotov
      ? `Molotov ${++molotovCount.n}`
      : isHeWeapon(weapon)
        ? `HE ${++heCount.n}`
        : `Utility ${++heCount.n}`;

    const victimMap = new Map<
      string,
      { victim_nickname: string; health_damage: number; is_enemy_hit: boolean }
    >();
    for (const hit of cluster) {
      const existing = victimMap.get(hit.victim_nickname);
      if (existing) {
        existing.health_damage += hit.health_damage;
      } else {
        victimMap.set(hit.victim_nickname, {
          victim_nickname: hit.victim_nickname,
          health_damage: hit.health_damage,
          is_enemy_hit: hit.is_enemy_hit
        });
      }
    }

    const victims = [...victimMap.values()].sort(
      (a, b) => b.health_damage - a.health_damage
    );

    return {
      weapon,
      label,
      throwTime: cluster[0]?.time_in_round ?? 0,
      totalDamage: victims.reduce((sum, v) => sum + v.health_damage, 0),
      victims
    };
  });
}

function resolveUtilityDamageGroups(
  hits: RoundUtilityDamageEvent[],
  roundDamageTotal: number
): UtilityDamageGroup[] {
  const groups = clusterUtilityDamageHits(hits);
  if (groups.length > 0 || roundDamageTotal <= 0) return groups;

  return [
    {
      weapon: "hegrenade",
      label: "HE / Molotov",
      throwTime: 0,
      totalDamage: roundDamageTotal,
      victims: [],
      summaryOnly: true
    }
  ];
}

type UtilityChipKind = "flash" | "smoke" | "damage" | "grenade";

interface UtilityChipData {
  label: string;
  kind: UtilityChipKind;
}

function buildRoundUtilityChips(
  utility: RoundUtilityEvent | undefined,
  wasted: RoundWastedUtilityEvent[],
  utilityDamage: RoundUtilityDamageEvent[],
  throws: RoundUtilityThrowEvent[] = []
): UtilityChipData[] {
  const chips: UtilityChipData[] = [];
  const sortedThrows = [...throws].sort(
    (a, b) => a.time_in_round - b.time_in_round
  );
  const throwCounts = { smoke: 0, he: 0, molotov: 0 };

  for (let i = 0; i < (utility?.flashes_thrown ?? 0); i++) {
    chips.push({ label: `Flash ${i + 1}`, kind: "flash" });
  }

  for (const t of sortedThrows) {
    const normalized = normalizeUtilityThrowType(t.utility_type);
    if (normalized === "smoke") {
      throwCounts.smoke++;
      chips.push({
        label: utilityThrowChipLabel(t.utility_type, throwCounts.smoke),
        kind: "smoke"
      });
    } else if (normalized === "he") {
      throwCounts.he++;
      chips.push({
        label: utilityThrowChipLabel(t.utility_type, throwCounts.he),
        kind: "damage"
      });
    } else if (normalized === "molotov") {
      throwCounts.molotov++;
      chips.push({
        label: utilityThrowChipLabel(t.utility_type, throwCounts.molotov),
        kind: "damage"
      });
    }
  }

  const smokeFallback = Math.max(
    0,
    (utility?.smokes_thrown ?? 0) - throwCounts.smoke
  );
  for (let i = 0; i < smokeFallback; i++) {
    chips.push({
      label: `Smoke ${throwCounts.smoke + i + 1}`,
      kind: "smoke"
    });
  }

  if (throwCounts.he === 0 && throwCounts.molotov === 0) {
    const damageGroups = clusterUtilityDamageHits(utilityDamage);
    for (const group of damageGroups) {
      chips.push({ label: group.label, kind: "damage" });
    }
    if (damageGroups.length === 0 && utility && utility.utility_damage > 0) {
      chips.push({ label: "HE / Molotov", kind: "damage" });
    }
  }

  for (const w of wasted) {
    chips.push({
      label: formatUtilityTypeLabel(w.utility_type),
      kind: "grenade"
    });
  }

  return chips;
}

function utilityChipClass(kind: UtilityChipKind) {
  switch (kind) {
    case "flash":
      return "border-primary/30 bg-primary/10 text-primary";
    case "smoke":
      return "border-border bg-muted/50 text-muted-foreground";
    case "damage":
      return "border-[color-mix(in_oklab,var(--kanaliiga-orange)_35%,transparent)] bg-[color-mix(in_oklab,var(--kanaliiga-orange)_12%,transparent)] text-[var(--kanaliiga-orange)]";
    case "grenade":
      return "border-border bg-muted/30 text-foreground/70 border-dashed";
  }
}

function clusterFlashThrows(flashes: RoundFlashEvent[], gapSec = 1.2) {
  const sorted = [...flashes].sort((a, b) => a.time_in_round - b.time_in_round);
  const groups: RoundFlashEvent[][] = [];
  let current: RoundFlashEvent[] = [];

  for (const flash of sorted) {
    const prev = current[current.length - 1];
    if (
      current.length === 0 ||
      flash.time_in_round - (prev?.time_in_round ?? 0) <= gapSec
    ) {
      current.push(flash);
    } else {
      groups.push(current);
      current = [flash];
    }
  }
  if (current.length > 0) groups.push(current);
  return groups;
}

function UtilityThrownList({
  rounds,
  wastedByRound,
  utilityDamageByRound,
  utilityThrowsByRound
}: {
  rounds: {
    round: number;
    flashes: RoundFlashEvent[];
    utility: RoundUtilityEvent | undefined;
  }[];
  wastedByRound: Map<number, RoundWastedUtilityEvent[]>;
  utilityDamageByRound: Map<number, RoundUtilityDamageEvent[]>;
  utilityThrowsByRound: Map<number, RoundUtilityThrowEvent[]>;
}) {
  const [expandedRound, setExpandedRound] = useState<number | null>(null);

  return (
    <div className="rounded-[var(--radius)] border border-border/50 overflow-hidden divide-y divide-border/40">
      {rounds.map(({ round, flashes, utility }) => {
        const wasted = wastedByRound.get(round) ?? [];
        const utilityDamage = utilityDamageByRound.get(round) ?? [];
        const utilityThrows = utilityThrowsByRound.get(round) ?? [];
        const chips = buildRoundUtilityChips(
          utility,
          wasted,
          utilityDamage,
          utilityThrows
        );
        const blindTotal = flashes.reduce(
          (sum, f) => sum + f.duration_seconds,
          0
        );
        const enemyBlind = flashes
          .filter((f) => f.is_enemy_flash)
          .reduce((sum, f) => sum + f.duration_seconds, 0);
        const mateBlind = blindTotal - enemyBlind;
        const damage = utility?.utility_damage ?? 0;
        const isOpen = expandedRound === round;
        const flashGroups = clusterFlashThrows(flashes);
        const damageGroups = resolveUtilityDamageGroups(utilityDamage, damage);

        return (
          <div key={round}>
            <button
              type="button"
              onClick={() => setExpandedRound(isOpen ? null : round)}
              className="w-full px-3 py-2.5 sm:px-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-left hover:bg-muted/20 transition-colors"
            >
              <span className="text-sm font-semibold tabular-nums shrink-0 w-14">
                Round {round}
              </span>
              <div className="flex flex-wrap gap-1.5 flex-1 min-w-[12rem]">
                {chips.length > 0 ? (
                  chips.map((chip, i) => (
                    <span
                      key={`${chip.label}-${i}`}
                      className={cn(
                        "text-[11px] font-medium px-2 py-0.5 rounded-full border",
                        utilityChipClass(chip.kind)
                      )}
                    >
                      {chip.label}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No utility thrown
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground tabular-nums">
                {blindTotal > 0 && <span>{blindTotal.toFixed(1)}s blind</span>}
                {damage > 0 && <span>{damage} HP</span>}
                <ChevronDown
                  className={cn(
                    "size-4 transition-transform opacity-60",
                    isOpen && "rotate-180"
                  )}
                  strokeWidth={1.5}
                />
              </div>
            </button>

            {isOpen && (
              <div className="px-4 pb-3 pt-1 bg-muted/15 border-t border-border/30 space-y-3">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {blindTotal > 0 && (
                    <>
                      <span>
                        <span className="font-semibold text-foreground/85">
                          {blindTotal.toFixed(1)}s
                        </span>{" "}
                        total blind
                      </span>
                      <span>{enemyBlind.toFixed(1)}s on enemies</span>
                      {mateBlind > 0 && (
                        <span>{mateBlind.toFixed(1)}s on teammates</span>
                      )}
                    </>
                  )}
                  {damage > 0 && (
                    <span>
                      <span className="font-semibold text-foreground/85">
                        {damage} HP
                      </span>{" "}
                      utility damage
                    </span>
                  )}
                  {utility && utility.enemies_flashed > 0 && (
                    <span>{utility.enemies_flashed} enemies flashed</span>
                  )}
                </div>

                {flashGroups.length > 0 && (
                  <div className="space-y-2">
                    {flashGroups.map((group, idx) => {
                      const groupBlind = group.reduce(
                        (sum, f) => sum + f.duration_seconds,
                        0
                      );
                      const throwTime = group[0]?.time_in_round ?? 0;
                      return (
                        <div
                          key={`${round}-flash-${idx}`}
                          className="rounded-md border border-border/40 bg-background/60 px-3 py-2"
                        >
                          <p className="text-xs font-medium mb-1.5">
                            Flash {idx + 1}
                            <span className="text-muted-foreground font-normal">
                              {" "}
                              · {formatRoundTime(throwTime)} ·{" "}
                              {groupBlind.toFixed(1)}s total blind
                            </span>
                          </p>
                          <ul className="space-y-1">
                            {group.map((f, i) => (
                              <li
                                key={i}
                                className="flex items-center justify-between gap-3 text-sm"
                              >
                                <span className="truncate">
                                  <span
                                    className={cn(
                                      "text-[10px] uppercase font-semibold mr-2",
                                      f.is_enemy_flash
                                        ? "text-primary"
                                        : "text-muted-foreground"
                                    )}
                                  >
                                    {f.is_enemy_flash ? "Enemy" : "Mate"}
                                  </span>
                                  {f.victim_nickname}
                                </span>
                                <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                                  {f.duration_seconds.toFixed(1)}s
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                )}

                {damageGroups.length > 0 && (
                  <div className="space-y-2">
                    {damageGroups.map((group, idx) => (
                      <div
                        key={`${round}-damage-${idx}`}
                        className="rounded-md border border-border/40 bg-background/60 px-3 py-2"
                      >
                        <p className="text-xs font-medium mb-1.5">
                          {group.label}
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            {group.throwTime > 0 && (
                              <>· {formatRoundTime(group.throwTime)} · </>
                            )}
                            {group.totalDamage} HP total
                          </span>
                        </p>
                        {group.victims.length > 0 ? (
                          <ul className="space-y-1">
                            {group.victims.map((v) => (
                              <li
                                key={v.victim_nickname}
                                className="flex items-center justify-between gap-3 text-sm"
                              >
                                <span className="truncate">
                                  <span
                                    className={cn(
                                      "text-[10px] uppercase font-semibold mr-2",
                                      v.is_enemy_hit
                                        ? "text-[var(--kanaliiga-orange)]"
                                        : "text-muted-foreground"
                                    )}
                                  >
                                    {v.is_enemy_hit ? "Enemy" : "Mate"}
                                  </span>
                                  {v.victim_nickname}
                                </span>
                                <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                                  {v.health_damage} HP
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {group.summaryOnly
                              ? "Damage recorded for this round — per-victim breakdown requires a reparse with hit logs."
                              : "No victims recorded."}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {utilityThrows.length > 0 && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground/80">
                      Grenades thrown
                    </p>
                    {utilityThrows.map((t, i) => (
                      <p key={i} className="tabular-nums">
                        {formatUtilityTypeLabel(t.utility_type)} at{" "}
                        {formatRoundTime(t.time_in_round)}
                      </p>
                    ))}
                  </div>
                )}

                {wasted.length > 0 && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground/80">
                      Wasted grenades
                    </p>
                    {wasted.map((w, i) => (
                      <p key={i} className="tabular-nums">
                        {formatUtilityTypeLabel(w.utility_type)} at{" "}
                        {formatRoundTime(w.time_in_round)} — no damage
                      </p>
                    ))}
                  </div>
                )}

                {chips.length > 0 &&
                  flashGroups.length === 0 &&
                  damageGroups.length === 0 &&
                  damage === 0 &&
                  wasted.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Utility thrown — no recorded impact this round.
                    </p>
                  )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function FlashSection({
  utilityStats,
  flashesByRound,
  utilityByRound,
  wastedByRound,
  utilityDamageByRound,
  utilityThrowsByRound
}: {
  utilityStats: PlayerGameUtilityStats | null;
  flashesByRound: Map<number, RoundFlashEvent[]>;
  utilityByRound: Map<number, RoundUtilityEvent>;
  wastedByRound: Map<number, RoundWastedUtilityEvent[]>;
  utilityDamageByRound: Map<number, RoundUtilityDamageEvent[]>;
  utilityThrowsByRound: Map<number, RoundUtilityThrowEvent[]>;
}) {
  const us = utilityStats;

  const roundsWithActivity = useMemo(() => {
    const roundSet = new Set<number>();
    for (const r of flashesByRound.keys()) roundSet.add(r);
    for (const r of wastedByRound.keys()) roundSet.add(r);
    for (const r of utilityDamageByRound.keys()) roundSet.add(r);
    for (const r of utilityThrowsByRound.keys()) roundSet.add(r);
    for (const [r, u] of utilityByRound) {
      if (u.utility_damage > 0 || u.smokes_thrown > 0 || u.flashes_thrown > 0) {
        roundSet.add(r);
      }
    }
    return Array.from(roundSet)
      .sort((a, b) => a - b)
      .map((round) => ({
        round,
        flashes: flashesByRound.get(round) ?? [],
        utility: utilityByRound.get(round)
      }));
  }, [
    flashesByRound,
    utilityByRound,
    wastedByRound,
    utilityDamageByRound,
    utilityThrowsByRound
  ]);

  const { totalEnemyFlashCount, totalFlashDuration } = useMemo(() => {
    let enemies = 0;
    let dur = 0;
    for (const [, flashes] of flashesByRound) {
      for (const f of flashes) {
        if (f.is_enemy_flash) {
          enemies++;
          dur += f.duration_seconds;
        }
      }
    }
    return {
      totalEnemyFlashCount: enemies,
      totalFlashDuration: dur
    };
  }, [flashesByRound]);

  const hasData =
    (us?.flashes_thrown ?? 0) > 0 ||
    (us?.smokes_thrown ?? 0) > 0 ||
    (us?.utility_damage ?? 0) > 0 ||
    roundsWithActivity.length > 0;
  const flashesThrown = us?.flashes_thrown ?? 0;
  const utilDmg = us?.utility_damage ?? 0;
  const wasted = us?.wasted_utility ?? 0;
  const smokes = us?.smokes_thrown ?? 0;
  const teammatesFlashed = us?.teammates_flashed ?? 0;
  const avgBlindSec =
    totalEnemyFlashCount > 0 ? totalFlashDuration / totalEnemyFlashCount : null;

  if (!hasData) {
    return (
      <p className="text-sm text-muted-foreground">
        No flash/utility data recorded.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-muted-foreground mb-3">Utility usage</p>
        <UtilityDonut
          flashesThrown={flashesThrown}
          smokesThrown={smokes}
          wasted={wasted}
          utilityDamage={utilDmg}
          enemiesBlinded={totalEnemyFlashCount}
          teammatesFlashed={teammatesFlashed}
          avgBlindSec={avgBlindSec}
        />
        {wasted > 0 && (
          <p className="text-[11px] text-muted-foreground mt-2">
            {wasted} grenade{wasted === 1 ? "" : "s"} thrown with no damage or
            flash effect
          </p>
        )}
      </div>

      {roundsWithActivity.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Utility thrown</p>
          <UtilityThrownList
            rounds={roundsWithActivity}
            wastedByRound={wastedByRound}
            utilityDamageByRound={utilityDamageByRound}
            utilityThrowsByRound={utilityThrowsByRound}
          />
        </div>
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
    if (kills >= 2) return "var(--kanaliiga-orange)";
    if (kills === 1 && r.outcome === "win") return GOOD_COLOR;
    if (r.fkfd === "fd") return BAD_COLOR;
    if (r.outcome === "win")
      return "color-mix(in oklab, var(--analysis-good) 45%, transparent)";
    return "var(--muted)";
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
          const isSelected = selected === r.round_number;
          return (
            <button
              key={r.round_number}
              onClick={() => setSelected(isSelected ? null : r.round_number)}
              className={cn(
                "relative w-10 h-12 rounded-md flex flex-col items-center justify-center gap-0.5 border transition-all bg-muted/20",
                isSelected && "ring-2 ring-primary scale-105",
                !isSelected && "hover:bg-muted/40",
                r.outcome === "win"
                  ? "border-primary/20"
                  : "border-destructive/20"
              )}
            >
              <div
                className={cn(
                  "absolute top-1 left-1 w-1.5 h-1.5 rounded-full",
                  r.side === "CT" ? "bg-muted-foreground" : "bg-primary"
                )}
              />
              {r.fkfd === "fk" && (
                <div className="absolute top-0.5 right-0.5 text-[9px] font-semibold text-primary">
                  FK
                </div>
              )}
              {r.fkfd === "fd" && (
                <div className="absolute top-0.5 right-0.5 text-[9px] font-semibold text-destructive">
                  FD
                </div>
              )}
              {kills > 0 ? (
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{ color: ic }}
                >
                  {kills}
                </span>
              ) : deathsByRound.get(r.round_number)?.length ? (
                <span className="text-xs text-muted-foreground">×</span>
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
        <div className="rounded-[var(--radius)] bg-muted/20 border border-border p-4 space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">
              Round {selectedRound.round_number}
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted border border-border">
              {selectedRound.side}
            </span>
            <span
              className={cn(
                "px-2 py-0.5 rounded text-xs font-medium border",
                selectedRound.outcome === "win"
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-destructive/10 text-destructive border-destructive/30"
              )}
            >
              {selectedRound.outcome === "win" ? "Won" : "Lost"}
            </span>
            {selectedRound.fkfd === "fk" && (
              <span className="px-2 py-0.5 rounded text-xs bg-primary/10 text-primary border border-primary/20">
                First kill
              </span>
            )}
            {selectedRound.fkfd === "fd" && (
              <span className="px-2 py-0.5 rounded text-xs bg-destructive/10 text-destructive border border-destructive/20">
                First death
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
              <p className="text-xs text-muted-foreground mb-2">Kills</p>
              {selectedKills.length === 0 ? (
                <p className="text-muted-foreground">No kills</p>
              ) : (
                selectedKills.map((k, i) => (
                  <div
                    key={i}
                    className="flex justify-between py-1 border-b border-border/20"
                  >
                    <div>
                      <span className="font-medium">{k.victim_nickname}</span>
                      <span className="text-muted-foreground ml-1.5">
                        {k.weapon}
                      </span>
                    </div>
                    <div className="flex gap-2 text-muted-foreground tabular-nums">
                      {k.is_headshot && (
                        <span className="text-primary font-medium">HS</span>
                      )}
                      <span>{k.time_in_round.toFixed(1)}s</span>
                    </div>
                  </div>
                ))
              )}
              {selectedDeath && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Death</p>
                  <div className="flex justify-between py-1">
                    <div>
                      <span className="font-medium">
                        {selectedDeath.killer_nickname}
                      </span>
                      <span className="text-muted-foreground ml-1.5">
                        {selectedDeath.weapon}
                      </span>
                    </div>
                    <div className="flex gap-2 text-muted-foreground tabular-nums">
                      {selectedDeath.is_headshot && (
                        <span className="text-primary font-medium">HS</span>
                      )}
                      <span>{selectedDeath.time_in_round.toFixed(1)}s</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Flashes */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Flashes thrown
              </p>
              {selectedFlashes.length === 0 ? (
                <p className="text-muted-foreground">No flashes</p>
              ) : (
                selectedFlashes.map((f, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-between px-2 py-1 rounded mb-1 border",
                      f.is_enemy_flash
                        ? "bg-muted/30 border-border/50"
                        : "bg-destructive/5 border-destructive/20"
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <div
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          f.is_enemy_flash ? "bg-primary" : "bg-destructive"
                        )}
                      />
                      <span className="font-medium">{f.victim_nickname}</span>
                      <span className="text-xs text-muted-foreground">
                        {f.is_enemy_flash ? "enemy" : "teammate"}
                      </span>
                    </div>
                    <span className="font-semibold text-sm tabular-nums">
                      {f.duration_seconds.toFixed(1)}s
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Opening duel + utility context */}
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Opening duel
                </p>
                {selectedRound.openingDuel ? (
                  <div className="text-sm">
                    {String(selectedRound.openingDuel.killer_steam_id) ===
                    String(steamId) ? (
                      <span className="text-primary font-medium">
                        FK with {selectedRound.openingDuel.weapon}
                        {selectedRound.openingDuel.is_headshot ? " (HS)" : ""}
                        {selectedRound.openingDuel.trade !== "isolated"
                          ? ` · ${selectedRound.openingDuel.trade}`
                          : ""}
                      </span>
                    ) : String(selectedRound.openingDuel.victim_steam_id) ===
                      String(steamId) ? (
                      <span className="text-destructive font-medium">
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
                <p className="text-xs text-muted-foreground mb-2">Utility</p>
                {selectedUtility ? (
                  <div className="flex flex-col gap-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Utility damage
                      </span>
                      <span className="font-semibold tabular-nums">
                        {selectedUtility.utility_damage > 0
                          ? `${selectedUtility.utility_damage} HP`
                          : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Smokes thrown
                      </span>
                      <span className="font-semibold tabular-nums">
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
                        <span className="font-semibold tabular-nums">
                          {selectedUtility.enemies_flashed}
                        </span>
                      </div>
                    )}
                    {selectedUtility.teammates_flashed > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Teammates blinded
                        </span>
                        <span className="font-semibold tabular-nums text-destructive">
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

/* ═══════════════════════════════════════════════════ HEADER ═══ */

function mapScoresForTeam(
  mapGame: MatchMapsPlayed,
  playerTeamId: number
): { player: number; opponent: number } {
  if (mapGame.team1_id === playerTeamId) {
    return { player: mapGame.team1_score, opponent: mapGame.team2_score };
  }
  return { player: mapGame.team2_score, opponent: mapGame.team1_score };
}

function PlayerMapSwitcher({
  maps,
  mapsPlayed,
  matchGameId,
  playerTeamId,
  onMapSelect
}: {
  maps: MapTab[];
  mapsPlayed: MatchMapsPlayed[];
  matchGameId: number;
  playerTeamId: number;
  onMapSelect?: (idx: number) => void;
}) {
  const sorted = [...maps].sort((a, b) => {
    const orderA = mapsPlayed.find((m) => m.id === a.id)?.map_order ?? 0;
    const orderB = mapsPlayed.find((m) => m.id === b.id)?.map_order ?? 0;
    return orderA - orderB;
  });

  return (
    <div
      className={cn(
        "grid gap-2 p-3 bg-muted/15",
        sorted.length > 1 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1"
      )}
    >
      {sorted.map((map) => {
        const played = mapsPlayed.find((m) => m.id === map.id);
        const mapName = played?.map_name ?? map.name;
        const scores = played ? mapScoresForTeam(played, playerTeamId) : null;
        const isActive = map.id === matchGameId;

        return (
          <button
            key={map.id}
            type="button"
            onClick={() => {
              const originalIdx = maps.findIndex((m) => m.id === map.id);
              if (originalIdx >= 0) onMapSelect?.(originalIdx);
            }}
            disabled={!onMapSelect}
            className={cn(
              "relative flex min-h-14 items-center overflow-hidden rounded-[var(--radius)] border transition-colors text-left",
              isActive
                ? "border-primary ring-1 ring-primary/40"
                : "border-kanaliiga-light-brown/40 hover:border-primary/60",
              !onMapSelect && "cursor-default"
            )}
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: `url(${createNextUrl(`/images/maps/${mapName}.png`)})`,
                filter: "brightness(0.55)"
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
            <div className="relative z-10 flex w-full items-center justify-between gap-2 px-3 py-2">
              <span className="text-sm font-semibold text-white drop-shadow-sm">
                {mapToReadableName(mapName)}
              </span>
              {scores && (
                <span className="text-lg font-bold tabular-nums text-white drop-shadow-sm">
                  {scores.player}
                  <span className="mx-1 font-normal opacity-70">–</span>
                  {scores.opponent}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function KanaRatingCompact({ rating }: { rating: number | null }) {
  if (rating == null) return null;
  const tier = resolveKanaRatingTier(rating);
  return (
    <ArcGauge
      value={rating}
      display={rating.toFixed(2)}
      label="KanaRating"
      sub={`${tier.label} · lg. median ${KANA_RATING_BENCHMARKS.leagueMedian.toFixed(2)}`}
      min={KANA_RATING_BENCHMARKS.gaugeMin}
      max={KANA_RATING_BENCHMARKS.gaugeMax}
      referenceValue={KANA_RATING_BENCHMARKS.leagueMedian}
      color={tier.color}
      size={96}
      compact
    />
  );
}

function KdaInline({
  kills,
  assists,
  deaths,
  className
}: {
  kills: number;
  assists: number;
  deaths: number;
  className?: string;
}) {
  const parts = [
    { v: kills, l: "K", color: GOOD_COLOR },
    { v: assists, l: "A", color: "var(--kanaliiga-light-brown)" },
    { v: deaths, l: "D", color: BAD_COLOR }
  ];

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2.5 mt-1.5 text-sm tabular-nums",
        className
      )}
    >
      {parts.map((p, i) => (
        <React.Fragment key={p.l}>
          {i > 0 && (
            <span className="text-muted-foreground/35 font-light">/</span>
          )}
          <span className="inline-flex items-baseline gap-0.5">
            <span className="font-semibold" style={{ color: p.color }}>
              {p.v}
            </span>
            <span className="text-[10px] text-muted-foreground">{p.l}</span>
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

function MatchPerformanceHeader({
  playerStats,
  playerTeam,
  opponentTeam,
  matchDate,
  bestOf,
  mapName,
  maps,
  mapsPlayed,
  matchGameId,
  onMapSelect
}: {
  playerStats: ExtendedPlayerStats;
  playerTeam: { id: number; name: string; score: number } | undefined;
  opponentTeam: { name: string; score: number } | undefined;
  matchDate: string | null;
  bestOf: number;
  mapName: string;
  maps?: MapTab[];
  mapsPlayed: MatchMapsPlayed[];
  matchGameId: number;
  onMapSelect?: (idx: number) => void;
}) {
  const rating = playerStats.kana_rating;
  const showMapSwitcher = maps && maps.length > 0;
  const currentMap = mapsPlayed.find((m) => m.id === matchGameId);
  const mapScores =
    currentMap && playerTeam
      ? mapScoresForTeam(currentMap, playerTeam.id)
      : null;
  const mapWon =
    mapScores != null ? mapScores.player > mapScores.opponent : null;

  return (
    <div className="rounded-[var(--radius)] border border-border overflow-hidden mb-3 shadow-sm">
      <div className="h-1 bg-gradient-to-r from-primary/80 via-kanaliiga-light-brown to-primary/20" />

      {showMapSwitcher && playerTeam && (
        <PlayerMapSwitcher
          maps={maps}
          mapsPlayed={mapsPlayed}
          matchGameId={matchGameId}
          playerTeamId={playerTeam.id}
          onMapSelect={maps.length > 1 ? onMapSelect : undefined}
        />
      )}

      <div className="bg-gradient-to-br from-primary/10 via-card to-card px-3 py-2.5 sm:px-4 border-b border-primary/30">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
          <div className="min-w-0 space-y-1 justify-self-start">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <p className="font-headings text-lg text-primary truncate leading-tight">
                {playerStats.nickname}
              </p>
              {playerTeam?.name && (
                <span className="text-[11px] text-muted-foreground truncate">
                  {playerTeam.name}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] uppercase tracking-wider text-kanaliiga-light-brown">
              <span>Map Performance</span>
              {bestOf > 1 && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-muted/60 border border-border/60 text-[10px] text-muted-foreground normal-case tracking-normal">
                    BO{bestOf}
                  </span>
                </>
              )}
            </div>

            <p className="text-sm">
              <span className="text-muted-foreground">vs </span>
              <span className="font-semibold">{opponentTeam?.name ?? "—"}</span>
            </p>

            <KdaInline
              kills={playerStats.kills}
              assists={playerStats.assists}
              deaths={playerStats.deaths}
              className="justify-start !mt-0 text-sm"
            />
          </div>

          <div className="text-center px-1 sm:px-3 justify-self-center">
            <p className="font-headings text-[10px] sm:text-xs uppercase tracking-wider text-kanaliiga-light-brown">
              {mapToReadableName(mapName)}
            </p>
            {mapScores && (
              <div className="flex items-baseline justify-center gap-1 tabular-nums mt-0.5">
                <span
                  className={cn(
                    "text-xl sm:text-2xl font-bold leading-none",
                    mapWon ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {mapScores.player}
                </span>
                <span className="text-sm text-muted-foreground/50 font-light">
                  —
                </span>
                <span
                  className={cn(
                    "text-xl sm:text-2xl font-bold leading-none",
                    mapWon === false
                      ? "text-destructive"
                      : "text-muted-foreground"
                  )}
                >
                  {mapScores.opponent}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-1.5 justify-self-end">
            {matchDate && (
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {matchDate}
              </span>
            )}
            <KanaRatingCompact rating={rating} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ ROOT ═══ */

export function PlayerMatchGameView({
  matchId,
  matchGameId,
  steamId,
  mapName,
  matchInfo,
  bestOf,
  maps,
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
  const { maps: mapsPlayed } = useMatchMaps(matchId);

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

  const wastedByRound = useMemo(() => {
    const m = new Map<number, RoundWastedUtilityEvent[]>();
    for (const w of roundEvents.wasted) {
      const arr = m.get(w.round_number) ?? [];
      arr.push(w);
      m.set(w.round_number, arr);
    }
    return m;
  }, [roundEvents.wasted]);

  const utilityThrowsByRound = useMemo(() => {
    const m = new Map<number, RoundUtilityThrowEvent[]>();
    for (const t of roundEvents.utility_throws ?? []) {
      const arr = m.get(t.round_number) ?? [];
      arr.push(t);
      m.set(t.round_number, arr);
    }
    return m;
  }, [roundEvents.utility_throws]);

  const utilityDamageByRound = useMemo(() => {
    const m = new Map<number, RoundUtilityDamageEvent[]>();
    for (const hit of roundEvents.utility_damage_hits) {
      const arr = m.get(hit.round_number) ?? [];
      arr.push(hit);
      m.set(hit.round_number, arr);
    }
    return m;
  }, [roundEvents.utility_damage_hits]);

  const teamsArray = Object.values(matchInfo.teams);
  const playerTeam = teamsArray.find((t) => t.id === playerStats?.team_id);
  const opponentTeam = teamsArray.find((t) => t.id !== playerStats?.team_id);
  const matchDate = matchInfo.start_timestamp
    ? format(new Date(matchInfo.start_timestamp), "dd.MM.yyyy")
    : null;

  const hitRows =
    hitMode === "dealt" ? (hitStats?.dealt ?? []) : (hitStats?.received ?? []);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-44 w-full rounded-[var(--radius)]" />
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
      <MatchPerformanceHeader
        playerStats={playerStats}
        playerTeam={playerTeam}
        opponentTeam={opponentTeam}
        matchDate={matchDate}
        bestOf={bestOf}
        mapName={mapName}
        maps={maps}
        mapsPlayed={mapsPlayed ?? []}
        matchGameId={matchGameId}
        onMapSelect={onMapSelect}
      />

      {/* ── WEAPON USAGE + HIT MAP ── */}
      <SectionCard
        icon={Crosshair}
        title="Weapons & Hit Map"
        sub="Kill distribution and damage by body zone"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div>
            <p className="text-xs text-muted-foreground mb-3">Weapon usage</p>
            {weaponStats.length > 0 ? (
              <WeaponDonut weapons={weaponStats} />
            ) : (
              <p className="text-sm text-muted-foreground">
                No weapon data recorded.
              </p>
            )}
          </div>
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <p className="text-xs text-muted-foreground">Hit map</p>
              <div className="flex gap-1">
                {(["dealt", "received"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setHitMode(m)}
                    className={cn(
                      "text-xs font-medium px-2.5 py-1 rounded border transition-colors",
                      hitMode === m
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {m === "dealt" ? "Dealt" : "Received"}
                  </button>
                ))}
              </div>
            </div>
            <BodyHeatmap rows={hitRows} mode={hitMode} />
          </div>
        </div>
      </SectionCard>

      {/* ── FK / FD ── */}
      <SectionCard icon={Target} title="First Kills & First Deaths">
        <FKFDSection
          openingDuels={openingDuels}
          steamId={steamId}
          rounds={rounds}
        />
      </SectionCard>

      {/* ── AIM & IMPACT ── */}
      <SectionCard
        icon={Crosshair}
        title="Aim & Impact"
        sub="Accuracy, movement, and damage output"
      >
        <AimImpactSection playerStats={playerStats} weaponStats={weaponStats} />
      </SectionCard>

      {/* ── TRADE PERFORMANCE ── */}
      <SectionCard icon={Zap} title="Trade Performance">
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

            const notTraded = p.deaths - p.traded;

            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* ── When a teammate dies nearby ── */}
                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-muted-foreground">
                      When a teammate is killed nearby
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { v: p.trade_opportunities, l: "Opportunities" },
                        { v: p.trade_attempts, l: "Attempted" },
                        { v: p.trades, l: "Converted" },
                        { v: ignored, l: "Ignored" }
                      ].map((s) => (
                        <div key={s.l} className="text-center">
                          <div className="text-lg font-bold tabular-nums leading-none">
                            {s.v}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1">
                            {s.l}
                          </div>
                        </div>
                      ))}
                    </div>
                    <SegmentBar
                      height={10}
                      showPct={false}
                      segments={[
                        {
                          label: "Converted",
                          value: p.trades,
                          color: GOOD_COLOR
                        },
                        {
                          label: "Failed",
                          value: failed,
                          color: "var(--kanaliiga-light-brown)"
                        },
                        {
                          label: "Ignored",
                          value: ignored,
                          color: NEUTRAL_COLOR
                        }
                      ].filter((s) => s.value > 0)}
                    />
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <StatChip
                        value={`${attRate}%`}
                        label="Attempt rate"
                        note={`${p.trade_attempts}/${p.trade_opportunities} opp`}
                      />
                      <StatChip
                        value={`${convRate}%`}
                        label="Conversion rate"
                        note={`${p.trades}/${p.trade_attempts} attempts`}
                      />
                    </div>
                  </div>

                  {/* ── When you die ── */}
                  <div className="flex flex-col gap-3">
                    <p className="text-xs text-muted-foreground">
                      When you die
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { v: p.deaths, l: "Deaths" },
                        { v: p.traded, l: "Traded" },
                        { v: notTraded, l: "Not traded" },
                        { v: p.first_deaths, l: "First deaths" }
                      ].map((s) => (
                        <div key={s.l} className="text-center">
                          <div className="text-lg font-bold tabular-nums leading-none">
                            {s.v}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1">
                            {s.l}
                          </div>
                        </div>
                      ))}
                    </div>
                    <SegmentBar
                      height={10}
                      showPct={false}
                      segments={[
                        { label: "Traded", value: p.traded, color: GOOD_COLOR },
                        {
                          label: "Not traded",
                          value: notTraded,
                          color: NEUTRAL_COLOR
                        }
                      ].filter((s) => s.value > 0)}
                    />
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <StatChip
                        value={`${deathTradedRate}%`}
                        label="Deaths traded"
                        note={`${p.traded}/${p.deaths} avenged`}
                      />
                      <StatChip
                        value={`${fdTradedRate}%`}
                        label="FD traded rate"
                        note={`${p.first_death_traded}/${p.first_death_trade_opportunities} tradeable`}
                      />
                    </div>
                  </div>
                </div>

                {/* ── First death analysis — full width below grid ── */}
                {p.first_deaths > 0 && (
                  <div className="rounded-[var(--radius)] bg-muted/20 border border-border/40 p-3 space-y-3 mt-4">
                    <p className="text-xs text-muted-foreground">
                      First death analysis
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { v: p.first_deaths, l: "Total FDs" },
                        {
                          v: p.first_death_trade_opportunities,
                          l: "Tradeable"
                        },
                        { v: p.first_death_traded, l: "Traded" },
                        { v: Math.max(0, fdIgnored), l: "Not tradeable" }
                      ].map((s) => (
                        <div key={s.l} className="text-center">
                          <div className="text-lg font-bold tabular-nums leading-none">
                            {s.v}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1">
                            {s.l}
                          </div>
                        </div>
                      ))}
                    </div>
                    {p.first_deaths > 0 && (
                      <SegmentBar
                        height={10}
                        showPct={false}
                        segments={[
                          {
                            label: "Traded",
                            value: p.first_death_traded,
                            color: GOOD_COLOR
                          },
                          {
                            label: "Failed",
                            value: fdFailed,
                            color: "var(--kanaliiga-light-brown)"
                          },
                          {
                            label: "Not tradeable",
                            value: Math.max(0, fdIgnored),
                            color: NEUTRAL_COLOR
                          }
                        ].filter((s) => s.value > 0)}
                      />
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

      {/* ── UTILITY & FLASHES ── */}
      <SectionCard
        icon={Flame}
        title="Utility & Flashes"
        sub="Grenades thrown, damage dealt, and players blinded"
      >
        <FlashSection
          utilityStats={utilityStats}
          flashesByRound={flashesByRound}
          utilityByRound={utilityByRound}
          wastedByRound={wastedByRound}
          utilityDamageByRound={utilityDamageByRound}
          utilityThrowsByRound={utilityThrowsByRound}
        />
      </SectionCard>

      {/* ── ROUND DRILL-DOWN ── */}
      <SectionCard icon={ListOrdered} title="Round-by-Round">
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
