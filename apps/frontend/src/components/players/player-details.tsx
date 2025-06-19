import React from "react";

import { PlayerDetailsHeader } from "./player-details-header";
import { PlayerMatchHistoryTable } from "./player-match-history-table";
import { PlayerStatCardsSection } from "./player-stat-cards-section";
import { PlayerTrophies } from "./player-trophies";

interface PlayerDetailsProps {
  steamId: string;
}

export const PlayerDetails = ({ steamId }: PlayerDetailsProps) => {
  return (
    <div>
      <PlayerDetailsHeader steamId={steamId} />
      <PlayerTrophies steamId={steamId} />
      <PlayerStatCardsSection steamId={steamId} />
      <PlayerMatchHistoryTable steamId={steamId} />
    </div>
  );
};
