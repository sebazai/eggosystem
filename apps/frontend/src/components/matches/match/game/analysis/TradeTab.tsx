"use client";

import React, { useMemo } from "react";
import { orderMatchParticipantsBySideHomeLeft } from "@/lib/order-match-teams-home-left-away";
import {
  AnalysisCard,
  VersusStat,
  MiniBar,
  HeatGrid,
  TeamDot,
  TEAM_A_COLOR,
  TEAM_B_COLOR
} from "./AnalysisVizComponents";
import type { MatchGameTradeStats, MatchInfo } from "@eggosystem/types";

interface TradeTabProps {
  tradeStats: MatchGameTradeStats;
  teams: MatchInfo["teams"];
}

/* ─── Trade funnel ───────────────────────────────────────────────── */
function TradeFunnel({
  teamName,
  opp,
  attempts,
  converted,
  color,
  scaleMax
}: {
  teamName: string;
  opp: number;
  attempts: number;
  converted: number;
  color: string;
  scaleMax: number;
}) {
  const stages = [
    { label: "Opportunities", value: opp },
    { label: "Attempts", value: attempts },
    { label: "Converted", value: converted }
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 mb-1">
        <TeamDot color={color} size={9} />
        <span className="text-xs font-semibold font-headings" style={{ color }}>
          {teamName}
        </span>
      </div>
      {stages.map((s, i) => {
        const pct = scaleMax === 0 ? 0 : (s.value / scaleMax) * 100;
        const opacity = 1 - i * 0.2;
        return (
          <div key={s.label} className="flex items-center gap-2.5">
            <div
              style={{
                height: 28,
                width: `${Math.max(8, pct)}%`,
                background: color,
                opacity,
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                paddingLeft: 8,
                minWidth: 32
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "rgba(0,0,0,0.7)",
                  whiteSpace: "nowrap"
                }}
                className="tabular-nums"
              >
                {s.value}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground/70 whitespace-nowrap">
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Trader leaderboard row ─────────────────────────────────────── */
function TraderRow({
  name,
  trades,
  opp,
  maxTrades,
  color
}: {
  name: string;
  trades: number;
  opp: number;
  maxTrades: number;
  color: string;
}) {
  const convPct = opp === 0 ? 0 : Math.round((trades / opp) * 100);
  return (
    <div
      className="grid items-center gap-2.5 py-2 border-b border-border/20 last:border-0"
      style={{ gridTemplateColumns: "140px 28px 1fr 80px" }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <TeamDot color={color} size={7} />
        <span className="text-xs font-semibold truncate">{name}</span>
      </div>
      <span className="text-sm font-bold tabular-nums" style={{ color }}>
        {trades}
      </span>
      <MiniBar value={trades} max={maxTrades} color={color} height={8} />
      <span className="text-[11px] text-muted-foreground/70 text-right tabular-nums">
        {convPct}% of {opp}
      </span>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
export const TradeTab = ({ tradeStats, teams }: TradeTabProps) => {
  const [teamA, teamB] = useMemo(() => {
    const list = orderMatchParticipantsBySideHomeLeft(Object.values(teams));
    return [list[0], list[1]] as const;
  }, [teams]);

  const teamAId = teamA?.id ?? 0;
  const teamBId = teamB?.id ?? 0;

  const aPlayers = useMemo(
    () => tradeStats.players.filter((p) => p.team_id === teamAId),
    [tradeStats, teamAId]
  );
  const bPlayers = useMemo(
    () => tradeStats.players.filter((p) => p.team_id === teamBId),
    [tradeStats, teamBId]
  );

  // Team aggregate trade stats
  const aTeam = useMemo(
    () => ({
      opp: aPlayers.reduce((s, p) => s + p.trade_opportunities, 0),
      attempts: aPlayers.reduce((s, p) => s + p.trade_attempts, 0),
      converted: aPlayers.reduce((s, p) => s + p.trades, 0),
      traded: aPlayers.reduce((s, p) => s + p.traded, 0),
      deaths: aPlayers.reduce((s, p) => s + p.deaths, 0)
    }),
    [aPlayers]
  );

  const bTeam = useMemo(
    () => ({
      opp: bPlayers.reduce((s, p) => s + p.trade_opportunities, 0),
      attempts: bPlayers.reduce((s, p) => s + p.trade_attempts, 0),
      converted: bPlayers.reduce((s, p) => s + p.trades, 0),
      traded: bPlayers.reduce((s, p) => s + p.traded, 0),
      deaths: bPlayers.reduce((s, p) => s + p.deaths, 0)
    }),
    [bPlayers]
  );

  const scaleMax = Math.max(aTeam.opp, bTeam.opp);
  const convA =
    aTeam.opp === 0 ? 0 : Math.round((aTeam.converted / aTeam.opp) * 100);
  const convB =
    bTeam.opp === 0 ? 0 : Math.round((bTeam.converted / bTeam.opp) * 100);
  const tradedA =
    aTeam.deaths === 0 ? 0 : Math.round((aTeam.traded / aTeam.deaths) * 100);
  const tradedB =
    bTeam.deaths === 0 ? 0 : Math.round((bTeam.traded / bTeam.deaths) * 100);

  // Leaderboard
  const allTraders = [...tradeStats.players].sort(
    (a, b) =>
      b.trades - a.trades || b.trade_opportunities - a.trade_opportunities
  );
  const maxTrades = allTraders[0]?.trades ?? 1;

  // Trade matrix lookup
  const tradeCount = (traderId: string, killerId: string) =>
    tradeStats.matrix
      .filter(
        (m) => m.trader_steam_id === traderId && m.killer_steam_id === killerId
      )
      .reduce((s, m) => s + m.count, 0);

  const aIds = aPlayers.map((p) => p.steam_id);
  const bIds = bPlayers.map((p) => p.steam_id);
  const nick = (id: string) =>
    tradeStats.players.find((p) => p.steam_id === id)?.nickname ?? id.slice(-4);

  return (
    <div className="flex flex-col gap-3.5">
      {/* Trade discipline */}
      <AnalysisCard
        title="Trade discipline"
        sub="Every death is a trade chance — how far each team carried it"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-5">
          <TradeFunnel
            teamName={teamA?.name ?? "Team A"}
            opp={aTeam.opp}
            attempts={aTeam.attempts}
            converted={aTeam.converted}
            color={TEAM_A_COLOR}
            scaleMax={scaleMax}
          />
          <TradeFunnel
            teamName={teamB?.name ?? "Team B"}
            opp={bTeam.opp}
            attempts={bTeam.attempts}
            converted={bTeam.converted}
            color={TEAM_B_COLOR}
            scaleMax={scaleMax}
          />
        </div>
        <div className="flex flex-col gap-4 pt-4 border-t border-border/30">
          <VersusStat
            label="Trade conversion (of all chances)"
            aVal={convA}
            bVal={convB}
            mode="max"
            aText={`${convA}%`}
            bText={`${convB}%`}
          />
          <VersusStat
            label="Own deaths traded back"
            aVal={tradedA}
            bVal={tradedB}
            mode="max"
            aText={`${tradedA}%`}
            bText={`${tradedB}%`}
          />
        </div>
      </AnalysisCard>

      {/* Who did the trading */}
      <AnalysisCard
        title="Who did the trading"
        sub="Trades completed · bar = count · right = conversion rate"
      >
        {allTraders.map((p) => (
          <TraderRow
            key={p.steam_id}
            name={p.nickname}
            trades={p.trades}
            opp={p.trade_opportunities}
            maxTrades={maxTrades}
            color={p.team_id === teamAId ? TEAM_A_COLOR : TEAM_B_COLOR}
          />
        ))}
      </AnalysisCard>

      {/* Trade heat grids */}
      <AnalysisCard
        title="Who traded for whom"
        sub="Trader (row) punished the enemy who had just killed a teammate (column)"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TeamDot color={TEAM_A_COLOR} />
              <span
                className="text-xs font-semibold"
                style={{ color: TEAM_A_COLOR }}
              >
                {teamA?.name ?? "Team A"} punished {teamB?.name ?? "Team B"}
              </span>
            </div>
            <HeatGrid
              rows={aIds}
              cols={bIds}
              rowLabel={nick}
              colLabel={nick}
              get={tradeCount}
              color={TEAM_A_COLOR}
              max={3}
              cornerRow="↓ Trader"
              cornerCol="Killer →"
              minWidth={320}
              cellH={34}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TeamDot color={TEAM_B_COLOR} />
              <span
                className="text-xs font-semibold"
                style={{ color: TEAM_B_COLOR }}
              >
                {teamB?.name ?? "Team B"} punished {teamA?.name ?? "Team A"}
              </span>
            </div>
            <HeatGrid
              rows={bIds}
              cols={aIds}
              rowLabel={nick}
              colLabel={nick}
              get={tradeCount}
              color={TEAM_B_COLOR}
              max={3}
              cornerRow="↓ Trader"
              cornerCol="Killer →"
              minWidth={320}
              cellH={34}
            />
          </div>
        </div>
      </AnalysisCard>
    </div>
  );
};
