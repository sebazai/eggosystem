import { Game, Season } from "@eggosystem/types";

export interface SeasonDetails extends Season {
  steam_app_id: Game["steam_app_id"];
}
