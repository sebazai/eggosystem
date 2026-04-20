import {
  type FaceITTeamDetails,
  type ChampionshipSubscription,
  type ChampionshipSubscriptionItem
} from "@eggosystem/types";
import { redisClient, expireInOneDay } from "../utils/redisClient";
import { logger } from "../utils/app-logger";
import { fetchAllItemsWithPagination } from "../utils/pagination-utils";
import {
  getPlayerByFaceitId,
  updateSteamPlayerFaceitData
} from "../models/player.models";
import { getFaceitPlayerDetails } from "./faceit-player.services";

export const getFaceITTeamDetails = async (faceit_team_id: string) => {
  const redisKey = `faceit-team-${faceit_team_id}`;
  const redisData = await redisClient.get(redisKey);
  if (redisData) {
    return JSON.parse(redisData) as FaceITTeamDetails;
  }
  const webURL = `https://open.faceit.com/data/v4/teams/${faceit_team_id}`;
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${process.env.FACEIT_API_KEY}`
  };
  const response = await fetch(webURL, { headers });
  if (!response.ok) {
    return undefined;
  }
  const data: FaceITTeamDetails = await response.json();
  await redisClient.set(redisKey, JSON.stringify(data), "EX", expireInOneDay);
  return data;
};

export const getFaceITChampionshipDetails = async <T>(
  championship_id: string
) => {
  const webURL = `https://open.faceit.com/data/v4/championships/${championship_id}`;
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${process.env.FACEIT_API_KEY}`
  };
  const response = await fetch(webURL, { headers });
  return response.json() as Promise<T>;
};

const getFaceITChampionshipSubscriptions = async (
  championship_id: string,
  offset: number = 0,
  limit: number = 10
) => {
  const webURL = `https://open.faceit.com/data/v4/championships/${championship_id}/subscriptions?offset=${offset}&limit=${limit}`;
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${process.env.FACEIT_API_KEY}`
  };
  const response = await fetch(webURL, { headers });
  return response.json() as Promise<ChampionshipSubscription>;
};

/**
 * Fetches ALL championship subscriptions by automatically handling pagination.
 * Returns the same data structure but with all items combined.
 */
export const getAllFaceITChampionshipSubscriptions = async (
  championship_id: string
): Promise<ChampionshipSubscription> => {
  const firstResponse = await getFaceITChampionshipSubscriptions(
    championship_id,
    0,
    10
  );

  if (firstResponse.items.length < 10) {
    return firstResponse;
  }

  const remainingItems = await fetchAllItemsWithPagination<
    ChampionshipSubscription,
    ChampionshipSubscriptionItem
  >(
    (offset: number, limit: number) =>
      getFaceITChampionshipSubscriptions(championship_id, offset, limit),
    "items",
    10,
    10
  );

  const allItems = [...firstResponse.items, ...remainingItems];

  return {
    ...firstResponse,
    items: allItems,
    start: 0,
    end: allItems.length
  };
};

interface ChampionshipTeamMember {
  faceit_user_id: string;
  nickname: string;
  steam_id: string | null;
}

interface ChampionshipTeamWithMembers {
  team_id: string;
  team_name: string;
  members: ChampionshipTeamMember[];
}

/**
 * Fetches all teams in a championship with full member details including Steam IDs.
 */
export const getChampionshipTeamsWithMembers = async (
  championship_id: string
): Promise<ChampionshipTeamWithMembers[]> => {
  logger.info(
    `[FaceIT] Fetching championship teams with members for championship: ${championship_id}`
  );

  const subscriptions =
    await getAllFaceITChampionshipSubscriptions(championship_id);

  const teams = await Promise.all(
    subscriptions.items.map(async (subscription) => {
      logger.info(
        `[FaceIT] Processing team: ${subscription.team.name} with ${subscription.team.members.length} members`
      );

      const teamMembers = await Promise.all(
        subscription.team.members.map(async (member) => {
          const dbPlayer = await getPlayerByFaceitId(member.user_id);

          if (dbPlayer) {
            if (
              member.nickname !== dbPlayer.faceit_nickname &&
              dbPlayer.steam_id
            ) {
              await updateSteamPlayerFaceitData(
                dbPlayer.steam_id,
                member.nickname,
                member.user_id
              );
              logger.info(
                `[FaceIT] Updated faceit_nickname for ${dbPlayer.steam_id}: ${dbPlayer.faceit_nickname} -> ${member.nickname}`
              );
            }

            logger.info(
              `[FaceIT] ✅ Found player in database: ${member.nickname || dbPlayer.faceit_nickname || dbPlayer.nickname} (Steam ID: ${dbPlayer.steam_id})`
            );
            return {
              faceit_user_id: member.user_id,
              nickname:
                member.nickname ||
                dbPlayer.faceit_nickname ||
                dbPlayer.nickname,
              steam_id: dbPlayer.steam_id ? String(dbPlayer.steam_id) : null
            };
          }

          const playerDetails = await getFaceitPlayerDetails(member.user_id);

          if (playerDetails && playerDetails?.games?.cs2) {
            logger.info(
              `[FaceIT] ✅ Got player details from API: ${playerDetails.nickname} (Steam ID: ${playerDetails.games.cs2.game_player_id})`
            );
            return {
              faceit_user_id: member.user_id,
              nickname: playerDetails.nickname,
              steam_id: playerDetails.games.cs2.game_player_id || null
            };
          } else {
            logger.warn(
              `[FaceIT] ❌ Failed to get CS2 Steam ID for: ${member.nickname} (${member.user_id})`
            );
            return {
              faceit_user_id: member.user_id,
              nickname: member.nickname,
              steam_id: null
            };
          }
        })
      );

      logger.info(
        `[FaceIT] Team ${subscription.team.name} final member count: ${teamMembers.length}/${subscription.team.members.length}`
      );

      return {
        team_id: subscription.team.team_id,
        team_name: subscription.team.name,
        members: teamMembers
      };
    })
  );

  return teams;
};
