import React from "react";

import { PlayerDetailsHeader } from "./PlayerDetailsHeader";
import { PlayerMatchHistoryTable } from "./PlayerMatchHistoryTableWrapper";
import { PlayerStatCardsSection } from "./PlayerStatCardsSection";
import { PlayerTrophies } from "./PlayerTrophies";

interface PlayerDetailsProps {
  steamId: string;
  hideHeader?: boolean;
}

export const PlayerDetails = ({
  steamId,
  hideHeader = false
}: PlayerDetailsProps) => {
  return (
    <div>
      {!hideHeader && <PlayerDetailsHeader steamId={steamId} />}
      <PlayerTrophies steamId={steamId} />
      <PlayerStatCardsSection steamId={steamId} />
      <PlayerMatchHistoryTable steamId={steamId} />
    </div>
  );
};
