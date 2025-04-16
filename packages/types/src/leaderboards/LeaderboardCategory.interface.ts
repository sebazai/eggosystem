import { LeaderboardPlayer } from "@eggosystem/types";

export type LeaderboardCategory = {
  title: string;
  unit: string;
  players: LeaderboardPlayer[];
};
