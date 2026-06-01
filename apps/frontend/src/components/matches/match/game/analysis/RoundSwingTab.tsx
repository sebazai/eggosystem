"use client";

import React, { useMemo, useState } from "react";
import { TableSkeleton } from "@/components/loading";
import {
  useRoundSwings,
  type RoundSwingEntry
} from "@/hooks/data/useRoundSwings";
import { useGameRoundInfo } from "@/hooks/data/useGameRoundInfo";
import { orderMatchParticipantsBySideHomeLeft } from "@/lib/order-match-teams-home-left-away";
import {
  AnalysisCard,
  VersusStat,
  Legend,
  TEAM_A_COLOR,
  TEAM_B_COLOR
} from "./AnalysisVizComponents";
import type { MatchInfo } from "@eggosystem/types";

interface RoundSwingTabProps {
  matchGameId: number;
  playerNames: Map<string, string>;
  teams: MatchInfo["teams"];
}

const fmtT = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

const H = 78; // px per half of the momentum chart

/* ─── Round grouping ─────────────────────────────────────────────── */
interface RoundGroup {
  roundNumber: number;
  aEvents: RoundSwingEntry[]; // delta >= 0 — team A gained
  bEvents: RoundSwingEntry[]; // delta <  0 — team B gained
  aTotal: number;
  bTotal: number;
}

function buildRoundGroups(swings: RoundSwingEntry[]): RoundGroup[] {
  const map = new Map<number, RoundGroup>();
  for (const s of swings) {
    if (!map.has(s.round_number)) {
      map.set(s.round_number, {
        roundNumber: s.round_number,
        aEvents: [],
        bEvents: [],
        aTotal: 0,
        bTotal: 0
      });
    }
    const g = map.get(s.round_number)!;
    if (s.delta >= 0) {
      g.aEvents.push(s);
      g.aTotal += Math.abs(s.delta);
    } else {
      g.bEvents.push(s);
      g.bTotal += Math.abs(s.delta);
    }
  }
  for (const g of map.values()) {
    g.aEvents.sort((a, b) => a.time_in_round - b.time_in_round);
    g.bEvents.sort((a, b) => a.time_in_round - b.time_in_round);
  }
  return Array.from(map.values()).sort((a, b) => a.roundNumber - b.roundNumber);
}

/* ─── Stacked half-bar ────────────────────────────────────────────── */
function StackedHalfBar({
  events,
  total,
  maxSide,
  color,
  top
}: {
  events: RoundSwingEntry[];
  total: number;
  maxSide: number;
  color: string;
  top: boolean;
}) {
  if (!events.length) return null;
  const totalH = Math.max(8, (total / maxSide) * H);
  return (
    <div
      style={{
        width: 16,
        height: totalH,
        display: "flex",
        flexDirection: top ? "column-reverse" : "column",
        gap: events.length > 1 ? 1 : 0,
        background: "transparent",
        overflow: "hidden",
        borderRadius: top ? "4px 4px 1px 1px" : "1px 1px 4px 4px",
        flexShrink: 0
      }}
    >
      {events.map((e, i) => (
        <div
          key={i}
          style={{
            flex: Math.abs(e.delta),
            background: color,
            minHeight: 2,
            flexShrink: 0
          }}
        />
      ))}
    </div>
  );
}

/* ─── Momentum chart ─────────────────────────────────────────────── */
function MomentumChart({
  swings,
  teamAName,
  teamBName,
  playerNames,
  regulationRounds
}: {
  swings: RoundSwingEntry[];
  teamAName: string;
  teamBName: string;
  playerNames: Map<string, string>;
  regulationRounds: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  const roundGroups = useMemo(() => buildRoundGroups(swings), [swings]);
  const maxSide = Math.max(
    0.01,
    ...roundGroups.map((g) => Math.max(g.aTotal, g.bTotal))
  );
  const halftime = regulationRounds / 2;

  if (!roundGroups.length) return null;

  const totalCols = roundGroups.reduce((acc, g, i) => {
    const prevR = i > 0 ? roundGroups[i - 1]!.roundNumber : 0;
    const hasBreak =
      (prevR <= halftime && g.roundNumber > halftime) ||
      (prevR <= regulationRounds && g.roundNumber > regulationRounds);
    return acc + 1 + (hasBreak ? 1 : 0);
  }, 0);

  const cur = hovered !== null ? (roundGroups[hovered] ?? null) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ overflowX: "auto" }}>
        <div>
          <div style={{ position: "relative" }}>
            {/* single unbroken center hairline */}
            <div
              style={{
                position: "absolute",
                top: H,
                left: 0,
                right: 0,
                height: 1,
                background: "var(--border)",
                pointerEvents: "none"
              }}
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${totalCols}, auto)`,
                gap: 2
              }}
            >
              {roundGroups.map((g, i) => {
                const dimmed = hovered !== null && hovered !== i;
                const prevR = i > 0 ? roundGroups[i - 1]!.roundNumber : 0;
                const isHalfBreak =
                  prevR <= halftime && g.roundNumber > halftime;
                const isOTBreak =
                  prevR <= regulationRounds && g.roundNumber > regulationRounds;

                return (
                  <React.Fragment key={i}>
                    {(isHalfBreak || isOTBreak) && (
                      <div
                        style={{
                          height: H * 2,
                          width: 6,
                          background: "var(--border)",
                          borderRadius: 9999,
                          alignSelf: "center",
                          flexShrink: 0
                        }}
                      />
                    )}
                    <div
                      style={{
                        cursor: "pointer",
                        height: H * 2,
                        display: "flex",
                        flexDirection: "column",
                        position: "relative",
                        opacity: dimmed ? 0.35 : 1,
                        touchAction: "manipulation",
                        transition: "opacity .12s"
                      }}
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() =>
                        setHovered((prev) => (prev === i ? null : i))
                      }
                    >
                      {/* Percentage — always at top */}
                      {(g.aTotal > 0 || g.bTotal > 0) && (
                        <span
                          className="tabular-nums"
                          style={{
                            position: "absolute",
                            top: 2,
                            left: 0,
                            right: 0,
                            textAlign: "center",
                            fontSize: 9,
                            lineHeight: 1,
                            color:
                              g.aTotal >= g.bTotal
                                ? TEAM_A_COLOR
                                : TEAM_B_COLOR,
                            pointerEvents: "none"
                          }}
                        >
                          +{Math.round(Math.max(g.aTotal, g.bTotal) * 100)}
                        </span>
                      )}
                      {/* Top zone — team A */}
                      <div
                        style={{
                          height: H,
                          display: "flex",
                          alignItems: "flex-end",
                          justifyContent: "center"
                        }}
                      >
                        {g.aTotal > 0 && (
                          <StackedHalfBar
                            events={g.aEvents}
                            total={g.aTotal}
                            maxSide={maxSide}
                            color={TEAM_A_COLOR}
                            top
                          />
                        )}
                      </div>
                      {/* Bottom zone — team B */}
                      <div
                        style={{
                          height: H,
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "center"
                        }}
                      >
                        {g.bTotal > 0 && (
                          <StackedHalfBar
                            events={g.bEvents}
                            total={g.bTotal}
                            maxSide={maxSide}
                            color={TEAM_B_COLOR}
                            top={false}
                          />
                        )}
                      </div>
                      {/* Round number — always at bottom */}
                      <span
                        className="tabular-nums"
                        style={{
                          position: "absolute",
                          bottom: 2,
                          left: 0,
                          right: 0,
                          textAlign: "center",
                          fontSize: 9,
                          lineHeight: 1,
                          color: "var(--muted-foreground)",
                          pointerEvents: "none"
                        }}
                      >
                        R{g.roundNumber}
                      </span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Hover readout */}
      <div
        style={{
          minHeight: 36,
          padding: "8px 12px",
          borderRadius: 9,
          background: "var(--muted)"
        }}
      >
        {cur ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <span
              style={{
                fontSize: 11,
                color: "var(--muted-foreground)",
                fontFamily: "var(--font-headings)",
                letterSpacing: ".04em"
              }}
            >
              R{cur.roundNumber}
            </span>
            {[...cur.aEvents, ...cur.bEvents]
              .sort((a, b) => a.time_in_round - b.time_in_round)
              .map((e, idx) => {
                const isA = e.delta >= 0;
                const color = isA ? TEAM_A_COLOR : TEAM_B_COLOR;
                const killer =
                  playerNames.get(e.primary_player_steam_id) ??
                  e.primary_player_steam_id.slice(-4);
                const victim = e.victim_steam_id
                  ? (playerNames.get(e.victim_steam_id) ??
                    e.victim_steam_id.slice(-4))
                  : null;
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 12
                    }}
                  >
                    <span
                      className="tabular-nums"
                      style={{
                        fontSize: 10,
                        color: "var(--muted-foreground)",
                        minWidth: 32
                      }}
                    >
                      {fmtT(e.time_in_round)}
                    </span>
                    <span style={{ color, fontWeight: 700 }}>{killer}</span>
                    {victim && (
                      <span style={{ color: "var(--muted-foreground)" }}>
                        ▸ {victim}
                        {e.weapon ? ` · ${e.weapon}` : ""}
                      </span>
                    )}
                    <span
                      className="tabular-nums"
                      style={{ marginLeft: "auto", color, fontWeight: 700 }}
                    >
                      +{Math.round(Math.abs(e.delta) * 100)}%
                    </span>
                  </div>
                );
              })}
          </div>
        ) : (
          <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
            Hover a round — stacked height = total win-probability shifted · up
            = {teamAName} gained, down = {teamBName} gained.
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Round moment row (ranked list) ─────────────────────────────── */
function RoundMomentRow({
  group,
  rank,
  playerNames,
  teamAName,
  teamBName
}: {
  group: RoundGroup;
  rank: number;
  playerNames: Map<string, string>;
  teamAName: string;
  teamBName: string;
}) {
  const { aTotal, bTotal } = group;
  const totalImpact = aTotal + bTotal;
  const mainColor = aTotal >= bTotal ? TEAM_A_COLOR : TEAM_B_COLOR;

  const allEvents = [...group.aEvents, ...group.bEvents].sort(
    (a, b) => a.time_in_round - b.time_in_round
  );

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/20 last:border-0">
      <span
        className="tabular-nums text-sm font-bold shrink-0 w-6 text-right mt-0.5"
        style={{ color: "var(--muted-foreground)" }}
      >
        {rank}
      </span>

      <div className="flex-1 min-w-0">
        {/* Round label + per-team totals */}
        <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
          <span className="font-semibold text-muted-foreground/60">
            R{group.roundNumber}
          </span>
          {aTotal > 0 && (
            <span style={{ color: TEAM_A_COLOR, fontWeight: 700 }}>
              {teamAName} +{Math.round(aTotal * 100)}%
            </span>
          )}
          {bTotal > 0 && (
            <span style={{ color: TEAM_B_COLOR, fontWeight: 700 }}>
              {teamBName} +{Math.round(bTotal * 100)}%
            </span>
          )}
        </div>

        {/* Team share bar */}
        <div className="flex gap-0.5 h-1.5 mb-3 rounded-full overflow-hidden">
          {aTotal > 0 && (
            <div
              style={{
                flex: aTotal,
                background: TEAM_A_COLOR,
                borderRadius: bTotal === 0 ? 9999 : "9999px 2px 2px 9999px"
              }}
            />
          )}
          {bTotal > 0 && (
            <div
              style={{
                flex: bTotal,
                background: TEAM_B_COLOR,
                borderRadius: aTotal === 0 ? 9999 : "2px 9999px 9999px 2px"
              }}
            />
          )}
        </div>

        {/* Events listed chronologically */}
        <div className="flex flex-col gap-1.5">
          {allEvents.map((e, i) => {
            const isA = e.delta >= 0;
            const color = isA ? TEAM_A_COLOR : TEAM_B_COLOR;
            const killer =
              playerNames.get(e.primary_player_steam_id) ??
              e.primary_player_steam_id.slice(-4);
            const victim = e.victim_steam_id
              ? (playerNames.get(e.victim_steam_id) ??
                e.victim_steam_id.slice(-4))
              : null;
            return (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="tabular-nums text-[10px] text-muted-foreground/50 shrink-0 w-8">
                  {fmtT(e.time_in_round)}
                </span>
                <span style={{ color, fontWeight: 700 }}>{killer}</span>
                {victim && (
                  <span className="text-muted-foreground">▸ {victim}</span>
                )}
                {e.weapon && (
                  <span className="text-[10px] px-1 rounded border border-border/40 text-muted-foreground">
                    {e.weapon}
                    {e.is_headshot ? " HS" : ""}
                  </span>
                )}
                <span
                  className="tabular-nums font-bold shrink-0 ml-auto"
                  style={{ color }}
                >
                  +{Math.round(Math.abs(e.delta) * 100)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Total badge */}
      <div
        className="shrink-0 text-xs font-bold tabular-nums px-2 py-1 rounded-full mt-0.5"
        style={{
          background: `color-mix(in oklab, ${mainColor} 14%, transparent)`,
          color: mainColor,
          border: `1px solid color-mix(in oklab, ${mainColor} 28%, transparent)`
        }}
      >
        +{Math.round(totalImpact * 100)}%
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
export const RoundSwingTab = ({
  matchGameId,
  playerNames,
  teams
}: RoundSwingTabProps) => {
  const [selectedRound, setSelectedRound] = useState<number | undefined>(
    undefined
  );

  const { roundInfo, isLoading: isLoadingRounds } =
    useGameRoundInfo(matchGameId);
  const { roundSwings, isLoading: isLoadingSwings } = useRoundSwings(
    matchGameId,
    selectedRound,
    selectedRound !== undefined ? 5 : 20
  );

  const [teamA, teamB] = useMemo(() => {
    const list = orderMatchParticipantsBySideHomeLeft(Object.values(teams));
    return [list[0], list[1]] as const;
  }, [teams]);

  const teamAName = teamA?.name ?? "Team A";
  const teamBName = teamB?.name ?? "Team B";

  const availableRounds = useMemo(
    () => (roundInfo ?? []).map((r) => r.round_number).sort((a, b) => a - b),
    [roundInfo]
  );

  const regulationRounds =
    roundInfo?.[0]?.regulation_rounds ?? roundSwings.length * 2;

  const isLoading = isLoadingRounds || isLoadingSwings;

  const chartSwings = useMemo(
    () =>
      [...roundSwings].sort((a, b) =>
        a.round_number !== b.round_number
          ? a.round_number - b.round_number
          : a.time_in_round - b.time_in_round
      ),
    [roundSwings]
  );

  const rankedGroups = useMemo(() => {
    const groups = buildRoundGroups(roundSwings);
    if (selectedRound !== undefined) {
      return groups.filter((g) => g.roundNumber === selectedRound);
    }
    return [...groups].sort(
      (a, b) => b.aTotal + b.bTotal - (a.aTotal + a.bTotal)
    );
  }, [roundSwings, selectedRound]);

  const teamImpact = useMemo(() => {
    let aCount = 0,
      aImpact = 0,
      bCount = 0,
      bImpact = 0;
    for (const s of roundSwings) {
      const mag = Math.abs(s.delta);
      if (s.delta >= 0) {
        aCount++;
        aImpact += mag;
      } else {
        bCount++;
        bImpact += mag;
      }
    }
    return { aCount, aImpact, bCount, bImpact };
  }, [roundSwings]);

  return (
    <div className="flex flex-col gap-3.5">
      <AnalysisCard
        title="Momentum swings"
        sub="Stacked by round — bar height = total win-probability shifted that round"
        right={
          <Legend
            items={[
              { label: teamAName, color: TEAM_A_COLOR },
              { label: teamBName, color: TEAM_B_COLOR }
            ]}
          />
        }
      >
        {isLoadingSwings ? (
          <div className="h-36 bg-muted/30 rounded animate-pulse" />
        ) : chartSwings.length > 0 ? (
          <MomentumChart
            swings={chartSwings}
            teamAName={teamAName}
            teamBName={teamBName}
            playerNames={playerNames}
            regulationRounds={regulationRounds}
          />
        ) : (
          <div className="text-sm text-muted-foreground/60 py-4 text-center">
            No round swing data available.
          </div>
        )}
      </AnalysisCard>

      {!isLoading && roundSwings.length > 0 && (
        <AnalysisCard
          title="Who created the momentum"
          sub="High-impact plays and total win-probability shifted"
        >
          <div className="flex flex-col gap-4">
            <VersusStat
              label="High-impact plays"
              aVal={teamImpact.aCount}
              bVal={teamImpact.bCount}
              mode="share"
            />
            <VersusStat
              label="Total win-probability shifted"
              aVal={Math.round(teamImpact.aImpact * 100)}
              bVal={Math.round(teamImpact.bImpact * 100)}
              mode="share"
              aText={`+${Math.round(teamImpact.aImpact * 100)}%`}
              bText={`+${Math.round(teamImpact.bImpact * 100)}%`}
            />
          </div>
        </AnalysisCard>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={() => setSelectedRound(undefined)}
          className={`px-4 py-2.5 sm:px-3 sm:py-1 rounded-full text-xs font-semibold border transition-colors ${
            selectedRound === undefined
              ? "bg-muted text-foreground border-border"
              : "bg-transparent text-muted-foreground border-border/40 hover:border-border"
          }`}
        >
          All rounds
        </button>
        {!isLoadingRounds &&
          availableRounds.map((rn) => (
            <button
              key={rn}
              onClick={() =>
                setSelectedRound(rn === selectedRound ? undefined : rn)
              }
              className={`w-10 h-10 sm:w-8 sm:h-7 rounded text-xs font-semibold border transition-colors ${
                selectedRound === rn
                  ? "bg-muted text-foreground border-border"
                  : "bg-transparent text-muted-foreground border-border/40 hover:border-border"
              }`}
            >
              {rn}
            </button>
          ))}
      </div>

      <AnalysisCard
        title="Key rounds by momentum"
        sub="Ranked by total win-probability shifted — events listed chronologically"
      >
        {isLoading && <TableSkeleton rows={5} />}
        {!isLoading && rankedGroups.length === 0 && (
          <div className="text-sm text-muted-foreground/60 py-4 text-center">
            No swing data available
            {selectedRound !== undefined ? ` for round ${selectedRound}` : ""}.
          </div>
        )}
        {!isLoading &&
          rankedGroups.map((g, i) => (
            <RoundMomentRow
              key={g.roundNumber}
              group={g}
              rank={i + 1}
              playerNames={playerNames}
              teamAName={teamAName}
              teamBName={teamBName}
            />
          ))}
        {!isLoading && rankedGroups.length > 0 && (
          <div className="text-[10px] text-muted-foreground/40 pt-2">
            Win probability = CT side&apos;s chance of winning the current round
            (teams switch sides at halftime)
          </div>
        )}
      </AnalysisCard>
    </div>
  );
};
