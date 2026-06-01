"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/loading";
import { useGameRoundInfo } from "@/hooks/data/useGameRoundInfo";
import { orderMatchParticipantsBySideHomeLeft } from "@/lib/order-match-teams-home-left-away";
import {
  AnalysisCard,
  KpiNum,
  Legend,
  TEAM_A_COLOR,
  TEAM_B_COLOR
} from "./AnalysisVizComponents";
import type {
  InsightResult,
  MatchGameInsights,
  MatchGameOpeningDuel,
  MatchInfo,
  MatchPlayerStats
} from "@eggosystem/types";

/* ─── Props ──────────────────────────────────────────────────────── */
interface InsightsTabProps {
  matchGameId: number;
  insights: MatchGameInsights;
  playerNames: Map<string, string>;
  playerStats: MatchPlayerStats[];
  openingDuels: MatchGameOpeningDuel[];
  matchTeams: MatchInfo["teams"];
}

/* ─── Sort types ─────────────────────────────────────────────────── */
type SortCol = "kills" | "deaths" | "diff" | "adr" | "kast" | "hs" | "rating";
type SortDir = "asc" | "desc";

const COL_LABELS: { key: SortCol; label: string }[] = [
  { key: "kills", label: "K" },
  { key: "deaths", label: "D" },
  { key: "diff", label: "+/−" },
  { key: "adr", label: "ADR" },
  { key: "kast", label: "KAST%" },
  { key: "hs", label: "HS%" },
  { key: "rating", label: "Rating" }
];

/* ─── Momentum strip ─────────────────────────────────────────────── */
function MomentumStrip({
  roundInfo,
  teamAId,
  teamBId,
  teamAName,
  teamBName,
  openingDuels,
  playerNames
}: {
  roundInfo: ReturnType<typeof useGameRoundInfo>["roundInfo"];
  teamAId: number;
  teamBId: number;
  teamAName: string;
  teamBName: string;
  openingDuels: MatchGameOpeningDuel[];
  playerNames: Map<string, string>;
}) {
  // hovered: mouse-only; selected: tap/click persists on mobile
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const active = hovered ?? selected;

  const rounds = useMemo(() => {
    if (!roundInfo) return [];
    return [...roundInfo].sort((a, b) => a.round_number - b.round_number);
  }, [roundInfo]);

  const duelMap = useMemo(() => {
    const m = new Map<number, MatchGameOpeningDuel>();
    for (const d of openingDuels) m.set(d.round_number, d);
    return m;
  }, [openingDuels]);

  if (!rounds.length) return null;

  const regulationRounds = rounds[0]?.regulation_rounds ?? rounds.length * 2;
  const halftime = regulationRounds / 2;
  const hasOvertime = rounds.length > regulationRounds;

  // Build running scores
  let aScore = 0;
  let bScore = 0;
  const cells: {
    rn: number;
    winnerTeamId: number;
    aScore: number;
    bScore: number;
  }[] = [];
  for (const r of rounds) {
    const winnerSide = (r as { winner?: string | null }).winner;
    const winTeamId =
      winnerSide === "CT"
        ? r.ct_team_id
        : winnerSide === "T"
          ? r.t_team_id
          : null;
    if (winTeamId === teamAId) aScore++;
    else if (winTeamId === teamBId) bScore++;
    cells.push({
      rn: r.round_number,
      winnerTeamId: winTeamId ?? 0,
      aScore,
      bScore
    });
  }

  const readout = active !== null ? cells.find((c) => c.rn === active) : null;
  const activeDuel = active !== null ? duelMap.get(active) : null;

  // Ensure each cell is at least 18px wide so touch targets are reachable.
  // The scrollable container uses -mx-4 on mobile to bleed to the card edges.
  const cellMinW = 45;
  const numSeps = hasOvertime ? 2 : 1;
  const minContentW = cells.length * (cellMinW + 2) + numSeps * 4;

  return (
    <div className="flex flex-col gap-2">
      {/* Horizontally scrollable strip — bleeds to card edges on mobile */}
      <div
        className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto"
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
          {/* Cells */}
          <div className="flex items-center gap-0.5 w-full">
            {cells.map((cell, idx) => {
              const isA = cell.winnerTeamId === teamAId;
              const isB = cell.winnerTeamId === teamBId;
              const color = isA
                ? TEAM_A_COLOR
                : isB
                  ? TEAM_B_COLOR
                  : "var(--muted)";
              const dimmed = active !== null && active !== cell.rn;
              const isActive = active === cell.rn;
              const isHalf = idx === halftime;
              const isOT = hasOvertime && idx === regulationRounds;
              return (
                <React.Fragment key={cell.rn}>
                  {(isHalf || isOT) && (
                    <div
                      style={{
                        width: 2,
                        flexShrink: 0,
                        height: 45,
                        background: "var(--border)",
                        borderRadius: 9999
                      }}
                    />
                  )}
                  <div
                    onMouseEnter={() => setHovered(cell.rn)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() =>
                      setSelected((prev) => (prev === cell.rn ? null : cell.rn))
                    }
                    style={{
                      flex: 1,
                      minWidth: cellMinW,
                      height: 45,
                      background: color,
                      borderRadius: 3,
                      opacity: dimmed ? 0.25 : 1,
                      cursor: "pointer",
                      touchAction: "manipulation",
                      transition: "opacity 0.12s, box-shadow 0.1s",
                      boxShadow: isActive
                        ? `0 0 0 2px color-mix(in oklab, ${color} 85%, white)`
                        : "none"
                    }}
                  />
                </React.Fragment>
              );
            })}
          </div>

          {/* Round number labels */}
          <div className="flex items-center gap-0.5 w-full">
            {cells.map((cell, idx) => {
              const isHalf = idx === halftime;
              const isOT = hasOvertime && idx === regulationRounds;
              return (
                <React.Fragment key={cell.rn}>
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
                      opacity: active === cell.rn ? 1 : 0.5
                    }}
                  >
                    {cell.rn}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Readout — card-style background makes it readable on mobile */}
      <div
        className="min-h-[36px] text-[11px] text-muted-foreground/80 rounded-lg px-3 py-2 transition-all duration-150"
        style={{
          opacity: readout ? 1 : 0,
          background: readout
            ? "color-mix(in oklab, var(--muted) 60%, transparent)"
            : "transparent"
        }}
      >
        {readout && (
          <span>
            <span className="font-semibold text-foreground">R{readout.rn}</span>
            {readout.winnerTeamId !== 0 && (
              <>
                {" · "}
                <span
                  style={{
                    color:
                      readout.winnerTeamId === teamAId
                        ? TEAM_A_COLOR
                        : TEAM_B_COLOR
                  }}
                >
                  {readout.winnerTeamId === teamAId
                    ? `${teamAName} won`
                    : `${teamBName} won`}
                </span>
              </>
            )}
            {" · "}
            <span className="tabular-nums">
              {readout.aScore}–{readout.bScore}
            </span>
            {activeDuel && (
              <>
                {" · "}
                <span className="font-medium text-foreground">
                  {playerNames.get(activeDuel.killer_steam_id) ?? "?"}
                </span>
                {" → "}
                <span>
                  {playerNames.get(activeDuel.victim_steam_id) ?? "?"}
                </span>{" "}
                <span className="text-muted-foreground/60">
                  ({activeDuel.weapon}
                  {activeDuel.is_headshot ? " HS" : ""})
                </span>
              </>
            )}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Scoreboard ─────────────────────────────────────────────────── */
function Scoreboard({
  playerStats,
  playerNames,
  teamAId
}: {
  playerStats: MatchPlayerStats[];
  playerNames: Map<string, string>;
  teamAId: number;
}) {
  const [sortCol, setSortCol] = useState<SortCol>("rating");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const copy = [...playerStats];
    copy.sort((a, b) => {
      let av = 0;
      let bv = 0;
      switch (sortCol) {
        case "kills":
          av = a.kills;
          bv = b.kills;
          break;
        case "deaths":
          av = a.deaths;
          bv = b.deaths;
          break;
        case "diff":
          av = a.kills - a.deaths;
          bv = b.kills - b.deaths;
          break;
        case "adr":
          av = a.adr;
          bv = b.adr;
          break;
        case "kast":
          av = a.kast_percentage;
          bv = b.kast_percentage;
          break;
        case "hs":
          av = a.hs_percent;
          bv = b.hs_percent;
          break;
        case "rating":
          av = a.kana_rating ?? 0;
          bv = b.kana_rating ?? 0;
          break;
      }
      return sortDir === "desc" ? bv - av : av - bv;
    });
    return copy;
  }, [playerStats, sortCol, sortDir]);

  const maxRating = useMemo(
    () => Math.max(0.01, ...playerStats.map((p) => p.kana_rating ?? 0)),
    [playerStats]
  );

  const handleSort = (col: SortCol) => {
    if (col === sortCol) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortCol(col);
      setSortDir("desc");
    }
  };

  const thCls = (col: SortCol) =>
    cn(
      "cursor-pointer select-none text-right text-[10px] font-semibold uppercase tracking-wide px-1.5 py-2 whitespace-nowrap transition-colors",
      sortCol === col
        ? "text-kanaliiga-orange"
        : "text-muted-foreground/60 hover:text-muted-foreground"
    );

  return (
    <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
      <table
        className="w-full text-xs"
        style={{ minWidth: 560, borderCollapse: "collapse" }}
      >
        <thead>
          <tr className="border-b border-border/40">
            <th className="text-left text-[10px] font-semibold uppercase tracking-wide px-1 py-2 text-muted-foreground/60">
              Player
            </th>
            {COL_LABELS.map(({ key, label }) => (
              <th
                key={key}
                className={thCls(key)}
                onClick={() => handleSort(key)}
              >
                {label}
                {sortCol === key && (
                  <span className="ml-0.5 opacity-60">
                    {sortDir === "desc" ? "↓" : "↑"}
                  </span>
                )}
              </th>
            ))}
            <th className="w-16" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => {
            const isA = p.team_id === teamAId;
            const color = isA ? TEAM_A_COLOR : TEAM_B_COLOR;
            const diff = p.kills - p.deaths;
            const rating = p.kana_rating ?? 0;
            const ratingPct = maxRating > 0 ? (rating / maxRating) * 100 : 0;
            return (
              <tr
                key={p.steam_id}
                className="border-b border-border/20 hover:bg-muted/20 transition-colors"
                style={
                  i === 0 && sortCol === "rating"
                    ? {
                        background: `color-mix(in oklab, ${color} 6%, transparent)`
                      }
                    : undefined
                }
              >
                <td className="px-1 py-2">
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        width: 3,
                        height: 14,
                        background: color,
                        borderRadius: 9999,
                        flexShrink: 0,
                        display: "inline-block"
                      }}
                    />
                    <span className="font-semibold text-foreground truncate max-w-[100px]">
                      {playerNames.get(String(p.steam_id)) ?? p.nickname}
                    </span>
                  </div>
                </td>
                <td className="text-right px-1.5 tabular-nums">{p.kills}</td>
                <td className="text-right px-1.5 tabular-nums text-muted-foreground">
                  {p.deaths}
                </td>
                <td
                  className="text-right px-1.5 tabular-nums font-semibold"
                  style={{
                    color:
                      diff > 0
                        ? TEAM_A_COLOR
                        : diff < 0
                          ? "var(--analysis-bad)"
                          : "var(--muted-foreground)"
                  }}
                >
                  {diff > 0 ? `+${diff}` : diff}
                </td>
                <td className="text-right px-1.5 tabular-nums text-muted-foreground">
                  {p.adr.toFixed(0)}
                </td>
                <td className="text-right px-1.5 tabular-nums text-muted-foreground">
                  {p.kast_percentage.toFixed(0)}%
                </td>
                <td className="text-right px-1.5 tabular-nums text-muted-foreground">
                  {p.hs_percent.toFixed(0)}%
                </td>
                <td
                  className="text-right px-1.5 tabular-nums font-bold"
                  style={{ color }}
                >
                  {rating.toFixed(2)}
                </td>
                <td className="px-1.5 w-16">
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: "var(--muted)" }}
                  >
                    <div
                      style={{
                        width: `${ratingPct}%`,
                        height: "100%",
                        background: color,
                        borderRadius: 9999
                      }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Insight tile ───────────────────────────────────────────────── */
function InsightTile({
  insight,
  playerNames,
  isOpen,
  onToggle
}: {
  insight: InsightResult;
  playerNames: Map<string, string>;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const isStrength = insight.polarity === "strength";
  const borderColor = isStrength
    ? "var(--analysis-good)"
    : insight.severity === "critical"
      ? "var(--analysis-bad)"
      : "var(--border)";

  const glyph = isStrength ? "▲" : insight.severity === "critical" ? "▼" : "•";
  const glyphColor = isStrength
    ? "var(--analysis-good)"
    : insight.severity === "critical"
      ? "var(--analysis-bad)"
      : "var(--muted-foreground)";

  return (
    <div
      className="rounded-lg overflow-hidden cursor-pointer transition-colors hover:bg-muted/30"
      style={{
        border: `1px solid var(--border)`,
        borderLeft: `3px solid ${borderColor}`,
        background: isOpen ? "var(--muted)" : undefined
      }}
      onClick={onToggle}
    >
      <div className="flex items-start gap-2 px-3 py-2.5">
        <span
          className="text-[10px] font-bold mt-0.5 shrink-0"
          style={{ color: glyphColor }}
        >
          {glyph}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-foreground leading-snug">
            {insight.headline}
          </div>
          {insight.players.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {insight.players.slice(0, 3).map((sid) => (
                <span
                  key={sid}
                  className="text-[10px] px-1.5 py-0 rounded-full border border-border/50 text-muted-foreground"
                >
                  {playerNames.get(sid) ?? sid.slice(-4)}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground/50 shrink-0 mt-0.5">
          {isOpen ? "▲" : "▼"}
        </span>
      </div>
      {isOpen && (
        <div className="px-3 pb-3 border-t border-border/30">
          <div className="text-[11px] text-muted-foreground leading-relaxed mt-2">
            {insight.story}
          </div>
          {insight.evidence_rounds.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="text-[10px] text-muted-foreground/50 self-center">
                R
              </span>
              {insight.evidence_rounds.map((rn) => (
                <span
                  key={rn}
                  className="text-[10px] px-1 rounded bg-muted/80 text-muted-foreground tabular-nums"
                >
                  {rn}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Team report card ───────────────────────────────────────────── */
function TeamReportCard({
  teamName,
  insights,
  playerNames,
  color
}: {
  teamName: string;
  insights: InsightResult[];
  playerNames: Map<string, string>;
  color: string;
}) {
  const [openSet, setOpenSet] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Sort: strengths first, then by severity
  const sorted = useMemo(() => {
    return [...insights].sort((a, b) => {
      if (a.polarity !== b.polarity) return a.polarity === "strength" ? -1 : 1;
      const sev: Record<string, number> = { critical: 0, notable: 1, info: 2 };
      return (sev[a.severity] ?? 2) - (sev[b.severity] ?? 2);
    });
  }, [insights]);

  return (
    <div className="flex-1 min-w-0">
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-t-lg"
        style={{
          background: `color-mix(in oklab, ${color} 10%, transparent)`,
          borderBottom: `1px solid color-mix(in oklab, ${color} 20%, transparent)`
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 9999,
            background: color,
            display: "inline-block",
            flexShrink: 0
          }}
        />
        <span
          className="text-sm font-semibold font-headings truncate"
          style={{ color }}
        >
          {teamName}
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground/50 shrink-0">
          {insights.length} pattern{insights.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex flex-col gap-1.5 pt-1.5">
        {sorted.length === 0 ? (
          <div className="text-xs text-muted-foreground/40 py-4 text-center italic">
            No patterns detected
          </div>
        ) : (
          sorted.map((ins) => (
            <InsightTile
              key={ins.id}
              insight={ins}
              playerNames={playerNames}
              isOpen={openSet.has(ins.id)}
              onToggle={() => toggle(ins.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ─── InsightsTab (Overview) ─────────────────────────────────────── */
export const InsightsTab = ({
  matchGameId,
  insights,
  playerNames,
  playerStats,
  openingDuels,
  matchTeams
}: InsightsTabProps) => {
  const [side, setSide] = useState<"CT" | "T">("CT");

  const { roundInfo, isLoading: isLoadingRounds } =
    useGameRoundInfo(matchGameId);

  const [teamA, teamB] = useMemo(() => {
    const list = orderMatchParticipantsBySideHomeLeft(
      Object.values(matchTeams)
    );
    return [list[0], list[1]] as const;
  }, [matchTeams]);

  const teamAId = teamA?.id ?? 0;
  const teamBId = teamB?.id ?? 0;

  // Compute KPI data from round info
  const kpiData = useMemo(() => {
    if (!roundInfo || roundInfo.length === 0) {
      return {
        finalA: 0,
        finalB: 0,
        h1A: 0,
        h1B: 0,
        h2A: 0,
        h2B: 0,
        otA: 0,
        otB: 0
      };
    }
    const sorted = [...roundInfo].sort(
      (a, b) => a.round_number - b.round_number
    );
    const regulationRounds = sorted[0]?.regulation_rounds ?? sorted.length * 2;
    const halftime = regulationRounds / 2;
    let h1A = 0,
      h1B = 0,
      h2A = 0,
      h2B = 0,
      otA = 0,
      otB = 0;
    sorted.forEach((r, idx) => {
      const w = (r as { winner?: string | null }).winner;
      const wTeam = w === "CT" ? r.ct_team_id : w === "T" ? r.t_team_id : null;
      if (idx < halftime) {
        if (wTeam === teamAId) h1A++;
        else if (wTeam === teamBId) h1B++;
      } else if (idx < regulationRounds) {
        if (wTeam === teamAId) h2A++;
        else if (wTeam === teamBId) h2B++;
      } else {
        if (wTeam === teamAId) otA++;
        else if (wTeam === teamBId) otB++;
      }
    });
    return {
      finalA: h1A + h2A + otA,
      finalB: h1B + h2B + otB,
      h1A,
      h1B,
      h2A,
      h2B,
      otA,
      otB
    };
  }, [roundInfo, teamAId, teamBId]);

  // Best-of series info
  const seriesInfo =
    teamA?.score !== undefined && teamB?.score !== undefined
      ? { a: teamA.score, b: teamB.score }
      : null;

  // Team insights for the report card
  const { team1Insights, team2Insights } = useMemo(() => {
    const rows = insights.teams;
    const t1 = rows.find((t) => t.team_id === teamAId);
    const t2 = rows.find((t) => t.team_id === teamBId);
    return {
      team1Insights: t1 ? (side === "CT" ? t1.ct : t1.t) : [],
      team2Insights: t2 ? (side === "CT" ? t2.ct : t2.t) : []
    };
  }, [insights, teamAId, teamBId, side]);

  return (
    <div className="flex flex-col gap-3.5">
      {/* ── How the game went ── */}
      <AnalysisCard
        title="How the game went"
        sub={`${teamA?.name ?? "Team A"} vs ${teamB?.name ?? "Team B"}`}
        right={
          <Legend
            items={[
              { label: teamA?.name ?? "Team A", color: TEAM_A_COLOR },
              { label: teamB?.name ?? "Team B", color: TEAM_B_COLOR }
            ]}
          />
        }
      >
        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <KpiNum
            value={`${kpiData.finalA}–${kpiData.finalB}`}
            label="Final score"
            sub={
              kpiData.finalA > kpiData.finalB
                ? (teamA?.name ?? "Team A")
                : (teamB?.name ?? "Team B")
            }
            color={
              kpiData.finalA >= kpiData.finalB ? TEAM_A_COLOR : TEAM_B_COLOR
            }
          />
          {!isLoadingRounds && roundInfo && roundInfo.length > 0 && (
            <>
              <KpiNum
                value={`${kpiData.h1A}–${kpiData.h1B}`}
                label="First half"
                color="var(--muted-foreground)"
              />
              <KpiNum
                value={`${kpiData.h2A}–${kpiData.h2B}`}
                label="Second half"
                color="var(--muted-foreground)"
              />
              {(kpiData.otA > 0 || kpiData.otB > 0) && (
                <KpiNum
                  value={`${kpiData.otA}–${kpiData.otB}`}
                  label="Overtime"
                  color="var(--kanaliiga-orange)"
                />
              )}
            </>
          )}
          {seriesInfo && (
            <KpiNum
              value={`${seriesInfo.a}–${seriesInfo.b}`}
              label="Series score"
              color="var(--muted-foreground)"
            />
          )}
        </div>

        {/* Momentum strip */}
        {isLoadingRounds ? (
          <div className="h-8 bg-muted/40 rounded animate-pulse" />
        ) : (
          <MomentumStrip
            roundInfo={roundInfo}
            teamAId={teamAId}
            teamBId={teamBId}
            teamAName={teamA?.name ?? "Team A"}
            teamBName={teamB?.name ?? "Team B"}
            openingDuels={openingDuels}
            playerNames={playerNames}
          />
        )}
      </AnalysisCard>

      {/* ── Scoreboard ── */}
      {playerStats.length > 0 && (
        <AnalysisCard
          title="Scoreboard"
          sub="All players · tap a column header to re-sort"
        >
          <Scoreboard
            playerStats={playerStats}
            playerNames={playerNames}
            teamAId={teamAId}
          />
        </AnalysisCard>
      )}

      {/* ── Team report card ── */}
      <AnalysisCard
        title="Team report card"
        sub="What each side did well and what to fix — tap any card to read why"
        right={
          <div
            className="flex rounded-lg overflow-hidden border border-border/50"
            style={{ fontSize: 11 }}
          >
            {(["CT", "T"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSide(s)}
                className={cn(
                  "px-3 py-1.5 font-headings text-[11px] transition-colors",
                  side === s
                    ? "bg-muted text-foreground"
                    : "bg-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {s} SIDE
              </button>
            ))}
          </div>
        }
      >
        <div className="text-[11px] text-muted-foreground/60 mb-3">
          Showing each team&apos;s{" "}
          <span className="font-semibold text-foreground">{side}-side</span>{" "}
          patterns from this map.
        </div>
        {insights.teams.length === 0 ? (
          <TableSkeleton rows={3} />
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            {teamA && (
              <TeamReportCard
                teamName={teamA.name}
                insights={team1Insights}
                playerNames={playerNames}
                color={TEAM_A_COLOR}
              />
            )}
            {teamB && (
              <TeamReportCard
                teamName={teamB.name}
                insights={team2Insights}
                playerNames={playerNames}
                color={TEAM_B_COLOR}
              />
            )}
          </div>
        )}
      </AnalysisCard>
    </div>
  );
};
