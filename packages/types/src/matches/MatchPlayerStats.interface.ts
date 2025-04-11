import { Player, PlayerStats, Team } from "../db";

export interface MatchPlayerStats {
  player_name: Player["name"];
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
}
