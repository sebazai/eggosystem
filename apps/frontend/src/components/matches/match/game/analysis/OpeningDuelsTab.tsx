"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { NextImageFallback } from "@/components/layout/NextImageFallback";
import { createTeamLogoUrl } from "@/lib/utils";
import type {
  MatchGameOpeningDuel,
  MatchInfo,
  MatchPlayerStats,
  OpeningDuelTradeStatus
} from "@eggosystem/types";
import { orderMatchParticipantsBySideHomeLeft } from "@/lib/order-match-teams-home-left-away";

/* ─────────────────────────────────────────── */
/*  Types & constants                          */
/* ─────────────────────────────────────────── */

interface OpeningDuelsTabProps {
  duels: MatchGameOpeningDuel[];
  playerStats: MatchPlayerStats[];
  teams: MatchInfo["teams"];
}

const TRADE_CONFIG: Record<
  OpeningDuelTradeStatus,
  { label: string; color: string; ring: string }
> = {
  isolated: {
    label: "Isolated",
    color: "text-red-300/80",
    ring: "border-red-300/30 bg-red-300/10"
  },
  attempted: {
    label: "Attempted",
    color: "text-yellow-200/80",
    ring: "border-yellow-200/30 bg-yellow-200/10"
  },
  converted: {
    label: "Converted",
    color: "text-green-400/80",
    ring: "border-green-400/30 bg-green-400/10"
  }
};

const winPct = (won: number, total: number) =>
  total > 0 ? Math.round((won / total) * 100) : 0;

const winColor = (pct: number) =>
  pct >= 60
    ? "text-green-400/80"
    : pct >= 40
      ? "text-yellow-200/80"
      : "text-red-300/80";

const barColor = (pct: number) =>
  pct >= 60
    ? "bg-green-300/50"
    : pct >= 40
      ? "bg-yellow-200/45"
      : "bg-red-300/50";

/* ─────────────────────────────────────────── */
/*  Mini win bar                               */
/* ─────────────────────────────────────────── */
const WinBar = ({
  pct,
  label,
  won,
  total
}: {
  pct: number;
  label: string;
  won: number;
  total: number;
}) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-bold", winColor(pct))}>
        {pct}%{" "}
        <span className="text-muted-foreground font-normal">
          ({won}/{total})
        </span>
      </span>
    </div>
    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className={cn("h-full rounded-full", barColor(pct))}
        style={{ width: `${pct}%` }}
      />
    </div>
  </div>
);

/* ─────────────────────────────────────────── */
/*  Half divider                               */
/* ─────────────────────────────────────────── */
const HalfDivider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3 my-1">
    <div className="flex-1 h-px bg-border" />
    <span className="text-xs font-bold text-muted-foreground border border-border rounded-full px-4 py-1 whitespace-nowrap bg-muted/40">
      {label}
    </span>
    <div className="flex-1 h-px bg-border" />
  </div>
);

/* ─────────────────────────────────────────── */
/*  Trade badge                                */
/* ─────────────────────────────────────────── */
const TradeBadge = ({ status }: { status: OpeningDuelTradeStatus }) => {
  const cfg = TRADE_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border",
        cfg.color,
        cfg.ring
      )}
    >
      {cfg.label}
    </span>
  );
};

/* ─────────────────────────────────────────── */
/*  Trade donut                                */
/* ─────────────────────────────────────────── */
const TradeDonut = ({
  isolated,
  attempted,
  converted,
  size = 28
}: {
  isolated: number;
  attempted: number;
  converted: number;
  size?: number;
}) => {
  const total = isolated + attempted + converted || 1;
  const r = size / 2 - 3;
  const circ = 2 * Math.PI * r;
  const pIso = isolated / total;
  const pAtt = attempted / total;
  const pCon = converted / total;
  const dIso = circ * pIso;
  const dAtt = circ * pAtt;
  const dCon = circ * pCon;
  const cx = size / 2;
  const cy = size / 2;
  const segments = [
    { dash: dIso, offset: 0, color: "#fca5a5" },
    { dash: dAtt, offset: -dIso, color: "#fde68a" },
    { dash: dCon, offset: -(dIso + dAtt), color: "#86efac" }
  ];
  return (
    <svg
      width={size}
      height={size}
      style={{ transform: "rotate(-90deg)", flexShrink: 0 }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={5}
      />
      {segments.map((seg, i) =>
        seg.dash > 0 ? (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={5}
            strokeDasharray={`${seg.dash} ${circ}`}
            strokeDashoffset={seg.offset}
          />
        ) : null
      )}
    </svg>
  );
};

/* ─────────────────────────────────────────── */
/*  Player stats calculation                   */
/* ─────────────────────────────────────────── */
type PlayerDuelStat = {
  steamId: string;
  name: string;
  fk: number;
  fd: number;
  fkWon: number;
  tradeIsolated: number;
  tradeAttempted: number;
  tradeConverted: number;
};

function buildPlayerDuelStats(
  duels: MatchGameOpeningDuel[],
  steamIds: string[],
  nameMap: Map<string, string>
): PlayerDuelStat[] {
  const map = new Map<string, PlayerDuelStat>(
    steamIds.map((id) => [
      id,
      {
        steamId: id,
        name: nameMap.get(id) ?? id,
        fk: 0,
        fd: 0,
        fkWon: 0,
        tradeIsolated: 0,
        tradeAttempted: 0,
        tradeConverted: 0
      }
    ])
  );

  for (const d of duels) {
    if (map.has(d.killer_steam_id)) {
      const s = map.get(d.killer_steam_id)!;
      s.fk++;
      if (d.round_won_by === d.killer_team) s.fkWon++;
    }
    if (map.has(d.victim_steam_id)) {
      const s = map.get(d.victim_steam_id)!;
      s.fd++;
      if (d.trade === "isolated") s.tradeIsolated++;
      if (d.trade === "attempted") s.tradeAttempted++;
      if (d.trade === "converted") s.tradeConverted++;
    }
  }

  return Array.from(map.values()).sort((a, b) => b.fk + b.fd - (a.fk + a.fd));
}

/* ─────────────────────────────────────────── */
/*  Player duel row                            */
/* ─────────────────────────────────────────── */
const PlayerDuelRow = ({
  s,
  teamColor
}: {
  s: PlayerDuelStat;
  teamColor: string;
}) => {
  const fkPct = s.fk > 0 ? Math.round((s.fkWon / s.fk) * 100) : 0;
  const fdTotal = s.tradeIsolated + s.tradeAttempted + s.tradeConverted;

  return (
    <div className="px-3 py-2 rounded-lg bg-muted/30 border border-border/40 space-y-1.5">
      {/* Name + FK/FD */}
      <div className="flex items-center justify-between">
        <span className={cn("text-sm font-bold", teamColor)}>{s.name}</span>
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-green-400/80">{s.fk} FK</span>
          <span className="text-muted-foreground">/</span>
          <span className="font-bold text-red-300/80">{s.fd} FD</span>
        </div>
      </div>

      {/* FK ratio bar */}
      {s.fk + s.fd > 0 && (
        <div className="space-y-0.5">
          <div className="flex h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-green-300/50"
              style={{ width: `${(s.fk / (s.fk + s.fd)) * 100}%` }}
            />
            <div className="flex-1 bg-red-300/50" />
          </div>
          <p className={cn("text-xs font-bold", winColor(fkPct))}>
            {fkPct}% round win after FK
          </p>
        </div>
      )}

      {/* Trade donut + legend */}
      {fdTotal > 0 && (
        <div className="flex items-center gap-2">
          <TradeDonut
            isolated={s.tradeIsolated}
            attempted={s.tradeAttempted}
            converted={s.tradeConverted}
          />
          <div className="text-[11px] leading-[1.7]">
            <div>
              <span className="font-bold text-red-300/80">
                {s.tradeIsolated}
              </span>
              <span className="text-muted-foreground"> isolated · </span>
              <span className="font-bold text-yellow-200/80">
                {s.tradeAttempted}
              </span>
              <span className="text-muted-foreground"> attempted · </span>
              <span className="font-bold text-green-400/80">
                {s.tradeConverted}
              </span>
              <span className="text-muted-foreground"> converted</span>
            </div>
            {s.tradeIsolated > 1 && (
              <div className="inline-block mt-0.5 text-[10px] font-semibold text-red-300/80 border border-red-300/20 bg-red-300/5 rounded px-1.5 py-0.5">
                bad positioning — {s.tradeIsolated} isolated
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────── */
/*  Round duel card                            */
/* ─────────────────────────────────────────── */
const DuelCard = ({
  duel,
  nameMap
}: {
  duel: MatchGameOpeningDuel;
  nameMap: Map<string, string>;
}) => {
  const tWon = duel.round_won_by === "T";
  const killerName = nameMap.get(duel.killer_steam_id) ?? duel.killer_steam_id;
  const victimName = nameMap.get(duel.victim_steam_id) ?? duel.victim_steam_id;
  const tradeCfg = TRADE_CONFIG[duel.trade];

  return (
    <div
      className={cn(
        "rounded-lg border bg-card overflow-hidden mb-2",
        tWon
          ? "border-l-[3px] border-l-amber-300/50"
          : "border-l-[3px] border-l-sky-300/50"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 border-b border-border/50 text-xs">
        <span className="font-mono font-bold">R{duel.round_number}</span>
        <span className="text-muted-foreground">
          @{Math.round(duel.time_in_round)}s
        </span>
        <span className="bg-muted rounded px-1.5 py-0.5">{duel.weapon}</span>
        {duel.is_headshot && (
          <span className="text-orange-400/80 font-bold">HS</span>
        )}
        <div className="flex-1" />
        <span
          className={cn(
            "text-[11px] font-bold rounded-full px-2.5 py-0.5 border",
            tWon
              ? "text-amber-300/80 border-amber-300/30 bg-amber-300/10"
              : "text-sky-300/80 border-sky-300/30 bg-sky-300/10"
          )}
        >
          {tWon ? "T won" : "CT won"}
        </span>
      </div>

      {/* Duel row */}
      <div className="flex items-center gap-2 px-3 py-2 text-sm">
        <span
          className={cn(
            "text-[10px] font-bold rounded px-1.5 py-0.5",
            duel.killer_team === "T"
              ? "text-amber-300/80 bg-amber-300/10"
              : "text-sky-300/80 bg-sky-300/10"
          )}
        >
          {duel.killer_team}
        </span>
        <span
          className={cn(
            "font-bold",
            duel.killer_team === "T" ? "text-amber-300/80" : "text-sky-300/80"
          )}
        >
          {killerName}
        </span>
        <span className="text-muted-foreground text-xs">opened</span>
        <span className="text-muted-foreground">→</span>
        <span
          className={cn(
            "text-[10px] font-bold rounded px-1.5 py-0.5",
            duel.victim_team === "T"
              ? "text-amber-300/80 bg-amber-300/10"
              : "text-sky-300/80 bg-sky-300/10"
          )}
        >
          {duel.victim_team}
        </span>
        <span
          className={cn(
            "font-bold",
            duel.victim_team === "T" ? "text-amber-300/80" : "text-sky-300/80"
          )}
        >
          {victimName}
        </span>
        <div className="flex-1" />
        <TradeBadge status={duel.trade} />
      </div>

      {/* Trade explanation */}
      <div className="px-3 pb-2">
        <p className={cn("text-[10px]", tradeCfg.color)}>
          {duel.trade === "isolated" &&
            `${victimName} died alone — no teammate within trade range`}
          {duel.trade === "attempted" &&
            `Trade was attempted but ${killerName} survived`}
          {duel.trade === "converted" &&
            `${killerName} was killed in return — 1-for-1 exchange`}
        </p>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────── */
/*  Main tab                                   */
/* ─────────────────────────────────────────── */
export const OpeningDuelsTab = ({
  duels,
  playerStats,
  teams
}: OpeningDuelsTabProps) => {
  const [section, setSection] = useState<"players" | "rounds">("players");

  // Determine half boundary: rounds up to switchover are half 1
  const sortedRounds = useMemo(
    () => [...duels].sort((a, b) => a.round_number - b.round_number),
    [duels]
  );

  const { teamA, teamB } = useMemo(() => {
    const list = orderMatchParticipantsBySideHomeLeft(Object.values(teams));
    return { teamA: list[0]!, teamB: list[1]! };
  }, [teams]);

  // Build steam_id → nickname map
  const nameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const ps of playerStats) {
      m.set(String(ps.steam_id), ps.nickname);
    }
    return m;
  }, [playerStats]);

  // Team steam ID sets
  const teamASteamIds = useMemo(
    () =>
      playerStats
        .filter((ps) => ps.team_id === teamA.id)
        .map((ps) => String(ps.steam_id)),
    [playerStats, teamA]
  );
  const teamBSteamIds = useMemo(
    () =>
      playerStats
        .filter((ps) => ps.team_id === teamB.id)
        .map((ps) => String(ps.steam_id)),
    [playerStats, teamB]
  );

  const teamAStats = useMemo(
    () => buildPlayerDuelStats(duels, teamASteamIds, nameMap),
    [duels, teamASteamIds, nameMap]
  );
  const teamBStats = useMemo(
    () => buildPlayerDuelStats(duels, teamBSteamIds, nameMap),
    [duels, teamBSteamIds, nameMap]
  );

  // CS2: first half is always rounds 1–12, second half 13–24, OT from 25
  const halfBoundary = 12;

  const half1 = sortedRounds.filter((d) => d.round_number <= halfBoundary);
  const half2 = sortedRounds.filter((d) => d.round_number > halfBoundary);

  // Figure out which side team A was on in half 1 (from first duel)
  const teamAHalf1Side = useMemo(() => {
    const firstDuel = half1.find(
      (d) =>
        teamASteamIds.includes(d.killer_steam_id) ||
        teamASteamIds.includes(d.victim_steam_id)
    );
    if (!firstDuel) return "CT";
    if (teamASteamIds.includes(firstDuel.killer_steam_id))
      return firstDuel.killer_team;
    return firstDuel.victim_team;
  }, [half1, teamASteamIds]);

  const teamBHalf1Side: "CT" | "T" = teamAHalf1Side === "CT" ? "T" : "CT";

  // Summary stats
  const totalRounds = duels.length;

  const teamAFkDuels = duels.filter((d) =>
    teamASteamIds.includes(d.killer_steam_id)
  );
  const teamBFkDuels = duels.filter((d) =>
    teamBSteamIds.includes(d.killer_steam_id)
  );

  const teamAFkWon = teamAFkDuels.filter(
    (d) => d.round_won_by === d.killer_team
  ).length;
  const teamBFkWon = teamBFkDuels.filter(
    (d) => d.round_won_by === d.killer_team
  ).length;

  const teamAFkPct = winPct(teamAFkWon, teamAFkDuels.length);
  const teamBFkPct = winPct(teamBFkWon, teamBFkDuels.length);

  const teamARecovery = duels.filter((d) =>
    teamASteamIds.includes(d.victim_steam_id)
  );
  const teamBRecovery = duels.filter((d) =>
    teamBSteamIds.includes(d.victim_steam_id)
  );

  const teamARecoveredWon = teamARecovery.filter(
    (d) => d.round_won_by !== d.killer_team
  ).length;
  const teamBRecoveredWon = teamBRecovery.filter(
    (d) => d.round_won_by !== d.killer_team
  ).length;

  const teamARecPct = winPct(teamARecoveredWon, teamARecovery.length);
  const teamBRecPct = winPct(teamBRecoveredWon, teamBRecovery.length);

  const isolatedCount = duels.filter((d) => d.trade === "isolated").length;
  const attemptedCount = duels.filter((d) => d.trade === "attempted").length;
  const convertedCount = duels.filter((d) => d.trade === "converted").length;

  return (
    <div className="space-y-5">
      {/* ── Summary stat cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: `${teamA.name} win after FK`,
            value: `${teamAFkPct}%`,
            sub: `${teamAFkWon}/${teamAFkDuels.length} rounds`,
            color: winColor(teamAFkPct)
          },
          {
            label: `${teamB.name} win after FK`,
            value: `${teamBFkPct}%`,
            sub: `${teamBFkWon}/${teamBFkDuels.length} rounds`,
            color: winColor(teamBFkPct)
          },
          {
            label: `${teamA.name} recovery rate`,
            value: `${teamARecPct}%`,
            sub: `won ${teamARecoveredWon}/${teamARecovery.length} after losing duel`,
            color: winColor(teamARecPct)
          },
          {
            label: `${teamB.name} recovery rate`,
            value: `${teamBRecPct}%`,
            sub: `won ${teamBRecoveredWon}/${teamBRecovery.length} after losing duel`,
            color: winColor(teamBRecPct)
          }
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="rounded-lg border bg-card p-3 space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={cn("text-2xl font-bold", color)}>{value}</p>
            <p className="text-[11px] text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Distribution + Trade overview ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-sm font-semibold">Opening kill share</p>
          <WinBar
            pct={winPct(teamAFkDuels.length, totalRounds)}
            label={`${teamA.name} got the opener`}
            won={teamAFkDuels.length}
            total={totalRounds}
          />
          <WinBar
            pct={winPct(teamBFkDuels.length, totalRounds)}
            label={`${teamB.name} got the opener`}
            won={teamBFkDuels.length}
            total={totalRounds}
          />
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-3">
          <p className="text-sm font-semibold">Trade outcomes</p>
          <div className="flex items-center gap-4">
            <TradeDonut
              isolated={isolatedCount}
              attempted={attemptedCount}
              converted={convertedCount}
              size={56}
            />
            <div className="text-xs space-y-1 flex-1">
              <div>
                <span className="font-bold text-red-300/80">
                  {isolatedCount}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  isolated ({winPct(isolatedCount, totalRounds)}%)
                </span>
              </div>
              <div>
                <span className="font-bold text-yellow-200/80">
                  {attemptedCount}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  attempted, failed ({winPct(attemptedCount, totalRounds)}%)
                </span>
              </div>
              <div>
                <span className="font-bold text-green-400/80">
                  {convertedCount}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  converted ({winPct(convertedCount, totalRounds)}%)
                </span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground border-t border-border/50 pt-2">
            Isolated = no kill-back within ~5s · Attempted = trade tried but
            failed · Converted = 1-for-1
          </p>
        </div>
      </div>

      {/* ── Section tabs ── */}
      <div className="flex gap-2 flex-wrap">
        {(
          [
            { key: "players", label: "Player duels" },
            { key: "rounds", label: "Round-by-round" }
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSection(key)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors",
              section === key
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Player duels ── */}
      {section === "players" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { team: teamA, stats: teamAStats, color: "text-sky-300/80" },
            { team: teamB, stats: teamBStats, color: "text-amber-300/80" }
          ].map(({ team, stats, color }) => (
            <div key={team.id}>
              <div className="flex items-center gap-2 mb-3">
                <NextImageFallback
                  src={createTeamLogoUrl(team.logo)}
                  alt={team.name}
                  width={20}
                  height={20}
                  className="rounded-sm"
                />
                <span className={cn("text-sm font-bold", color)}>
                  {team.name}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground flex gap-3 mb-2">
                <span>
                  <span className="text-green-400/80 font-bold">■</span> FK win%
                </span>
                <span>
                  <span className="text-red-300/80 font-bold">■</span> isolated
                </span>
                <span>
                  <span className="text-yellow-200/80 font-bold">■</span>{" "}
                  attempted
                </span>
                <span>
                  <span className="text-green-400/80 font-bold">■</span>{" "}
                  converted
                </span>
              </div>
              <div className="space-y-1.5">
                {stats.map((s) => (
                  <PlayerDuelRow key={s.steamId} s={s} teamColor={color} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Round-by-round ── */}
      {section === "rounds" && (
        <div className="space-y-2">
          {half1.length > 0 && (
            <>
              <HalfDivider
                label={`Half 1 — ${teamA.name} ${teamAHalf1Side} · ${teamB.name} ${teamBHalf1Side}`}
              />
              {half1.map((d) => (
                <DuelCard key={d.round_number} duel={d} nameMap={nameMap} />
              ))}
            </>
          )}
          {half2.length > 0 && (
            <>
              <HalfDivider
                label={`Half 2 — ${teamA.name} ${teamAHalf1Side === "CT" ? "T" : "CT"} · ${teamB.name} ${teamBHalf1Side === "CT" ? "T" : "CT"}`}
              />
              {half2.map((d) => (
                <DuelCard key={d.round_number} duel={d} nameMap={nameMap} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};
