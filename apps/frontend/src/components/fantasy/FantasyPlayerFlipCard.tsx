"use client";

import { useState, useRef } from "react";
import { cn, createTeamLogoUrl } from "@/lib/utils";
import { NextImageFallback } from "../layout/NextImageFallback";
import type { FantasyPlayer } from "./FantasyLeague";

type Props = {
  player: FantasyPlayer;
  onAdd: (player: FantasyPlayer) => void;
  disabled: boolean;
  budgetRemaining: number;
  isExistingTeamPlayer?: boolean; // Don't apply opacity to existing team cards
};

// Metallic color palettes
const tierFrameGradients = {
  gold: "from-[#FFD866] via-[#E0A424] to-[#A06A1C]",
  silver: "from-[#E8E8E8] via-[#C0C0C0] to-[#8C8C8C]",
  bronze: "from-[#E09E5C] via-[#B8753C] to-[#8B5A2B]"
} as const;

const tierInnerGlow = {
  gold: "shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),inset_0_-1px_2px_rgba(0,0,0,0.3)]",
  silver:
    "shadow-[inset_0_1px_2px_rgba(255,255,255,0.5),inset_0_-1px_2px_rgba(0,0,0,0.2)]",
  bronze:
    "shadow-[inset_0_1px_2px_rgba(255,200,150,0.4),inset_0_-1px_2px_rgba(0,0,0,0.3)]"
} as const;

const tierCardShadow = {
  gold: "shadow-[0_8px_20px_rgba(224,164,36,0.35),0_0_40px_rgba(255,216,102,0.2)]",
  silver:
    "shadow-[0_8px_20px_rgba(140,140,140,0.35),0_0_40px_rgba(192,192,192,0.15)]",
  bronze:
    "shadow-[0_8px_20px_rgba(139,90,43,0.35),0_0_40px_rgba(224,158,92,0.2)]"
} as const;

const tierAccents = {
  gold: "bg-gradient-to-br from-[#FFD866] via-[#E0A424] to-[#C89020]",
  silver: "bg-gradient-to-br from-[#E8E8E8] via-[#C0C0C0] to-[#A0A0A0]",
  bronze: "bg-gradient-to-br from-[#E09E5C] via-[#B8753C] to-[#9A5F30]"
} as const;

const tierTextColor = {
  gold: "text-black",
  silver: "text-black",
  bronze: "text-white"
} as const;

const tierTextGlow = {
  gold: "drop-shadow-[0_2px_4px_rgba(160,106,28,0.5)] [text-shadow:0_1px_0_rgba(255,255,255,0.3)]",
  silver:
    "drop-shadow-[0_2px_4px_rgba(80,80,80,0.5)] [text-shadow:0_1px_0_rgba(255,255,255,0.4)]",
  bronze:
    "drop-shadow-[0_2px_4px_rgba(60,40,20,0.6)] [text-shadow:0_1px_0_rgba(255,200,150,0.2)]"
} as const;

const tierStatHighlight = {
  gold: "text-[#FFD866]",
  silver: "text-[#E8E8E8]",
  bronze: "text-[#E09E5C]"
} as const;

export default function FantasyPlayerFlipCard({
  player,
  onAdd,
  disabled,
  budgetRemaining,
  isExistingTeamPlayer = false
}: Props) {
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const canAfford = player.value <= budgetRemaining;
  const isDisabled = disabled || !canAfford;
  const teamLogoUrl =
    player.teamLogo ||
    createTeamLogoUrl(player.team.toLowerCase().replace(/\s+/g, "-") + ".png");

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't flip if clicking the button
    const target = e.target as HTMLElement;
    if (target.tagName === "BUTTON" || target.closest("button")) {
      return;
    }
    setIsFlipped(!isFlipped);
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isDisabled) {
      onAdd(player);
    }
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "group relative w-full h-[420px] perspective cursor-pointer",
        isDisabled && !isExistingTeamPlayer && "opacity-60" // Don't fade existing team cards
      )}
      onClick={handleCardClick}
    >
      {/* Card Container with Flip Effect */}
      <div
        className={cn(
          "relative w-full h-full transition-transform duration-500 ease-in-out transform-style-preserve-3d",
          isFlipped && "rotate-y-180"
        )}
      >
        {/* Front of Card */}
        <div className="absolute inset-0 backface-hidden">
          {/* Outer Drop Shadow */}
          <div
            className={cn(
              "relative p-[4px] h-full bg-gradient-to-b rounded-2xl",
              tierFrameGradients[player.tier],
              tierCardShadow[player.tier],
              tierInnerGlow[player.tier],
              "transition-all duration-300"
            )}
          >
            {/* Inner Border for Depth */}
            <div
              className={cn(
                "absolute inset-[4px] border border-black/40 rounded-[14px]",
                "pointer-events-none"
              )}
            />

            {/* Inner Card */}
            <div className="relative bg-neutral-900 h-full w-full flex flex-col overflow-hidden rounded-[14px]">
              {/* Header with Team Logo and Tier Ribbon */}
              <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "p-[2px] rounded-full bg-gradient-to-br",
                      tierFrameGradients[player.tier],
                      "shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
                    )}
                  >
                    <NextImageFallback
                      src={teamLogoUrl}
                      alt={player.team || "Team logo"}
                      width={28}
                      height={28}
                      className="rounded-full bg-neutral-900 p-0.5"
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-100 tracking-wide">
                    {player.team}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Tier Ribbon Badge */}
                  <div className="relative">
                    <div
                      className={cn(
                        "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg",
                        tierAccents[player.tier],
                        tierTextColor[player.tier],
                        tierInnerGlow[player.tier],
                        "shadow-[0_2px_6px_rgba(0,0,0,0.4)]",
                        "relative"
                      )}
                    >
                      {player.tier}
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Player Photo with Enhanced Depth */}
              <div className="relative flex-1 bg-gradient-to-b from-neutral-800 via-neutral-850 to-neutral-900 flex items-center justify-center overflow-hidden">
                {/* Hex pattern background */}
                <div
                  className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    backgroundSize: "30px 30px"
                  }}
                />

                {player.photo ? (
                  <NextImageFallback
                    src={player.photo}
                    alt={`${player.name} player photo`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="text-6xl text-gray-700 font-bold blur-[1px] opacity-40">
                    ?
                  </div>
                )}

                {/* Points Badge - Floating Circle over Avatar (Lower Right) */}
                {player.points !== undefined && player.points !== 0 && (
                  <div
                    className={cn(
                      "absolute bottom-5 right-3 z-20 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg border-2",
                      player.points > 0
                        ? "bg-green-600/90 border-green-400/50"
                        : "bg-red-600/90 border-red-400/50"
                    )}
                  >
                    <p className="text-[10px] font-black text-white leading-tight text-center">
                      {player.points > 0 ? "+" : ""}
                      {player.points}p
                    </p>
                  </div>
                )}

                {/* Radial spotlight effect */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_40%,rgba(0,0,0,0.4)_100%)]" />

                {/* Tier-colored overlay */}
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-[0.15]",
                    tierFrameGradients[player.tier],
                    "mix-blend-overlay"
                  )}
                />

                {/* Top vignette */}
                <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/60 to-transparent" />

                {/* Bottom gradient for name banner */}
                <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black via-black/70 to-transparent" />
              </div>

              {/* Premium Player Name Banner */}
              <div className="relative -mt-7 z-10 px-2">
                <div
                  className={cn(
                    "relative px-4 py-2.5 bg-gradient-to-r rounded-xl",
                    tierFrameGradients[player.tier],
                    tierInnerGlow[player.tier],
                    "shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                  )}
                >
                  {/* Inner shadow for depth */}
                  <div className="absolute inset-0 shadow-[inset_0_-2px_8px_rgba(0,0,0,0.3)] rounded-xl" />

                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-transparent rounded-xl" />

                  <div
                    className={cn(
                      "relative font-black text-lg text-center uppercase tracking-[0.1em] truncate",
                      tierTextColor[player.tier],
                      tierTextGlow[player.tier]
                    )}
                  >
                    {player.name}
                  </div>
                </div>
              </div>

              {/* Premium Stats Section with Hierarchy */}
              <div className="relative px-3 py-3 bg-gradient-to-b from-neutral-900 via-neutral-850 to-neutral-900">
                {/* Subtle background blur for readability */}
                <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" />

                <div className="relative grid grid-cols-3 gap-0">
                  {/* Rating */}
                  <div className="text-center px-2">
                    <div className="text-[9px] text-gray-500 uppercase tracking-[0.15em] font-black mb-1.5 letterspacing-wider">
                      Rating
                    </div>
                    <div
                      className={cn(
                        "text-xl font-black tracking-tight",
                        tierStatHighlight[player.tier],
                        "drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]"
                      )}
                    >
                      {player.stats.rating.toFixed(2)}
                    </div>
                  </div>

                  {/* Vertical Separator */}
                  <div className="relative text-center px-2 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-px before:bg-gradient-to-b before:from-transparent before:via-neutral-600 before:to-transparent after:absolute after:right-0 after:top-1 after:bottom-1 after:w-px after:bg-gradient-to-b after:from-transparent after:via-neutral-600 after:to-transparent">
                    <div className="text-[9px] text-gray-500 uppercase tracking-[0.15em] font-black mb-1.5">
                      K/D
                    </div>
                    <div
                      className={cn(
                        "text-xl font-black tracking-tight",
                        tierStatHighlight[player.tier],
                        "drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]"
                      )}
                    >
                      {player.stats.kd.toFixed(2)}
                    </div>
                  </div>

                  {/* Kills */}
                  <div className="text-center px-2">
                    <div className="text-[9px] text-gray-500 uppercase tracking-[0.15em] font-black mb-1.5">
                      Kills
                    </div>
                    <div
                      className={cn(
                        "text-xl font-black tracking-tight",
                        tierStatHighlight[player.tier],
                        "drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]"
                      )}
                    >
                      {player.stats.kills}
                    </div>
                  </div>
                </div>
              </div>

              {/* Premium Footer with Better Alignment */}
              <div className="flex items-center justify-between gap-3 px-3 py-3 bg-gradient-to-t from-black via-neutral-900 to-neutral-800">
                <div className="flex-1">
                  <div className="text-[9px] text-gray-500 uppercase tracking-[0.15em] font-black mb-0.5">
                    Value
                  </div>
                  <div className="font-black text-lg text-green-400/90 drop-shadow-[0_0_6px_rgba(74,222,128,0.4)]">
                    €{(player.value / 1000).toFixed(0)}K
                  </div>
                </div>

                {/* Collectible-style Button */}
                <button
                  onClick={handleAddClick}
                  disabled={isDisabled}
                  className={cn(
                    "relative px-4 py-2 font-black uppercase tracking-[0.1em] text-[10px] transition-all duration-200 rounded-lg",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    !isDisabled && [
                      "bg-gradient-to-br shadow-[0_4px_10px_rgba(0,0,0,0.4)]",
                      tierFrameGradients[player.tier],
                      tierTextColor[player.tier],
                      tierInnerGlow[player.tier],
                      "hover:scale-105 hover:shadow-[0_6px_14px_rgba(0,0,0,0.5)]",
                      "active:scale-95"
                    ],
                    isDisabled &&
                      "bg-neutral-800 text-gray-500 border border-neutral-700"
                  )}
                >
                  {/* Button shine overlay */}
                  {!isDisabled && (
                    <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-transparent rounded-lg" />
                  )}
                  <span className="relative z-10">
                    {!canAfford ? "No Funds" : "Add"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Back of Card - Detailed Stats */}
        <div className="absolute inset-0 rotate-y-180 backface-hidden">
          {/* Premium Frame with Shadow */}
          <div
            className={cn(
              "relative p-[4px] h-full bg-gradient-to-b rounded-2xl",
              tierFrameGradients[player.tier],
              tierCardShadow[player.tier],
              tierInnerGlow[player.tier],
              "transition-all duration-300"
            )}
          >
            {/* Inner Border */}
            <div
              className={cn(
                "absolute inset-[4px] border border-black/40 rounded-[14px]",
                "pointer-events-none"
              )}
            />

            {/* Inner Card */}
            <div className="relative bg-neutral-900 h-full w-full flex flex-col overflow-hidden rounded-[14px]">
              {/* Header */}
              <div className="p-3 bg-gradient-to-r from-neutral-800/80 to-neutral-900/80">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "p-0.5 rounded-full bg-gradient-to-br",
                      tierFrameGradients[player.tier]
                    )}
                  >
                    <NextImageFallback
                      src={teamLogoUrl}
                      alt={player.team || "Team logo"}
                      width={32}
                      height={32}
                      className="rounded-full bg-neutral-900"
                    />
                  </div>
                  <div className="flex-1">
                    <div
                      className={cn(
                        "font-black text-base uppercase tracking-wide truncate",
                        player.tier === "gold"
                          ? "text-yellow-400"
                          : player.tier === "silver"
                            ? "text-gray-300"
                            : "text-amber-500"
                      )}
                    >
                      {player.name}
                    </div>
                    <div className="text-xs text-gray-400 font-semibold">
                      {player.team}
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="flex-1 p-3 space-y-3 bg-gradient-to-b from-neutral-900 to-neutral-800">
                <div
                  className={cn(
                    "text-center py-2 px-3 font-black text-xs uppercase tracking-widest rounded-lg",
                    tierAccents[player.tier],
                    tierTextGlow[player.tier]
                  )}
                >
                  Kana Rating 3.0
                </div>

                {/* Main Stats Grid - Smaller */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-neutral-800/80 backdrop-blur-sm rounded-lg p-2 text-center border border-neutral-700/50">
                    <div
                      className={cn(
                        "text-xl font-black",
                        player.tier === "gold"
                          ? "text-yellow-400"
                          : player.tier === "silver"
                            ? "text-gray-300"
                            : "text-amber-500",
                        tierTextGlow[player.tier]
                      )}
                    >
                      {player.stats.rating.toFixed(2)}
                    </div>
                    <div className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-wider font-bold">
                      Rating
                    </div>
                  </div>

                  <div className="bg-neutral-800/80 backdrop-blur-sm rounded-lg p-2 text-center border border-neutral-700/50">
                    <div
                      className={cn(
                        "text-xl font-black",
                        player.tier === "gold"
                          ? "text-yellow-400"
                          : player.tier === "silver"
                            ? "text-gray-300"
                            : "text-amber-500",
                        tierTextGlow[player.tier]
                      )}
                    >
                      {player.stats.kd.toFixed(2)}
                    </div>
                    <div className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-wider font-bold">
                      K/D
                    </div>
                  </div>
                </div>

                {/* Secondary Stats - Smaller */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-neutral-800/80 backdrop-blur-sm rounded-lg p-2 text-center border border-green-900/30">
                    <div className="text-base font-black text-green-400 drop-shadow-[0_0_6px_rgba(74,222,128,0.6)]">
                      {player.stats.kills}
                    </div>
                    <div className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-wider font-bold">
                      Kills
                    </div>
                  </div>

                  <div className="bg-neutral-800/80 backdrop-blur-sm rounded-lg p-2 text-center border border-red-900/30">
                    <div className="text-base font-black text-red-400 drop-shadow-[0_0_6px_rgba(248,113,113,0.6)]">
                      {player.stats.deaths}
                    </div>
                    <div className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-wider font-bold">
                      Deaths
                    </div>
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="space-y-2">
                  {/* Headshot % and KAST */}
                  <div className="grid grid-cols-2 gap-2">
                    {player.stats.headshotPercentage > 0 && (
                      <div className="bg-neutral-800/60 rounded-lg p-2 border border-neutral-700/30">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                            HS%
                          </span>
                          <span className="text-base font-black text-orange-400">
                            {player.stats.headshotPercentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                    {player.stats.kast && (
                      <div className="bg-neutral-800/60 rounded-lg p-2 border border-neutral-700/30">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">
                            KAST
                          </span>
                          <span className="text-base font-black text-cyan-400">
                            {player.stats.kast.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Flash Assists, FK/FD, ADR (T), ADR (CT) - 2 columns, value on top */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* Flash Assists */}
                    <div className="bg-neutral-800/60 rounded-lg p-2 border border-neutral-700/30 text-center">
                      <div className="text-base font-black text-yellow-400 mb-0.5">
                        {player.stats.flashAssists}
                      </div>
                      <div className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">
                        Flash Assists
                      </div>
                    </div>

                    {/* FK / FD */}
                    {player.stats.firstKills !== undefined &&
                      player.stats.firstDeaths !== undefined && (
                        <div className="bg-neutral-800/60 rounded-lg p-2 border border-neutral-700/30 text-center">
                          <div className="text-base font-black text-pink-400 mb-0.5">
                            {player.stats.firstKills} /{" "}
                            {player.stats.firstDeaths}
                          </div>
                          <div className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">
                            FK / FD
                          </div>
                        </div>
                      )}

                    {/* ADR (T) */}
                    {player.stats.adrT && (
                      <div className="bg-neutral-800/60 rounded-lg p-2 border border-amber-900/30 text-center">
                        <div className="text-base font-black text-amber-400 mb-0.5">
                          {player.stats.adrT.toFixed(1)}
                        </div>
                        <div className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">
                          ADR (T)
                        </div>
                      </div>
                    )}

                    {/* ADR (CT) */}
                    {player.stats.adrCT && (
                      <div className="bg-neutral-800/60 rounded-lg p-2 border border-blue-900/30 text-center">
                        <div className="text-base font-black text-blue-400 mb-0.5">
                          {player.stats.adrCT.toFixed(1)}
                        </div>
                        <div className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">
                          ADR (CT)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-3 bg-gradient-to-t from-black via-neutral-900 to-neutral-800">
                <button
                  onClick={handleAddClick}
                  disabled={isDisabled}
                  className={cn(
                    "relative w-full px-4 py-2.5 font-black uppercase tracking-[0.1em] text-[10px] transition-all duration-200 rounded-lg",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    !isDisabled && [
                      "bg-gradient-to-br shadow-[0_4px_10px_rgba(0,0,0,0.4)]",
                      tierFrameGradients[player.tier],
                      tierTextColor[player.tier],
                      tierInnerGlow[player.tier],
                      "hover:scale-[1.02] hover:shadow-[0_6px_14px_rgba(0,0,0,0.5)]",
                      "active:scale-[0.98]"
                    ],
                    isDisabled &&
                      "bg-neutral-800 text-gray-500 border border-neutral-700"
                  )}
                >
                  {/* Button shine overlay */}
                  {!isDisabled && (
                    <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-transparent to-transparent rounded-lg" />
                  )}
                  <span className="relative z-10">
                    {!canAfford
                      ? `No Funds - €${(player.value / 1000).toFixed(0)}K`
                      : `Add - €${(player.value / 1000).toFixed(0)}K`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
