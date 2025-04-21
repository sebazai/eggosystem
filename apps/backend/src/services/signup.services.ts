import type { PoolConnection } from "mysql2/promise";
import { insertSeasonTeamRegistration } from "../models/seasonteamregistration.models";
import { insertSeasonTeamPlayer } from "../models/seasonteamplayers.models";
import { type SeasonDetails, SeasonPlatform } from "@eggosystem/types";
import { getFaceITTeamDetails } from "./faceit.services";
import {
  getPlayerAppIdRank,
  getPlayerHoursForSteamAppId,
  getPlayerRankForPlatform
} from "./player-ranks.services";
import { insertFaceITPlayerRankForSeason } from "../models/seasonplayerranks.models";

export const signUpTeamForSeason = async (
  data: {
    seasonId: SeasonDetails["id"];
    seasonAppId: SeasonDetails["app_id"];
    seasonPlatform: SeasonDetails["platform"];
    teamId: number;
    players: {
      steam_id: string;
      is_co_captain?: boolean;
      is_captain?: boolean;
    }[];
    teamExternalId?: string;
  },
  connection: PoolConnection
) => {
  const seasonIdString = data.seasonId.toString();
  const seasonAppIdString = data.seasonAppId.toString();
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
      external_platform_id: data.teamExternalId
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
    const [{ rank }, { hours }, externalRank] = await Promise.all([
      getPlayerAppIdRank(player.steam_id, seasonAppIdString),
      getPlayerHoursForSteamAppId(player.steam_id, seasonAppIdString),
      getPlayerRankForPlatform(player.steam_id, data.seasonPlatform)
    ]);
    await insertFaceITPlayerRankForSeason(
      player.steam_id,
      seasonIdString,
      rank,
      hours,
      externalRank,
      connection
    );
  }
};

export const isValidExternalId = async (
  platform: SeasonPlatform,
  id?: string
) => {
  if (platform === SeasonPlatform.Kanaliiga) {
    return true;
  }
  if (platform === SeasonPlatform.FACEIT && id) {
    const data = await getFaceITTeamDetails(id);
    return !!data;
  }
  return false;
};
