"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { orderMatchParticipantsBySideHomeLeft } from "@/lib/order-match-teams-home-left-away";
import { useSetupPairs } from "@/hooks/data/useSetupPairs";
import { useWastedUtility } from "@/hooks/data/useWastedUtility";
import { useRoundUtilitySummary } from "@/hooks/data/useRoundUtilitySummary";
import type { MatchInfo, MatchPlayerStats } from "@eggosystem/types";

interface SupportUtilityTabProps {
  matchGameId: number;
  playerStats: MatchPlayerStats[];
  teams: MatchInfo["teams"];
}

const UTIL_LABELS: Record<string, string> = {
  flashbang: "Flash",
  smoke_grenade: "Smoke",
  he_grenade: "HE",
  molotov: "Molo",
  incgrenade: "Molo"
};

function TypeBadge({ type }: { type: string }) {
  const isFlash = type === "flash";
  return (
    <span
      className={cn(
        "text-[10px] font-semibold px-1.5 py-0.5 rounded border",
        isFlash
          ? "border-violet-400/50 text-violet-400"
          : "border-orange-400/50 text-orange-400"
      )}
    >
      {isFlash ? "flash" : "util dmg"}
    </span>
  );
}

/* ── Round utility bar chart ── */
const RoundChart = ({
  rounds
}: {
  rounds: {
    roundNumber: number;
    smokes: number;
    flashes: number;
    he: number;
    isBuyRound: boolean;
  }[];
}) => {
  if (rounds.length === 0) return null;

  const maxVal = Math.max(...rounds.map((r) => r.smokes + r.flashes + r.he), 1);
  const BAR_W = 28;
  const GAP = 8;
  const H = 80;
  const totalW = rounds.length * (BAR_W + GAP) + GAP;

  return (
    <div className="overflow-x-auto">
      <svg
        width={totalW}
        height={H + 28}
        style={{ display: "block", minWidth: totalW }}
      >
        {rounds.map((r, i) => {
          const x = i * (BAR_W + GAP) + GAP;
          const smokeH = (r.smokes / maxVal) * H;
          const flashH = (r.flashes / maxVal) * H;
          const heH = (r.he / maxVal) * H;
          const isWarning = r.isBuyRound && r.smokes === 0;

          return (
            <g key={r.roundNumber}>
              {isWarning && (
                <rect
                  x={x - 2}
                  y={0}
                  width={BAR_W + 4}
                  height={H + 2}
                  fill="rgba(239,68,68,0.12)"
                  rx={3}
                />
              )}
              {/* HE layer */}
              <rect
                x={x}
                y={H - heH}
                width={BAR_W}
                height={heH}
                fill="#fb923c"
                opacity={0.75}
                rx={2}
              />
              {/* Smoke layer */}
              <rect
                x={x}
                y={H - heH - smokeH}
                width={BAR_W}
                height={smokeH}
                fill="#38bdf8"
                opacity={0.65}
                rx={2}
              />
              {/* Flash layer */}
              <rect
                x={x}
                y={H - heH - smokeH - flashH}
                width={BAR_W}
                height={flashH}
                fill="#a78bfa"
                opacity={0.7}
                rx={2}
              />
              {/* round label */}
              <text
                x={x + BAR_W / 2}
                y={H + 18}
                textAnchor="middle"
                fill={isWarning ? "rgb(239,68,68)" : "rgba(156,163,175,0.7)"}
                fontSize={9}
                fontWeight={isWarning ? 700 : 400}
              >
                R{r.roundNumber}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center gap-4 mt-1">
        {[
          { color: "#38bdf8", label: "Smokes" },
          { color: "#a78bfa", label: "Flashes" },
          { color: "#fb923c", label: "HE / Molo" }
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-sm"
              style={{ background: color, opacity: 0.7 }}
            />
            <span className="text-[10px] text-muted-foreground/60">
              {label}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-2">
          <div className="w-2.5 h-2.5 rounded-sm bg-red-500/20 border border-red-500/40" />
          <span className="text-[10px] text-muted-foreground/60">
            0 smokes on buy round
          </span>
        </div>
      </div>
    </div>
  );
};

/* ── Collapsible section ── */
const Collapsible = ({
  title,
  badge,
  badgeTone = "neutral",
  defaultOpen = false,
  children
}: {
  title: string;
  badge?: string;
  badgeTone?: "neutral" | "warning" | "danger" | "info";
  defaultOpen?: boolean;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);

  const badgeClasses: Record<string, string> = {
    neutral: "bg-muted/50 text-muted-foreground",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    danger: "bg-red-500/10 text-red-400 border-red-500/30",
    info: "bg-sky-500/10 text-sky-400 border-sky-500/30"
  };

  return (
    <div className="rounded-lg border border-border/60 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/20 transition-colors"
      >
        <span
          className={cn(
            "text-[10px] transition-transform duration-150",
            open ? "rotate-90" : "rotate-0"
          )}
          style={{ display: "inline-block" }}
        >
          ▶
        </span>
        <span className="text-sm font-semibold flex-1">{title}</span>
        {badge && (
          <span
            className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded border",
              badgeClasses[badgeTone]
            )}
          >
            {badge}
          </span>
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 border-t border-border/40">
          {children}
        </div>
      )}
    </div>
  );
};

/* ── Empty state ── */
const _NoData = ({ message }: { message: string }) => (
  <p className="text-sm text-muted-foreground/50 py-6 text-center">{message}</p>
);

/* ── Main tab ── */
export const SupportUtilityTab = ({
  matchGameId,
  playerStats,
  teams
}: SupportUtilityTabProps) => {
  const { setupPairs } = useSetupPairs(matchGameId);
  const { wastedUtility } = useWastedUtility(matchGameId);
  const { roundUtility } = useRoundUtilitySummary(matchGameId);

  const teamList = useMemo(
    () => orderMatchParticipantsBySideHomeLeft(Object.values(teams)),
    [teams]
  );
  const teamA = teamList[0]!;
  const _teamB = teamList[1]!;

  const nameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const ps of playerStats) m.set(String(ps.steam_id), ps.nickname);
    return m;
  }, [playerStats]);

  const teamIdMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const ps of playerStats) m.set(String(ps.steam_id), ps.team_id);
    return m;
  }, [playerStats]);

  const teamColor = (steamId: string) =>
    teamIdMap.get(steamId) === teamA.id ? "#7dd3fc" : "#fcd34d";

  const playerName = (steamId: string) => nameMap.get(steamId) ?? steamId;

  /* ── Derived: wasted by player ── */
  const wastedByPlayer = useMemo(() => {
    const m = new Map<string, Record<string, number>>();
    for (const w of wastedUtility) {
      const existing = m.get(w.thrower_steam_id) ?? {};
      existing[w.utility_type] = (existing[w.utility_type] ?? 0) + w.count;
      m.set(w.thrower_steam_id, existing);
    }
    return Array.from(m.entries())
      .map(([id, types]) => ({
        id,
        flash: types["flashbang"] ?? 0,
        smoke: types["smoke_grenade"] ?? 0,
        he: (types["he_grenade"] ?? 0) + (types["incgrenade"] ?? 0),
        molo: types["molotov"] ?? 0,
        total: Object.values(types).reduce((a, b) => a + b, 0)
      }))
      .sort((a, b) => b.total - a.total);
  }, [wastedUtility]);

  const maxWasted = Math.max(...wastedByPlayer.map((p) => p.total), 1);

  /* ── Derived: wasted by type ── */
  const wastedByType = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const w of wastedUtility) {
      const key = UTIL_LABELS[w.utility_type] ?? w.utility_type;
      totals[key] = (totals[key] ?? 0) + w.count;
    }
    return Object.entries(totals).sort((a, b) => b[1] - a[1]);
  }, [wastedUtility]);

  const maxWastedType = Math.max(...wastedByType.map(([, v]) => v), 1);

  /* ── Derived: round utility aggregated per round ── */
  const roundAgg = useMemo(() => {
    const m = new Map<
      number,
      { smokes: number; flashes: number; he: number; wasted: number }
    >();
    for (const r of roundUtility) {
      const existing = m.get(r.round_number) ?? {
        smokes: 0,
        flashes: 0,
        he: 0,
        wasted: 0
      };
      existing.smokes += r.smokes_thrown;
      existing.flashes += r.flashes_thrown;
      existing.he += r.utility_damage > 0 ? 1 : 0;
      existing.wasted += r.wasted_utility;
      m.set(r.round_number, existing);
    }
    return Array.from(m.entries())
      .sort(([a], [b]) => a - b)
      .map(([roundNumber, agg]) => ({ roundNumber, ...agg }));
  }, [roundUtility]);

  /* ── Derived: identify buy rounds (smokes > 1 or flashes > 2 → likely full buy) ── */
  const roundsWithBuyFlag = useMemo(() => {
    return roundAgg.map((r) => ({
      ...r,
      isBuyRound: r.smokes >= 1 || r.flashes >= 3
    }));
  }, [roundAgg]);

  const zeroSmokeRounds = roundsWithBuyFlag.filter(
    (r) => r.isBuyRound && r.smokes === 0
  );

  /* ── Derived: top support pair ── */
  const topPair = setupPairs[0];

  /* ── Derived: flash/util split ── */
  const flashSetups = setupPairs
    .filter((p) => p.setup_type === "flash")
    .reduce((s, p) => s + p.count, 0);
  const utilSetups = setupPairs
    .filter((p) => p.setup_type !== "flash")
    .reduce((s, p) => s + p.count, 0);

  const totalWasted = wastedByPlayer.reduce((s, p) => s + p.total, 0);

  const hasSetupData = setupPairs.length > 0;
  const hasWastedData = wastedUtility.length > 0;
  const hasRoundData = roundUtility.length > 0;
  const hasAnyData = hasSetupData || hasWastedData || hasRoundData;

  if (!hasAnyData) {
    return (
      <div className="py-12 text-center space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          No support or utility data
        </p>
        <p className="text-xs text-muted-foreground/50">
          This game was parsed before utility tracking was added.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Insight callouts ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {topPair && (
          <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 px-4 py-3 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-400/80">
              Best support pair
            </p>
            <p className="text-sm">
              <span
                style={{
                  color: teamColor(topPair.setup_player_steam_id),
                  fontWeight: 700
                }}
              >
                {playerName(topPair.setup_player_steam_id)}
              </span>
              <span className="text-muted-foreground/50 mx-1.5">→</span>
              <span
                style={{
                  color: teamColor(topPair.beneficiary_steam_id),
                  fontWeight: 700
                }}
              >
                {playerName(topPair.beneficiary_steam_id)}
              </span>
              <span className="text-muted-foreground/60 text-xs ml-2">
                {topPair.count}× via{" "}
                {topPair.setup_type === "flash" ? "flash" : "util dmg"} · avg{" "}
                {topPair.avg_seconds_after_setup.toFixed(1)}s after
              </span>
            </p>
          </div>
        )}

        {hasWastedData && wastedByPlayer[0] && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-400/80">
              Most wasted utility
            </p>
            <p className="text-sm">
              <span
                style={{
                  color: teamColor(wastedByPlayer[0].id),
                  fontWeight: 700
                }}
              >
                {playerName(wastedByPlayer[0].id)}
              </span>
              <span className="text-muted-foreground/60 text-xs ml-2">
                {wastedByPlayer[0].total} grenades wasted
                {wastedByPlayer[0].flash > 0 &&
                  ` · ${wastedByPlayer[0].flash} flash`}
                {wastedByPlayer[0].smoke > 0 &&
                  ` · ${wastedByPlayer[0].smoke} smoke`}
                {wastedByPlayer[0].molo > 0 &&
                  ` · ${wastedByPlayer[0].molo} molo`}
              </span>
            </p>
          </div>
        )}

        {hasSetupData && (
          <div className="rounded-lg border border-border/40 bg-muted/20 px-4 py-3 space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/60">
              Setup assists
            </p>
            <p className="text-sm">
              <span className="font-bold">{flashSetups}</span>
              <span className="text-muted-foreground/60 text-xs">
                {" "}
                flash setups ·{" "}
              </span>
              <span className="font-bold">{utilSetups}</span>
              <span className="text-muted-foreground/60 text-xs">
                {" "}
                utility damage setups
              </span>
            </p>
          </div>
        )}

        {hasRoundData && (
          <div
            className={cn(
              "rounded-lg border px-4 py-3 space-y-1",
              zeroSmokeRounds.length > 0
                ? "border-red-500/25 bg-red-500/5"
                : "border-border/40 bg-muted/20"
            )}
          >
            <p
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wide",
                zeroSmokeRounds.length > 0
                  ? "text-red-400/80"
                  : "text-muted-foreground/60"
              )}
            >
              Smoke discipline
            </p>
            {zeroSmokeRounds.length > 0 ? (
              <p className="text-sm">
                <span className="font-bold text-red-400">
                  {zeroSmokeRounds.length}
                </span>
                <span className="text-muted-foreground/60 text-xs">
                  {" "}
                  buy round{zeroSmokeRounds.length > 1 ? "s" : ""} with 0 smokes
                  — R{zeroSmokeRounds.map((r) => r.roundNumber).join(", R")}
                </span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground/60 text-xs">
                Smokes thrown on all detected buy rounds
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Collapsible: Support pairs ── */}
      {hasSetupData && (
        <Collapsible
          title="Support pairs — full breakdown"
          badge={`${setupPairs.length} pairs`}
          badgeTone="info"
          defaultOpen={true}
        >
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/40 text-muted-foreground/60 uppercase tracking-wide text-[10px]">
                  <th className="text-left py-2 pr-3 font-semibold">
                    Setup player
                  </th>
                  <th className="text-left py-2 px-2 font-semibold">
                    Beneficiary
                  </th>
                  <th className="text-left py-2 px-2 font-semibold">Type</th>
                  <th className="text-right py-2 px-2 font-semibold">Setups</th>
                  <th className="text-right py-2 pl-2 font-semibold">
                    Avg delay
                  </th>
                </tr>
              </thead>
              <tbody>
                {setupPairs.map((p, i) => (
                  <tr
                    key={i}
                    className="border-b border-border/20 hover:bg-muted/20"
                  >
                    <td
                      className="py-2 pr-3 font-semibold"
                      style={{ color: teamColor(p.setup_player_steam_id) }}
                    >
                      {playerName(p.setup_player_steam_id)}
                    </td>
                    <td
                      className="py-2 px-2 font-semibold"
                      style={{ color: teamColor(p.beneficiary_steam_id) }}
                    >
                      {playerName(p.beneficiary_steam_id)}
                    </td>
                    <td className="py-2 px-2">
                      <TypeBadge type={p.setup_type} />
                    </td>
                    <td className="py-2 px-2 text-right font-bold tabular-nums">
                      {p.count}×
                    </td>
                    <td className="py-2 pl-2 text-right tabular-nums text-muted-foreground/60">
                      {p.avg_seconds_after_setup.toFixed(1)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground/40 mt-2">
            &quot;Setup&quot; = flash or utility damage applied to an enemy
            within 5s before a teammate got the kill
          </p>
        </Collapsible>
      )}

      {/* ── Collapsible: Wasted utility ── */}
      {hasWastedData && (
        <Collapsible
          title="Wasted grenades — per player"
          badge={`${totalWasted} total`}
          badgeTone="warning"
          defaultOpen={true}
        >
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Per-player bars */}
            <div className="space-y-3">
              {wastedByPlayer.map((p) => (
                <div key={p.id}>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-semibold w-20 truncate"
                      style={{ color: teamColor(p.id) }}
                    >
                      {playerName(p.id)}
                    </span>
                    <div
                      className="flex-1 h-3 rounded-sm overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <div
                        className="h-full rounded-sm"
                        style={{
                          width: `${(p.total / maxWasted) * 100}%`,
                          background: "rgba(239,68,68,0.45)"
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold w-5 text-right">
                      {p.total}
                    </span>
                  </div>
                  <div className="flex gap-1.5 pl-[88px] flex-wrap">
                    {p.flash > 0 && (
                      <span className="text-[10px] px-1.5 py-px rounded bg-violet-400/10 text-violet-400/80">
                        {p.flash} flash
                      </span>
                    )}
                    {p.smoke > 0 && (
                      <span className="text-[10px] px-1.5 py-px rounded bg-sky-400/10 text-sky-400/80">
                        {p.smoke} smoke
                      </span>
                    )}
                    {p.he > 0 && (
                      <span className="text-[10px] px-1.5 py-px rounded bg-orange-400/10 text-orange-400/80">
                        {p.he} HE
                      </span>
                    )}
                    {p.molo > 0 && (
                      <span className="text-[10px] px-1.5 py-px rounded bg-red-400/10 text-red-400/80">
                        {p.molo} molo
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* By type breakdown */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide mb-3">
                By grenade type
              </p>
              <div className="space-y-2.5">
                {wastedByType.map(([label, count]) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground/70 w-16">
                      {label}
                    </span>
                    <div
                      className="flex-1 h-2.5 rounded-sm overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.06)" }}
                    >
                      <div
                        className="h-full rounded-sm"
                        style={{
                          width: `${(count / maxWastedType) * 100}%`,
                          background: "rgba(239,68,68,0.4)"
                        }}
                      />
                    </div>
                    <span className="text-xs font-bold w-5 text-right">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/40 mt-3">
            Wasted = grenade thrown with 0 enemies flashed and 0 utility damage
            dealt
          </p>
        </Collapsible>
      )}

      {/* ── Collapsible: Round timeline ── */}
      {hasRoundData && (
        <Collapsible
          title="Round utility timeline"
          badge={
            zeroSmokeRounds.length > 0
              ? `R${zeroSmokeRounds[0]?.roundNumber} flagged`
              : undefined
          }
          badgeTone="danger"
          defaultOpen={false}
        >
          <div className="mt-4 space-y-3">
            <p className="text-[11px] text-muted-foreground/50">
              Stacked per round: smokes (blue) · flashes (purple) · HE/molo
              (orange) ·{" "}
              <span className="text-red-400/70">
                Red highlight = buy round with 0 smokes
              </span>
            </p>
            <RoundChart
              rounds={roundsWithBuyFlag.map((r) => ({
                ...r,
                roundNumber: r.roundNumber
              }))}
            />
          </div>
        </Collapsible>
      )}
    </div>
  );
};
