"use client";

import React, { useMemo, useState } from "react";
import { orderMatchParticipantsBySideHomeLeft } from "@/lib/order-match-teams-home-left-away";
import { useGameRoundInfo } from "@/hooks/data/useGameRoundInfo";
import {
  AnalysisCard,
  VersusStat,
  SegmentBar,
  Legend,
  TEAM_A_COLOR,
  TEAM_B_COLOR,
  BAD_COLOR,
  GOOD_COLOR
} from "./AnalysisVizComponents";
import type {
  MatchGameOpeningDuel,
  MatchInfo,
  MatchPlayerStats,
  OpeningDuelTradeStatus
} from "@eggosystem/types";

interface OpeningDuelsTabProps {
  matchGameId: number;
  duels: MatchGameOpeningDuel[];
  playerStats: MatchPlayerStats[];
  teams: MatchInfo["teams"];
}

const TRADE_COLORS: Record<OpeningDuelTradeStatus, string> = {
  isolated: "var(--muted-foreground)",
  attempted: BAD_COLOR,
  converted: GOOD_COLOR
};

const TRADE_LABELS: Record<OpeningDuelTradeStatus, string> = {
  isolated: "left alone",
  attempted: "trade failed",
  converted: "traded back"
};

/* ─── Opener strip ───────────────────────────────────────────────── */
function OpenerStrip({
  duels,
  playerNames,
  regulationRounds
}: {
  duels: MatchGameOpeningDuel[];
  playerNames: Map<string, string>;
  regulationRounds: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const sorted = useMemo(
    () => [...duels].sort((a, b) => a.round_number - b.round_number),
    [duels]
  );

  if (!sorted.length) return null;
  const halftime = regulationRounds / 2;
  const hasOvertime =
    sorted.length > 0 &&
    sorted[sorted.length - 1]!.round_number > regulationRounds;

  const cellMinW = 32;
  const numSeps = hasOvertime ? 2 : 1;
  const minContentW = sorted.length * (cellMinW + 2) + numSeps * 4;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2 items-start">
        {/* Static row labels */}
        <div className="flex flex-col gap-2 shrink-0 text-[9px] text-muted-foreground/50 uppercase tracking-wide">
          <span className="h-[32px] flex items-center">First kill</span>
          <span className="h-[32px] flex items-center">Round won</span>
          <span className="h-[9px]" />
        </div>

        {/* Scrollable bar + number rows */}
        <div
          className="-mr-4 pr-4 sm:mr-0 sm:pr-0 overflow-x-auto flex-1 min-w-0"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div
            style={{
              minWidth: minContentW,
              display: "flex",
              flexDirection: "column",
              gap: 4
            }}
          >
            {/* FK row */}
            <div className="flex items-center gap-0.5 w-full">
              {sorted.map((d, idx) => {
                const isHalf = idx === halftime;
                const isOT = hasOvertime && idx === regulationRounds;
                const dimmed = hovered !== null && hovered !== d.round_number;
                const killerTeamColor =
                  d.killer_team === "CT" ? TEAM_A_COLOR : TEAM_B_COLOR;
                return (
                  <React.Fragment key={d.round_number}>
                    {(isHalf || isOT) && (
                      <div
                        style={{
                          width: 2,
                          height: 32,
                          background: "var(--border)",
                          borderRadius: 9999,
                          flexShrink: 0
                        }}
                      />
                    )}
                    <div
                      onMouseEnter={() => setHovered(d.round_number)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        flex: 1,
                        minWidth: cellMinW,
                        height: 32,
                        background: killerTeamColor,
                        borderRadius: 3,
                        opacity: dimmed ? 0.2 : 1,
                        cursor: "default",
                        transition: "opacity 0.1s"
                      }}
                    />
                  </React.Fragment>
                );
              })}
            </div>

            {/* Round won row */}
            <div className="flex items-center gap-0.5 w-full">
              {sorted.map((d, idx) => {
                const isHalf = idx === halftime;
                const isOT = hasOvertime && idx === regulationRounds;
                const dimmed = hovered !== null && hovered !== d.round_number;
                const winColor =
                  d.round_won_by === "CT" ? TEAM_A_COLOR : TEAM_B_COLOR;
                return (
                  <React.Fragment key={d.round_number}>
                    {(isHalf || isOT) && (
                      <div
                        style={{
                          width: 2,
                          height: 32,
                          background: "var(--border)",
                          borderRadius: 9999,
                          flexShrink: 0
                        }}
                      />
                    )}
                    <div
                      onMouseEnter={() => setHovered(d.round_number)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        flex: 1,
                        minWidth: cellMinW,
                        height: 32,
                        background: winColor,
                        borderRadius: 3,
                        opacity: dimmed ? 0.2 : 1,
                        transition: "opacity 0.1s"
                      }}
                    />
                  </React.Fragment>
                );
              })}
            </div>

            {/* Round number labels */}
            <div className="flex items-center gap-0.5 w-full">
              {sorted.map((d, idx) => {
                const isHalf = idx === halftime;
                const isOT = hasOvertime && idx === regulationRounds;
                return (
                  <React.Fragment key={d.round_number}>
                    {(isHalf || isOT) && (
                      <div style={{ width: 2, flexShrink: 0 }} />
                    )}
                    <div
                      style={{
                        flex: 1,
                        minWidth: cellMinW,
                        textAlign: "center",
                        fontSize: 9,
                        color: isOT
                          ? "var(--kanaliiga-orange)"
                          : "var(--muted-foreground)",
                        opacity: hovered === d.round_number ? 1 : 0.4
                      }}
                    >
                      {d.round_number}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Hover readout */}
      <div className="text-[11px] text-muted-foreground/80 min-h-[18px]">
        {hovered !== null &&
          (() => {
            const d = sorted.find((x) => x.round_number === hovered);
            if (!d) return null;
            const fkName = playerNames.get(d.killer_steam_id);
            const victimName = playerNames.get(d.victim_steam_id);
            return (
              <span>
                <span className="font-semibold text-foreground">
                  R{d.round_number}
                </span>
                {" · "}
                {fkName && (
                  <>
                    <span className="font-medium">{fkName}</span> → {victimName}
                  </>
                )}
                {" · "}
                {d.weapon}
                {d.is_headshot ? " HS" : ""}
                {" · "}
                <span
                  style={{
                    color: d.round_won_by === "CT" ? TEAM_A_COLOR : TEAM_B_COLOR
                  }}
                >
                  {d.round_won_by} won
                </span>
              </span>
            );
          })()}
      </div>
    </div>
  );
}

/* ─── Entry player row ───────────────────────────────────────────── */
function EntryPlayerRow({
  name,
  fk,
  fd,
  fkWins,
  trades,
  color
}: {
  name: string;
  fk: number;
  fd: number;
  fkWins: number;
  trades: Record<OpeningDuelTradeStatus, number>;
  color: string;
}) {
  const [hoveredSegment, setHoveredSegment] =
    useState<OpeningDuelTradeStatus | null>(null);
  const winPct = fk === 0 ? 0 : Math.round((fkWins / fk) * 100);
  const totalTrades = Object.values(trades).reduce((s, n) => s + n, 0);

  return (
    <div className="flex flex-col gap-1 py-2 border-b border-border/20 last:border-0">
      <div className="flex items-center gap-1.5">
        <span
          style={{
            width: 3,
            height: 14,
            background: color,
            borderRadius: 9999,
            display: "inline-block",
            flexShrink: 0
          }}
        />
        <span className="text-sm font-semibold truncate">{name}</span>
      </div>
      <div className="flex items-center gap-3 text-xs pl-[11px]">
        <span className="tabular-nums">
          <span className="font-bold" style={{ color }}>
            {fk}
          </span>
          <span className="text-muted-foreground/60 mx-0.5">FK</span>
        </span>
        <span className="tabular-nums">
          <span className="font-bold text-muted-foreground">{fd}</span>
          <span className="text-muted-foreground/60 mx-0.5">FD</span>
        </span>
        <span className="tabular-nums text-muted-foreground">
          {winPct}% win after FK
        </span>
      </div>
      {totalTrades > 0 && (
        <div className="flex items-center gap-2 pl-[11px]">
          <span className="text-[10px] text-muted-foreground/50 shrink-0">
            FD trade:
          </span>
          <div className="relative flex-1" style={{ minWidth: 60 }}>
            <div
              className="flex h-2 rounded-full overflow-hidden"
              style={{ background: "var(--muted)" }}
            >
              {(
                [
                  "isolated",
                  "attempted",
                  "converted"
                ] as OpeningDuelTradeStatus[]
              ).map((k) => {
                const v = trades[k];
                if (!v) return null;
                const isHovered = hoveredSegment === k;
                return (
                  <div
                    key={k}
                    onMouseEnter={() => setHoveredSegment(k)}
                    onMouseLeave={() => setHoveredSegment(null)}
                    style={{
                      flex: v,
                      background: TRADE_COLORS[k],
                      cursor: "default",
                      outline: isHovered
                        ? `1.5px solid var(--foreground)`
                        : "none",
                      outlineOffset: -1,
                      transition: "outline 0s"
                    }}
                  />
                );
              })}
            </div>
            {hoveredSegment && (
              <div
                className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium pointer-events-none z-10"
                style={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  color: TRADE_COLORS[hoveredSegment]
                }}
              >
                {trades[hoveredSegment]}× {TRADE_LABELS[hoveredSegment]}
              </div>
            )}
          </div>
          <span className="text-[10px] text-muted-foreground/50 shrink-0 tabular-nums">
            {totalTrades}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
export const OpeningDuelsTab = ({
  matchGameId,
  duels,
  playerStats,
  teams
}: OpeningDuelsTabProps) => {
  const { roundInfo } = useGameRoundInfo(matchGameId);
  const regulationRounds = useMemo(
    () => roundInfo?.[0]?.regulation_rounds ?? duels.length * 2,
    [roundInfo, duels.length]
  );

  const [teamA, teamB] = useMemo(() => {
    const list = orderMatchParticipantsBySideHomeLeft(Object.values(teams));
    return [list[0], list[1]] as const;
  }, [teams]);

  const teamAId = teamA?.id ?? 0;
  const teamBId = teamB?.id ?? 0;

  const playerNames = useMemo(() => {
    const m = new Map<string, string>();
    playerStats.forEach((p) => m.set(p.steam_id, p.nickname));
    return m;
  }, [playerStats]);

  // Team KPIs
  const kpis = useMemo(() => {
    const initKpi = () => ({
      openers: 0,
      winAfterFK: 0,
      totalFK: 0,
      recovery: 0,
      totalFD: 0
    });
    const a = initKpi();
    const b = initKpi();

    // Map steamId → teamId
    const steamToTeam = new Map<string, number>();
    playerStats.forEach((p) => steamToTeam.set(p.steam_id, p.team_id));

    for (const d of duels) {
      const killerTeamId = steamToTeam.get(d.killer_steam_id) ?? 0;
      const victimTeamId = steamToTeam.get(d.victim_steam_id) ?? 0;

      // FK for killer's team
      if (killerTeamId === teamAId) {
        a.openers++;
        a.totalFK++;
        const killerWon = d.round_won_by === d.killer_team;
        if (killerWon) a.winAfterFK++;
      } else if (killerTeamId === teamBId) {
        b.openers++;
        b.totalFK++;
        const killerWon = d.round_won_by === d.killer_team;
        if (killerWon) b.winAfterFK++;
      }

      // Recovery for victim's team
      if (victimTeamId === teamAId) {
        a.totalFD++;
        const victimWon = d.round_won_by !== d.killer_team;
        if (victimWon) a.recovery++;
      } else if (victimTeamId === teamBId) {
        b.totalFD++;
        const victimWon = d.round_won_by !== d.killer_team;
        if (victimWon) b.recovery++;
      }
    }

    return {
      a: {
        openers: a.openers,
        winAfterFKPct:
          a.totalFK === 0 ? 0 : Math.round((a.winAfterFK / a.totalFK) * 100),
        recoveryPct:
          a.totalFD === 0 ? 0 : Math.round((a.recovery / a.totalFD) * 100)
      },
      b: {
        openers: b.openers,
        winAfterFKPct:
          b.totalFK === 0 ? 0 : Math.round((b.winAfterFK / b.totalFK) * 100),
        recoveryPct:
          b.totalFD === 0 ? 0 : Math.round((b.recovery / b.totalFD) * 100)
      }
    };
  }, [duels, playerStats, teamAId, teamBId]);

  // Trade outcomes
  const tradeOutcomes = useMemo(() => {
    const counts: Record<OpeningDuelTradeStatus, number> = {
      isolated: 0,
      attempted: 0,
      converted: 0
    };
    duels.forEach((d) => counts[d.trade]++);
    return counts;
  }, [duels]);

  // Per-player entry stats
  const playerEntry = useMemo(() => {
    const map = new Map<
      string,
      {
        fk: number;
        fd: number;
        fkWins: number;
        trades: Record<OpeningDuelTradeStatus, number>;
      }
    >();

    const steamToTeam = new Map<string, number>();
    playerStats.forEach((p) => steamToTeam.set(p.steam_id, p.team_id));

    for (const d of duels) {
      if (!map.has(d.killer_steam_id)) {
        map.set(d.killer_steam_id, {
          fk: 0,
          fd: 0,
          fkWins: 0,
          trades: { isolated: 0, attempted: 0, converted: 0 }
        });
      }
      if (!map.has(d.victim_steam_id)) {
        map.set(d.victim_steam_id, {
          fk: 0,
          fd: 0,
          fkWins: 0,
          trades: { isolated: 0, attempted: 0, converted: 0 }
        });
      }

      const killer = map.get(d.killer_steam_id)!;
      killer.fk++;
      if (d.round_won_by === d.killer_team) killer.fkWins++;

      const victim = map.get(d.victim_steam_id)!;
      victim.fd++;
      victim.trades[d.trade]++;
    }

    return map;
  }, [duels, playerStats]);

  const teamAPlayers = playerStats
    .filter((p) => p.team_id === teamAId)
    .sort(
      (a, b) =>
        (playerEntry.get(b.steam_id)?.fk ?? 0) -
        (playerEntry.get(a.steam_id)?.fk ?? 0)
    );

  const teamBPlayers = playerStats
    .filter((p) => p.team_id === teamBId)
    .sort(
      (a, b) =>
        (playerEntry.get(b.steam_id)?.fk ?? 0) -
        (playerEntry.get(a.steam_id)?.fk ?? 0)
    );

  const totalTrades = Object.values(tradeOutcomes).reduce((s, n) => s + n, 0);

  return (
    <div className="flex flex-col gap-3.5">
      {/* First-blood battle */}
      <AnalysisCard
        title="First-blood battle"
        sub="Who wins the opening duel — and whether it converts"
      >
        <div className="flex flex-col gap-4">
          <VersusStat
            label="First kills won"
            aVal={kpis.a.openers}
            bVal={kpis.b.openers}
            mode="share"
          />
          <VersusStat
            label="Round win after first kill"
            aVal={kpis.a.winAfterFKPct}
            bVal={kpis.b.winAfterFKPct}
            mode="pct"
            aText={`${kpis.a.winAfterFKPct}%`}
            bText={`${kpis.b.winAfterFKPct}%`}
          />
          <VersusStat
            label="Recovery — won round after losing the opener"
            aVal={kpis.a.recoveryPct}
            bVal={kpis.b.recoveryPct}
            mode="pct"
            aText={`${kpis.a.recoveryPct}%`}
            bText={`${kpis.b.recoveryPct}%`}
          />
        </div>
      </AnalysisCard>

      {/* What happened to the opener */}
      <AnalysisCard
        title="What happened to the opening kill"
        sub={`${totalTrades} opening duels total`}
        right={
          <Legend
            items={[
              { label: TRADE_LABELS.isolated, color: TRADE_COLORS.isolated },
              { label: TRADE_LABELS.attempted, color: TRADE_COLORS.attempted },
              { label: TRADE_LABELS.converted, color: TRADE_COLORS.converted }
            ]}
          />
        }
      >
        <SegmentBar
          height={16}
          segments={[
            {
              label: TRADE_LABELS.isolated,
              value: tradeOutcomes.isolated,
              color: TRADE_COLORS.isolated
            },
            {
              label: TRADE_LABELS.attempted,
              value: tradeOutcomes.attempted,
              color: TRADE_COLORS.attempted
            },
            {
              label: TRADE_LABELS.converted,
              value: tradeOutcomes.converted,
              color: TRADE_COLORS.converted
            }
          ]}
        />
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          {(
            ["isolated", "attempted", "converted"] as OpeningDuelTradeStatus[]
          ).map((k) => (
            <span key={k} className="tabular-nums">
              <span className="font-bold text-foreground">
                {tradeOutcomes[k]}
              </span>{" "}
              {TRADE_LABELS[k]}
            </span>
          ))}
        </div>
      </AnalysisCard>

      {/* Round-by-round opener strip */}
      <AnalysisCard
        title="Round-by-round: did first blood convert?"
        sub="Top = who drew first blood · bottom = who won the round"
        right={
          <Legend
            items={[
              { label: teamA?.name ?? "Team A", color: TEAM_A_COLOR },
              { label: teamB?.name ?? "Team B", color: TEAM_B_COLOR }
            ]}
          />
        }
      >
        <OpenerStrip
          duels={duels}
          playerNames={playerNames}
          regulationRounds={regulationRounds}
        />
      </AnalysisCard>

      {/* Player entry table */}
      <AnalysisCard
        title="Entry duels by player"
        sub="Sorted by first kills — bar shows what happened when they died first"
        right={
          <Legend
            items={[
              { label: TRADE_LABELS.isolated, color: TRADE_COLORS.isolated },
              { label: TRADE_LABELS.attempted, color: TRADE_COLORS.attempted },
              { label: TRADE_LABELS.converted, color: TRADE_COLORS.converted }
            ]}
          />
        }
      >
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-2">
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 9999,
                  background: TEAM_A_COLOR,
                  display: "inline-block"
                }}
              />
              <span
                className="text-xs font-semibold font-headings"
                style={{ color: TEAM_A_COLOR }}
              >
                {teamA?.name ?? "Team A"}
              </span>
            </div>
            {teamAPlayers.map((p) => {
              const e = playerEntry.get(p.steam_id) ?? {
                fk: 0,
                fd: 0,
                fkWins: 0,
                trades: { isolated: 0, attempted: 0, converted: 0 }
              };
              return (
                <EntryPlayerRow
                  key={p.steam_id}
                  name={p.nickname}
                  fk={e.fk}
                  fd={e.fd}
                  fkWins={e.fkWins}
                  trades={e.trades}
                  color={TEAM_A_COLOR}
                />
              );
            })}
          </div>
          <div className="w-px bg-border/40 hidden sm:block" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-2">
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 9999,
                  background: TEAM_B_COLOR,
                  display: "inline-block"
                }}
              />
              <span
                className="text-xs font-semibold font-headings"
                style={{ color: TEAM_B_COLOR }}
              >
                {teamB?.name ?? "Team B"}
              </span>
            </div>
            {teamBPlayers.map((p) => {
              const e = playerEntry.get(p.steam_id) ?? {
                fk: 0,
                fd: 0,
                fkWins: 0,
                trades: { isolated: 0, attempted: 0, converted: 0 }
              };
              return (
                <EntryPlayerRow
                  key={p.steam_id}
                  name={p.nickname}
                  fk={e.fk}
                  fd={e.fd}
                  fkWins={e.fkWins}
                  trades={e.trades}
                  color={TEAM_B_COLOR}
                />
              );
            })}
          </div>
        </div>
      </AnalysisCard>
    </div>
  );
};
