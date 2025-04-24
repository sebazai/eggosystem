import type { PoolConnection } from "mysql2/promise";
import { insertSeasonTeamPlayer } from "../models/season-team-players.models";
import {
  isFaceITCSRank,
  type PlayerSchemaType,
  SeasonPlatform
} from "@eggosystem/types";
import { getFaceITTeamDetails } from "./faceit.services";
import {
  getPlayerAppIdRank,
  getPlayerHoursForSteamAppId,
  getPlayerRankForPlatform
} from "./player-ranks.services";
import { insertFaceITPlayerRankForSeason } from "../models/season-player-ranks.models";
import { getSeasonDetailsById } from "../models/season.models";
import { areSteamProfilesPublic } from "./steam.services";

export const ensurePlayerSteamProfilesPublic = async (
  players: PlayerSchemaType[]
) => {
  const steamIds = players.map((p) => p.steamId);
  const areProfilePublic = await areSteamProfilesPublic(steamIds);
  if (!areProfilePublic.is_all_public) {
    throw new Error(
      `Steam IDs ${areProfilePublic.not_public.join(", ")} are not public.`
    );
  }
};

export const checkExternalId = async (
  platform: SeasonPlatform,
  teamExternalId?: string
) => {
  const externalIdValid = await isValidExternalId(platform, teamExternalId);

  if (!externalIdValid) {
    throw new Error(
      `Could not find external team data for ${platform.toLocaleUpperCase()} id ${teamExternalId}`
    );
  }
};

export const getValidSeason = async (seasonId: number) => {
  const season = await getSeasonDetailsById(seasonId);
  if (!season) {
    return { status: 404, message: "Season not found" };
  }
  if (!season.signup_start_date) {
    return {
      status: 400,
      message: "Season does not have a signup start date"
    };
  }
  const now = new Date();
  const signupStart = new Date(season.signup_start_date);
  if (now < signupStart) {
    return {
      status: 400,
      message: "Signup has not started yet"
    };
  }
  if (season.signup_end_date) {
    const signupEnd = new Date(season.signup_end_date);
    if (now > signupEnd) {
      return {
        status: 400,
        message: "Signup has ended"
      };
    }
  }
  return season;
};

export const addPlayersForTeamInSeason = async (
  seasonId: number,
  appId: number,
  platform: SeasonPlatform,
  teamId: number,
  players: PlayerSchemaType[],
  connection?: PoolConnection
) => {
  const playersForTeamRegistration = players.map((player) => {
    return {
      steam_id: player.steamId,
      is_captain: player.captain,
      is_co_captain: player.coCaptain
    };
  });
  for (const player of playersForTeamRegistration) {
    await insertSeasonTeamPlayer(
      seasonId,
      teamId,
      {
        steam_id: player.steam_id
      },
      connection
    );
    const [{ rank }, { hours }, externalRank] = await Promise.all([
      getPlayerAppIdRank(player.steam_id, appId),
      getPlayerHoursForSteamAppId(player.steam_id, appId),
      getPlayerRankForPlatform(player.steam_id, platform)
    ]);

    if (isFaceITCSRank(externalRank))
      await insertFaceITPlayerRankForSeason(
        player.steam_id,
        seasonId,
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
