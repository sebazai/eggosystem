"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type {
  InsightResult,
  MatchGameInsights,
  MatchGameInsightsTeam
} from "@eggosystem/types";

/* ─────────────────────────────────────────────────────────────────────────────
 *  Types & constants
 * ─────────────────────────────────────────────────────────────────────────── */

interface InsightsTabProps {
  insights: MatchGameInsights;
  playerNames: Map<string, string>;
}

type Side = "CT" | "T";

const SEVERITY_ORDER: Record<InsightResult["severity"], number> = {
  critical: 0,
  notable: 1,
  info: 2
};

const CATEGORY_LABELS: Record<InsightResult["category"], string> = {
  openings: "Openings",
  timing: "Timing",
  trades: "Trades",
  flashes: "Flashes",
  execution: "Execution",
  retakes: "Retakes",
  economy: "Economy",
  impact: "Impact",
  clutch: "Clutch"
};

/* Sort order: critical concerns → notable concerns → info concerns → strengths */
function sortInsights(insights: InsightResult[]): InsightResult[] {
  return [...insights].sort((a, b) => {
    const aPriority = a.polarity === "concern" ? 0 : 1;
    const bPriority = b.polarity === "concern" ? 0 : 1;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
  });
}

/* ─────────────────────────────────────────────────────────────────────────────
 *  InsightCard
 * ─────────────────────────────────────────────────────────────────────────── */

interface InsightCardProps {
  insight: InsightResult;
  playerNames: Map<string, string>;
}

const InsightCard = ({ insight, playerNames }: InsightCardProps) => {
  const borderColor =
    insight.polarity === "strength"
      ? "border-l-green-500"
      : insight.severity === "critical"
        ? "border-l-red-500"
        : insight.severity === "notable"
          ? "border-l-yellow-500"
          : "border-l-muted-foreground/40";

  const severityBadgeVariant =
    insight.polarity === "strength"
      ? "default"
      : insight.severity === "critical"
        ? "destructive"
        : "secondary";

  const severityLabel =
    insight.polarity === "strength"
      ? "Strength"
      : insight.severity === "critical"
        ? "Critical"
        : insight.severity === "notable"
          ? "Notable"
          : "Info";

  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-card/50 p-4 border-l-[3px]",
        borderColor
      )}
    >
      {/* Header row */}
      <div className="flex flex-wrap items-start gap-2 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
          {CATEGORY_LABELS[insight.category]}
        </span>
        <Badge
          variant={severityBadgeVariant}
          className={cn(
            "text-[10px] px-1.5 py-0 h-4",
            insight.polarity === "strength" &&
              "bg-green-600/80 text-white border-transparent"
          )}
        >
          {severityLabel}
        </Badge>
      </div>

      {/* Headline */}
      <h4 className="text-sm font-semibold text-foreground leading-snug mb-2">
        {insight.headline}
      </h4>

      {/* Story */}
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
        {insight.story}
      </p>

      {/* Player pills */}
      {insight.players.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {insight.players.map((steamId) => (
            <span
              key={steamId}
              className="inline-flex items-center rounded-full bg-accent/60 px-2 py-0.5 text-[10px] font-medium text-accent-foreground"
            >
              {playerNames.get(steamId) ?? steamId.slice(-6)}
            </span>
          ))}
        </div>
      )}

      {/* Evidence round pills */}
      {insight.evidence_rounds.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-[10px] text-muted-foreground/50 mr-0.5 self-center">
            Rounds
          </span>
          {insight.evidence_rounds.map((rn) => (
            <span
              key={rn}
              className="inline-flex items-center rounded bg-muted/60 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground"
            >
              {rn}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
 *  TeamColumn
 * ─────────────────────────────────────────────────────────────────────────── */

interface TeamColumnProps {
  team: MatchGameInsightsTeam;
  insights: InsightResult[];
  playerNames: Map<string, string>;
  activePlayer: string | null;
}

const TeamColumn = ({
  team,
  insights,
  playerNames,
  activePlayer
}: TeamColumnProps) => {
  const visible =
    activePlayer !== null
      ? insights.filter((i) => i.players.includes(activePlayer))
      : insights;
  const sorted = sortInsights(visible);
  const hiddenCount = insights.length - visible.length;

  return (
    <div className="flex flex-col gap-3 min-w-0">
      {/* Team header */}
      <div className="flex items-center gap-2 pb-1 border-b border-border/40">
        {team.team_logo && (
          <img
            src={team.team_logo}
            alt={team.team_name}
            className="w-5 h-5 object-contain rounded"
          />
        )}
        <span className="text-sm font-bold text-foreground truncate">
          {team.team_name}
        </span>
        <span className="text-[10px] text-muted-foreground/50 shrink-0">
          {visible.length} insight{visible.length !== 1 ? "s" : ""}
          {hiddenCount > 0 && (
            <span className="ml-1 text-muted-foreground/30">
              ({hiddenCount} hidden)
            </span>
          )}
        </span>
      </div>

      {/* Insight cards */}
      {sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground/40 italic py-4 text-center">
          {activePlayer !== null
            ? "No patterns for this player"
            : "No patterns detected"}
        </p>
      ) : (
        sorted.map((insight, i) => (
          <InsightCard
            key={`${insight.id}-${i}`}
            insight={insight}
            playerNames={playerNames}
          />
        ))
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
 *  Player filter row
 * ─────────────────────────────────────────────────────────────────────────── */

interface PlayerFilterProps {
  players: { steamId: string; name: string; count: number }[];
  activePlayer: string | null;
  onSelect: (steamId: string | null) => void;
}

const PlayerFilter = ({
  players,
  activePlayer,
  onSelect
}: PlayerFilterProps) => {
  if (players.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 py-2">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mr-1">
        Filter
      </span>
      <button
        onClick={() => onSelect(null)}
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
          activePlayer === null
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted"
        )}
      >
        All
      </button>
      {players.map(({ steamId, name, count }) => (
        <button
          key={steamId}
          onClick={() => onSelect(activePlayer === steamId ? null : steamId)}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
            activePlayer === steamId
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted"
          )}
        >
          {name}
          <span
            className={cn(
              "rounded-full px-1 py-0 text-[9px] font-bold",
              activePlayer === steamId
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted-foreground/20 text-muted-foreground"
            )}
          >
            {count}
          </span>
        </button>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
 *  InsightsTab (main export)
 * ─────────────────────────────────────────────────────────────────────────── */

export const InsightsTab = ({ insights, playerNames }: InsightsTabProps) => {
  const [side, setSide] = useState<Side>("CT");
  const [activePlayer, setActivePlayer] = useState<string | null>(null);

  const { team1, team2 } = useMemo(() => {
    const [t1, t2] = insights.teams;
    return { team1: t1, team2: t2 };
  }, [insights.teams]);

  const team1Insights = useMemo(
    () => (team1 ? (side === "CT" ? team1.ct : team1.t) : []),
    [team1, side]
  );
  const team2Insights = useMemo(
    () => (team2 ? (side === "CT" ? team2.ct : team2.t) : []),
    [team2, side]
  );

  // Collect all players mentioned on this side across both teams
  const filterPlayers = useMemo(() => {
    const countMap = new Map<string, number>();
    for (const insight of [...team1Insights, ...team2Insights]) {
      for (const steamId of insight.players) {
        countMap.set(steamId, (countMap.get(steamId) ?? 0) + 1);
      }
    }
    return Array.from(countMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([steamId, count]) => ({
        steamId,
        name: playerNames.get(steamId) ?? steamId.slice(-6),
        count
      }));
  }, [team1Insights, team2Insights, playerNames]);

  const handleSideChange = (newSide: Side) => {
    setSide(newSide);
    setActivePlayer(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Side tabs */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-3">
        {(["CT", "T"] as Side[]).map((s) => (
          <button
            key={s}
            onClick={() => handleSideChange(s)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-semibold transition-colors",
              side === s
                ? s === "CT"
                  ? "bg-blue-600/20 text-blue-400 border border-blue-600/40"
                  : "bg-orange-600/20 text-orange-400 border border-orange-600/40"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {s} Side
          </button>
        ))}
        <div className="ml-auto text-[10px] text-muted-foreground/40">
          {team1Insights.length + team2Insights.length} pattern
          {team1Insights.length + team2Insights.length !== 1 ? "s" : ""}{" "}
          detected
        </div>
      </div>

      {/* Player filter */}
      <PlayerFilter
        players={filterPlayers}
        activePlayer={activePlayer}
        onSelect={setActivePlayer}
      />

      {/* Two-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {team1 && (
          <TeamColumn
            team={team1}
            insights={team1Insights}
            playerNames={playerNames}
            activePlayer={activePlayer}
          />
        )}
        {team2 && (
          <TeamColumn
            team={team2}
            insights={team2Insights}
            playerNames={playerNames}
            activePlayer={activePlayer}
          />
        )}
      </div>
    </div>
  );
};
