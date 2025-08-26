import { getActiveSeasonForAppId } from "../models/season.models";

export const getActiveOrPassedSeasonId = async (seasonId: string) => {
  if (seasonId === "active") {
    const activeSeasonId = await getActiveSeasonForAppId(1, 730);
    if (activeSeasonId?.season_id) {
      return activeSeasonId.season_id;
    }
    throw new Error("No active season found");
  }
  const seasonParseInt = parseInt(seasonId);
  if (isNaN(seasonParseInt)) {
    throw new Error("Invalid season ID");
  }
  if (seasonParseInt < 0) {
    throw new Error("Invalid season ID");
  }
  return seasonParseInt;
};
