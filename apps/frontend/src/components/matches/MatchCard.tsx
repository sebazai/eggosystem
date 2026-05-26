"use client";

import Link from "next/link";
import { Clock, Crown, Swords } from "lucide-react";
import type { MatchesByFilters } from "@eggosystem/types";
import { DivisionPill } from "./DivisionPill";
import { SeasonChip } from "./SeasonChip";
import { MetaPill } from "./MetaPill";
import { MapScoreChip } from "./MapScoreChip";
import { leagueColor } from "@/lib/matches/tiers";
import {
  stageLabel,
  stageKicker,
  durationLabel,
  matchDurationMinutes
} from "@/lib/matches/format";
import { dualTeamRowToHomeLeftDisplay } from "@/lib/order-match-teams-home-left-away";
import { NextImageFallback } from "@/components/layout/NextImageFallback";
import { createTeamLogoUrl } from "@/lib/utils";

interface MatchCardProps {
  match: MatchesByFilters;
  href: string;
  showSeason?: boolean;
  seasonLabel?: string;
}

export function MatchCard({
  match,
  href,
  showSeason,
  seasonLabel
}: MatchCardProps) {
  const tierColor = leagueColor(match.league_name).color;

  const { left, right } = dualTeamRowToHomeLeftDisplay({
    team1_side: match.team1_side,
    team2_side: match.team2_side,
    team1_name: match.team1_name,
    team2_name: match.team2_name,
    team1_logo: match.team1_logo,
    team2_logo: match.team2_logo,
    team1_score: match.team1_score,
    team2_score: match.team2_score
  });

  const leftWins = left.score > right.score;
  const rightWins = right.score > left.score;
  const hasSeriesWinner = leftWins || rightWins;

  function seriesScoreClass(isWinner: boolean): string {
    if (!hasSeriesWinner) return "text-foreground";
    return isWinner ? "text-kanaliiga-orange" : "text-muted-foreground";
  }

  const durationMinutes = matchDurationMinutes(
    match.start_timestamp,
    match.end_timestamp
  );
  const kicker = stageKicker(match.stage);
  const stage = stageLabel({
    stage: match.stage,
    match_group: match.match_group,
    match_round: match.match_round
  });
  const format = match.best_of ? `Bo${match.best_of}` : null;

  return (
    <Link href={href} className="block w-full min-w-0 no-underline">
      {/* Desktop */}
      <div className="mb-2 hidden overflow-hidden rounded-xl border border-white/8 bg-white/5 transition-colors duration-200 hover:bg-white/[0.07] lg:grid lg:grid-cols-[6px_240px_1fr_220px]">
        {/* Col 1: Tier stripe */}
        <div className="h-full" style={{ backgroundColor: tierColor }} />

        {/* Col 2: Meta */}
        <div className="flex flex-col gap-1.5 border-r border-white/8 px-4 py-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <DivisionPill leagueName={match.league_name} />
            {showSeason && seasonLabel && <SeasonChip label={seasonLabel} />}
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {kicker}
          </p>
          {stage ? (
            <p className="font-headings text-sm text-foreground">{stage}</p>
          ) : null}
          <div className="mt-1 flex flex-wrap gap-3">
            {durationMinutes !== null && (
              <MetaPill icon={Clock} label={durationLabel(durationMinutes)} />
            )}
            {format && <MetaPill icon={Swords} label={format} />}
          </div>
        </div>

        {/* Col 3: Teams + score */}
        <div className="flex flex-col justify-center px-4 py-3">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="flex items-center justify-end gap-2">
              <span className="font-headings text-base text-right">
                {left.name}
              </span>
              <NextImageFallback
                src={createTeamLogoUrl(left.logo ?? "")}
                alt={left.name}
                width={40}
                height={40}
                className="h-10 w-10 flex-shrink-0 object-contain"
              />
            </div>

            <div className="flex items-center px-2 font-headings text-[30px] leading-none">
              <span className={seriesScoreClass(leftWins)}>{left.score}</span>
              <span className="mx-1 text-xl opacity-30">—</span>
              <span className={seriesScoreClass(rightWins)}>{right.score}</span>
            </div>

            <div className="flex items-center justify-start gap-2">
              <NextImageFallback
                src={createTeamLogoUrl(right.logo ?? "")}
                alt={right.name}
                width={40}
                height={40}
                className="h-10 w-10 flex-shrink-0 object-contain"
              />
              <span className="font-headings text-base">{right.name}</span>
            </div>
          </div>

          {match.maps_json.length > 0 && (
            <div className="mt-2 flex flex-wrap justify-center gap-1.5 border-t border-dashed border-white/8 pt-2">
              {match.maps_json.map((map, i) => {
                const winner =
                  map.score_a > map.score_b
                    ? "a"
                    : map.score_b > map.score_a
                      ? "b"
                      : "draw";
                return <MapScoreChip key={i} map={map} winner={winner} />;
              })}
            </div>
          )}
        </div>

        {/* Col 4: MVP + action (graceful degrade — no MVP data in API yet) */}
        <div className="flex flex-col justify-between border-l border-white/8 px-4 py-3">
          <div>
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
              Series MVP
            </p>
            {/* MVP player data unavailable — backend work required */}
            <p className="font-mono text-[10px] text-muted-foreground/50">—</p>
          </div>
          <span className="mt-3 inline-block rounded border border-white/16 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:border-white/30 hover:text-foreground">
            Match Recap →
          </span>
        </div>
      </div>

      {/* Tablet (md–lg): 3-column without MVP column */}
      <div className="mb-2 hidden overflow-hidden rounded-xl border border-white/8 bg-white/5 transition-colors duration-200 hover:bg-white/[0.07] md:grid md:grid-cols-[6px_240px_1fr] lg:hidden">
        <div className="h-full" style={{ backgroundColor: tierColor }} />

        <div className="flex flex-col gap-1.5 border-r border-white/8 px-4 py-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <DivisionPill leagueName={match.league_name} />
            {showSeason && seasonLabel && <SeasonChip label={seasonLabel} />}
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {kicker}
          </p>
          {stage ? (
            <p className="font-headings text-sm text-foreground">{stage}</p>
          ) : null}
          <div className="mt-1 flex flex-wrap gap-3">
            {durationMinutes !== null && (
              <MetaPill icon={Clock} label={durationLabel(durationMinutes)} />
            )}
            {format && <MetaPill icon={Swords} label={format} />}
          </div>
        </div>

        <div className="flex flex-col justify-center px-4 py-3">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="flex items-center justify-end gap-2">
              <span className="font-headings text-base text-right">
                {left.name}
              </span>
              <NextImageFallback
                src={createTeamLogoUrl(left.logo ?? "")}
                alt={left.name}
                width={32}
                height={32}
                className="h-8 w-8 flex-shrink-0 object-contain"
              />
            </div>

            <div className="flex items-center px-2 font-headings text-[2rem] leading-none">
              <span className={seriesScoreClass(leftWins)}>{left.score}</span>
              <span className="mx-1 text-xl opacity-30">—</span>
              <span className={seriesScoreClass(rightWins)}>{right.score}</span>
            </div>

            <div className="flex items-center justify-start gap-2">
              <NextImageFallback
                src={createTeamLogoUrl(right.logo ?? "")}
                alt={right.name}
                width={32}
                height={32}
                className="h-8 w-8 flex-shrink-0 object-contain"
              />
              <span className="font-headings text-base">{right.name}</span>
            </div>
          </div>

          {match.maps_json.length > 0 && (
            <div className="mt-2 flex flex-wrap justify-center gap-1.5 border-t border-dashed border-white/8 pt-2">
              {match.maps_json.map((map, i) => {
                const winner =
                  map.score_a > map.score_b
                    ? "a"
                    : map.score_b > map.score_a
                      ? "b"
                      : "draw";
                return <MapScoreChip key={i} map={map} winner={winner} />;
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mobile */}
      <div
        className="mb-2 overflow-hidden rounded-xl border border-white/8 bg-white/5 transition-colors duration-200 hover:bg-white/[0.07] md:hidden"
        style={{ borderLeftColor: tierColor, borderLeftWidth: "4px" }}
      >
        <div className="flex flex-col gap-2 px-3 py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1">
              <DivisionPill leagueName={match.league_name} compact />
              {showSeason && seasonLabel && (
                <SeasonChip label={seasonLabel} mini />
              )}
            </div>
            {stage ? (
              <span className="shrink-0 text-right font-mono text-[9px] text-muted-foreground">
                {stage}
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-1.5">
            <div className="flex flex-col items-start gap-1.5">
              <NextImageFallback
                src={createTeamLogoUrl(left.logo ?? "")}
                alt={left.name}
                width={32}
                height={32}
                className="h-8 w-8 flex-shrink-0 object-contain"
              />
              <span className="break-words font-headings text-sm leading-tight">
                {left.name}
              </span>
            </div>

            <div className="flex items-center px-1 font-headings text-[1.75rem] leading-none">
              <span className={seriesScoreClass(leftWins)}>{left.score}</span>
              <span className="mx-1 text-lg opacity-30">—</span>
              <span className={seriesScoreClass(rightWins)}>{right.score}</span>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <NextImageFallback
                src={createTeamLogoUrl(right.logo ?? "")}
                alt={right.name}
                width={32}
                height={32}
                className="h-8 w-8 flex-shrink-0 object-contain"
              />
              <span className="break-words text-right font-headings text-sm leading-tight">
                {right.name}
              </span>
            </div>
          </div>

          {match.maps_json.length > 0 && (
            <div className="flex flex-wrap gap-1 border-t border-dashed border-white/8 pt-1">
              {match.maps_json.map((map, i) => {
                const winner =
                  map.score_a > map.score_b
                    ? "a"
                    : map.score_b > map.score_a
                      ? "b"
                      : "draw";
                return (
                  <MapScoreChip key={i} map={map} winner={winner} compact />
                );
              })}
            </div>
          )}

          {/* Mobile footer: MVP (unavailable) + recap link */}
          <div className="flex items-center justify-between border-t border-white/8 pt-2">
            <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground/50">
              <Crown
                size={12}
                strokeWidth={1.5}
                className="text-kanaliiga-orange/40"
              />
              —
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-kanaliiga-orange">
              Recap →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
