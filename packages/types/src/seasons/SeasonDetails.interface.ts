import { Game, Season } from "@eggosystem/types";

export interface SeasonDetails extends Season {
  app_id: Game["app_id"];
}
