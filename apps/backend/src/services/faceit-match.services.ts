import {
  type FaceitMatchStatsResponse,
  type MatchDemoReadyWebhook,
  type ChampionshipDetailsDemoReady
} from "@eggosystem/types";
import { redisClient, expireInOneDay } from "../utils/redisClient";
import { logger } from "../utils/app-logger";
import { getHubMatchesByExternalMatchRoomId } from "../models/match.models";
import {
  getMatchGameByDemoUrl,
  upsertMatchGameForMatch
} from "../models/match-game.models";
import { parseFaceitDemoUrl } from "../utils/faceit-demo-url-parser";
import { getConnection } from "../db/mysqlConnection";
import { getMatchPickedMapsOrderedByVetoOrder } from "../models/match-team-map-veto.models";

export const getFaceITMatchDetails = async <T>(match_id: string) => {
  const webURL = `https://open.faceit.com/data/v4/matches/${match_id}`;
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${process.env.FACEIT_API_KEY}`
  };
  const response = await fetch(webURL, { headers });
  return response.json() as Promise<T>;
};

export const getDemoDownloadUrl = async (matchGameDemoUrl: string) => {
  const demoAPI = "https://open.faceit.com/download/v2/demos/download";
  const demoHeaders = {
    Accept: "application/json",
    Authorization: `Bearer ${process.env.FACEIT_API_KEY}`
  };

  const response = await fetch(demoAPI, {
    method: "POST",
    headers: demoHeaders,
    body: JSON.stringify({
      resource_url: matchGameDemoUrl
    })
  });

  if (!response.ok) {
    throw new Error(
      `Failed to get demo download URL: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  return data.payload.download_url;
};

export const getFaceitMatchStats = async (match_id: string) => {
  if (!process.env.FACEIT_API_KEY) {
    throw new Error("FACEIT_API_KEY environment variable is required");
  }

  const redisKey = `faceit-match-stats-${match_id}`;
  const cached = await redisClient.get(redisKey);
  if (cached) {
    return JSON.parse(cached) as FaceitMatchStatsResponse;
  }

  const webURL = `https://open.faceit.com/data/v4/matches/${match_id}/stats`;
  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${process.env.FACEIT_API_KEY}`
  };
  const response = await fetch(webURL, { headers });
  if (!response.ok) {
    throw new Error(
      `Faceit API returned ${response.status}: ${response.statusText}`
    );
  }
  const data: FaceitMatchStatsResponse = await response.json();
  const best_of_regular = data.rounds.length.toString();
  if (data.rounds && data.rounds.some((r) => r.best_of === best_of_regular)) {
    await redisClient.set(redisKey, JSON.stringify(data), "EX", expireInOneDay);
  }
  return data;
};

export const addFaceitMatchGameToDatabase = async (
  webhookData: MatchDemoReadyWebhook,
  matchDetails: ChampionshipDetailsDemoReady,
  isRoundRobinBo2As2xBo1: boolean = false
) => {
  const { demo_url } = webhookData.payload;
  const { match_id: externalMatchRoomId } = matchDetails;

  return resolveOrCreateMatchGameIdForDemoUrl({
    externalMatchRoomId,
    demoUrl: demo_url,
    isRoundRobinBo2As2xBo1
  });
};

export const resolveOrCreateMatchGameIdForDemoUrl = async (input: {
  externalMatchRoomId: string;
  demoUrl: string;
  isRoundRobinBo2As2xBo1?: boolean;
}): Promise<number> => {
  const {
    externalMatchRoomId,
    demoUrl,
    isRoundRobinBo2As2xBo1 = false
  } = input;

  const gameWithDemo = await getMatchGameByDemoUrl(demoUrl);

  if (gameWithDemo) {
    return gameWithDemo.id;
  }

  const parsedDemoUrl = parseFaceitDemoUrl(demoUrl);
  if (!parsedDemoUrl) {
    throw new Error(`Invalid faceit demo url: ${demoUrl}`);
  }

  const matches = await getHubMatchesByExternalMatchRoomId(externalMatchRoomId);

  if (!matches || matches.length === 0) {
    throw new Error(
      `No matches found when adding match games with match_id: ${externalMatchRoomId}`
    );
  }

  const match = matches[0];

  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    const mapPlayedNumber = parsedDemoUrl.mapNumber;
    const matchMapVetoes = await getMatchPickedMapsOrderedByVetoOrder(
      match.id,
      connection
    );
    const mapPlayedVoteObject = matchMapVetoes[mapPlayedNumber - 1];

    if (isRoundRobinBo2As2xBo1 && matches.length === 2) {
      if (matchMapVetoes.length !== 2) {
        throw new Error("Something is very wrong with this 2xBO1");
      }

      const matchObject = matches[mapPlayedNumber - 1];
      if (!matchObject) {
        throw new Error("Could not find match object for 2xBO1 matches");
      }

      const insertedRow = await upsertMatchGameForMatch({
        match_id: matchObject.id,
        map_id: mapPlayedVoteObject.map_id,
        map_order: mapPlayedNumber,
        demo_file: demoUrl,
        connection
      });
      await connection.commit();

      return insertedRow.insertId;
    }

    if (!mapPlayedVoteObject) {
      logger.error(
        `Could not find map played vote object for match ${externalMatchRoomId}, map played in: ${mapPlayedNumber - 1}, matchMapVetoes: ${JSON.stringify(matchMapVetoes)}`
      );
      throw new Error(
        `Could not find map played vote object for match_id: ${externalMatchRoomId}`
      );
    }

    const insertedRow = await upsertMatchGameForMatch({
      match_id: match.id,
      map_id: mapPlayedVoteObject.map_id,
      map_order: mapPlayedNumber,
      demo_file: demoUrl,
      connection
    });

    await connection.commit();
    return insertedRow.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const resolveOrCreateMatchGameIdForHubMatchDemo = async (input: {
  matchId: number;
  demoUrl: string;
  mapOrder?: number;
}): Promise<number> => {
  const { matchId, demoUrl, mapOrder } = input;

  const existingByDemo = await getMatchGameByDemoUrl(demoUrl);
  if (existingByDemo) {
    return existingByDemo.id;
  }

  const parsedDemoUrl = parseFaceitDemoUrl(demoUrl);
  const effectiveMapOrder = mapOrder ?? parsedDemoUrl?.mapNumber;
  if (!effectiveMapOrder || effectiveMapOrder < 1) {
    throw new Error(
      "Cannot resolve map order from demo URL; provide map_order explicitly"
    );
  }

  const connection = await getConnection();
  try {
    await connection.beginTransaction();
    const matchMapVetoes = await getMatchPickedMapsOrderedByVetoOrder(
      matchId,
      connection
    );
    const mapPlayedVoteObject = matchMapVetoes[effectiveMapOrder - 1];
    if (!mapPlayedVoteObject) {
      throw new Error(
        `Could not find map veto row for match_id=${matchId} map_order=${effectiveMapOrder}`
      );
    }
    const insertedRow = await upsertMatchGameForMatch({
      match_id: matchId,
      map_id: mapPlayedVoteObject.map_id,
      map_order: effectiveMapOrder,
      demo_file: demoUrl,
      connection
    });
    await connection.commit();
    return insertedRow.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
