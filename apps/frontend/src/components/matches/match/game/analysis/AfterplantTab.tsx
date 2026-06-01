"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
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
  RoundEndReasonInfo,
  type MatchGameAfterplantRound,
  type MatchInfo,
  type MatchPlayerStats
} from "@eggosystem/types";

interface AfterplantTabProps {
  afterplantRounds: MatchGameAfterplantRound[];
  playerStats: MatchPlayerStats[];
  teams: MatchInfo["teams"];
}

const T_WIN_REASONS: RoundEndReasonInfo[] = [
  RoundEndReasonInfo.TargetBombed,
  RoundEndReasonInfo.T_Win
];

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
function OutcomeChip({ held, color }: { held: boolean; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
      style={{
        background: `color-mix(in oklab, ${color} 18%, transparent)`,
        color,
        border: `1px solid color-mix(in oklab, ${color} 30%, transparent)`
      }}
    >
      {held ? "■ Held" : "▲ Retaken"}
    </span>
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
  const tWon = T_WIN_REASONS.includes(round.round_end_reason_info);
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
          {/* Round number */}
          <span className="text-xs font-bold text-muted-foreground tabular-nums">
            R{round.round_number}
          </span>
          {/* Site badge */}
          <SiteBadge site={round.plant_site} />
          {/* Details */}
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
          {/* Outcome */}
          <OutcomeChip held={tWon} color={tWon ? tColor : ctColor} />
        </div>
      </button>

      {/* Expanded kill list */}
      {isOpen &&
        round.kills_after_plant &&
        round.kills_after_plant.length > 0 && (
          <div className="pb-3 pl-14 flex flex-col gap-1.5">
            <div className="text-[10px] text-muted-foreground/50 uppercase tracking-wide mb-1">
              Post-plant kills
            </div>
            {round.kills_after_plant.map((k, i) => {
              const killerTeam = k.victim_team === "CT" ? "T" : "CT";
              const killerColor = killerTeam === "T" ? tColor : ctColor;
              const victimColor = k.victim_team === "CT" ? ctColor : tColor;
              return (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground/40 tabular-nums w-10 shrink-0">
                    {k.time_in_round.toFixed(0)}s
                  </span>
                  <span
                    className="font-semibold"
                    style={{ color: killerColor }}
                  >
                    {playerNames.get(k.killer_steam_id) ??
                      k.killer_steam_id.slice(-4)}
                  </span>
                  <span className="text-muted-foreground/40">→</span>
                  <span style={{ color: victimColor }}>
                    {playerNames.get(k.victim_steam_id) ??
                      k.victim_steam_id.slice(-4)}
                  </span>
                  {k.is_traded && (
                    <span className="text-[10px] px-1 rounded bg-muted/60 text-muted-foreground/60 ml-1">
                      traded
                    </span>
                  )}
                </div>
              );
            })}
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

  const [teamA] = useMemo(() => {
    const list = orderMatchParticipantsBySideHomeLeft(Object.values(teams));
    return [list[0], list[1]] as const;
  }, [teams]);

  const playerNames = useMemo(() => {
    const m = new Map<string, string>();
    playerStats.forEach((p) => m.set(p.steam_id, p.nickname));
    return m;
  }, [playerStats]);

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

  return (
    <div className="flex flex-col gap-3.5">
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

      {/* Bombsite control */}
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

      {/* Retake highlights */}
      {retakes.length > 0 && (
        <AnalysisCard
          title="The retakes"
          sub={`${retakes.length} plant${retakes.length !== 1 ? "s" : ""} taken back`}
        >
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
        </AnalysisCard>
      )}
    </div>
  );
};
