"use client";

import React, { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { NextImageFallback } from "@/components/layout/NextImageFallback";
import { createTeamLogoUrl, cn } from "@/lib/utils";
import {
  RoundEndReasonInfo,
  type AfterplantKillEvent,
  type MatchGameAfterplantRound,
  type MatchInfo,
  type MatchPlayerStats
} from "@eggosystem/types";

/* ─────────────────────────────────────────── */
/*  Types & constants                          */
/* ─────────────────────────────────────────── */

interface AfterplantTabProps {
  afterplantRounds: MatchGameAfterplantRound[];
  playerStats: MatchPlayerStats[];
  teams: MatchInfo["teams"];
}

const T_WIN_REASONS: RoundEndReasonInfo[] = [
  RoundEndReasonInfo.TargetBombed,
  RoundEndReasonInfo.T_Win
];

const winPct = (won: number, total: number) =>
  total > 0 ? Math.round((won / total) * 100) : 0;

const winColor = (pct: number) =>
  pct >= 60
    ? "text-green-400/80"
    : pct >= 40
      ? "text-yellow-200/80"
      : "text-red-300/80";

const barColor = (pct: number) =>
  pct >= 60
    ? "bg-green-300/50"
    : pct >= 40
      ? "bg-yellow-200/45"
      : "bg-red-300/50";

/* ─────────────────────────────────────────── */
/*  Mini win progress bar                      */
/* ─────────────────────────────────────────── */

const WinBar = ({
  pct,
  label,
  won,
  total
}: {
  pct: number;
  label: string;
  won: number;
  total: number;
}) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-bold", winColor(pct))}>
        {pct}%{" "}
        <span className="text-muted-foreground font-normal">
          ({won}/{total})
        </span>
      </span>
    </div>
    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className={cn("h-full rounded-full", barColor(pct))}
        style={{ width: `${pct}%` }}
      />
    </div>
  </div>
);

/* ─────────────────────────────────────────── */
/*  Summary cards (one per team)               */
/* ─────────────────────────────────────────── */

const TeamSummaryCard = ({
  teamName,
  teamLogo,
  attackRounds,
  defendRounds
}: {
  teamName: string;
  teamLogo: string | null;
  attackRounds: MatchGameAfterplantRound[];
  defendRounds: MatchGameAfterplantRound[];
}) => {
  const atkWon = attackRounds.filter((r) =>
    T_WIN_REASONS.includes(r.round_end_reason_info)
  ).length;
  const atkPct = winPct(atkWon, attackRounds.length);

  const atkSiteA = attackRounds.filter((r) => r.plant_site === "A");
  const atkSiteB = attackRounds.filter((r) => r.plant_site === "B");
  const atkWonA = atkSiteA.filter((r) =>
    T_WIN_REASONS.includes(r.round_end_reason_info)
  ).length;
  const atkWonB = atkSiteB.filter((r) =>
    T_WIN_REASONS.includes(r.round_end_reason_info)
  ).length;

  const defWon = defendRounds.filter(
    (r) => !T_WIN_REASONS.includes(r.round_end_reason_info)
  ).length;
  const defPct = winPct(defWon, defendRounds.length);

  const defSiteA = defendRounds.filter((r) => r.plant_site === "A");
  const defSiteB = defendRounds.filter((r) => r.plant_site === "B");
  const defWonA = defSiteA.filter(
    (r) => !T_WIN_REASONS.includes(r.round_end_reason_info)
  ).length;
  const defWonB = defSiteB.filter(
    (r) => !T_WIN_REASONS.includes(r.round_end_reason_info)
  ).length;

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border/50">
        {teamLogo && (
          <NextImageFallback
            src={createTeamLogoUrl(teamLogo)}
            alt={teamName}
            width={24}
            height={24}
            className="object-contain shrink-0"
            fallbackSrc="/images/default-team-logo.webp"
          />
        )}
        <span className="font-bold text-sm">{teamName}</span>
      </div>
      <div className="p-4 space-y-4">
        {/* Afterplants */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-amber-300/80 uppercase tracking-wide">
            Afterplants (T-side)
          </p>
          <WinBar
            pct={atkPct}
            label="Overall"
            won={atkWon}
            total={attackRounds.length}
          />
          {atkSiteA.length > 0 && (
            <WinBar
              pct={winPct(atkWonA, atkSiteA.length)}
              label="Site A"
              won={atkWonA}
              total={atkSiteA.length}
            />
          )}
          {atkSiteB.length > 0 && (
            <WinBar
              pct={winPct(atkWonB, atkSiteB.length)}
              label="Site B"
              won={atkWonB}
              total={atkSiteB.length}
            />
          )}
        </div>
        {/* Retakes */}
        <div className="space-y-2 pt-3 border-t border-border/50">
          <p className="text-xs font-bold text-sky-300/80 uppercase tracking-wide">
            Retakes (CT-side)
          </p>
          <WinBar
            pct={defPct}
            label="Overall"
            won={defWon}
            total={defendRounds.length}
          />
          {defSiteA.length > 0 && (
            <WinBar
              pct={winPct(defWonA, defSiteA.length)}
              label="Site A"
              won={defWonA}
              total={defSiteA.length}
            />
          )}
          {defSiteB.length > 0 && (
            <WinBar
              pct={winPct(defWonB, defSiteB.length)}
              label="Site B"
              won={defWonB}
              total={defSiteB.length}
            />
          )}
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────── */
/*  Situation row                              */
/* ─────────────────────────────────────────── */

const SituationRow = ({
  situation,
  won,
  total
}: {
  situation: string;
  won: number;
  total: number;
}) => {
  const pct = winPct(won, total);
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono font-bold text-sm w-10 shrink-0">
        {situation}
      </span>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full", barColor(pct))}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn("font-bold text-xs w-9 text-right", winColor(pct))}>
        {pct}%
      </span>
      <span className="text-xs text-muted-foreground w-8 text-right">
        {won}/{total}
      </span>
    </div>
  );
};

/* ─────────────────────────────────────────── */
/*  Situation breakdown panel                  */
/* ─────────────────────────────────────────── */

const SituationPanel = ({
  teamName,
  attackRounds,
  defendRounds
}: {
  teamName: string;
  attackRounds: MatchGameAfterplantRound[];
  defendRounds: MatchGameAfterplantRound[];
}) => {
  // Afterplants: group by "tCount v ctCount"
  const afterplantSits = useMemo(() => {
    const map = new Map<string, { won: number; total: number }>();
    attackRounds.forEach((r) => {
      const k = `${r.t_alive_at_plant}v${r.ct_alive_at_plant}`;
      const cur = map.get(k) ?? { won: 0, total: 0 };
      cur.total++;
      if (T_WIN_REASONS.includes(r.round_end_reason_info)) cur.won++;
      map.set(k, cur);
    });
    return Array.from(map.entries())
      .map(([k, v]) => ({ key: k, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [attackRounds]);

  // Retakes: group by "ctCount v tCount" (CT perspective), win = CT won
  const retakeSits = useMemo(() => {
    const map = new Map<string, { won: number; total: number }>();
    defendRounds.forEach((r) => {
      const k = `${r.ct_alive_at_plant}v${r.t_alive_at_plant}`;
      const cur = map.get(k) ?? { won: 0, total: 0 };
      cur.total++;
      if (!T_WIN_REASONS.includes(r.round_end_reason_info)) cur.won++;
      map.set(k, cur);
    });
    return Array.from(map.entries())
      .map(([k, v]) => ({ key: k, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [defendRounds]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div className="space-y-3">
        <p className="text-xs font-bold text-amber-300/80 uppercase tracking-wide">
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
        <p className="text-xs font-bold text-sky-300/80 uppercase tracking-wide">
          {teamName} retakes
        </p>
        <p className="text-xs text-muted-foreground -mt-1">
          our players v enemy players (CT view) — retake win %
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
};

/* ─────────────────────────────────────────── */
/*  Death swimlane (dynamic time range)        */
/* ─────────────────────────────────────────── */

const TIMELINE_PAD = 3; // seconds of padding before first / after last kill

const DotLane = ({
  kills,
  side,
  steamIdToName,
  timeMin,
  timeMax
}: {
  kills: AfterplantKillEvent[];
  side: "CT" | "T";
  steamIdToName: Map<string, string>;
  timeMin: number;
  timeMax: number;
}) => {
  const sidekills = kills.filter((k) => k.victim_team === side);
  const color = side === "T" ? "#fcd34d" : "#7dd3fc";
  const range = Math.max(timeMax - timeMin, 1);

  const toPct = (t: number) =>
    Math.min(Math.max(((t - timeMin) / range) * 100, 0), 100);

  return (
    <div className="relative h-5 flex-1">
      <div className="absolute inset-y-1/2 left-0 right-0 h-px bg-border" />
      {sidekills.map((k, i) => {
        const victim =
          steamIdToName.get(k.victim_steam_id) ?? k.victim_steam_id;
        const killer =
          steamIdToName.get(k.killer_steam_id) ?? k.killer_steam_id;
        return (
          <div
            key={i}
            title={`${killer} killed ${victim} @${Math.round(k.time_in_round)}s${k.is_traded ? " ↺ traded" : ""}`}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full cursor-default z-10"
            style={{
              left: `${toPct(k.time_in_round)}%`,
              background: k.is_traded ? "transparent" : color,
              border: `2px solid ${color}`
            }}
          />
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────── */
/*  Single round card with swimlanes           */
/* ─────────────────────────────────────────── */

const RoundCard = ({
  round,
  steamIdToName
}: {
  round: MatchGameAfterplantRound;
  steamIdToName: Map<string, string>;
}) => {
  const tWon = T_WIN_REASONS.includes(round.round_end_reason_info);

  const tPlayers = (round.ct_t?.T ?? []).map(
    (id) => steamIdToName.get(String(id)) ?? String(id)
  );
  const ctPlayers = (round.ct_t?.CT ?? []).map(
    (id) => steamIdToName.get(String(id)) ?? String(id)
  );

  const deathsFor = (side: "T" | "CT") =>
    round.kills_after_plant.filter((k) => k.victim_team === side);

  // Dynamic timeline range: crop tightly around actual kill times
  const killTimes = round.kills_after_plant.map((k) => k.time_in_round);
  const timeMin =
    killTimes.length > 0
      ? Math.max(0, Math.min(...killTimes) - TIMELINE_PAD)
      : 0;
  const timeMax =
    killTimes.length > 0 ? Math.max(...killTimes) + TIMELINE_PAD : 30;

  // Generate 3–4 evenly-spaced axis labels within the cropped range
  const axisLabels = (() => {
    const range = timeMax - timeMin;
    const step = range <= 10 ? 2 : range <= 20 ? 5 : range <= 40 ? 10 : 15;
    const start = Math.ceil(timeMin / step) * step;
    const labels: number[] = [];
    for (let t = start; t <= timeMax; t += step) labels.push(t);
    return labels;
  })();

  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-border overflow-hidden",
        tWon
          ? "border-l-2 border-l-amber-300/50"
          : "border-l-2 border-l-sky-300/50"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-muted/30 border-b border-border/50">
        <span className="font-mono font-bold text-sm w-9 shrink-0">
          R{round.round_number}
        </span>
        <span className="font-bold text-sm">
          {round.t_alive_at_plant}v{round.ct_alive_at_plant}
        </span>
        <span className="text-xs text-muted-foreground bg-muted rounded px-2 py-0.5">
          Site {round.plant_site}
        </span>
        <div className="flex-1" />
        <span
          className={cn(
            "text-xs font-bold px-2.5 py-0.5 rounded-full border",
            tWon
              ? "text-amber-300/80 bg-amber-300/10 border-amber-300/30"
              : "text-sky-300/80 bg-sky-300/10 border-sky-300/30"
          )}
        >
          {tWon ? "T won" : "CT won"}
        </span>
      </div>

      {/* Alive after plant */}
      <div className="px-4 pt-2.5 pb-2">
        <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground/50 mb-1.5">
          Alive after plant
        </p>
        <div className="space-y-1">
          <div className="flex items-start gap-2 pl-2 border-l-2 border-amber-300/30">
            <span className="text-[11px] font-bold text-amber-300/80 w-5 shrink-0 mt-0.5">
              T
            </span>
            <span className="text-xs font-semibold text-amber-300/70 w-28 shrink-0 truncate">
              {round.t_team_name}
            </span>
            <span className="text-xs text-foreground/70 leading-relaxed">
              {tPlayers.join("  ·  ") || "—"}
            </span>
          </div>
          <div className="flex items-start gap-2 pl-2 border-l-2 border-sky-300/30">
            <span className="text-[11px] font-bold text-sky-300/80 w-5 shrink-0 mt-0.5">
              CT
            </span>
            <span className="text-xs font-semibold text-sky-300/70 w-28 shrink-0 truncate">
              {round.ct_team_name}
            </span>
            <span className="text-xs text-foreground/70 leading-relaxed">
              {ctPlayers.join("  ·  ") || "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Swimlanes */}
      {round.kills_after_plant.length > 0 && (
        <div className="px-4 pt-2.5 pb-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-sky-300/70 w-5 shrink-0">
              CT
            </span>
            <DotLane
              kills={round.kills_after_plant}
              side="CT"
              steamIdToName={steamIdToName}
              timeMin={timeMin}
              timeMax={timeMax}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-amber-300/70 w-5 shrink-0">
              T
            </span>
            <DotLane
              kills={round.kills_after_plant}
              side="T"
              steamIdToName={steamIdToName}
              timeMin={timeMin}
              timeMax={timeMax}
            />
          </div>
          {/* Dynamic time axis — only shows ticks within the cropped range */}
          <div className="relative pl-7 h-3">
            {axisLabels.map((s) => (
              <span
                key={s}
                className="absolute text-[9px] text-muted-foreground/60 -translate-x-1/2"
                style={{
                  left: `calc(1.75rem + ${((s - timeMin) / (timeMax - timeMin)) * 100}% * (100% - 1.75rem) / 100%)`
                }}
              >
                {s}s
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Died */}
      <div className="px-4 pt-2 pb-3 border-t border-border/40 mt-1">
        <p className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground/50 mb-1.5">
          Died
        </p>
        <div className="space-y-1">
          {(["T", "CT"] as const).map((side) => {
            const deaths = deathsFor(side);
            const color =
              side === "T" ? "text-amber-300/70" : "text-sky-300/70";
            return (
              <div key={side} className="flex items-start gap-2 text-xs">
                <span className={cn("font-bold w-5 shrink-0", color)}>
                  {side}
                </span>
                {deaths.length === 0 ? (
                  <span className="text-muted-foreground/40">—</span>
                ) : (
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                    {deaths.map((k, i) => {
                      const victim =
                        steamIdToName.get(k.victim_steam_id) ??
                        k.victim_steam_id;
                      const killer =
                        steamIdToName.get(k.killer_steam_id) ??
                        k.killer_steam_id;
                      return (
                        <span key={i} className="text-foreground/60">
                          <span className="text-foreground/80 font-medium">
                            {victim}
                          </span>
                          <span className="text-muted-foreground/50">
                            {" "}
                            by {killer} @{Math.round(k.time_in_round)}s
                          </span>
                          {k.is_traded && (
                            <span className="text-emerald-400/70"> ↺</span>
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
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────── */
/*  Half divider                               */
/* ─────────────────────────────────────────── */

const HalfDivider = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3 my-1">
    <div className="flex-1 h-px bg-border" />
    <span className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border whitespace-nowrap">
      {label}
    </span>
    <div className="flex-1 h-px bg-border" />
  </div>
);

/* ─────────────────────────────────────────── */
/*  Player involvement bar charts              */
/* ─────────────────────────────────────────── */

const CHART_GREEN = "rgba(134, 239, 172, 0.5)";
const CHART_RED = "rgba(252, 165, 165, 0.5)";

const PlayerBarChart = ({
  title,
  data
}: {
  title: string;
  data: { name: string; won: number; lost: number }[];
}) => (
  <div className="space-y-2">
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
      {title}
    </p>
    <ResponsiveContainer width="100%" height={data.length * 28 + 24}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 0, right: 8, left: 4, bottom: 0 }}
        barSize={10}
      >
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={80}
          tick={{ fontSize: 11, fill: "currentColor" }}
        />
        <Tooltip
          formatter={(value: number, name: string) => [value, name]}
          contentStyle={{
            background: "#111827",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 6,
            fontSize: 11,
            color: "#f9fafb"
          }}
          cursor={{ fill: "rgba(255,255,255,0.04)" }}
        />
        <Bar dataKey="won" name="Won" stackId="a" fill={CHART_GREEN} />
        <Bar dataKey="lost" name="Lost" stackId="a" fill={CHART_RED} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

/* ─────────────────────────────────────────── */
/*  Root export                                */
/* ─────────────────────────────────────────── */

export const AfterplantTab = ({
  afterplantRounds,
  playerStats,
  teams
}: AfterplantTabProps) => {
  const [activeSection, setActiveSection] = useState<"rounds" | "players">(
    "rounds"
  );
  const [situationTeam, setSituationTeam] = useState<0 | 1>(0);

  const steamIdToName = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of playerStats) map.set(String(p.steam_id), p.nickname);
    return map;
  }, [playerStats]);

  const teamList = useMemo(() => Object.values(teams), [teams]);

  const sorted = useMemo(
    () => [...afterplantRounds].sort((a, b) => a.round_number - b.round_number),
    [afterplantRounds]
  );

  // Split by attacking team: rounds where each team is T (already sorted by round_number)
  const teamARounds = useMemo(
    () => sorted.filter((r) => r.t_team_id === teamList[0]?.id),
    [sorted, teamList]
  );
  const teamBRounds = useMemo(
    () => sorted.filter((r) => r.t_team_id === teamList[1]?.id),
    [sorted, teamList]
  );

  // Determine which team attacked first (lowest round number = first half)
  const teamAFirstRound = teamARounds[0]?.round_number ?? Infinity;
  const teamBFirstRound = teamBRounds[0]?.round_number ?? Infinity;
  // firstHalf[0] = team that attacked first, firstHalf[1] = team that attacked second
  const halfOrder =
    teamAFirstRound <= teamBFirstRound
      ? ([teamARounds, teamBRounds] as const)
      : ([teamBRounds, teamARounds] as const);
  const halfOrderTeams =
    teamAFirstRound <= teamBFirstRound
      ? ([teamList[0], teamList[1]] as const)
      : ([teamList[1], teamList[0]] as const);

  // Player involvement data builders
  const buildInvolvementData = (
    rounds: MatchGameAfterplantRound[],
    side: "T" | "CT"
  ) => {
    const map = new Map<string, { name: string; won: number; lost: number }>();
    rounds.forEach((r) => {
      const players = side === "T" ? (r.ct_t?.T ?? []) : (r.ct_t?.CT ?? []);
      const won =
        side === "T"
          ? T_WIN_REASONS.includes(r.round_end_reason_info)
          : !T_WIN_REASONS.includes(r.round_end_reason_info);
      players.forEach((id) => {
        const name = steamIdToName.get(String(id)) ?? String(id);
        const cur = map.get(name) ?? { name, won: 0, lost: 0 };
        won ? cur.won++ : cur.lost++;
        map.set(name, cur);
      });
    });
    return Array.from(map.values()).sort(
      (a, b) => b.won + b.lost - (a.won + a.lost)
    );
  };

  if (!sorted.length) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        No plant data found for this game.
      </div>
    );
  }

  const activeTeam = teamList[situationTeam];
  const activeAttackRounds = situationTeam === 0 ? teamARounds : teamBRounds;
  const activeDefendRounds = situationTeam === 0 ? teamBRounds : teamARounds;

  return (
    <div className="space-y-6">
      {/* ── Summary cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {teamList.map((team, i) => {
          const atk = i === 0 ? teamARounds : teamBRounds;
          const def = i === 0 ? teamBRounds : teamARounds;
          const firstAtk = atk[0];
          const logo = firstAtk?.t_team_logo ?? null;
          return (
            <TeamSummaryCard
              key={team.id}
              teamName={team.name}
              teamLogo={logo}
              attackRounds={atk}
              defendRounds={def}
            />
          );
        })}
      </div>

      {/* ── Situation breakdown ── */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="font-semibold text-sm">Situation breakdown</h3>
          <div className="flex gap-2 ml-auto">
            {teamList.map((team, i) => (
              <button
                key={team.id}
                onClick={() => setSituationTeam(i as 0 | 1)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold border transition-colors",
                  situationTeam === i
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
                )}
              >
                {team.name}
              </button>
            ))}
          </div>
        </div>
        {activeTeam && (
          <SituationPanel
            teamName={activeTeam.name}
            attackRounds={activeAttackRounds}
            defendRounds={activeDefendRounds}
          />
        )}
      </div>

      {/* ── Section tabs ── */}
      <div className="flex gap-2 flex-wrap">
        {(
          [
            { key: "rounds", label: "Round-by-round" },
            { key: "players", label: "Player involvement" }
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors",
              activeSection === key
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Round-by-round ── */}
      {activeSection === "rounds" && (
        <div className="space-y-3">
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ background: "#7dd3fc", border: "2px solid #7dd3fc" }}
              />
              CT death
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ background: "#fcd34d", border: "2px solid #fcd34d" }}
              />
              T death
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{
                  background: "transparent",
                  border: "2px solid #9ca3af"
                }}
              />
              hollow = traded (killer killed back ≤5s)
            </span>
          </div>

          {halfOrder[0].length > 0 && (
            <>
              <HalfDivider
                label={`${halfOrderTeams[0]?.name ?? "Team A"} T · ${halfOrderTeams[1]?.name ?? "Team B"} CT`}
              />
              <div className="space-y-3">
                {halfOrder[0].map((r) => (
                  <RoundCard
                    key={r.round_number}
                    round={r}
                    steamIdToName={steamIdToName}
                  />
                ))}
              </div>
            </>
          )}

          {halfOrder[1].length > 0 && (
            <>
              <HalfDivider
                label={`${halfOrderTeams[1]?.name ?? "Team B"} T · ${halfOrderTeams[0]?.name ?? "Team A"} CT`}
              />
              <div className="space-y-3">
                {halfOrder[1].map((r) => (
                  <RoundCard
                    key={r.round_number}
                    round={r}
                    steamIdToName={steamIdToName}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Player involvement ── */}
      {activeSection === "players" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Team A */}
          <div className="space-y-6">
            <h3 className="font-semibold text-sm">{teamList[0]?.name}</h3>
            <PlayerBarChart
              title="Attacking (T-side)"
              data={buildInvolvementData(teamARounds, "T")}
            />
            <PlayerBarChart
              title="Defending (CT-side)"
              data={buildInvolvementData(teamBRounds, "CT")}
            />
          </div>
          {/* Team B */}
          <div className="space-y-6">
            <h3 className="font-semibold text-sm">{teamList[1]?.name}</h3>
            <PlayerBarChart
              title="Attacking (T-side)"
              data={buildInvolvementData(teamBRounds, "T")}
            />
            <PlayerBarChart
              title="Defending (CT-side)"
              data={buildInvolvementData(teamARounds, "CT")}
            />
          </div>
        </div>
      )}
    </div>
  );
};
