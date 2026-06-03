"use client";

import React, { useMemo, useState } from "react";
import { NextImageFallback } from "@/components/layout/NextImageFallback";
import { cn, createTeamLogoUrl } from "@/lib/utils";
import { orderMatchParticipantsBySideHomeLeft } from "@/lib/order-match-teams-home-left-away";
import {
  AnalysisCard,
  KpiNum,
  Legend,
  GOOD_COLOR,
  BAD_COLOR,
  TEAM_A_COLOR,
  TEAM_B_COLOR
} from "./AnalysisVizComponents";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  buildAfterplantSituations,
  buildRetakeSituations,
  computeTeamAfterplantSummary,
  formatRoundTimeSeconds,
  getAfterplantRoundOutcome,
  getAfterplantTimelineRange,
  getTimelineAxisLabels,
  T_WIN_REASONS,
  timeToTimelinePct,
  winPct,
  type SiteWinRecord,
  type TeamAfterplantSummary
} from "./afterplant-round-helpers";

const TIMELINE_GRID_CLASS =
  "grid grid-cols-[auto_1fr] gap-x-1.5 sm:gap-x-2 gap-y-1 min-w-0";
const TIMELINE_SIDE_LABEL_CLASS =
  "text-[10px] font-bold w-6 sm:w-8 shrink-0 tabular-nums";
import {
  type AfterplantKillEvent,
  type MatchGameAfterplantRound,
  type MatchInfo,
  type MatchPlayerStats
} from "@eggosystem/types";

interface AfterplantTabProps {
  afterplantRounds: MatchGameAfterplantRound[];
  playerStats: MatchPlayerStats[];
  teams: MatchInfo["teams"];
}

function winRateColor(pct: number): string {
  if (pct >= 60) return GOOD_COLOR;
  if (pct >= 40) return "var(--foreground)";
  return BAD_COLOR;
}

function teamToggleStyle(
  teamColor: string,
  isActive: boolean
): React.CSSProperties {
  if (isActive) {
    return {
      background: `color-mix(in oklab, ${teamColor} 18%, transparent)`,
      borderColor: `color-mix(in oklab, ${teamColor} 35%, var(--border))`,
      color: teamColor
    };
  }
  return {
    background: `color-mix(in oklab, ${teamColor} 6%, transparent)`,
    borderColor: `color-mix(in oklab, ${teamColor} 22%, var(--border))`,
    color: `color-mix(in oklab, ${teamColor} 55%, var(--muted-foreground))`
  };
}

function WinBar({
  pct,
  label,
  won,
  total
}: {
  pct: number;
  label: string;
  won: number;
  total: number;
}) {
  const color = winRateColor(pct);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs gap-2">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold tabular-nums" style={{ color }}>
          {pct}%{" "}
          <span className="text-muted-foreground font-normal">
            ({won}/{total})
          </span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: color,
            opacity: 0.75
          }}
        />
      </div>
    </div>
  );
}

function SiteWinBars({
  siteA,
  siteB,
  wonLabel
}: {
  siteA: SiteWinRecord;
  siteB: SiteWinRecord;
  wonLabel: (won: number, total: number) => string;
}) {
  return (
    <>
      {siteA.total > 0 && (
        <WinBar
          pct={winPct(siteA.won, siteA.total)}
          label="Site A"
          won={siteA.won}
          total={siteA.total}
        />
      )}
      {siteB.total > 0 && (
        <WinBar
          pct={winPct(siteB.won, siteB.total)}
          label="Site B"
          won={siteB.won}
          total={siteB.total}
        />
      )}
      {siteA.total === 0 && siteB.total === 0 && (
        <p className="text-xs text-muted-foreground">{wonLabel(0, 0)}</p>
      )}
    </>
  );
}

function TeamSummaryCard({
  teamName,
  teamLogo,
  summary
}: {
  teamName: string;
  teamLogo: string | null;
  summary: TeamAfterplantSummary;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border/50">
        {teamLogo && (
          <NextImageFallback
            src={createTeamLogoUrl(teamLogo)}
            alt={teamName}
            width={24}
            height={24}
            className="object-contain shrink-0"
            fallbackSrc="/team-images/nologo.png"
          />
        )}
        <span className="font-bold text-sm">{teamName}</span>
      </div>
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
            Afterplants (T-side)
          </p>
          <WinBar
            pct={winPct(summary.attackWon, summary.attackTotal)}
            label="Overall"
            won={summary.attackWon}
            total={summary.attackTotal}
          />
          <SiteWinBars
            siteA={summary.attackSiteA}
            siteB={summary.attackSiteB}
            wonLabel={() => "No plant rounds"}
          />
        </div>
        <div className="space-y-2 pt-3 border-t border-border/50">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
            Retakes (CT-side)
          </p>
          <WinBar
            pct={winPct(summary.defendWon, summary.defendTotal)}
            label="Overall"
            won={summary.defendWon}
            total={summary.defendTotal}
          />
          <SiteWinBars
            siteA={summary.defendSiteA}
            siteB={summary.defendSiteB}
            wonLabel={() => "No defend rounds"}
          />
        </div>
      </div>
    </div>
  );
}

function SituationRow({
  situation,
  won,
  total
}: {
  situation: string;
  won: number;
  total: number;
}) {
  const pct = winPct(won, total);
  const color = winRateColor(pct);
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono font-bold text-sm w-10 shrink-0 tabular-nums">
        {situation}
      </span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color, opacity: 0.75 }}
        />
      </div>
      <span
        className="font-bold text-xs w-9 text-right tabular-nums"
        style={{ color }}
      >
        {pct}%
      </span>
      <span className="text-xs text-muted-foreground w-8 text-right tabular-nums">
        {won}/{total}
      </span>
    </div>
  );
}

function SituationPanel({
  teamName,
  attackRounds,
  defendRounds
}: {
  teamName: string;
  attackRounds: MatchGameAfterplantRound[];
  defendRounds: MatchGameAfterplantRound[];
}) {
  const afterplantSits = useMemo(
    () => buildAfterplantSituations(attackRounds),
    [attackRounds]
  );
  const retakeSits = useMemo(
    () => buildRetakeSituations(defendRounds),
    [defendRounds]
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div className="space-y-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
          {teamName} afterplants
        </p>
        <p className="text-xs text-muted-foreground -mt-1">
          T players v CT players at plant — T win %
        </p>
        <div className="space-y-2">
          {afterplantSits.map((s) => (
            <SituationRow
              key={s.key}
              situation={s.key}
              won={s.won}
              total={s.total}
            />
          ))}
          {afterplantSits.length === 0 && (
            <p className="text-xs text-muted-foreground">No plant rounds</p>
          )}
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
          {teamName} retakes
        </p>
        <p className="text-xs text-muted-foreground -mt-1">
          Our players v enemy players (CT view) — retake win %
        </p>
        <div className="space-y-2">
          {retakeSits.map((s) => (
            <SituationRow
              key={s.key}
              situation={s.key}
              won={s.won}
              total={s.total}
            />
          ))}
          {retakeSits.length === 0 && (
            <p className="text-xs text-muted-foreground">No defend rounds</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Site badge ─────────────────────────────────────────────────── */
function SiteBadge({ site }: { site: "A" | "B" }) {
  return (
    <span
      className="inline-flex items-center justify-center font-headings font-bold text-xs"
      style={{
        width: 24,
        height: 24,
        borderRadius: 6,
        background: "var(--muted)",
        color: "var(--foreground)",
        flexShrink: 0
      }}
    >
      {site}
    </span>
  );
}

/* ─── Outcome chip ───────────────────────────────────────────────── */
function OutcomeChip({
  winnerTeamName,
  outcomeLabel,
  color
}: {
  winnerTeamName: string;
  outcomeLabel: string;
  color: string;
}) {
  return (
    <span
      className="inline-flex flex-wrap items-center justify-end gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 max-w-[min(100%,220px)]"
      style={{
        background: `color-mix(in oklab, ${color} 18%, transparent)`,
        color,
        border: `1px solid color-mix(in oklab, ${color} 30%, transparent)`
      }}
    >
      <span className="truncate">{winnerTeamName}</span>
      <span className="font-normal opacity-80">· {outcomeLabel}</span>
    </span>
  );
}

/* ─── Post-plant timeline ────────────────────────────────────────── */
function TimelineMarkerTooltip({
  label,
  children
}: {
  label: string;
  children: React.ReactElement;
}) {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" sideOffset={6} className="z-[100]">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function PlantMarker({
  plantTime,
  site,
  laneColor,
  timeMin,
  timeMax
}: {
  plantTime: number;
  site: "A" | "B";
  laneColor: string;
  timeMin: number;
  timeMax: number;
}) {
  return (
    <TimelineMarkerTooltip
      label={`Bomb planted on ${site} @${formatRoundTimeSeconds(plantTime)}`}
    >
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold cursor-default"
        style={{
          left: `${timeToTimelinePct(plantTime, timeMin, timeMax)}%`,
          background: `color-mix(in oklab, ${laneColor} 22%, var(--card))`,
          color: laneColor,
          border: `1.5px solid ${laneColor}`
        }}
      >
        {site}
      </div>
    </TimelineMarkerTooltip>
  );
}

function DotLane({
  kills,
  side,
  laneColor,
  playerNames,
  timeMin,
  timeMax,
  plantTime,
  plantSite
}: {
  kills: AfterplantKillEvent[];
  side: "CT" | "T";
  laneColor: string;
  playerNames: Map<string, string>;
  timeMin: number;
  timeMax: number;
  plantTime?: number | null;
  plantSite?: "A" | "B";
}) {
  const sideKills = kills.filter((k) => k.victim_team === side);

  return (
    <div className="relative h-5 flex-1 min-w-0">
      <div className="absolute inset-y-1/2 left-0 right-0 h-px bg-border/60" />
      {side === "T" && plantTime != null && plantSite && (
        <PlantMarker
          plantTime={plantTime}
          site={plantSite}
          laneColor={laneColor}
          timeMin={timeMin}
          timeMax={timeMax}
        />
      )}
      {sideKills.map((k, i) => {
        const victim =
          playerNames.get(k.victim_steam_id) ?? k.victim_steam_id.slice(-4);
        const killer =
          playerNames.get(k.killer_steam_id) ?? k.killer_steam_id.slice(-4);
        const label = `${killer} killed ${victim} @${formatRoundTimeSeconds(k.time_in_round)}${k.is_traded ? " (trade)" : ""}`;
        return (
          <TimelineMarkerTooltip key={i} label={label}>
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full cursor-default z-10"
              style={{
                left: `${timeToTimelinePct(k.time_in_round, timeMin, timeMax)}%`,
                background: k.is_traded ? "transparent" : laneColor,
                border: `2px solid ${laneColor}`
              }}
            />
          </TimelineMarkerTooltip>
        );
      })}
    </div>
  );
}

function AfterplantTimeline({
  round,
  playerNames,
  tColor,
  ctColor
}: {
  round: MatchGameAfterplantRound;
  playerNames: Map<string, string>;
  tColor: string;
  ctColor: string;
}) {
  const { timeMin, timeMax } = getAfterplantTimelineRange(
    round.kills_after_plant,
    round.plant_time_in_round
  );
  const axisLabels = getTimelineAxisLabels(timeMin, timeMax);
  const hasTimeline =
    round.kills_after_plant.length > 0 || round.plant_time_in_round != null;

  if (!hasTimeline) return null;

  return (
    <TooltipProvider delayDuration={0} skipDelayDuration={0}>
      <div className={cn(TIMELINE_GRID_CLASS, "pt-1")}>
        <span className={TIMELINE_SIDE_LABEL_CLASS} style={{ color: ctColor }}>
          CT
        </span>
        <DotLane
          kills={round.kills_after_plant}
          side="CT"
          laneColor={ctColor}
          playerNames={playerNames}
          timeMin={timeMin}
          timeMax={timeMax}
        />
        <span className={TIMELINE_SIDE_LABEL_CLASS} style={{ color: tColor }}>
          T
        </span>
        <DotLane
          kills={round.kills_after_plant}
          side="T"
          laneColor={tColor}
          playerNames={playerNames}
          timeMin={timeMin}
          timeMax={timeMax}
          plantTime={round.plant_time_in_round}
          plantSite={round.plant_site}
        />
        <span className="w-6 sm:w-8 shrink-0" aria-hidden />
        <div className="relative h-4 min-w-0">
          {axisLabels.map((s) => (
            <span
              key={s}
              className="absolute text-[9px] text-muted-foreground/60 tabular-nums -translate-x-1/2 whitespace-nowrap"
              style={{
                left: `${timeToTimelinePct(s, timeMin, timeMax)}%`
              }}
            >
              {formatRoundTimeSeconds(s)}
            </span>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}

function AlivePlayerList({ names }: { names: string[] }) {
  if (names.length === 0) {
    return <span className="text-xs text-muted-foreground/40">—</span>;
  }
  return (
    <ul className="flex flex-wrap gap-x-2 gap-y-1 list-none m-0 p-0">
      {names.map((name, index) => (
        <li
          key={`${name}-${index}`}
          className="text-xs text-foreground/70 leading-snug"
        >
          {name}
        </li>
      ))}
    </ul>
  );
}

function AliveTeamBlock({
  side,
  teamName,
  players,
  color
}: {
  side: "T" | "CT";
  teamName: string;
  players: string[];
  color: string;
}) {
  return (
    <div
      className="flex flex-col gap-1.5 min-w-0 pl-2.5 py-2 border-l-2 rounded-r-md"
      style={{
        borderColor: `color-mix(in oklab, ${color} 35%, transparent)`
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="text-[11px] font-bold shrink-0 tabular-nums"
          style={{ color }}
        >
          {side}
        </span>
        <span
          className="text-xs font-semibold min-w-0 break-words"
          style={{ color }}
        >
          {teamName}
        </span>
      </div>
      <AlivePlayerList names={players} />
    </div>
  );
}

function AliveAfterPlant({
  round,
  playerNames,
  tColor,
  ctColor
}: {
  round: MatchGameAfterplantRound;
  playerNames: Map<string, string>;
  tColor: string;
  ctColor: string;
}) {
  const tPlayers = (round.ct_t?.T ?? []).map(
    (id) => playerNames.get(String(id)) ?? String(id).slice(-4)
  );
  const ctPlayers = (round.ct_t?.CT ?? []).map(
    (id) => playerNames.get(String(id)) ?? String(id).slice(-4)
  );

  return (
    <div className="flex flex-col gap-2 min-w-0">
      <AliveTeamBlock
        side="T"
        teamName={round.t_team_name}
        players={tPlayers}
        color={tColor}
      />
      <AliveTeamBlock
        side="CT"
        teamName={round.ct_team_name}
        players={ctPlayers}
        color={ctColor}
      />
    </div>
  );
}

function DiedAfterPlant({
  round,
  playerNames,
  tColor,
  ctColor
}: {
  round: MatchGameAfterplantRound;
  playerNames: Map<string, string>;
  tColor: string;
  ctColor: string;
}) {
  const deathsFor = (side: "T" | "CT") =>
    round.kills_after_plant.filter((k) => k.victim_team === side);

  return (
    <div className="space-y-1">
      {(["T", "CT"] as const).map((side) => {
        const deaths = deathsFor(side);
        const color = side === "T" ? tColor : ctColor;
        return (
          <div
            key={side}
            className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-2 text-xs min-w-0"
          >
            <span className="font-bold shrink-0 tabular-nums" style={{ color }}>
              {side}
            </span>
            {deaths.length === 0 ? (
              <span className="text-muted-foreground/40">—</span>
            ) : (
              <div className="flex flex-wrap gap-x-3 gap-y-1 min-w-0">
                {deaths.map((k, i) => {
                  const victim =
                    playerNames.get(k.victim_steam_id) ??
                    k.victim_steam_id.slice(-4);
                  const killer =
                    playerNames.get(k.killer_steam_id) ??
                    k.killer_steam_id.slice(-4);
                  return (
                    <span key={i} className="text-foreground/60">
                      <span className="text-foreground/80 font-medium">
                        {victim}
                      </span>
                      <span className="text-muted-foreground/50">
                        {" "}
                        by {killer} @{formatRoundTimeSeconds(k.time_in_round)}
                      </span>
                      {k.is_traded && (
                        <span className="text-emerald-500/80 ml-0.5">↺</span>
                      )}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Plant row (expandable) ─────────────────────────────────────── */
function PlantRow({
  round,
  tName,
  playerNames,
  isOpen,
  onToggle,
  tColor,
  ctColor
}: {
  round: MatchGameAfterplantRound;
  tName: string;
  playerNames: Map<string, string>;
  isOpen: boolean;
  onToggle: () => void;
  tColor: string;
  ctColor: string;
}) {
  const outcome = getAfterplantRoundOutcome(round, tColor, ctColor);
  const killerCount = round.kills_after_plant?.length ?? 0;

  return (
    <div className="border-b border-border/20 last:border-0">
      <button className="w-full text-left" onClick={onToggle}>
        <div
          className={cn(
            "grid items-center gap-2.5 px-0 py-2.5 hover:bg-muted/20 transition-colors rounded",
            isOpen && "bg-muted/20"
          )}
          style={{ gridTemplateColumns: "28px 28px 1fr auto" }}
        >
          <span className="text-xs font-bold text-muted-foreground tabular-nums">
            R{round.round_number}
          </span>
          <SiteBadge site={round.plant_site} />
          <div className="flex flex-wrap items-center gap-1.5 text-xs min-w-0">
            <span style={{ color: tColor }} className="font-semibold">
              {tName}
            </span>
            <span className="text-muted-foreground/50">planted</span>
            <span className="text-muted-foreground/60">
              {round.t_alive_at_plant}v{round.ct_alive_at_plant}
            </span>
            {killerCount > 0 && (
              <span className="text-muted-foreground/50">
                · {killerCount} kill{killerCount !== 1 ? "s" : ""} post-plant
              </span>
            )}
          </div>
          <OutcomeChip
            winnerTeamName={outcome.winnerTeamName}
            outcomeLabel={outcome.outcomeLabel}
            color={outcome.winnerColor}
          />
        </div>
      </button>

      {isOpen && (
        <div className="pb-4 pl-4 sm:pl-10 pr-1 flex flex-col gap-3 border-t border-border/20 mt-0.5 pt-3 min-w-0">
          <div className="min-w-0">
            <div className="text-[10px] text-muted-foreground/50 uppercase tracking-wide mb-1.5">
              Alive after plant
            </div>
            <AliveAfterPlant
              round={round}
              playerNames={playerNames}
              tColor={tColor}
              ctColor={ctColor}
            />
          </div>

          <div className="min-w-0">
            <div className="text-[10px] text-muted-foreground/50 uppercase tracking-wide mb-1.5 leading-snug">
              <span>Timeline</span>
              {round.plant_time_in_round != null && (
                <span className="normal-case tracking-normal text-muted-foreground/40 block sm:inline sm:ml-1.5">
                  {round.plant_site} plant @
                  {formatRoundTimeSeconds(round.plant_time_in_round)}
                </span>
              )}
            </div>
            <AfterplantTimeline
              round={round}
              playerNames={playerNames}
              tColor={tColor}
              ctColor={ctColor}
            />
            {round.kills_after_plant.length === 0 &&
              round.plant_time_in_round == null && (
                <p className="text-xs text-muted-foreground/50">
                  No post-plant timeline data
                </p>
              )}
          </div>

          {round.kills_after_plant.length > 0 && (
            <div>
              <div className="text-[10px] text-muted-foreground/50 uppercase tracking-wide mb-1.5">
                Died
              </div>
              <DiedAfterPlant
                round={round}
                playerNames={playerNames}
                tColor={tColor}
                ctColor={ctColor}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Site gauge ─────────────────────────────────────────────────── */
function SiteGauge({
  site,
  held,
  plants
}: {
  site: "A" | "B";
  held: number;
  plants: number;
}) {
  if (plants === 0) return null;
  const heldPct = (held / plants) * 100;
  const retakenPct = 100 - heldPct;
  const retaken = plants - held;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <SiteBadge site={site} />
        <span className="text-sm font-bold tabular-nums">{plants}</span>
        <span className="text-xs text-muted-foreground/60">
          plant{plants !== 1 ? "s" : ""}
        </span>
      </div>
      <div
        className="flex h-3 rounded-full overflow-hidden w-full"
        style={{ background: "var(--muted)" }}
      >
        <div style={{ flex: heldPct, background: BAD_COLOR, opacity: 0.8 }} />
        <div
          style={{ flex: retakenPct, background: GOOD_COLOR, opacity: 0.8 }}
        />
      </div>
      <div className="flex justify-between text-[11px]">
        <span style={{ color: BAD_COLOR }} className="tabular-nums">
          held {held} ({Math.round(heldPct)}%)
        </span>
        <span style={{ color: GOOD_COLOR }} className="tabular-nums">
          retaken {retaken} ({Math.round(retakenPct)}%)
        </span>
      </div>
    </div>
  );
}

/* ─── Retake card ────────────────────────────────────────────────── */
function RetakeCard({
  round,
  ctName,
  playerNames,
  ctColor
}: {
  round: MatchGameAfterplantRound;
  ctName: string;
  playerNames: Map<string, string>;
  ctColor: string;
}) {
  const ctAlive = round.ct_alive_at_plant;
  const tAlive = round.t_alive_at_plant;
  const isClutch = ctAlive < tAlive;
  const borderColor = ctColor;

  return (
    <div
      className="flex flex-col gap-2 p-3 rounded-xl"
      style={{
        border: `1px solid color-mix(in oklab, ${borderColor} ${isClutch ? 45 : 22}%, var(--border))`,
        background: `color-mix(in oklab, ${borderColor} 4%, transparent)`
      }}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <SiteBadge site={round.plant_site} />
        <span className="text-xs text-muted-foreground/60">
          R{round.round_number}
        </span>
        <span
          className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: `color-mix(in oklab, ${GOOD_COLOR} 18%, transparent)`,
            color: GOOD_COLOR,
            border: `1px solid color-mix(in oklab, ${GOOD_COLOR} 30%, transparent)`
          }}
        >
          DEFUSED
        </span>
      </div>
      <div
        className="text-2xl font-bold tabular-nums"
        style={{ color: ctColor }}
      >
        {ctAlive}v{tAlive}
      </div>
      <div className="text-[11px] text-muted-foreground/70">
        {ctName} retook {round.plant_site}-site
        {isClutch && (
          <span style={{ color: ctColor }} className="ml-1 font-semibold">
            under disadvantage
          </span>
        )}
      </div>
      {/* Top retake kill */}
      {round.kills_after_plant && round.kills_after_plant.length > 0 && (
        <div className="text-[11px] text-muted-foreground/60">
          {round.kills_after_plant
            .filter((k) => k.victim_team === "T")
            .slice(0, 2)
            .map((k, i) => (
              <span key={i}>
                {i > 0 && " · "}
                <span className="font-semibold text-foreground">
                  {playerNames.get(k.killer_steam_id) ??
                    k.killer_steam_id.slice(-4)}
                </span>
              </span>
            ))}{" "}
          {round.kills_after_plant.filter((k) => k.victim_team === "T")
            .length === 1
            ? "closed it out"
            : "combined on the retake"}
        </div>
      )}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
export const AfterplantTab = ({
  afterplantRounds,
  playerStats,
  teams
}: AfterplantTabProps) => {
  const [openRound, setOpenRound] = useState<number | null>(null);
  const [situationTeam, setSituationTeam] = useState<0 | 1>(0);

  const teamList = useMemo(
    () => orderMatchParticipantsBySideHomeLeft(Object.values(teams)),
    [teams]
  );
  const teamA = teamList[0];
  const teamB = teamList[1];

  const playerNames = useMemo(() => {
    const m = new Map<string, string>();
    playerStats.forEach((p) => m.set(p.steam_id, p.nickname));
    return m;
  }, [playerStats]);

  const sorted = useMemo(
    () => [...afterplantRounds].sort((a, b) => a.round_number - b.round_number),
    [afterplantRounds]
  );

  const teamARounds = useMemo(
    () => sorted.filter((r) => r.t_team_id === teamA?.id),
    [sorted, teamA?.id]
  );
  const teamBRounds = useMemo(
    () => sorted.filter((r) => r.t_team_id === teamB?.id),
    [sorted, teamB?.id]
  );

  const teamSummaries = useMemo(
    () =>
      teamList.map((team, i) => {
        const attackRounds = i === 0 ? teamARounds : teamBRounds;
        const defendRounds = i === 0 ? teamBRounds : teamARounds;
        const firstAttack = attackRounds[0];
        return {
          team,
          teamLogo: firstAttack?.t_team_logo ?? null,
          summary: computeTeamAfterplantSummary(attackRounds, defendRounds),
          attackRounds,
          defendRounds
        };
      }),
    [teamList, teamARounds, teamBRounds]
  );

  const activeTeamSummary = teamSummaries[situationTeam];

  // Overview stats
  const overview = useMemo(() => {
    const plants = afterplantRounds.length;
    const held = afterplantRounds.filter((r) =>
      T_WIN_REASONS.includes(r.round_end_reason_info)
    ).length;
    const retaken = plants - held;
    return { plants, held, retaken };
  }, [afterplantRounds]);

  // By site
  const bySite = useMemo(() => {
    const init = () => ({ plants: 0, held: 0 });
    const a = init();
    const b = init();
    for (const r of afterplantRounds) {
      const target = r.plant_site === "A" ? a : b;
      target.plants++;
      if (T_WIN_REASONS.includes(r.round_end_reason_info)) target.held++;
    }
    return { A: a, B: b };
  }, [afterplantRounds]);

  // Retake rounds
  const retakes = useMemo(
    () =>
      afterplantRounds.filter(
        (r) => !T_WIN_REASONS.includes(r.round_end_reason_info)
      ),
    [afterplantRounds]
  );

  if (!sorted.length) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No plant data found for this game.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {teamSummaries.map(({ team, teamLogo, summary }) => (
          <TeamSummaryCard
            key={team.id}
            teamName={team.name}
            teamLogo={teamLogo}
            summary={summary}
          />
        ))}
      </div>

      {(bySite.A.plants > 0 || bySite.B.plants > 0) && (
        <AnalysisCard
          title="Bombsite control"
          sub="Where the bomb was planted and how often it survived to detonation"
          right={
            <Legend
              items={[
                { label: "held", color: BAD_COLOR },
                { label: "retaken", color: GOOD_COLOR }
              ]}
            />
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {bySite.A.plants > 0 && (
              <SiteGauge
                site="A"
                held={bySite.A.held}
                plants={bySite.A.plants}
              />
            )}
            {bySite.B.plants > 0 && (
              <SiteGauge
                site="B"
                held={bySite.B.held}
                plants={bySite.B.plants}
              />
            )}
          </div>
        </AnalysisCard>
      )}

      <AnalysisCard
        title="Situation breakdown"
        sub="Win rate by alive count at plant — afterplants on T-side, retakes on CT-side"
        right={
          teamList.length > 1 ? (
            <div className="flex flex-wrap gap-1.5">
              {teamList.map((team, i) => {
                const teamColor = i === 0 ? TEAM_A_COLOR : TEAM_B_COLOR;
                const isActive = situationTeam === i;
                return (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => setSituationTeam(i as 0 | 1)}
                    className="px-4 py-2.5 sm:px-3 sm:py-1 rounded-full text-xs font-semibold border transition-colors"
                    style={teamToggleStyle(teamColor, isActive)}
                  >
                    {team.name}
                  </button>
                );
              })}
            </div>
          ) : undefined
        }
      >
        {activeTeamSummary && (
          <SituationPanel
            teamName={activeTeamSummary.team.name}
            attackRounds={activeTeamSummary.attackRounds}
            defendRounds={activeTeamSummary.defendRounds}
          />
        )}

        {retakes.length > 0 && (
          <div className="mt-6 pt-6 border-t border-border/30">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">
              The retakes
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              {retakes.length} plant{retakes.length !== 1 ? "s" : ""} taken back
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {retakes.map((r) => {
                const tIsA = r.t_team_id === (teamA?.id ?? 0);
                const ctColor = tIsA ? TEAM_B_COLOR : TEAM_A_COLOR;
                return (
                  <RetakeCard
                    key={r.round_number}
                    round={r}
                    ctName={r.ct_team_name}
                    playerNames={playerNames}
                    ctColor={ctColor}
                  />
                );
              })}
            </div>
          </div>
        )}
      </AnalysisCard>

      {/* After the plant */}
      <AnalysisCard
        title="After the plant"
        sub="Every round the bomb went down — did the plant hold, or did the retake land?"
      >
        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <KpiNum
            value={overview.plants}
            label="Bomb plants"
            sub={`of ${afterplantRounds.length > 0 ? Math.max(overview.plants, afterplantRounds.length) : "—"} rounds`}
          />
          <KpiNum
            value={overview.held}
            unit={`/${overview.plants}`}
            label="Held by planter"
            sub={`${overview.plants > 0 ? Math.round((overview.held / overview.plants) * 100) : 0}% kept the plant`}
            color={BAD_COLOR}
          />
          <KpiNum
            value={overview.retaken}
            unit={`/${overview.plants}`}
            label="Retaken"
            sub={`${overview.plants > 0 ? Math.round((overview.retaken / overview.plants) * 100) : 0}% defused`}
            color={GOOD_COLOR}
          />
        </div>

        {/* Plant ledger */}
        <div className="border-t border-border/30">
          {afterplantRounds.map((r) => {
            // For each round, determine which team was T (planting)
            // We need to figure out team A vs B from ct_team_id / t_team_id
            const tIsA = r.t_team_id === (teamA?.id ?? 0);
            const tColor = tIsA ? TEAM_A_COLOR : TEAM_B_COLOR;
            const ctColor = tIsA ? TEAM_B_COLOR : TEAM_A_COLOR;

            return (
              <PlantRow
                key={r.round_number}
                round={r}
                tName={r.t_team_name}
                playerNames={playerNames}
                isOpen={openRound === r.round_number}
                onToggle={() =>
                  setOpenRound(
                    openRound === r.round_number ? null : r.round_number
                  )
                }
                tColor={tColor}
                ctColor={ctColor}
              />
            );
          })}
        </div>
      </AnalysisCard>
    </div>
  );
};
