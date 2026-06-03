import { SteamPlayer, PlayerStats, Team } from "../db";

export interface GamePlayerStats {
  steam_id: SteamPlayer["steam_id"];
  nickname: SteamPlayer["nickname"];
  team_id: Team["id"];
  kills: PlayerStats["kills"];
  headshots: PlayerStats["headshots"];
  assists: PlayerStats["assists"];
  flash_assists: PlayerStats["flash_assists"];
  deaths: PlayerStats["deaths"];
  kast_percentage: PlayerStats["kast"];
  adr: PlayerStats["adr"];
  enemies_flashed: PlayerStats["enemies_flashed"];
  hs_percent: PlayerStats["hs_percent"];
  kana_rating: PlayerStats["kana_rating"];
  first_kills: PlayerStats["first_kills"];
  first_deaths: PlayerStats["first_deaths"];
  shots: PlayerStats["shots"];
  shots_hit: PlayerStats["shots_hit"];
  total_strafing_shots: PlayerStats["total_strafing_shots"];
  good_strafing_shots: PlayerStats["good_strafing_shots"];
  ttd: PlayerStats["ttd"];
  time_to_kill: PlayerStats["ttf"];
  crosshair_placement: PlayerStats["crosshair_placement"];
}
