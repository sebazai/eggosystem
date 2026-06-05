import { getPrimaryPlayersForTeam } from "../models/season-team-players.models";
import { getSeasonByIdOrThrow } from "../models/season.models";
import { BadRequestError } from "../utils/errors";

export const ensureSeasonMaxPlayersForTeam = async (
  seasonId: number,
  teamId: number,
  { excludeSteamId = false }: { excludeSteamId?: boolean } = {}
) => {
  const primaryPlayers = await getPrimaryPlayersForTeam(teamId, seasonId);
  const season = await getSeasonByIdOrThrow(seasonId);
  const maxPlayersForSeason = season.max_players;

  if (primaryPlayers.length - (excludeSteamId ? 1 : 0) >= maxPlayersForSeason) {
    throw new BadRequestError(
      `Team ${teamId} already has the maximum number of players (${maxPlayersForSeason})`
    );
  }
};
