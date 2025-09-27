import { Game } from "./Game.interface";

export interface GameType {
  id: number;
  game_id: Game["id"];
  name: string;
  min_players: number;
  max_players: number;
}
