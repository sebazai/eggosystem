"use client";

import Link from "next/link";
import { Clock, Crown, Swords } from "lucide-react";
import type { MatchMvp, MatchesByFilters } from "@eggosystem/types";
import { useMatchMvp } from "@/context/MatchMvpContext";
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
import { NextImageFallback } from "@/components/layout/NextImageFallback";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, createAvatarUrl, createTeamLogoUrl } from "@/lib/utils";

interface MatchCardProps {
  match: MatchesByFilters;
  href: string;
  showSeason?: boolean;
  seasonLabel?: string;
}

function formatMvpRating(rating: number): string {
  return rating.toFixed(2);
}

function truncateWithHyphen(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(1, maxLength - 1))}-`;
}

function mvpInitials(nickname: string): string {
  const trimmed = nickname.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

interface SeriesMvpDisplayProps {
  seriesMvp: MatchMvp | null | undefined;
  isLoading: boolean;
  variant: "desktop" | "mobile";
}

const mvpSkeletonClassName = "bg-white/20";

function SeriesMvpSkeleton({ variant }: { variant: "desktop" | "mobile" }) {
  if (variant === "mobile") {
    return (
      <div className="flex min-w-0 items-center gap-1.5" aria-hidden="true">
        <Skeleton
          className={cn("h-3 w-3 shrink-0 rounded-sm", mvpSkeletonClassName)}
        />
        <Skeleton className={cn("h-3 w-8 shrink-0", mvpSkeletonClassName)} />
        <Skeleton className={cn("h-3 w-20 min-w-0", mvpSkeletonClassName)} />
        <Skeleton className={cn("h-3 w-8 shrink-0", mvpSkeletonClassName)} />
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2.5" aria-hidden="true">
      <Skeleton
        className={cn("size-16 shrink-0 rounded-full", mvpSkeletonClassName)}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className={cn("h-4 w-full max-w-28", mvpSkeletonClassName)} />
        <Skeleton className={cn("h-8 w-20 rounded-md", mvpSkeletonClassName)} />
      </div>
    </div>
  );
}

function SeriesMvpEmpty({ variant }: { variant: "desktop" | "mobile" }) {
  if (variant === "mobile") {
    return (
      <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground/50">
        <Crown
          size={12}
          strokeWidth={1.5}
          className="shrink-0 text-kanaliiga-orange/40"
        />
        <span className="uppercase tracking-[0.08em]">MVP</span>
        <span>—</span>
      </span>
    );
  }

  return <p className="font-mono text-[10px] text-muted-foreground/50">—</p>;
}

function SeriesMvpPlayer({
  seriesMvp,
  variant
}: {
  seriesMvp: MatchMvp;
  variant: "desktop" | "mobile";
}) {
  const avatarUrl = seriesMvp.avatar
    ? createAvatarUrl(seriesMvp.avatar) || null
    : null;
  const initials = mvpInitials(seriesMvp.nickname);
  const displayNickname =
    variant === "mobile"
      ? truncateWithHyphen(seriesMvp.nickname, 10)
      : truncateWithHyphen(seriesMvp.nickname, 14);
  const isNicknameTruncated = displayNickname !== seriesMvp.nickname;

  if (variant === "mobile") {
    return (
      <span className="flex min-w-0 items-center gap-1 font-mono text-[10px]">
        <Crown
          size={12}
          strokeWidth={1.5}
          className="shrink-0 text-kanaliiga-orange"
        />
        <span className="shrink-0 uppercase tracking-[0.08em] text-muted-foreground">
          MVP
        </span>
        <span
          className="min-w-0 flex-1 overflow-hidden text-clip whitespace-nowrap font-headings text-xs uppercase text-foreground"
          title={isNicknameTruncated ? seriesMvp.nickname : undefined}
        >
          {displayNickname}
        </span>
        <span className="shrink-0 font-headings text-xs text-kanaliiga-orange">
          {formatMvpRating(seriesMvp.kana_rating)}
        </span>
      </span>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar className="size-16 shrink-0">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={seriesMvp.nickname} />
        ) : null}
        <AvatarFallback className="bg-white/10 font-headings text-base uppercase text-foreground">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p
          className="min-w-0 overflow-hidden text-clip whitespace-nowrap font-headings text-sm uppercase leading-tight text-foreground"
          title={isNicknameTruncated ? seriesMvp.nickname : undefined}
        >
          {displayNickname}
        </p>
        <div className="inline-flex w-fit items-center gap-1.5 rounded-md border border-kanaliiga-orange/35 bg-kanaliiga-orange/10 px-2 py-1 shadow-[0_0_12px_rgba(251,146,60,0.12)]">
          <span className="font-headings text-xl tabular-nums leading-none tracking-tight text-kanaliiga-orange">
            {formatMvpRating(seriesMvp.kana_rating)}
          </span>
          <span className="font-mono text-[7px] uppercase leading-[1.15] tracking-[0.14em] text-kanaliiga-orange/65">
            Kana
            <br />
            rating
          </span>
        </div>
      </div>
    </div>
  );
}

function SeriesMvpDisplay({
  seriesMvp,
  isLoading,
  variant
}: SeriesMvpDisplayProps) {
  if (isLoading) {
    return <SeriesMvpSkeleton variant={variant} />;
  }

  if (!seriesMvp) {
    return <SeriesMvpEmpty variant={variant} />;
  }

  return <SeriesMvpPlayer seriesMvp={seriesMvp} variant={variant} />;
}

export function MatchCard({
  match,
  href,
  showSeason,
  seasonLabel
}: MatchCardProps) {
  const { seriesMvp, isMvpLoading, visibilityRef } = useMatchMvp(
    match.match_id
  );
  const tierColor = leagueColor(match.league_name).color;

  const { home_team: home, away_team: away } = match;

  const homeWins = home.score > away.score;
  const awayWins = away.score > home.score;
  const hasSeriesWinner = homeWins || awayWins;

  function seriesScoreClass(isWinner: boolean): string {
    if (!hasSeriesWinner) return "text-foreground";
    return isWinner ? "text-kanaliiga-orange" : "text-muted-foreground";
  }

  function mapWinner(
    map: MatchesByFilters["maps_json"][number]
  ): "home" | "away" | "draw" {
    if (map.home_score > map.away_score) return "home";
    if (map.away_score > map.home_score) return "away";
    return "draw";
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

  function renderMapChips(compact?: boolean) {
    if (match.maps_json.length === 0) return null;
    return match.maps_json.map((map, i) => (
      <MapScoreChip
        key={i}
        map={map}
        winner={mapWinner(map)}
        compact={compact}
      />
    ));
  }

  return (
    <Link
      ref={visibilityRef}
      href={href}
      className="block w-full min-w-0 no-underline"
    >
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
                {home.name}
              </span>
              <NextImageFallback
                src={createTeamLogoUrl(home.logo ?? "")}
                alt={home.name}
                width={40}
                height={40}
                className="h-10 w-10 flex-shrink-0 object-contain"
              />
            </div>

            <div className="flex items-center px-2 font-headings text-[30px] leading-none">
              <span className={seriesScoreClass(homeWins)}>{home.score}</span>
              <span className="mx-1 text-xl opacity-30">—</span>
              <span className={seriesScoreClass(awayWins)}>{away.score}</span>
            </div>

            <div className="flex items-center justify-start gap-2">
              <NextImageFallback
                src={createTeamLogoUrl(away.logo ?? "")}
                alt={away.name}
                width={40}
                height={40}
                className="h-10 w-10 flex-shrink-0 object-contain"
              />
              <span className="font-headings text-base">{away.name}</span>
            </div>
          </div>

          {match.maps_json.length > 0 && (
            <div className="mt-2 flex flex-wrap justify-center gap-1.5 border-t border-dashed border-white/8 pt-2">
              {renderMapChips()}
            </div>
          )}
        </div>

        {/* Col 4: MVP + action */}
        <div className="flex min-h-0 flex-col border-l border-white/8 px-3 py-2.5">
          <div className="shrink-0 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
            MVP
          </div>
          <div className="flex flex-1 items-center py-1">
            <SeriesMvpDisplay
              seriesMvp={seriesMvp}
              isLoading={isMvpLoading}
              variant="desktop"
            />
          </div>
          <span className="inline-block w-fit shrink-0 rounded border border-white/16 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:border-white/30 hover:text-foreground">
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
                {home.name}
              </span>
              <NextImageFallback
                src={createTeamLogoUrl(home.logo ?? "")}
                alt={home.name}
                width={32}
                height={32}
                className="h-8 w-8 flex-shrink-0 object-contain"
              />
            </div>

            <div className="flex items-center px-2 font-headings text-[2rem] leading-none">
              <span className={seriesScoreClass(homeWins)}>{home.score}</span>
              <span className="mx-1 text-xl opacity-30">—</span>
              <span className={seriesScoreClass(awayWins)}>{away.score}</span>
            </div>

            <div className="flex items-center justify-start gap-2">
              <NextImageFallback
                src={createTeamLogoUrl(away.logo ?? "")}
                alt={away.name}
                width={32}
                height={32}
                className="h-8 w-8 flex-shrink-0 object-contain"
              />
              <span className="font-headings text-base">{away.name}</span>
            </div>
          </div>

          {match.maps_json.length > 0 && (
            <div className="mt-2 flex flex-wrap justify-center gap-1.5 border-t border-dashed border-white/8 pt-2">
              {renderMapChips()}
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
                src={createTeamLogoUrl(home.logo ?? "")}
                alt={home.name}
                width={32}
                height={32}
                className="h-8 w-8 flex-shrink-0 object-contain"
              />
              <span className="break-words font-headings text-sm leading-tight">
                {home.name}
              </span>
            </div>

            <div className="flex items-center px-1 font-headings text-[1.75rem] leading-none">
              <span className={seriesScoreClass(homeWins)}>{home.score}</span>
              <span className="mx-1 text-lg opacity-30">—</span>
              <span className={seriesScoreClass(awayWins)}>{away.score}</span>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <NextImageFallback
                src={createTeamLogoUrl(away.logo ?? "")}
                alt={away.name}
                width={32}
                height={32}
                className="h-8 w-8 flex-shrink-0 object-contain"
              />
              <span className="break-words text-right font-headings text-sm leading-tight">
                {away.name}
              </span>
            </div>
          </div>

          {match.maps_json.length > 0 && (
            <div className="flex flex-wrap gap-1 border-t border-dashed border-white/8 pt-1">
              {renderMapChips(true)}
            </div>
          )}

          {/* Mobile footer: MVP + recap link */}
          <div className="flex items-center justify-between border-t border-white/8 pt-2">
            <SeriesMvpDisplay
              seriesMvp={seriesMvp}
              isLoading={isMvpLoading}
              variant="mobile"
            />
            <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-kanaliiga-orange">
              Recap →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
