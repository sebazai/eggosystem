import type { Season, Team, League, Nullable } from "@eggosystem/types";

export interface SeasonLeagueTeam {
  season_id: Season["id"];
  team_id: Team["id"];
  league_id: League["id"];
  placement: Nullable<number>;
  position_offset: Nullable<number>;
}
