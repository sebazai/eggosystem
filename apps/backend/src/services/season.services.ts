import { getPrimaryPlayersForTeam } from "../models/season-team-players.models";
import {
  getActiveSeasonForAppId,
  getSeasonByIdOrThrow
} from "../models/season.models";
import { BadRequestError } from "../utils/errors";

export const getActiveOrPassedSeasonId = async (seasonId: string) => {
  if (seasonId === "active") {
    const activeSeasonId = await getActiveSeasonForAppId(1, 730);
    if (activeSeasonId?.season_id) {
      return activeSeasonId.season_id;
    }
    throw new BadRequestError("No active season found");
  }
  const seasonParseInt = parseInt(seasonId);
  if (isNaN(seasonParseInt)) {
    throw new BadRequestError("Invalid season ID");
  }
  if (seasonParseInt < 0) {
    throw new BadRequestError("Invalid season ID");
  }
  return seasonParseInt;
};

export const ensureSeasonMaxPlayersForTeam = async (
  seasonId: number,
  teamId: number,
  {
    maxPlayers = 9,
    excludeSteamId = false
  }: { maxPlayers?: number; excludeSteamId?: boolean } = {}
) => {
  const primaryPlayers = await getPrimaryPlayersForTeam(teamId, seasonId);
  const season = await getSeasonByIdOrThrow(seasonId);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  const maxPlayersForSeason = season.max_players ?? maxPlayers;

  if (primaryPlayers.length - (excludeSteamId ? 1 : 0) >= maxPlayersForSeason) {
    throw new BadRequestError(
      `Team ${teamId} already has the maximum number of players (${maxPlayersForSeason})`
    );
  }
};
