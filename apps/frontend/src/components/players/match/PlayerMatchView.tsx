"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback } from "react";
import type { MatchInfo } from "@eggosystem/types";
import { PlayerMatchGameView } from "../match-game/PlayerMatchGameView";

interface GameEntry {
  id: number;
  name: string;
  mapOrder: number;
}

interface PlayerMatchViewProps {
  games: GameEntry[];
  steamId: string;
  matchId: number;
  matchInfo: MatchInfo;
  bestOf: number;
}

export const PlayerMatchView = ({
  games,
  steamId,
  matchId,
  matchInfo,
  bestOf
}: PlayerMatchViewProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const gameParam = searchParams.get("game");
  const selectedIdx = (() => {
    if (gameParam) {
      const idx = games.findIndex((g) => String(g.id) === gameParam);
      if (idx !== -1) return idx;
    }
    return 0;
  })();

  const handleMapSelect = useCallback(
    (idx: number) => {
      const game = games[idx];
      if (!game) return;
      const params = new URLSearchParams(searchParams.toString());
      params.set("game", String(game.id));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [games, pathname, router, searchParams]
  );

  const selectedGame = games[selectedIdx];
  if (!selectedGame) return null;

  return (
    <PlayerMatchGameView
      key={selectedGame.id}
      matchId={matchId}
      matchGameId={selectedGame.id}
      steamId={steamId}
      mapName={selectedGame.name}
      matchInfo={matchInfo}
      bestOf={bestOf}
      maps={games}
      selectedMapIdx={selectedIdx}
      onMapSelect={handleMapSelect}
    />
  );
};
