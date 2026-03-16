import type { Season, Team, League, Nullable } from "@eggosystem/types";

export interface SeasonLeagueTeam {
  season_id: Season["id"];
  team_id: Team["id"];
  league_id: League["id"];
  placement: Nullable<number>;
  position_offset: Nullable<number>;
  /** Bracket seed for playoffs (1 = first seed). Distinct from placement (winner/2nd/3rd). */
  playoff_seed?: Nullable<number>;
}
