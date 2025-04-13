"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

interface PlayerDetailsProps {
  params: {
    playerId: string;
  };
}

export default function PlayerDetailsPage({ params }: PlayerDetailsProps) {
  const playerId = decodeURIComponent(params.playerId);

  // This would be replaced with actual data fetching in the future
  const playerData = {
    nickname: playerId,
    team_name: "Example Team",
    team_logo: "/teams/nologo.svg",
    matches_played: 25,
    kills: 325,
    deaths: 280,
    assists: 102,
    kd: 1.16,
    adr: 85.4,
    hs_percent: 42.3,
    kana_rating: 1.12
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/players" className="flex items-center gap-2">
            <ChevronLeft size={16} />
            Back to Players
          </Link>
        </Button>
      </div>

      <div className="bg-card rounded-md overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-kanaliiga-light-brown/20 rounded-full flex items-center justify-center text-3xl font-bold">
              {playerData.nickname.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{playerData.nickname}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Image
                  src={playerData.team_logo}
                  alt={playerData.team_name}
                  width={20}
                  height={20}
                  className="rounded-full"
                />
                <span className="text-muted-foreground">
                  {playerData.team_name}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Player Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Matches"
              value={playerData.matches_played.toString()}
            />
            <StatCard label="Kills" value={playerData.kills.toString()} />
            <StatCard label="Deaths" value={playerData.deaths.toString()} />
            <StatCard label="Assists" value={playerData.assists.toString()} />
            <StatCard label="K/D Ratio" value={playerData.kd.toFixed(2)} />
            <StatCard label="ADR" value={playerData.adr.toFixed(1)} />
            <StatCard
              label="HS%"
              value={`${playerData.hs_percent.toFixed(1)}%`}
            />
            <StatCard
              label="Rating"
              value={playerData.kana_rating.toFixed(2)}
            />
          </div>

          <div className="mt-8">
            <p className="text-center text-muted-foreground">
              More detailed statistics and match history will be available soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="bg-kanaliiga-light-brown/10 p-4 rounded-md">
      <div className="text-muted-foreground text-sm">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}
