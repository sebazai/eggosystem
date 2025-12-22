"use client";

import { useState } from "react";
import { cn, mapToReadableName } from "@/lib/utils";
import Image from "next/image";
import type { PlayerMapStats } from "@eggosystem/types";
import { StatDisplay } from "@/components/ui/stat-display";
import { STAT_DESCRIPTIONS } from "@/configs/stat-descriptions";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Swords, ArrowLeftRight, Bomb, Move, Crosshair } from "lucide-react";

type StatCategory = "combat" | "trading" | "utility" | "positioning" | "openings";

interface MapStatCardProps {
    mapStat: PlayerMapStats;
}

const CATEGORY_TABS: { key: StatCategory; label: string; shortLabel: string; icon: React.ReactNode }[] = [
    { key: "combat", label: "Combat", shortLabel: "Combat", icon: <Swords className="w-4 h-4" /> },
    { key: "trading", label: "Trading", shortLabel: "Trade", icon: <ArrowLeftRight className="w-4 h-4" /> },
    { key: "utility", label: "Utility", shortLabel: "Util", icon: <Bomb className="w-4 h-4" /> },
    { key: "positioning", label: "Positioning", shortLabel: "Pos", icon: <Move className="w-4 h-4" /> },
    { key: "openings", label: "Openings", shortLabel: "Open", icon: <Crosshair className="w-4 h-4" /> }
];

// Function to determine color based on win percentage
const getWinRateColor = (winPercentage: number) => {
    if (winPercentage <= 25) return "text-red-400/50";
    if (winPercentage <= 50) return "text-amber-400/50";
    return "text-green-400/50";
};

export function MapStatCard({ mapStat }: MapStatCardProps) {
    const [activeCategory, setActiveCategory] = useState<StatCategory>("combat");
    const mapName = mapToReadableName(mapStat.map_name);

    return (
        <TooltipProvider>
            <div className="bg-card rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                {/* Map Header with Image - Original Style */}
                <div className="relative h-48 w-full">
                    <Image
                        src={`/images/maps/${mapStat.map_name}.png`}
                        alt={mapName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                        <div className="p-4 text-white w-full">
                            <h3 className="font-bold text-lg">{mapName}</h3>
                        </div>
                    </div>
                </div>

                <div className="p-4">
                    {/* Hero Stats Section - Original Style */}
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-center">
                            <p
                                className={`text-3xl font-bold ${getWinRateColor(mapStat.win_percentage)}`}
                            >
                                {mapStat.win_percentage.toFixed(0)}%
                            </p>
                            <p className="text-xs text-muted-foreground">Win rate</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl">
                                <span className="text-green-400/50 font-medium">
                                    {mapStat.wins}
                                </span>{" "}
                                / {mapStat.maps_played}
                            </p>
                            <p className="text-xs text-muted-foreground">Wins / Played</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xl font-bold">{mapStat.kd.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">K/D Ratio</p>
                        </div>
                    </div>

                    {/* Category Icon Tabs */}
                    <div className="flex justify-between mb-4 border-b border-border">
                        {CATEGORY_TABS.map((tab) => (
                            <Tooltip key={tab.key}>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => setActiveCategory(tab.key)}
                                        className={cn(
                                            "flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors",
                                            activeCategory === tab.key
                                                ? "text-kanaliiga-orange border-b-2 border-kanaliiga-orange -mb-[1px]"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {tab.icon}
                                        <span className="hidden sm:inline">{tab.shortLabel}</span>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>{tab.label}</TooltipContent>
                            </Tooltip>
                        ))}
                    </div>

                    {/* Category Content */}
                    <div>
                        {activeCategory === "combat" && <CombatStats mapStat={mapStat} />}
                        {activeCategory === "trading" && <TradingStats mapStat={mapStat} />}
                        {activeCategory === "utility" && <UtilityStats mapStat={mapStat} />}
                        {activeCategory === "positioning" && <PositioningStats mapStat={mapStat} />}
                        {activeCategory === "openings" && <OpeningsStats mapStat={mapStat} />}
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}

// Helper function to get Kana Rating color
const getKanaRatingColor = (rating: number) => {
    if (rating < 0.5) return "bg-red-400/50";
    if (rating < 0.8) return "bg-amber-400/50";
    return "bg-green-400/50";
};

// Helper function to get ADR color
const getAdrColor = (adr: number) => {
    if (adr < 50) return "bg-red-400/50";
    if (adr < 80) return "bg-amber-400/50";
    return "bg-green-400/50";
};

// Combat Stats Content
function CombatStats({ mapStat }: { mapStat: PlayerMapStats }) {
    // Calculate CT and T side KD ratios using actual data
    const tKd =
        mapStat.kills_t > 0
            ? (mapStat.kills_t / (mapStat.deaths / 2)).toFixed(2)
            : "0.00";
    const ctKd =
        mapStat.kills_ct > 0
            ? (mapStat.kills_ct / (mapStat.deaths / 2)).toFixed(2)
            : "0.00";

    const multiKillRounds =
        mapStat.multikill_2k + mapStat.multikill_3k + mapStat.multikill_4k + mapStat.multikill_5k;
    const clutchTotal = mapStat.clutches_won + mapStat.clutches_lost;
    const clutchRate = clutchTotal > 0 ? (mapStat.clutches_won / clutchTotal) * 100 : 0;

    return (
        <div className="space-y-4">
            {/* Kana Rating */}
            <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Kana Rating</span>
                    <span className="font-bold">{mapStat.kana_rating.toFixed(2)}</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${getKanaRatingColor(mapStat.kana_rating)}`}
                        style={{
                            width: `${Math.min(100, mapStat.kana_rating * 100)}%`
                        }}
                    />
                </div>
            </div>

            {/* ADR */}
            <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">ADR</span>
                    <span className="font-bold">{mapStat.adr.toFixed(1)}</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${getAdrColor(mapStat.adr)}`}
                        style={{ width: `${Math.min(100, mapStat.adr)}%` }}
                    />
                </div>
            </div>

            {/* HS% */}
            <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Headshot %</span>
                    <span className="font-bold">{mapStat.hs_percent.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${mapStat.hs_percent >= 50 ? "bg-green-400/50" : mapStat.hs_percent >= 35 ? "bg-amber-400/50" : "bg-red-400/50"}`}
                        style={{ width: `${mapStat.hs_percent}%` }}
                    />
                </div>
            </div>

            {/* Side K/D Row */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-amber-400">T K/D</span>
                        <span className="font-bold">{tKd}</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-amber-400/50"
                            style={{ width: `${Math.min(100, parseFloat(tKd) * 50)}%` }}
                        />
                    </div>
                </div>
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-sky-400">CT K/D</span>
                        <span className="font-bold">{ctKd}</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-sky-400/50"
                            style={{ width: `${Math.min(100, parseFloat(ctKd) * 50)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Stats Row */}
            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-border">
                <div>
                    <p className="text-lg font-bold">{mapStat.kills}/{mapStat.deaths}</p>
                    <p className="text-xs text-muted-foreground">K/D</p>
                </div>
                <div>
                    <p className="text-lg font-bold">{multiKillRounds}</p>
                    <p className="text-xs text-muted-foreground">Multi-kills</p>
                </div>
                <div>
                    <p className="text-lg font-bold">{mapStat.clutches_won}/{clutchTotal}</p>
                    <p className="text-xs text-muted-foreground">Clutches</p>
                </div>
            </div>
        </div>
    );
}

// Helper function for trade color (standardized with other tabs)
const getTradeColor = (percentage: number) => {
    if (percentage >= 70) return "bg-green-400/50";
    if (percentage >= 40) return "bg-amber-400/50";
    return "bg-red-400/50";
};

// Trading Stats Content
function TradingStats({ mapStat }: { mapStat: PlayerMapStats }) {
    // Attempt rate: how often they tried when they could
    const attemptRate =
        mapStat.trade_opportunities > 0
            ? (mapStat.trade_attempts / mapStat.trade_opportunities) * 100
            : 0;

    // Conversion rate: when they tried, how often they succeeded
    const conversionRate =
        mapStat.trade_attempts > 0
            ? (mapStat.trades / mapStat.trade_attempts) * 100
            : 0;

    // Overall success rate (for the stacked bar)
    const overallSuccessRate =
        mapStat.trade_opportunities > 0
            ? (mapStat.trades / mapStat.trade_opportunities) * 100
            : 0;

    const failedAttempts = mapStat.trade_attempts - mapStat.trades;
    const ignoredOpportunities = mapStat.trade_opportunities - mapStat.trade_attempts;

    return (
        <div className="space-y-4">
            {/* Stacked bar: Success (green) + Failed (amber) + Ignored (red) */}
            <div>
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-green-400">Success ({mapStat.trades})</span>
                    <span className="text-amber-400">Failed ({failedAttempts})</span>
                    <span className="text-red-400">Ignored ({ignoredOpportunities})</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden flex">
                    {/* Green: successful trades */}
                    {mapStat.trades > 0 && (
                        <div
                            className="h-full bg-green-400/50"
                            style={{
                                width: `${(mapStat.trades / mapStat.trade_opportunities) * 100}%`
                            }}
                        />
                    )}
                    {/* Amber: tried but failed */}
                    {failedAttempts > 0 && (
                        <div
                            className="h-full bg-amber-400/50"
                            style={{
                                width: `${(failedAttempts / mapStat.trade_opportunities) * 100}%`
                            }}
                        />
                    )}
                    {/* Red: didn't try */}
                    {ignoredOpportunities > 0 && (
                        <div
                            className="h-full bg-red-400/50"
                            style={{
                                width: `${(ignoredOpportunities / mapStat.trade_opportunities) * 100}%`
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Attempt Rate */}
            <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Attempt Rate</span>
                    <span className="font-bold">{attemptRate.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${attemptRate >= 80 ? "bg-green-400/50" : attemptRate >= 60 ? "bg-amber-400/50" : "bg-red-400/50"}`}
                        style={{ width: `${attemptRate}%` }}
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Tried {mapStat.trade_attempts} / {mapStat.trade_opportunities} opportunities
                </p>
            </div>

            {/* Conversion Rate */}
            <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Conversion Rate</span>
                    <span className="font-bold">{conversionRate.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${conversionRate >= 70 ? "bg-green-400/50" : conversionRate >= 50 ? "bg-amber-400/50" : "bg-red-400/50"}`}
                        style={{ width: `${conversionRate}%` }}
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    Got {mapStat.trades} / {mapStat.trade_attempts} attempts
                </p>
            </div>

            {/* Bottom Stats Row */}
            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-border">
                <div>
                    <p className="text-lg font-bold">{mapStat.trade_opportunities}</p>
                    <p className="text-xs text-muted-foreground">Opportunities</p>
                </div>
                <div>
                    <p className="text-lg font-bold">{mapStat.trade_attempts}</p>
                    <p className="text-xs text-muted-foreground">Attempted</p>
                </div>
                <div>
                    <p className="text-lg font-bold">{mapStat.trades}</p>
                    <p className="text-xs text-muted-foreground">Success</p>
                </div>
            </div>
        </div>
    );
}

// Utility Stats Content
function UtilityStats({ mapStat }: { mapStat: PlayerMapStats }) {
    const utilDmgPerRound =
        mapStat.rounds_played > 0 ? mapStat.utility_damage / mapStat.rounds_played : 0;

    const flashesPerRound =
        mapStat.rounds_played > 0 ? mapStat.flashes_thrown / mapStat.rounds_played : 0;

    // Flash quality: enemy flash vs teammate flash duration ratio
    const flashQuality =
        mapStat.avg_teammate_flash_duration > 0
            ? mapStat.avg_enemy_flash_duration / mapStat.avg_teammate_flash_duration
            : mapStat.avg_enemy_flash_duration;

    return (
        <div className="space-y-4">
            {/* Utility Damage */}
            <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Utility Damage</span>
                    <span className="font-bold">{mapStat.utility_damage}</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${utilDmgPerRound >= 10 ? "bg-green-400/50" : utilDmgPerRound >= 5 ? "bg-amber-400/50" : "bg-red-400/50"}`}
                        style={{ width: `${Math.min(100, utilDmgPerRound * 10)}%` }}
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{utilDmgPerRound.toFixed(1)} per round</p>
            </div>

            {/* Flash Quality - Enemy vs Teammate */}
            <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Flash Quality</span>
                    <span className="font-bold">{mapStat.avg_enemy_flash_duration.toFixed(2)}s</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${mapStat.avg_enemy_flash_duration >= 1.5 ? "bg-green-400/50" : mapStat.avg_enemy_flash_duration >= 1.0 ? "bg-amber-400/50" : "bg-red-400/50"}`}
                        style={{ width: `${Math.min(100, mapStat.avg_enemy_flash_duration * 50)}%` }}
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Enemy flash duration (avg)</p>
            </div>

            {/* Team Flash - lower is better */}
            <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Team Flash</span>
                    <span className={`font-bold ${mapStat.avg_teammate_flash_duration <= 0.3 ? "text-green-400" : mapStat.avg_teammate_flash_duration <= 0.6 ? "text-amber-400" : "text-red-400"}`}>
                        {mapStat.avg_teammate_flash_duration.toFixed(2)}s
                    </span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${mapStat.avg_teammate_flash_duration <= 0.3 ? "bg-green-400/50" : mapStat.avg_teammate_flash_duration <= 0.6 ? "bg-amber-400/50" : "bg-red-400/50"}`}
                        style={{ width: `${Math.max(0, 100 - mapStat.avg_teammate_flash_duration * 100)}%` }}
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Lower is better</p>
            </div>

            {/* Bottom Stats Row */}
            <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-border">
                <div>
                    <p className="text-lg font-bold">{mapStat.flash_assists}</p>
                    <p className="text-xs text-muted-foreground">Flash Assists</p>
                </div>
                <div>
                    <p className="text-lg font-bold">{mapStat.enemies_flashed}</p>
                    <p className="text-xs text-muted-foreground">Enemies Flashed</p>
                </div>
                <div>
                    <p className="text-lg font-bold">{mapStat.awp_kills}</p>
                    <p className="text-xs text-muted-foreground">AWP Kills</p>
                </div>
            </div>
        </div>
    );
}

// Positioning Stats Content
function PositioningStats({ mapStat }: { mapStat: PlayerMapStats }) {
    // Trade opportunity rate indicates positioning awareness
    const tradeOpportunityRate =
        mapStat.rounds_played > 0
            ? (mapStat.trade_opportunities / mapStat.rounds_played) * 100
            : 0;

    // Traded rate (how often this player got traded when dying)
    const tradedRate =
        mapStat.deaths > 0 ? (mapStat.trades / mapStat.deaths) * 100 : 0;

    return (
        <div className="space-y-4">
            {/* KAST - key positioning indicator */}
            <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">KAST</span>
                    <span className="font-bold">{mapStat.kast.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${mapStat.kast >= 70 ? "bg-green-400/50" : mapStat.kast >= 50 ? "bg-amber-400/50" : "bg-red-400/50"}`}
                        style={{ width: `${mapStat.kast}%` }}
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Kill, Assist, Survived, or Traded</p>
            </div>

            {/* Crosshair Placement */}
            <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Crosshair Placement</span>
                    <span className="font-bold">{mapStat.crosshair_placement.toFixed(1)}°</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${mapStat.crosshair_placement <= 5 ? "bg-green-400/50" : mapStat.crosshair_placement <= 10 ? "bg-amber-400/50" : "bg-red-400/50"}`}
                        style={{ width: `${Math.max(0, 100 - mapStat.crosshair_placement * 5)}%` }}
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Lower is better (deviation from head level)</p>
            </div>

            {/* Counter-strafing */}
            <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Counter-strafing</span>
                    <span className="font-bold">{mapStat.counter_strafing_percentage.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${mapStat.counter_strafing_percentage >= 80 ? "bg-green-400/50" : mapStat.counter_strafing_percentage >= 60 ? "bg-amber-400/50" : "bg-red-400/50"}`}
                        style={{ width: `${mapStat.counter_strafing_percentage}%` }}
                    />
                </div>
            </div>

            {/* Time to Damage */}
            <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Time to Damage</span>
                    <span className="font-bold">{mapStat.time_to_damage.toFixed(0)}ms</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${mapStat.time_to_damage <= 400 ? "bg-green-400/50" : mapStat.time_to_damage <= 600 ? "bg-amber-400/50" : "bg-red-400/50"}`}
                        style={{ width: `${Math.max(0, 100 - mapStat.time_to_damage / 10)}%` }}
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Lower is better</p>
            </div>

            {/* Trade Positioning Stats */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                <div className="text-center">
                    <p className="text-lg font-bold">{mapStat.trade_opportunities}</p>
                    <p className="text-xs text-muted-foreground">Trade Opps</p>
                </div>
                <div className="text-center">
                    <p className="text-lg font-bold">{tradedRate.toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">Deaths Traded</p>
                </div>
            </div>
        </div>
    );
}

// Openings Stats Content
function OpeningsStats({ mapStat }: { mapStat: PlayerMapStats }) {
    const totalOpenings = mapStat.first_kills + mapStat.first_deaths;
    const openingWinRate =
        totalOpenings > 0 ? (mapStat.first_kills / totalOpenings) * 100 : 0;

    const totalOpeningsT = mapStat.first_kills_t + mapStat.first_deaths_t;
    const openingWinRateT =
        totalOpeningsT > 0 ? (mapStat.first_kills_t / totalOpeningsT) * 100 : 0;

    const totalOpeningsCT = mapStat.first_kills_ct + mapStat.first_deaths_ct;
    const openingWinRateCT =
        totalOpeningsCT > 0 ? (mapStat.first_kills_ct / totalOpeningsCT) * 100 : 0;

    const openingDiff = mapStat.first_kills - mapStat.first_deaths;

    return (
        <div className="space-y-4">
            {/* Overall Opening Win Rate */}
            <div>
                <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">Opening Win Rate</span>
                    <span className="font-bold">{openingWinRate.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full ${openingWinRate >= 55 ? "bg-green-400/50" : openingWinRate >= 45 ? "bg-amber-400/50" : "bg-red-400/50"}`}
                        style={{ width: `${openingWinRate}%` }}
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                    {mapStat.first_kills} kills / {mapStat.first_deaths} deaths
                </p>
            </div>

            {/* Side-specific Openings in Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* T-Side */}
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-amber-400 font-medium">T-Side</span>
                        <span className="font-bold">{openingWinRateT.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-amber-400/50"
                            style={{ width: `${openingWinRateT}%` }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {mapStat.first_kills_t} / {mapStat.first_deaths_t}
                    </p>
                </div>
                {/* CT-Side */}
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-sky-400 font-medium">CT-Side</span>
                        <span className="font-bold">{openingWinRateCT.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-sky-400/50"
                            style={{ width: `${openingWinRateCT}%` }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        {mapStat.first_kills_ct} / {mapStat.first_deaths_ct}
                    </p>
                </div>
            </div>

            {/* First Death Trade Analysis */}
            <div className="border-t border-border pt-4">
                <p className="text-sm font-medium mb-2">First Death Analysis</p>
                <div className="space-y-2">
                    {/* Stacked bar: Traded (green) + Not Traded but Tradeable (amber) + Stupid (red) */}
                    {(() => {
                        const traded = mapStat.first_death_traded || 0;
                        const tradeable = mapStat.first_deaths_tradeable || 0;
                        const totalDeaths = mapStat.first_deaths || 0;
                        const notTraded = Math.max(0, tradeable - traded);
                        const isolated = Math.max(0, totalDeaths - tradeable);

                        if (totalDeaths === 0) {
                            return <p className="text-xs text-muted-foreground">No first deaths recorded</p>;
                        }

                        return (
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-green-400">Traded ({traded})</span>
                                    <span className="text-amber-400">Not Traded ({notTraded})</span>
                                    <span className="text-red-400">Isolated ({isolated})</span>
                                </div>
                                <div className="h-3 bg-gray-800 rounded-full overflow-hidden flex">
                                    {traded > 0 && (
                                        <div
                                            className="h-full bg-green-400/50"
                                            style={{ width: `${(traded / totalDeaths) * 100}%` }}
                                        />
                                    )}
                                    {notTraded > 0 && (
                                        <div
                                            className="h-full bg-amber-400/50"
                                            style={{ width: `${(notTraded / totalDeaths) * 100}%` }}
                                        />
                                    )}
                                    {isolated > 0 && (
                                        <div
                                            className="h-full bg-red-400/50"
                                            style={{ width: `${(isolated / totalDeaths) * 100}%` }}
                                        />
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {tradeable} of {totalDeaths} deaths were in tradeable positions
                                </p>
                            </div>
                        );
                    })()}
                </div>

                {/* T/CT Side Breakdown */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                    {/* T-Side */}
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-amber-400 font-medium">T-Side</span>
                        </div>
                        {(() => {
                            const tradedT = mapStat.first_death_traded_t || 0;
                            const tradeableT = mapStat.first_deaths_tradeable_t || 0;
                            const totalT = mapStat.first_deaths_t || 0;
                            const notTradedT = Math.max(0, tradeableT - tradedT);
                            const isolatedT = Math.max(0, totalT - tradeableT);

                            if (totalT === 0) return <p className="text-xs text-muted-foreground">No data</p>;

                            return (
                                <>
                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
                                        {tradedT > 0 && (
                                            <div className="h-full bg-green-400/50" style={{ width: `${(tradedT / totalT) * 100}%` }} />
                                        )}
                                        {notTradedT > 0 && (
                                            <div className="h-full bg-amber-400/50" style={{ width: `${(notTradedT / totalT) * 100}%` }} />
                                        )}
                                        {isolatedT > 0 && (
                                            <div className="h-full bg-red-400/50" style={{ width: `${(isolatedT / totalT) * 100}%` }} />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{tradedT}/{notTradedT}/{isolatedT}</p>
                                </>
                            );
                        })()}
                    </div>
                    {/* CT-Side */}
                    <div>
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-sky-400 font-medium">CT-Side</span>
                        </div>
                        {(() => {
                            const tradedCT = mapStat.first_death_traded_ct || 0;
                            const tradeableCT = mapStat.first_deaths_tradeable_ct || 0;
                            const totalCT = mapStat.first_deaths_ct || 0;
                            const notTradedCT = Math.max(0, tradeableCT - tradedCT);
                            const isolatedCT = Math.max(0, totalCT - tradeableCT);

                            if (totalCT === 0) return <p className="text-xs text-muted-foreground">No data</p>;

                            return (
                                <>
                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
                                        {tradedCT > 0 && (
                                            <div className="h-full bg-green-400/50" style={{ width: `${(tradedCT / totalCT) * 100}%` }} />
                                        )}
                                        {notTradedCT > 0 && (
                                            <div className="h-full bg-amber-400/50" style={{ width: `${(notTradedCT / totalCT) * 100}%` }} />
                                        )}
                                        {isolatedCT > 0 && (
                                            <div className="h-full bg-red-400/50" style={{ width: `${(isolatedCT / totalCT) * 100}%` }} />
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{tradedCT}/{notTradedCT}/{isolatedCT}</p>
                                </>
                            );
                        })()}
                    </div>
                </div>
            </div>

            {/* Opening Diff Badge */}
            <div
                className={cn(
                    "text-center py-3 rounded-lg text-lg font-bold",
                    openingDiff >= 0
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                )}
            >
                {openingDiff >= 0 ? "+" : ""}{openingDiff} Opening Diff
            </div>
        </div>
    );
}
