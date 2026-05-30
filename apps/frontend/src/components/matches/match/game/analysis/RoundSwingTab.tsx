"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { TableSkeleton } from "@/components/loading";
import {
  useRoundSwings,
  type RoundSwingEntry
} from "@/hooks/data/useRoundSwings";
import { useGameRoundInfo } from "@/hooks/data/useGameRoundInfo";
import type { MatchInfo } from "@eggosystem/types";
import { orderMatchParticipantsBySideHomeLeft } from "@/lib/order-match-teams-home-left-away";

interface RoundSwingTabProps {
  matchGameId: number;
  playerNames: Map<string, string>;
  teams: MatchInfo["teams"];
}

/* ── Tiny tag pill ── */
const Tag = ({
  label,
  variant = "neutral"
}: {
  label: string;
  variant?: "neutral" | "ct" | "t" | "gold";
}) => (
  <span
    className={cn(
      "inline-block px-1.5 py-0 rounded text-[10px] font-bold tracking-wide border",
      variant === "neutral" &&
        "bg-muted/60 border-border/50 text-muted-foreground",
      variant === "ct" && "bg-sky-400/10 border-sky-400/30 text-sky-300",
      variant === "t" && "bg-amber-400/10 border-amber-400/30 text-amber-300",
      variant === "gold" &&
        "bg-yellow-400/10 border-yellow-400/30 text-yellow-300"
    )}
  >
    {label}
  </span>
);

/* ── Team probability row ── */
const ProbRow = ({
  name,
  before,
  after,
  benefited,
  color
}: {
  name: string;
  before: number;
  after: number;
  benefited: boolean;
  color: string;
}) => {
  const change = after - before;
  return (
    <div
      className="grid items-center gap-2.5"
      style={{ gridTemplateColumns: "140px 36px 1fr 48px 52px" }}
    >
      {/* Team name */}
      <span
        className={cn(
          "text-xs truncate",
          benefited ? "font-bold" : "font-normal text-muted-foreground"
        )}
        style={benefited ? { color } : undefined}
      >
        {name}
      </span>

      {/* Before */}
      <span
        className={cn(
          "text-xs tabular-nums text-right",
          benefited
            ? "line-through opacity-50 text-muted-foreground"
            : "font-semibold text-foreground/80"
        )}
      >
        {(before * 100).toFixed(0)}%
      </span>

      {/* Bar */}
      <div className="relative h-2.5">
        {/* Ghost bar (before) */}
        <div
          className="absolute inset-y-0.5 left-0 rounded-sm bg-border/40"
          style={{ width: `${before * 100}%` }}
        />
        {/* Solid bar (after) */}
        <div
          className="absolute inset-y-0.5 left-0 rounded-sm transition-all"
          style={{
            width: `${after * 100}%`,
            background: benefited ? color : undefined,
            opacity: benefited ? 0.75 : 0.2
          }}
        />
      </div>

      {/* After */}
      <span
        className={cn(
          "tabular-nums text-right font-bold",
          benefited ? "text-base" : "text-sm text-foreground/60"
        )}
        style={benefited ? { color } : undefined}
      >
        {(after * 100).toFixed(0)}%
      </span>

      {/* Delta */}
      <span
        className="text-xs tabular-nums text-right font-bold"
        style={{ color: benefited ? color : undefined }}
      >
        {!benefited && (
          <span className="text-muted-foreground/50">
            {change > 0 ? "+" : ""}
            {(change * 100).toFixed(1)}%
          </span>
        )}
        {benefited && (
          <>
            {change > 0 ? "+" : ""}
            {(change * 100).toFixed(1)}%
          </>
        )}
      </span>
    </div>
  );
};

/* ── Single swing card ── */
const SwingCard = ({
  swing,
  ctTeamName,
  tTeamName,
  playerNames,
  ctColor,
  tColor
}: {
  swing: RoundSwingEntry;
  ctTeamName: string;
  tTeamName: string;
  playerNames: Map<string, string>;
  ctColor: string;
  tColor: string;
}) => {
  const swungToT = swing.post_win_prob < swing.pre_win_prob;
  const beneficiaryName = swungToT ? tTeamName : ctTeamName;
  const swingColor = swungToT ? tColor : ctColor;
  const delta = Math.abs(swing.post_win_prob - swing.pre_win_prob);

  const killerName =
    playerNames.get(swing.primary_player_steam_id) ??
    swing.primary_player_steam_id.slice(-4);
  const victimName = swing.victim_steam_id
    ? (playerNames.get(swing.victim_steam_id) ??
      swing.victim_steam_id.slice(-4))
    : null;

  const situation =
    swing.cts_alive_after !== null && swing.ts_alive_after !== null
      ? `CT ${swing.cts_alive_after} · T ${swing.ts_alive_after}`
      : null;

  return (
    <div
      className="rounded-lg border bg-card overflow-hidden border-l-4"
      style={{ borderLeftColor: swungToT ? tColor : ctColor }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 px-3.5 py-2.5 bg-muted/30 border-b border-border/50">
        <span className="text-sm font-bold text-foreground min-w-fit">
          Round {swing.round_number}
        </span>
        <span className="w-px h-3.5 bg-border/60 shrink-0" />

        {victimName ? (
          <span className="text-xs text-muted-foreground">
            <span className="font-bold text-foreground">{killerName}</span>
            {" killed "}
            <span className="font-bold text-foreground">{victimName}</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            <span className="font-bold text-foreground">{killerName}</span>
          </span>
        )}

        <div className="flex flex-wrap gap-1 items-center">
          {swing.weapon && <Tag label={swing.weapon} />}
          {swing.is_headshot && <Tag label="Headshot" variant="gold" />}
          {swing.is_post_plant && (
            <Tag label="Post-plant" variant={swungToT ? "t" : "ct"} />
          )}
          {situation && <Tag label={situation} />}
          <span className="text-[10px] text-muted-foreground/60">
            · {swing.time_in_round.toFixed(0)}s
          </span>
        </div>

        <div className="ml-auto shrink-0">
          <span
            className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-full border"
            style={{
              background: `${swingColor}18`,
              borderColor: `${swingColor}4d`,
              color: swingColor
            }}
          >
            +{(delta * 100).toFixed(1)}% {beneficiaryName}
          </span>
        </div>
      </div>

      {/* Probability rows */}
      <div className="px-3.5 py-3 space-y-2">
        {/* Column labels */}
        <div
          className="grid items-center gap-2.5 text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wide pb-1.5 border-b border-border/40"
          style={{ gridTemplateColumns: "140px 36px 1fr 48px 52px" }}
        >
          <span>Team</span>
          <span className="text-right">Before</span>
          <span />
          <span className="text-right">After</span>
          <span className="text-right">Change</span>
        </div>

        <ProbRow
          name={ctTeamName}
          before={swing.pre_win_prob}
          after={swing.post_win_prob}
          benefited={!swungToT}
          color={ctColor}
        />
        <ProbRow
          name={tTeamName}
          before={1 - swing.pre_win_prob}
          after={1 - swing.post_win_prob}
          benefited={swungToT}
          color={tColor}
        />
      </div>
    </div>
  );
};

/* ── Main tab ── */
export const RoundSwingTab = ({
  matchGameId,
  playerNames,
  teams
}: RoundSwingTabProps) => {
  const [selectedRound, setSelectedRound] = useState<number | undefined>(
    undefined
  );
  const [sortBy, setSortBy] = useState<"impact" | "round">("impact");

  const { roundInfo, isLoading: isLoadingRounds } =
    useGameRoundInfo(matchGameId);
  const { roundSwings, isLoading: isLoadingSwings } = useRoundSwings(
    matchGameId,
    selectedRound,
    selectedRound !== undefined ? 5 : 10
  );

  const teamList = useMemo(
    () => orderMatchParticipantsBySideHomeLeft(Object.values(teams)),
    [teams]
  );
  const teamA = teamList[0]!;
  const teamB = teamList[1]!;

  const availableRounds = useMemo(
    () => (roundInfo ?? []).map((r) => r.round_number).sort((a, b) => a - b),
    [roundInfo]
  );

  const isLoading = isLoadingRounds || isLoadingSwings;

  const sorted = useMemo(() => {
    const swings = [...roundSwings];
    // When a specific round is selected, always show kills in time order.
    // The "By impact" sort only makes sense across all rounds.
    if (selectedRound !== undefined || sortBy === "round") return swings;
    return swings.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }, [roundSwings, sortBy, selectedRound]);

  return (
    <div className="space-y-4">
      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Round selector */}
        <div className="flex flex-wrap gap-1.5 flex-1">
          <button
            onClick={() => setSelectedRound(undefined)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
              selectedRound === undefined
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
            )}
          >
            All rounds
          </button>
          {availableRounds.map((rn) => (
            <button
              key={rn}
              onClick={() =>
                setSelectedRound(rn === selectedRound ? undefined : rn)
              }
              className={cn(
                "w-8 h-7 rounded text-xs font-semibold border transition-colors",
                selectedRound === rn
                  ? "bg-accent text-accent-foreground border-accent"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
              )}
            >
              {rn}
            </button>
          ))}
        </div>

        {/* Sort — only relevant in "all rounds" view */}
        {selectedRound === undefined && (
          <div className="flex gap-1.5 shrink-0">
            {(
              [
                { key: "impact", label: "By impact" },
                { key: "round", label: "By round" }
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
                  sortBy === key
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {isLoading && <TableSkeleton rows={5} />}

      {!isLoading && sorted.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No round swing data available
            {selectedRound !== undefined ? ` for round ${selectedRound}` : ""}.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Round swing analysis requires parser enrichment data.
          </p>
        </div>
      )}

      {!isLoading &&
        sorted.map((swing, i) => (
          <SwingCard
            key={i}
            swing={swing}
            ctTeamName={teamA.name}
            tTeamName={teamB.name}
            playerNames={playerNames}
            ctColor="#7dd3fc"
            tColor="#fcd34d"
          />
        ))}

      {!isLoading && sorted.length > 0 && (
        <p className="text-[10px] text-muted-foreground/50">
          Win probability = CT team&apos;s chance of winning the round · before
          and after the pivotal event
        </p>
      )}
    </div>
  );
};
