import React from "react";

import { PlayerDetailsHeader } from "./PlayerDetailsHeader";
import { PlayerMatchHistoryTable } from "./PlayerMatchHistoryTableWrapper";
import { PlayerStatCardsSection } from "./PlayerStatCardsSection";
import { PlayerTrophies } from "./PlayerTrophies";

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
