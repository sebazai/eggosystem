"use client";

import React, { useMemo, useState } from "react";
import { useMatchGameKillMatrix } from "@/hooks/data/useMatchGameKillMatrix";
import { AnalysisGenericSkeleton } from "./AnalysisSkeleton";
import { orderMatchParticipantsBySideHomeLeft } from "@/lib/order-match-teams-home-left-away";
import {
  AnalysisCard,
  VersusStat,
  Legend,
  TeamDot,
  TEAM_A_COLOR,
  TEAM_B_COLOR
} from "./AnalysisVizComponents";
import type { MatchInfo, MatchPlayerStats } from "@eggosystem/types";

interface KillMatrixTabProps {
  matchGameId: number;
  playerStats: MatchPlayerStats[];
  teams: MatchInfo["teams"];
}

/* ─── Cell tint ──────────────────────────────────────────────────── */
function cellTint(net: number, teamAColor: string, teamBColor: string) {
  if (net === 0) return "var(--muted)";
  const alpha = Math.round(13 + (13 * Math.min(Math.abs(net), 5)) / 5);
  const base = net > 0 ? teamAColor : teamBColor;
  return `color-mix(in oklab, ${base} ${alpha}%, var(--muted))`;
}

/* ─── Duel map (5×5 grid) ────────────────────────────────────────── */
function DuelMap({
  aPlayers,
  bPlayers,
  getKills,
  playerNames
}: {
  aPlayers: MatchPlayerStats[];
  bPlayers: MatchPlayerStats[];
  getKills: (killerId: string, victimId: string) => number;
  playerNames: Map<string, string>;
}) {
  const [hovRow, setHovRow] = useState<string | null>(null);
  const [hovCol, setHovCol] = useState<string | null>(null);

  const cellW = 72;
  const cellH = 52;
  const labelW = 100;

  return (
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <div style={{ minWidth: 460 }}>
        {/* Column headers (Team B) */}
        <div className="flex" style={{ paddingLeft: labelW, gap: 3 }}>
          {bPlayers.map((p) => (
            <div
              key={p.steam_id}
              style={{
                width: cellW,
                flexShrink: 0,
                textAlign: "center",
                fontSize: 10,
                fontWeight: 600,
                color:
                  hovCol === p.steam_id
                    ? TEAM_B_COLOR
                    : "var(--muted-foreground)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                paddingBottom: 4
              }}
              title={playerNames.get(p.steam_id) ?? p.nickname}
            >
              {playerNames.get(p.steam_id) ?? p.nickname}
            </div>
          ))}
        </div>

        {/* Rows (Team A) */}
        {aPlayers.map((rowPlayer) => (
          <div
            key={rowPlayer.steam_id}
            className="flex items-center"
            style={{ gap: 3, marginBottom: 3 }}
          >
            {/* Row label */}
            <div
              style={{
                width: labelW,
                flexShrink: 0,
                fontSize: 11,
                fontWeight: 600,
                color:
                  hovRow === rowPlayer.steam_id
                    ? TEAM_A_COLOR
                    : "var(--foreground)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                paddingRight: 8
              }}
              title={playerNames.get(rowPlayer.steam_id) ?? rowPlayer.nickname}
            >
              {playerNames.get(rowPlayer.steam_id) ?? rowPlayer.nickname}
            </div>

            {/* Cells */}
            {bPlayers.map((colPlayer) => {
              const a = getKills(rowPlayer.steam_id, colPlayer.steam_id);
              const b = getKills(colPlayer.steam_id, rowPlayer.steam_id);
              const net = a - b;
              const isHov =
                hovRow === rowPlayer.steam_id || hovCol === colPlayer.steam_id;
              return (
                <div
                  key={colPlayer.steam_id}
                  onMouseEnter={() => {
                    setHovRow(rowPlayer.steam_id);
                    setHovCol(colPlayer.steam_id);
                  }}
                  onMouseLeave={() => {
                    setHovRow(null);
                    setHovCol(null);
                  }}
                  style={{
                    width: cellW,
                    height: cellH,
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    background: cellTint(net, TEAM_A_COLOR, TEAM_B_COLOR),
                    borderRadius: 6,
                    border: isHov
                      ? "1px solid var(--border)"
                      : "1px solid transparent",
                    cursor: "default",
                    transition: "background 0.1s"
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      lineHeight: 1,
                      color:
                        net > 0
                          ? TEAM_A_COLOR
                          : net < 0
                            ? TEAM_B_COLOR
                            : "var(--muted-foreground)"
                    }}
                    className="tabular-nums"
                  >
                    {a}:{b}
                  </div>
                  {net !== 0 && (
                    <div
                      style={{
                        fontSize: 10,
                        color: net > 0 ? TEAM_A_COLOR : TEAM_B_COLOR,
                        opacity: 0.7,
                        lineHeight: 1.2
                      }}
                      className="tabular-nums"
                    >
                      {net > 0 ? `+${net}` : net}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Matchup row (top contested duels) ─────────────────────────── */
function MatchupRow({
  playerA,
  playerB,
  killsA,
  killsB,
  maxTotal
}: {
  playerA: string;
  playerB: string;
  killsA: number;
  killsB: number;
  maxTotal: number;
}) {
  const total = killsA + killsB;
  const barPct = maxTotal === 0 ? 0 : (total / maxTotal) * 100;
  const aShare = total === 0 ? 0.5 : killsA / total;

  return (
    <div
      className="grid items-center gap-2 py-2 border-b border-border/20 last:border-0"
      style={{ gridTemplateColumns: "1fr 120px 1fr" }}
    >
      <div
        className="text-xs font-semibold text-right truncate"
        style={{
          color: killsA >= killsB ? TEAM_A_COLOR : "var(--muted-foreground)"
        }}
      >
        {playerA}
      </div>
      <div className="relative h-4">
        {/* Bar container centered */}
        <div
          className="absolute inset-0 flex rounded-full overflow-hidden"
          style={{
            width: `${barPct}%`,
            left: `${(100 - barPct) / 2}%`
          }}
        >
          <div
            style={{
              flex: aShare,
              background: TEAM_A_COLOR,
              opacity: killsA >= killsB ? 1 : 0.45
            }}
          />
          <div
            style={{
              flex: 1 - aShare,
              background: TEAM_B_COLOR,
              opacity: killsB > killsA ? 1 : 0.45
            }}
          />
        </div>
      </div>
      <div
        className="text-xs font-semibold text-left truncate"
        style={{
          color: killsB >= killsA ? TEAM_B_COLOR : "var(--muted-foreground)"
        }}
      >
        {playerB}
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
export const KillMatrixTab = ({
  matchGameId,
  playerStats,
  teams
}: KillMatrixTabProps) => {
  const { killMatrix, isLoading: isLoadingMatrix } =
    useMatchGameKillMatrix(matchGameId);

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

  const aPlayers = useMemo(
    () => playerStats.filter((p) => p.team_id === teamAId),
    [playerStats, teamAId]
  );
  const bPlayers = useMemo(
    () => playerStats.filter((p) => p.team_id === teamBId),
    [playerStats, teamBId]
  );

  const killLookup = useMemo(() => {
    const m = new Map<string, number>();
    if (!killMatrix) return m;
    for (const k of killMatrix.kills) {
      m.set(`${k.killer_steam_id}:${k.victim_steam_id}`, k.count);
    }
    return m;
  }, [killMatrix]);

  const getKills = (killer: string, victim: string) =>
    killLookup.get(`${killer}:${victim}`) ?? 0;

  // Team total kills
  const aKills = useMemo(
    () =>
      bPlayers.reduce(
        (s, b) =>
          s +
          aPlayers.reduce((ss, a) => ss + getKills(a.steam_id, b.steam_id), 0),
        0
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [aPlayers, bPlayers, killLookup]
  );
  const bKills = useMemo(
    () =>
      aPlayers.reduce(
        (s, a) =>
          s +
          bPlayers.reduce((ss, b) => ss + getKills(b.steam_id, a.steam_id), 0),
        0
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [aPlayers, bPlayers, killLookup]
  );

  // Head-to-head duels won
  const allDuels = useMemo(() => {
    const list: { aId: string; bId: string; aKills: number; bKills: number }[] =
      [];
    for (const a of aPlayers) {
      for (const b of bPlayers) {
        const ak = getKills(a.steam_id, b.steam_id);
        const bk = getKills(b.steam_id, a.steam_id);
        if (ak + bk > 0)
          list.push({
            aId: a.steam_id,
            bId: b.steam_id,
            aKills: ak,
            bKills: bk
          });
      }
    }
    return list.sort((x, y) => y.aKills + y.bKills - (x.aKills + x.bKills));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aPlayers, bPlayers, killLookup]);

  const aDuelsWon = allDuels.filter((d) => d.aKills > d.bKills).length;
  const bDuelsWon = allDuels.filter((d) => d.bKills > d.aKills).length;
  const totalDuels = allDuels.length;

  // Flash assists from kill matrix
  const flashAssists = killMatrix?.flash_assists ?? [];

  if (isLoadingMatrix) return <AnalysisGenericSkeleton cards={2} />;

  return (
    <div className="flex flex-col gap-3.5">
      {/* Matchup overview */}
      <AnalysisCard
        title="The matchup"
        sub="Kills traded between the two sides across the map"
        right={
          <Legend
            items={[
              { label: teamA?.name ?? "Team A", color: TEAM_A_COLOR },
              { label: teamB?.name ?? "Team B", color: TEAM_B_COLOR }
            ]}
          />
        }
      >
        <div className="flex flex-col gap-4">
          <VersusStat
            label="Cross-team kills"
            aVal={aKills}
            bVal={bKills}
            mode="share"
          />
          <VersusStat
            label={`Head-to-head duels won (of ${totalDuels})`}
            aVal={aDuelsWon}
            bVal={bDuelsWon}
            mode="share"
          />
        </div>
      </AnalysisCard>

      {/* Duel map */}
      <AnalysisCard
        title="Duel map"
        sub="Who beat whom · each cell is a player-vs-player head-to-head"
        right={
          <Legend
            items={[
              { label: teamA?.name ?? "Team A", color: TEAM_A_COLOR },
              { label: teamB?.name ?? "Team B", color: TEAM_B_COLOR }
            ]}
          />
        }
      >
        <DuelMap
          aPlayers={aPlayers}
          bPlayers={bPlayers}
          getKills={getKills}
          playerNames={playerNames}
        />
      </AnalysisCard>

      {/* Top contested duels */}
      {allDuels.length > 0 && (
        <AnalysisCard
          title="Most-contested duels"
          sub="Bar splits the kills each way"
        >
          <div
            className="grid items-center gap-x-2 text-[10px] text-muted-foreground/60 pb-2 border-b border-border/30 mb-1"
            style={{ gridTemplateColumns: "1fr 120px 1fr" }}
          >
            <div className="text-right">{teamA?.name ?? "Team A"}</div>
            <div />
            <div>{teamB?.name ?? "Team B"}</div>
          </div>
          {allDuels.slice(0, 8).map((d, i) => (
            <MatchupRow
              key={i}
              playerA={playerNames.get(d.aId) ?? d.aId.slice(-4)}
              playerB={playerNames.get(d.bId) ?? d.bId.slice(-4)}
              killsA={d.aKills}
              killsB={d.bKills}
              maxTotal={allDuels[0]!.aKills + allDuels[0]!.bKills}
            />
          ))}
        </AnalysisCard>
      )}

      {/* Flash assists */}
      <AnalysisCard
        title="Flash assists"
        sub="Blinds that directly set up a kill"
      >
        {flashAssists.length === 0 ? (
          <div className="text-sm text-muted-foreground/60 py-2">
            No flash assists recorded for this game.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {flashAssists.map((f, i) => {
              const assisterTeamId = playerStats.find(
                (p) => p.steam_id === f.assister_steam_id
              )?.team_id;
              const victimTeamId = playerStats.find(
                (p) => p.steam_id === f.victim_steam_id
              )?.team_id;
              const aColor =
                assisterTeamId === teamAId ? TEAM_A_COLOR : TEAM_B_COLOR;
              const vColor =
                victimTeamId === teamAId ? TEAM_A_COLOR : TEAM_B_COLOR;
              return (
                <div
                  key={i}
                  className="flex items-center gap-2 flex-wrap px-3 py-2.5 rounded-lg text-xs"
                  style={{
                    background: "var(--muted)",
                    border: "1px solid var(--border)"
                  }}
                >
                  <TeamDot color={aColor} />
                  <span className="font-bold" style={{ color: aColor }}>
                    {playerNames.get(f.assister_steam_id) ??
                      f.assister_steam_id.slice(-4)}
                  </span>
                  <span className="text-muted-foreground">
                    flashed for the kill on
                  </span>
                  <TeamDot color={vColor} />
                  <span className="font-bold" style={{ color: vColor }}>
                    {playerNames.get(f.victim_steam_id) ??
                      f.victim_steam_id.slice(-4)}
                  </span>
                  {f.count > 1 && (
                    <span className="ml-auto tabular-nums font-semibold">
                      ×{f.count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </AnalysisCard>
    </div>
  );
};
