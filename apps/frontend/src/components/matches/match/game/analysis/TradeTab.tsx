"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import type {
  MatchGameTradeStats,
  PlayerTradeStats,
  TradeMatrixEntry
} from "@eggosystem/types";
import type { MatchTeamInfo } from "@eggosystem/types";
import { Button } from "@/components/ui/button";

/* ─── colour helpers ────────────────────────── */
const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100));

function effColor(v: number, lo = 35, hi = 60): string {
  if (v >= hi) return "text-green-400/80";
  if (v >= lo) return "text-yellow-200/80";
  return "text-red-300/80";
}

function effBg(v: number, lo = 35, hi = 60): string {
  if (v >= hi) return "bg-green-400/70";
  if (v >= lo) return "bg-yellow-200/60";
  return "bg-red-300/50";
}

/* ─── shared primitives ─────────────────────── */

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-4 my-8">
      <div className="flex-1 h-px bg-border/60" />
      <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/50 border border-border/50 rounded-full px-4 py-1 whitespace-nowrap">
        {title}
      </span>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  );
}

function FunnelBar({
  opp,
  att,
  conv,
  height = "h-1.5"
}: {
  opp: number;
  att: number;
  conv: number;
  height?: string;
}) {
  const failed = att - conv;
  const ignored = opp - att;
  if (opp === 0) {
    return <div className={cn(height, "rounded-full bg-muted/40")} />;
  }
  return (
    <div
      className={cn(height, "rounded-full bg-muted/40 overflow-hidden flex")}
    >
      {conv > 0 && <div className="bg-green-400/60" style={{ flex: conv }} />}
      {failed > 0 && (
        <div className="bg-yellow-200/50" style={{ flex: failed }} />
      )}
      {ignored > 0 && (
        <div className="bg-red-300/35" style={{ flex: ignored }} />
      )}
    </div>
  );
}

function RateBar({
  value,
  label,
  sub
}: {
  value: number;
  label: string;
  sub?: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-bold", effColor(value))}>{value}%</span>
      </div>
      <div className="h-[3px] rounded-full bg-muted/40 overflow-hidden">
        <div
          className={cn("h-full rounded-full", effBg(value))}
          style={{ width: `${value}%` }}
        />
      </div>
      {sub && <p className="text-[9px] text-muted-foreground/40 mt-1">{sub}</p>}
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SECTION 1 — Team Trade Discipline
   ══════════════════════════════════════════════════ */

function PlayerRankRow({
  p,
  teamColor,
  rankBy
}: {
  p: PlayerTradeStats;
  teamColor: string;
  rankBy: "trade" | "death";
}) {
  const value =
    rankBy === "trade"
      ? pct(p.trades, p.trade_opportunities)
      : pct(p.traded, p.deaths);
  const detail =
    rankBy === "trade"
      ? `${p.trades}/${p.trade_opportunities}`
      : `${p.traded}/${p.deaths}`;

  return (
    <div className="flex items-center gap-2 py-1.5 border-b border-border/30 last:border-0">
      <span className={cn("text-xs font-semibold flex-1 truncate", teamColor)}>
        {p.nickname}
      </span>
      <span className="text-[10px] text-muted-foreground/50 w-10 text-right">
        {detail}
      </span>
      <div className="w-16 h-1 rounded-full bg-muted/40 overflow-hidden">
        <div
          className={cn("h-full rounded-full", effBg(value))}
          style={{ width: `${value}%` }}
        />
      </div>
      <span
        className={cn("text-[11px] font-bold w-8 text-right", effColor(value))}
      >
        {value}%
      </span>
    </div>
  );
}

function TeamDisciplineCard({
  players,
  teamName,
  teamColor
}: {
  players: PlayerTradeStats[];
  teamName: string;
  teamColor: string;
}) {
  const opp = players.reduce((s, p) => s + p.trade_opportunities, 0);
  const att = players.reduce((s, p) => s + p.trade_attempts, 0);
  const conv = players.reduce((s, p) => s + p.trades, 0);
  const died = players.reduce((s, p) => s + p.deaths, 0);
  const trad = players.reduce((s, p) => s + p.traded, 0);

  const attRate = pct(att, opp);
  const convRate = pct(conv, att);
  const tradedPct = pct(trad, died);

  const headlines = [
    { v: opp, l: "opportunities", c: "text-foreground/80" },
    { v: `${attRate}%`, l: "attempt rate", c: effColor(attRate) },
    { v: `${convRate}%`, l: "conversion", c: effColor(convRate) },
    { v: `${tradedPct}%`, l: "deaths traded", c: effColor(tradedPct, 25, 45) }
  ] as const;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 space-y-4">
      {/* header + headline stats */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-4">
        <span className={cn("text-sm font-bold shrink-0", teamColor)}>
          {teamName}
        </span>
        <div className="grid grid-cols-4 gap-2 sm:flex sm:gap-4">
          {headlines.map((h) => (
            <div key={h.l} className="text-center">
              <div className={cn("text-sm font-extrabold leading-none", h.c)}>
                {h.v}
              </div>
              <div className="text-[9px] text-muted-foreground/40 mt-1">
                {h.l}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* funnel bar */}
      <div>
        <div className="flex justify-between text-[9px] mb-1">
          <span className="text-green-400/70">Success ({conv})</span>
          <span className="text-yellow-200/70">Failed ({att - conv})</span>
          <span className="text-red-300/60">Ignored ({opp - att})</span>
        </div>
        <FunnelBar opp={opp} att={att} conv={conv} height="h-2" />
      </div>

      <div className="h-px bg-border/40" />

      {/* ranked lists */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/35 mb-2">
            Trade efficiency ↓
          </div>
          {[...players]
            .sort(
              (a, b) =>
                pct(b.trades, b.trade_opportunities) -
                pct(a.trades, a.trade_opportunities)
            )
            .map((p) => (
              <PlayerRankRow
                key={p.steam_id}
                p={p}
                teamColor={teamColor}
                rankBy="trade"
              />
            ))}
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/35 mb-2">
            Deaths traded ↓
          </div>
          {[...players]
            .sort((a, b) => pct(b.traded, b.deaths) - pct(a.traded, a.deaths))
            .map((p) => (
              <PlayerRankRow
                key={p.steam_id}
                p={p}
                teamColor={teamColor}
                rankBy="death"
              />
            ))}
        </div>
      </div>
    </div>
  );
}

function TeamDisciplineSection({
  teamAPlayers,
  teamBPlayers,
  teamAName,
  teamBName,
  activeTeam,
  onToggle
}: {
  teamAPlayers: PlayerTradeStats[];
  teamBPlayers: PlayerTradeStats[];
  teamAName: string;
  teamBName: string;
  activeTeam: "A" | "B";
  onToggle: () => void;
}) {
  const players = activeTeam === "A" ? teamAPlayers : teamBPlayers;
  const name = activeTeam === "A" ? teamAName : teamBName;
  const color = activeTeam === "A" ? "text-amber-300/80" : "text-sky-300/80";

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Team-level trade funnel — how often each team takes trade opportunities,
        attempts them, and converts. Ranked player lists highlight the best
        traders and most well-positioned deaths.
      </p>
      <div className="flex gap-2">
        <Button
          size="xs"
          variant={activeTeam === "A" ? "default" : "outline"}
          onClick={() => activeTeam !== "A" && onToggle()}
        >
          {teamAName}
        </Button>
        <Button
          size="xs"
          variant={activeTeam === "B" ? "default" : "outline"}
          onClick={() => activeTeam !== "B" && onToggle()}
        >
          {teamBName}
        </Button>
      </div>
      <TeamDisciplineCard players={players} teamName={name} teamColor={color} />
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SECTION 2 — Full Per-Player Trade Profile
   ══════════════════════════════════════════════════ */

function DeathBar({ p }: { p: PlayerTradeStats }) {
  const untraded = p.deaths - p.traded;
  if (p.deaths === 0) {
    return <div className="h-1.5 rounded-full bg-muted/40" />;
  }
  return (
    <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden flex">
      {p.traded > 0 && (
        <div className="bg-green-400/60" style={{ flex: p.traded }} />
      )}
      {untraded > 0 && (
        <div className="bg-red-300/35" style={{ flex: untraded }} />
      )}
    </div>
  );
}

function FullPlayerCard({
  p,
  teamColor
}: {
  p: PlayerTradeStats;
  teamColor: string;
}) {
  const attRate = pct(p.trade_attempts, p.trade_opportunities);
  const convRate = pct(p.trades, p.trade_attempts);
  const tradedPct = pct(p.traded, p.deaths);
  const fdPct = pct(p.first_death_traded, p.first_death_trade_opportunities);

  return (
    <div className="rounded-lg border border-border/60 bg-card p-3 space-y-3">
      {/* header */}
      <div className="flex justify-between items-center">
        <span className={cn("text-sm font-bold", teamColor)}>{p.nickname}</span>
        <div className="flex gap-3">
          {[
            { v: p.trade_opportunities, l: "opp", c: "text-foreground/70" },
            { v: p.trade_attempts, l: "tried", c: "text-foreground/70" },
            { v: p.trades, l: "success", c: "text-green-400/80" }
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className={cn("text-sm font-extrabold leading-none", s.c)}>
                {s.v}
              </div>
              <div className="text-[9px] text-muted-foreground/40 mt-0.5">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* when killing */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-muted-foreground/50">
          When a teammate is killed nearby →
        </p>
        <div className="flex justify-between text-[9px] mb-1">
          <span className="text-green-400/70">Success ({p.trades})</span>
          <span className="text-yellow-200/70">
            Failed ({p.trade_attempts - p.trades})
          </span>
          <span className="text-red-300/60">
            Ignored ({p.trade_opportunities - p.trade_attempts})
          </span>
        </div>
        <FunnelBar
          opp={p.trade_opportunities}
          att={p.trade_attempts}
          conv={p.trades}
        />
        <div className="grid grid-cols-2 gap-3 pt-1">
          <RateBar
            value={attRate}
            label="Attempt rate"
            sub={`Tried ${p.trade_attempts}/${p.trade_opportunities} opportunities`}
          />
          <RateBar
            value={convRate}
            label="Conversion rate"
            sub={`Got ${p.trades}/${p.trade_attempts} attempts`}
          />
        </div>
      </div>

      <div className="h-px bg-border/40" />

      {/* when dying */}
      <div className="space-y-1.5">
        <p className="text-[10px] text-muted-foreground/50">When you die →</p>
        <div className="flex justify-between text-[9px] mb-1">
          <span className="text-green-400/70">Traded ({p.traded})</span>
          <span className="text-red-300/60">
            Not traded ({p.deaths - p.traded})
          </span>
        </div>
        <DeathBar p={p} />
        <div className="grid grid-cols-2 gap-3 pt-1">
          <RateBar
            value={tradedPct}
            label="Death traded rate"
            sub={`${p.traded}/${p.deaths} deaths avenged`}
          />
          <RateBar
            value={fdPct}
            label="FK death traded"
            sub={`${p.first_death_traded}/${p.first_death_trade_opportunities} tradeable FK deaths`}
          />
        </div>
      </div>
    </div>
  );
}

function PlayerProfileSection({
  teamAPlayers,
  teamBPlayers,
  teamAName,
  teamBName
}: {
  teamAPlayers: PlayerTradeStats[];
  teamBPlayers: PlayerTradeStats[];
  teamAName: string;
  teamBName: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Full trade profile per player: the opportunity funnel (did you try? did
        you convert?), and how well-positioned your deaths were.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="text-xs font-bold text-amber-300/80">{teamAName}</div>
          {teamAPlayers.map((p) => (
            <FullPlayerCard
              key={p.steam_id}
              p={p}
              teamColor="text-amber-300/80"
            />
          ))}
        </div>
        <div className="space-y-3">
          <div className="text-xs font-bold text-sky-300/80">{teamBName}</div>
          {teamBPlayers.map((p) => (
            <FullPlayerCard
              key={p.steam_id}
              p={p}
              teamColor="text-sky-300/80"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   SECTION 3 — Trade Relationship Matrix
   ══════════════════════════════════════════════════ */

function MatrixCell({ v }: { v: number }) {
  const alpha = v === 0 ? 0 : Math.min(0.85, 0.18 + v * 0.3);
  return (
    <div
      className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold border"
      style={{
        background:
          v > 0 ? `rgba(134,239,172,${alpha})` : "rgba(255,255,255,0.02)",
        borderColor: v > 0 ? `rgba(134,239,172,0.2)` : "rgba(255,255,255,0.05)",
        color: v > 0 ? "rgb(134,239,172)" : "rgba(255,255,255,0.15)"
      }}
    >
      {v > 0 ? v : "·"}
    </div>
  );
}

function BlankCell() {
  return (
    <div
      className="w-8 h-8 rounded border"
      style={{
        background: "rgba(255,255,255,0.01)",
        borderColor: "rgba(255,255,255,0.04)"
      }}
    />
  );
}

function TradeMatrixSection({
  matrix,
  teamAPlayers,
  teamBPlayers,
  teamAName,
  teamBName
}: {
  matrix: TradeMatrixEntry[];
  teamAPlayers: PlayerTradeStats[];
  teamBPlayers: PlayerTradeStats[];
  teamAName: string;
  teamBName: string;
}) {
  const allPlayers = [...teamAPlayers, ...teamBPlayers];
  const tIds = teamAPlayers.map((p) => p.steam_id);
  const ctIds = teamBPlayers.map((p) => p.steam_id);

  const lookup = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of matrix) {
      m.set(`${e.trader_steam_id}:${e.killer_steam_id}`, e.count);
    }
    return m;
  }, [matrix]);

  const getCount = (trader: string, killer: string) =>
    lookup.get(`${trader}:${killer}`) ?? 0;

  const rowTotal = (traderId: string) =>
    allPlayers.reduce((s, p) => s + getCount(traderId, p.steam_id), 0);

  const colTotal = (killerId: string) =>
    allPlayers.reduce((s, p) => s + getCount(p.steam_id, killerId), 0);

  const nameOf = (p: PlayerTradeStats) => p.nickname;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground leading-relaxed">
        Who avenged whom. Each row is a <em>trader</em>; each column is the
        enemy killer they punished.{" "}
        <span className="text-green-400/70 font-medium">Green</span> = trade
        made. The bottom row shows how many times each player was traded out —
        meaning they killed in a dangerous, punishable spot.
      </p>

      <div className="overflow-x-auto">
        <table className="border-separate" style={{ borderSpacing: 3 }}>
          <thead>
            <tr>
              {/* corner */}
              <th colSpan={2} className="pb-2 text-left">
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/30">
                  TRADER ↓ &nbsp;·&nbsp; punished →
                </span>
              </th>

              {/* Team A column headers */}
              {teamAPlayers.map((p) => (
                <th key={p.steam_id} className="pb-2 align-bottom">
                  <div
                    className="text-[10px] font-bold text-amber-300/80 whitespace-nowrap pb-1 max-h-16 overflow-hidden"
                    style={{
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)"
                    }}
                  >
                    {nameOf(p)}
                  </div>
                </th>
              ))}

              <th className="w-3" />

              {/* Team B column headers */}
              {teamBPlayers.map((p) => (
                <th key={p.steam_id} className="pb-2 align-bottom">
                  <div
                    className="text-[10px] font-bold text-sky-300/80 whitespace-nowrap pb-1 max-h-16 overflow-hidden"
                    style={{
                      writingMode: "vertical-rl",
                      transform: "rotate(180deg)"
                    }}
                  >
                    {nameOf(p)}
                  </div>
                </th>
              ))}

              <th className="w-3" />
              <th className="pb-2 pl-2 text-[10px] text-muted-foreground/40 align-bottom">
                Σ
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Team A traders */}
            {teamAPlayers.map((trader, ri) => {
              const total = rowTotal(trader.steam_id);
              return (
                <tr key={trader.steam_id}>
                  {ri === 0 && (
                    <td
                      rowSpan={teamAPlayers.length}
                      className="pr-1.5 align-middle"
                    >
                      <div
                        className="text-[9px] font-bold uppercase tracking-wider text-amber-300/40 whitespace-nowrap"
                        style={{
                          writingMode: "vertical-rl",
                          transform: "rotate(180deg)"
                        }}
                      >
                        {teamAName}
                      </div>
                    </td>
                  )}
                  <td className="pr-2 whitespace-nowrap">
                    <span className="text-xs font-semibold text-amber-300/80">
                      {nameOf(trader)}
                    </span>
                  </td>
                  {/* own team — blank */}
                  {tIds.map((id) => (
                    <td key={id} className="p-0">
                      <BlankCell />
                    </td>
                  ))}
                  <td />
                  {/* enemy cells */}
                  {ctIds.map((id) => (
                    <td key={id} className="p-0">
                      <MatrixCell v={getCount(trader.steam_id, id)} />
                    </td>
                  ))}
                  <td />
                  <td className="pl-2 align-middle">
                    <span
                      className={cn(
                        "text-xs font-bold",
                        total > 0
                          ? "text-green-400/80"
                          : "text-muted-foreground/30"
                      )}
                    >
                      {total || "—"}
                    </span>
                  </td>
                </tr>
              );
            })}

            {/* gap */}
            <tr>
              <td colSpan={99} className="h-2" />
            </tr>

            {/* Team B traders */}
            {teamBPlayers.map((trader, ri) => {
              const total = rowTotal(trader.steam_id);
              return (
                <tr key={trader.steam_id}>
                  {ri === 0 && (
                    <td
                      rowSpan={teamBPlayers.length}
                      className="pr-1.5 align-middle"
                    >
                      <div
                        className="text-[9px] font-bold uppercase tracking-wider text-sky-300/40 whitespace-nowrap"
                        style={{
                          writingMode: "vertical-rl",
                          transform: "rotate(180deg)"
                        }}
                      >
                        {teamBName}
                      </div>
                    </td>
                  )}
                  <td className="pr-2 whitespace-nowrap">
                    <span className="text-xs font-semibold text-sky-300/80">
                      {nameOf(trader)}
                    </span>
                  </td>
                  {/* enemy cells */}
                  {tIds.map((id) => (
                    <td key={id} className="p-0">
                      <MatrixCell v={getCount(trader.steam_id, id)} />
                    </td>
                  ))}
                  <td />
                  {/* own team — blank */}
                  {ctIds.map((id) => (
                    <td key={id} className="p-0">
                      <BlankCell />
                    </td>
                  ))}
                  <td />
                  <td className="pl-2 align-middle">
                    <span
                      className={cn(
                        "text-xs font-bold",
                        total > 0
                          ? "text-green-400/80"
                          : "text-muted-foreground/30"
                      )}
                    >
                      {total || "—"}
                    </span>
                  </td>
                </tr>
              );
            })}

            {/* column totals */}
            <tr>
              <td colSpan={99} className="h-1" />
            </tr>
            <tr>
              <td
                colSpan={2}
                className="pr-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground/30 text-right align-middle"
              >
                Times traded ↓
              </td>
              {tIds.map((id) => {
                const t = colTotal(id);
                return (
                  <td key={id} className="text-center align-middle">
                    <span
                      className={cn(
                        "text-xs font-bold",
                        t > 0 ? "text-red-300/70" : "text-muted-foreground/25"
                      )}
                    >
                      {t || "·"}
                    </span>
                  </td>
                );
              })}
              <td />
              {ctIds.map((id) => {
                const t = colTotal(id);
                return (
                  <td key={id} className="text-center align-middle">
                    <span
                      className={cn(
                        "text-xs font-bold",
                        t > 0 ? "text-red-300/70" : "text-muted-foreground/25"
                      )}
                    >
                      {t || "·"}
                    </span>
                  </td>
                );
              })}
              <td colSpan={2} />
            </tr>
          </tbody>
        </table>
      </div>

      {/* legend */}
      <div className="flex flex-wrap gap-5 text-[10px] text-muted-foreground/40 pt-1">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ background: "rgba(134,239,172,0.5)" }}
          />
          Green = trade made
        </span>
        <span>
          <span className="text-red-300/70 font-bold">Red</span> bottom row =
          that player was traded out (killed in a punishable spot)
        </span>
        <span>
          <span className="text-green-400/80 font-bold">Σ</span> = total trades
          made
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   ROOT
   ══════════════════════════════════════════════════ */

interface TradeTabProps {
  tradeStats: MatchGameTradeStats;
  teams: Record<string, MatchTeamInfo>;
}

export const TradeTab = ({ tradeStats, teams }: TradeTabProps) => {
  const [activeTeam, setActiveTeam] = useState<"A" | "B">("A");

  const teamList = useMemo(() => Object.values(teams), [teams]);
  const teamA = teamList[0];
  const teamB = teamList[1];

  const teamAName = teamA?.name ?? "Team A";
  const teamBName = teamB?.name ?? "Team B";

  // Split players by team_id returned from the backend
  const teamAId = teamA?.id;

  const teamAPlayers = useMemo(
    () => tradeStats.players.filter((p) => p.team_id === teamAId),
    [tradeStats.players, teamAId]
  );
  const teamBPlayers = useMemo(
    () => tradeStats.players.filter((p) => p.team_id !== teamAId),
    [tradeStats.players, teamAId]
  );

  return (
    <div className="space-y-0">
      {/* legend strip */}
      <div className="flex flex-wrap gap-4 text-[10px] text-muted-foreground/50 mb-2">
        {[
          { bg: "bg-green-400/50", label: "Success / traded" },
          { bg: "bg-yellow-200/45", label: "Failed (attempted, no kill)" },
          { bg: "bg-red-300/35", label: "Ignored / not traded" }
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className={cn("inline-block w-2.5 h-2.5 rounded-sm", l.bg)} />
            {l.label}
          </span>
        ))}
      </div>

      {/* ── Section 1: Team Trade Discipline ── */}
      <SectionDivider title="Team Trade Discipline" />
      <TeamDisciplineSection
        teamAPlayers={teamAPlayers}
        teamBPlayers={teamBPlayers}
        teamAName={teamAName}
        teamBName={teamBName}
        activeTeam={activeTeam}
        onToggle={() => setActiveTeam((prev) => (prev === "A" ? "B" : "A"))}
      />

      {/* ── Section 2: Player Trade Profile ── */}
      <SectionDivider title="Player Trade Profile" />
      <PlayerProfileSection
        teamAPlayers={teamAPlayers}
        teamBPlayers={teamBPlayers}
        teamAName={teamAName}
        teamBName={teamBName}
      />

      {/* ── Section 3: Trade Matrix ── */}
      <SectionDivider title="Trade Relationship Matrix" />
      <TradeMatrixSection
        matrix={tradeStats.matrix}
        teamAPlayers={teamAPlayers}
        teamBPlayers={teamBPlayers}
        teamAName={teamAName}
        teamBName={teamBName}
      />
    </div>
  );
};
