import { Nullable } from "../utils";
import { MatchGame } from "./MatchGame.interface";
import { SteamPlayer } from "./SteamPlayer.interface";

export interface MatchGameClip {
  id: number;
  game_id: MatchGame["id"];
  clip_steam_id: Nullable<SteamPlayer["steam_id"]>;
  clip_status: "Processing" | "Submitted" | "Processed" | "Error";
  clip_type: "potg";
  clip_id: string | null;
  clip_request_id: string | null;
  clip_url: string | null;
  clip_thumbnail_url: string | null;
  clip_snapshot_url: string | null;
  clip_title: string | null;
  clip_length: string | null;
  additional_data: string | null; // JSON string
}
