import type { SeasonDetails, Season } from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export const getSeasons = async () => {
  return runQuery<Season[]>("SELECT * FROM Seasons");
};

export const getSeasonById = async (id: string) => {
  const [data] = await runQuery<[Season | undefined]>(
    "SELECT * FROM Seasons WHERE id = ?",
    [id]
  );
  return data;
};

export const getSeasonDetailsById = async (id: string) => {
  const [data] = await runQuery<Array<SeasonDetails | undefined>>(
    "SELECT s.*, g.steam_app_id FROM Seasons s JOIN Games g ON s.game_id = g.id WHERE s.id = ?",
    [id]
  );
  return data;
};
