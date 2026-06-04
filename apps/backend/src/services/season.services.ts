import { getPrimaryPlayersForTeam } from "../models/season-team-players.models";
import { getSeasonByIdOrThrow } from "../models/season.models";
import { BadRequestError } from "../utils/errors";

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
