"use client";

import React from "react";

import { PlayerMatchHistoryTable } from "./PlayerMatchHistoryTableWrapper";
import { PlayerStatCardsSection } from "./PlayerStatCardsSection";
import { PlayerTrophies } from "./PlayerTrophies";

interface PlayerSummaryProps {
  steamId: string;
}

export const PlayerSummary = ({ steamId }: PlayerSummaryProps) => {
  return (
    <div>
      <PlayerTrophies steamId={steamId} />
      <PlayerStatCardsSection steamId={steamId} />
      <PlayerMatchHistoryTable steamId={steamId} />
    </div>
  );
};
