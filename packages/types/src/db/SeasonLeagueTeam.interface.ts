import type { Season, Team, League } from "@eggosystem/types";

export interface SeasonLeagueTeam {
  season_id: Season["id"];
  team_id: Team["id"];
  league_id: League["id"];
}
