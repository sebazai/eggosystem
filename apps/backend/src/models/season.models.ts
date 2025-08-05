import type {
  SeasonDetails,
  Season,
  ActiveSeasonSignupForAppId,
  ActiveSignupOrSeasonForAppId
} from "@eggosystem/types";
import { runQuery } from "../db/mysqlRunQuery";

export const getSeasons = async () => {
  return runQuery<Season[]>("SELECT * FROM Seasons");
};

export const getSeasonById = async (id: number) => {
  const [data] = await runQuery<[Season | undefined]>(
    "SELECT * FROM Seasons WHERE id = ?",
    [id]
  );
  return data;
};

export const getSeasonDetailsById = async (id: number) => {
  const [data] = await runQuery<Array<SeasonDetails | undefined>>(
    "SELECT s.*, g.app_id FROM Seasons s JOIN Games g ON s.game_id = g.id WHERE s.id = ?",
    [id]
  );
  return data;
};

export const getActiveOrLatestSeasonForAppId = async (app_id: number) => {
  const [activeSeason] = await runQuery<
    Array<{ season_id: number } | undefined>
  >(
    `SELECT s.id AS season_id
     FROM Seasons s
     JOIN Games g ON s.game_id = g.id
     WHERE g.app_id = ?
     AND (
         (s.start_date <= NOW() AND (s.end_date IS NULL OR s.end_date >= NOW()))
         OR s.id = (
            SELECT MAX(s2.id)
            FROM Seasons s2 
            JOIN Games g2 ON s2.game_id = g2.id 
            WHERE g2.app_id = ?
            AND s2.end_date IS NOT NULL
            AND s2.end_date < NOW()
         )
     )
     ORDER BY s.id DESC
     LIMIT 1;`,
    [app_id, app_id]
  );
  return activeSeason;
};

export const getActiveSeasonForAppId = async (app_id: number) => {
  const [activeSeason] = await runQuery<
    Array<{ season_id: number } | undefined>
  >(
    `SELECT s.id AS season_id
     FROM Seasons s
     JOIN Games g ON s.game_id = g.id
     WHERE g.app_id = ?
     AND s.start_date <= NOW() AND (s.end_date IS NULL OR s.end_date >= NOW())
     ORDER BY s.id DESC
     LIMIT 1;`,
    [app_id, app_id]
  );
  return activeSeason;
};

export const getActiveSignupSeasonForAppId = async (app_id: number) => {
  const [activeSignupSeason] = await runQuery<
    Array<ActiveSeasonSignupForAppId | undefined>
  >(
    `SELECT s.id AS season_id, s.platform, s.signup_end_date, s.full_name
     FROM Seasons s
     JOIN Games g ON s.game_id = g.id
     WHERE g.app_id = ? AND s.start_date >= NOW() AND s.signup_start_date <= NOW() AND (s.signup_end_date IS NULL OR s.signup_end_date >= NOW())
     ORDER BY s.id DESC
     LIMIT 1;`,
    [app_id]
  );
  return activeSignupSeason;
};

export const getActiveSignupOrActiveSeasonForAppId = async (app_id: number) => {
  const [activeSignupOrActiveSeason] = await runQuery<
    Array<ActiveSignupOrSeasonForAppId | undefined>
  >(
    `SELECT s.id AS season_id, s.platform, s.signup_end_date, s.full_name
     FROM Seasons s
     JOIN Games g ON s.game_id = g.id
     WHERE g.app_id = ? AND s.end_date >= NOW() OR  s.signup_end_date >= NOW()
     ORDER BY s.id DESC
     LIMIT 1;`,
    [app_id]
  );
  return activeSignupOrActiveSeason;
};
