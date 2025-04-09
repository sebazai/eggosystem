import { runQuery } from "../db/mysqlRunQuery";

export const getPlayerHoursForSeason = async (
  steam_id: string,
  season_id: string
) => {
  const [hours] = await runQuery<Array<{ hours: number } | undefined>>(
    "SELECT cs_hours as hours FROM SeasonPlayerRanks WHERE steam_id = ? AND season_id = ? LIMIT 1",
    [steam_id, season_id]
  );

  return hours;
};

export const getPlayerRankForSeason = async (
  steam_id: string,
  season_id: string
) => {
  const [rank] = await runQuery<Array<{ rank: number } | undefined>>(
    "SELECT cs2_rank as rank FROM SeasonPlayerRanks WHERE steam_id = ? AND season_id = ? LIMIT 1",
    [steam_id, season_id]
  );

  return rank;
};
