"use client";

import React, { useMemo } from "react";
import { orderMatchParticipantsBySideHomeLeft } from "@/lib/order-match-teams-home-left-away";
import { useFlashMatrix } from "@/hooks/data/useFlashMatrix";
import { useSetupPairs } from "@/hooks/data/useSetupPairs";
import { useWastedUtility } from "@/hooks/data/useWastedUtility";
import { useRoundUtilitySummary } from "@/hooks/data/useRoundUtilitySummary";
import { TableSkeleton } from "@/components/loading";
import {
  AnalysisCard,
  VersusStat,
  MiniBar,
  Legend,
  TeamDot,
  BAD_COLOR,
  TEAM_A_COLOR,
  TEAM_B_COLOR
} from "./AnalysisVizComponents";
import type { MatchInfo, MatchPlayerStats } from "@eggosystem/types";

interface SupportUtilityTabProps {
  matchGameId: number;
  playerStats: MatchPlayerStats[];
  teams: MatchInfo["teams"];
}

const UTIL_LABELS: Record<string, string> = {
  flashbang: "Flashbang",
  smoke_grenade: "Smoke",
  he_grenade: "HE Grenade",
  molotov: "Molotov",
  incgrenade: "Molotov"
};

/* ─── Flash row (diverging leaderboard) ─────────────────────────── */
function FlashRow({
  name,
  enemyFlashes,
  teammateFlashes,
  scaleMax,
  teamColor
}: {
  name: string;
  enemyFlashes: number;
  teammateFlashes: number;
  scaleMax: number;
  teamColor: string;
}) {
  const enemyPct = scaleMax === 0 ? 0 : (enemyFlashes / scaleMax) * 100;
  const matePct = scaleMax === 0 ? 0 : (teammateFlashes / scaleMax) * 100;

  return (
    <div
      className="grid items-center gap-2 py-2 border-b border-border/20 last:border-0"
      style={{ gridTemplateColumns: "minmax(0, 2fr) 2rem 1fr 1fr 2rem" }}
    >
      {/* Name */}
      <div className="flex items-center gap-1.5 min-w-0">
        <TeamDot color={teamColor} size={7} />
        <span className="text-xs font-semibold truncate">{name}</span>
      </div>
      {/* Teammate count (bad if high) */}
      <span
        className="text-xs font-bold tabular-nums text-right"
        style={{
          color: teammateFlashes >= 2 ? BAD_COLOR : "var(--muted-foreground)"
        }}
      >
        {teammateFlashes}
      </span>
      {/* Teammate bar ← (grows left from center) */}
      <div className="flex justify-end h-2.5">
        <div
          style={{
            width: `${matePct}%`,
            background: BAD_COLOR,
            opacity: 0.7,
            borderRadius: "9999px 2px 2px 9999px",
            minWidth: teammateFlashes > 0 ? 3 : 0
          }}
        />
      </div>
      {/* Enemy bar → (grows right from center) */}
      <div className="flex justify-start h-2.5">
        <div
          style={{
            width: `${enemyPct}%`,
            background: teamColor,
            opacity: 0.85,
            borderRadius: "2px 9999px 9999px 2px",
            minWidth: enemyFlashes > 0 ? 3 : 0
          }}
        />
      </div>
      {/* Enemy count */}
      <span
        className="text-xs font-bold tabular-nums"
        style={{ color: teamColor }}
      >
        {enemyFlashes}
      </span>
    </div>
  );
}

/* ─── Setup pair row ─────────────────────────────────────────────── */
function SetupRow({
  setupName,
  benefName,
  type,
  count,
  maxCount,
  avgSec,
  color
}: {
  setupName: string;
  benefName: string;
  type: string;
  count: number;
  maxCount: number;
  avgSec: number;
  color: string;
}) {
  const typeBadge = type === "flash" ? "flash" : "util";
  const typeColor =
    type === "flash" ? "var(--analysis-team-b)" : "var(--kanaliiga-orange)";

  return (
    <div
      className="grid items-center gap-2 py-2 border-b border-border/20 last:border-0"
      style={{ gridTemplateColumns: "1fr 56px 96px" }}
    >
      <div className="flex items-center gap-1.5 min-w-0 text-xs">
        <span className="font-bold" style={{ color }}>
          {setupName}
        </span>
        <span className="text-muted-foreground/50">→</span>
        <span className="text-muted-foreground">{benefName}</span>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded border ml-1 shrink-0"
          style={{
            borderColor: `color-mix(in oklab, ${typeColor} 50%, transparent)`,
            color: typeColor
          }}
        >
          {typeBadge}
        </span>
      </div>
      {/* Dot bar */}
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxCount }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: 9999,
              background: i < count ? color : "var(--muted)",
              flexShrink: 0
            }}
          />
        ))}
      </div>
      {/* Time delta */}
      <span className="text-[10px] text-muted-foreground/60 text-right tabular-nums">
        ~{avgSec.toFixed(1)}s after
      </span>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
export const SupportUtilityTab = ({
  matchGameId,
  playerStats,
  teams
}: SupportUtilityTabProps) => {
  const { playerStats: flashStats, isLoading: isLoadingFlash } =
    useFlashMatrix(matchGameId);
  const { setupPairs, isLoading: isLoadingSetup } = useSetupPairs(matchGameId);
  const { wastedUtility, isLoading: isLoadingWasted } =
    useWastedUtility(matchGameId);
  const { roundUtility, isLoading: isLoadingRoundUtil } =
    useRoundUtilitySummary(matchGameId);

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

  // Team flash totals
  const flashTeams = useMemo(() => {
    const a = { enemy: 0, thrown: 0 };
    const b = { enemy: 0, thrown: 0 };
    for (const f of flashStats) {
      const teamId = playerStats.find(
        (p) => p.steam_id === f.steam_id
      )?.team_id;
      if (teamId === teamAId) {
        a.enemy += f.enemy_flashes;
        a.thrown += f.total_flashes;
      } else if (teamId === teamBId) {
        b.enemy += f.enemy_flashes;
        b.thrown += f.total_flashes;
      }
    }
    return { a, b };
  }, [flashStats, playerStats, teamAId, teamBId]);

  const flashSorted = useMemo(
    () => [...flashStats].sort((x, y) => y.enemy_flashes - x.enemy_flashes),
    [flashStats]
  );
  const fScale = flashSorted[0]?.enemy_flashes ?? 1;

  // Setup pair stats
  const setupTeamA = useMemo(
    () =>
      setupPairs
        .filter(
          (s) =>
            playerStats.find((p) => p.steam_id === s.setup_player_steam_id)
              ?.team_id === teamAId
        )
        .reduce((s, p) => s + p.count, 0),
    [setupPairs, playerStats, teamAId]
  );
  const setupTeamB = useMemo(
    () =>
      setupPairs
        .filter(
          (s) =>
            playerStats.find((p) => p.steam_id === s.setup_player_steam_id)
              ?.team_id === teamBId
        )
        .reduce((s, p) => s + p.count, 0),
    [setupPairs, playerStats, teamBId]
  );

  const topSetups = useMemo(
    () =>
      [...setupPairs]
        .sort(
          (a, b) =>
            b.count - a.count ||
            a.avg_seconds_after_setup - b.avg_seconds_after_setup
        )
        .slice(0, 8),
    [setupPairs]
  );
  const maxSetup = topSetups[0]?.count ?? 1;

  // Wasted utility by type
  const wastedByType = useMemo(() => {
    const m = new Map<string, number>();
    for (const w of wastedUtility) {
      const key = UTIL_LABELS[w.utility_type] ?? w.utility_type;
      m.set(key, (m.get(key) ?? 0) + w.count);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [wastedUtility]);
  const wMax = wastedByType[0]?.[1] ?? 1;
  const wTotal = wastedByType.reduce((s, [, n]) => s + n, 0);

  // Per-team smoke + utility-damage totals derived from round-level rows
  const { smokesA, smokesB, utilDmgA, utilDmgB } = useMemo(() => {
    let sA = 0,
      sB = 0,
      dA = 0,
      dB = 0;
    for (const r of roundUtility) {
      const teamId = playerStats.find(
        (p) => p.steam_id === r.steam_id
      )?.team_id;
      if (teamId === teamAId) {
        sA += r.smokes_thrown;
        dA += r.utility_damage;
      } else if (teamId === teamBId) {
        sB += r.smokes_thrown;
        dB += r.utility_damage;
      }
    }
    return { smokesA: sA, smokesB: sB, utilDmgA: dA, utilDmgB: dB };
  }, [roundUtility, playerStats, teamAId, teamBId]);

  const utilDmgByPlayer = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of roundUtility) {
      if (r.utility_damage > 0)
        m.set(r.steam_id, (m.get(r.steam_id) ?? 0) + r.utility_damage);
    }
    return [...m.entries()]
      .map(([steamId, dmg]) => ({ steamId, dmg }))
      .sort((a, b) => b.dmg - a.dmg);
  }, [roundUtility]);

  const utilDmgMax = utilDmgByPlayer[0]?.dmg ?? 1;

  if (
    isLoadingFlash ||
    isLoadingSetup ||
    isLoadingWasted ||
    isLoadingRoundUtil
  ) {
    return <TableSkeleton rows={6} />;
  }

  return (
    <div className="flex flex-col gap-3.5">
      {/* Flash impact */}
      <AnalysisCard
        title="Flash impact"
        sub="Every flash either blinds an enemy (useful) or a teammate (wasted)"
        right={
          <Legend
            items={[
              { label: "teammates blinded", color: BAD_COLOR },
              { label: "enemies blinded", color: "var(--muted-foreground)" }
            ]}
          />
        }
      >
        <div className="flex flex-col gap-4 mb-4 pb-4 border-b border-border/30">
          <VersusStat
            label="Enemies blinded"
            aVal={flashTeams.a.enemy}
            bVal={flashTeams.b.enemy}
            mode="share"
          />
          <VersusStat
            label="Flashes thrown"
            aVal={flashTeams.a.thrown}
            bVal={flashTeams.b.thrown}
            mode="share"
          />
        </div>

        {/* Diverging leaderboard header */}
        <div
          className="grid text-[10px] text-muted-foreground/50 pb-1 mb-1 border-b border-border/20"
          style={{ gridTemplateColumns: "minmax(0, 2fr) 2rem 1fr 1fr 2rem" }}
        >
          <span />
          <span className="text-right" style={{ gridColumn: "span 2" }}>
            mates◄
          </span>
          <span style={{ gridColumn: "span 2" }}>►enemy</span>
        </div>
        {flashSorted.map((f) => {
          const teamId = playerStats.find(
            (p) => p.steam_id === f.steam_id
          )?.team_id;
          const color = teamId === teamAId ? TEAM_A_COLOR : TEAM_B_COLOR;
          return (
            <FlashRow
              key={f.steam_id}
              name={playerNames.get(f.steam_id) ?? f.steam_id.slice(-4)}
              enemyFlashes={f.enemy_flashes}
              teammateFlashes={f.teammate_flashes}
              scaleMax={fScale}
              teamColor={color}
            />
          );
        })}
      </AnalysisCard>

      {/* Grenade impact — smokes + utility damage */}
      <AnalysisCard
        title="Grenade impact"
        sub="Smokes deployed and HE / molotov damage dealt across all rounds"
        right={
          <span className="text-xs text-muted-foreground/60 tabular-nums">
            {utilDmgA + utilDmgB} dmg total
          </span>
        }
      >
        <div className="flex flex-col gap-4 mb-4 pb-4 border-b border-border/30">
          <VersusStat
            label="Smokes thrown"
            aVal={smokesA}
            bVal={smokesB}
            mode="share"
          />
          <VersusStat
            label="Utility damage"
            aVal={utilDmgA}
            bVal={utilDmgB}
            mode="share"
          />
        </div>

        {utilDmgByPlayer.length === 0 ? (
          <div className="text-sm text-muted-foreground/60 py-2">
            No utility damage recorded.
          </div>
        ) : (
          <>
            <div
              className="grid text-[10px] text-muted-foreground/50 pb-1 mb-1 border-b border-border/20"
              style={{ gridTemplateColumns: "minmax(0, 2fr) 1fr 2.5rem" }}
            >
              <span>Player</span>
              <span />
              <span className="text-right">Dmg</span>
            </div>
            {utilDmgByPlayer.map(({ steamId, dmg }) => {
              const teamId = playerStats.find(
                (p) => p.steam_id === steamId
              )?.team_id;
              const color = teamId === teamAId ? TEAM_A_COLOR : TEAM_B_COLOR;
              return (
                <div
                  key={steamId}
                  className="grid items-center gap-2 py-2 border-b border-border/20 last:border-0"
                  style={{ gridTemplateColumns: "minmax(0, 2fr) 1fr 2.5rem" }}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <TeamDot color={color} size={7} />
                    <span className="text-xs font-semibold truncate">
                      {playerNames.get(steamId) ?? steamId.slice(-4)}
                    </span>
                  </div>
                  <MiniBar
                    value={dmg}
                    max={utilDmgMax}
                    color={color}
                    height={9}
                  />
                  <span
                    className="text-xs font-bold tabular-nums text-right"
                    style={{ color }}
                  >
                    {dmg}
                  </span>
                </div>
              );
            })}
          </>
        )}
      </AnalysisCard>

      {/* Setups that became kills */}
      <AnalysisCard
        title="Setups that became kills"
        sub="Utility or flash that set a teammate up for a kill within seconds"
        right={
          <span className="text-xs text-muted-foreground/60 tabular-nums">
            {setupTeamA + setupTeamB} total
          </span>
        }
      >
        <div className="mb-4">
          <VersusStat
            label="Setup-assisted kills created"
            aVal={setupTeamA}
            bVal={setupTeamB}
            mode="share"
          />
        </div>
        {topSetups.length === 0 ? (
          <div className="text-sm text-muted-foreground/60 py-2">
            No setup pairs recorded.
          </div>
        ) : (
          topSetups.map((s, i) => {
            const setupTeamId = playerStats.find(
              (p) => p.steam_id === s.setup_player_steam_id
            )?.team_id;
            const color = setupTeamId === teamAId ? TEAM_A_COLOR : TEAM_B_COLOR;
            return (
              <SetupRow
                key={i}
                setupName={
                  playerNames.get(s.setup_player_steam_id) ??
                  s.setup_player_steam_id.slice(-4)
                }
                benefName={
                  playerNames.get(s.beneficiary_steam_id) ??
                  s.beneficiary_steam_id.slice(-4)
                }
                type={s.setup_type}
                count={s.count}
                maxCount={maxSetup}
                avgSec={s.avg_seconds_after_setup}
                color={color}
              />
            );
          })
        )}
      </AnalysisCard>

      {/* Wasted utility */}
      <AnalysisCard
        title="Wasted utility"
        sub={`Grenades that did no damage and blinded no one — ${wTotal} total`}
      >
        {wastedByType.length === 0 ? (
          <div className="text-sm text-muted-foreground/60 py-2">
            No wasted utility recorded.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {wastedByType.map(([type, n]) => (
              <div
                key={type}
                className="grid items-center gap-3"
                style={{ gridTemplateColumns: "minmax(0, 1.5fr) 1fr 2rem" }}
              >
                <span className="text-xs text-muted-foreground">{type}</span>
                <MiniBar
                  value={n}
                  max={wMax}
                  color="var(--muted-foreground)"
                  height={9}
                />
                <span className="text-sm font-bold text-foreground text-right tabular-nums">
                  {n}
                </span>
              </div>
            ))}
          </div>
        )}
      </AnalysisCard>
    </div>
  );
};
