import type { PoolConnection } from "mysql2/promise";
import { insertSeasonTeamRegistration } from "../models/seasonteamregistration.models";
import { insertSeasonTeamPlayer } from "../models/seasonteamplayers.models";

export const signUpTeamForSeason = async (
  data: {
    seasonId: number;
    teamId: number;
    players: {
      steam_id: string;
      is_co_captain?: boolean;
      is_captain?: boolean;
    }[];
    teamExternalId: string;
    defects?: string;
  },
  connection?: PoolConnection
) => {
  const captain = data.players.find((player) => player.is_captain);
  const coCaptain = data.players.find((player) => player.is_co_captain);
  if (!captain || !coCaptain) {
    throw new Error("Captain and co-captain are required");
  }
  await insertSeasonTeamRegistration(
    {
      season_id: data.seasonId,
      team_id: data.teamId,
      captain_steam_id: captain.steam_id,
      co_captain_steam_id: coCaptain.steam_id,
      external_platform_id: data.teamExternalId,
      defects: data.defects
    },
    connection
  );
  for (const player of data.players) {
    await insertSeasonTeamPlayer(
      {
        season_id: data.seasonId,
        team_id: data.teamId,
        steam_id: player.steam_id
      },
      connection
    );
  }
};
