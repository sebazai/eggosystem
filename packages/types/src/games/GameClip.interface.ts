import { MatchGameClip, SteamPlayer } from "../db";

export interface GameClip extends MatchGameClip {
  nickname: SteamPlayer["nickname"];
}
