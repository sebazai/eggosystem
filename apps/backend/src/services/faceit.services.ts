import type { FaceITCSRank, FaceITTeamDetails } from "@eggosystem/types";
import {
  redisClient,
  expireIn30Days,
  expireInOneDay
} from "../utils/redisClient";

const getMonthDifference = (timestamp1: number, timestamp2: number) => {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);

  const yearsDiff = date2.getFullYear() - date1.getFullYear();
  const monthsDiff = date2.getMonth() - date1.getMonth();

  return yearsDiff * 12 + monthsDiff;
};

const applyDecay = (
  type: "elo" | "rank",
  last_value: number,
  min_value: number,
  last_match?: number
) => {
  const clamp = (num: number, min: number) => Math.max(num, min);
  if (!last_match) {
    return clamp(last_value, min_value);
  }
  const currentTime = new Date().getTime();
  const monthsDiff = getMonthDifference(last_match, currentTime);

  let decay = 0;

  if (type === "rank") {
    if (monthsDiff >= 3) decay = 1;
    if (monthsDiff >= 8) decay = 2;
    if (monthsDiff >= 12) decay = 3;
  } else if (type === "elo") {
    if (monthsDiff >= 3) decay = last_value * 0.05; // 5%
    if (monthsDiff >= 8) decay = last_value * 0.1; // 10%
    if (monthsDiff >= 12) decay = last_value * 0.15; // 15%
  } else {
    return clamp(last_value, min_value);
  }
  if (min_value > last_value) {
    min_value = last_value;
  }
  return clamp(last_value - decay, min_value);
};

const getFaceITGameRank = async (steam_id: string, game: "cs2" | "csgo") => {
  try {
    const webURL = `https://open.faceit.com/data/v4/players?game=${game}&game_player_id=${steam_id}`;
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${process.env.FACEIT_API_KEY}`
    };
    const response = await fetch(webURL, { headers });
    if (!response.ok) {
      return undefined;
    }
    const data = await response.json();
    const elo = Number(data["games"][game]["faceit_elo"]);
    const rank = Number(data["games"][game]["skill_level"]);
    const player_id = data["player_id"];
    return {
      elo,
      rank,
      player_id
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`Error fetching FaceIT rank for ${steam_id}`, err);
    return null;
  }
};

const getFaceITMetaData = async (
  faceit_player_id: string,
  game: "cs2" | "csgo" = "cs2"
) => {
  try {
    const stats_url = `https://open.faceit.com/data/v4/players/${faceit_player_id}/stats/${game}`;
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${process.env.FACEIT_API_KEY}`
    };
    const statsResponse = await fetch(stats_url, { headers });
    const data = await statsResponse.json();

    const kdr = data["lifetime"]["Average K/D Ratio"];
    const matches_played = data["lifetime"]["Matches"];

    const game_url = `https://open.faceit.com/data/v4/players/${faceit_player_id}/games/${game}/stats`;
    const gameResponse = await fetch(game_url, { headers });
    const gameData = await gameResponse.json();
    const last_match = new Date(
      gameData.items[0]["stats"]["Created At"]
    ).getTime();

    return {
      faceit_kdr: Number(kdr),
      faceit_matches_played: Number(matches_played),
      faceit_last_match: last_match
    };
  } catch (_err) {
    // NO-OP
    return {
      faceit_kdr: 1 / 1.05
    };
  }
};

const getFaceITCSGORank = async (steam_id: string) => {
  const data = await getFaceITGameRank(steam_id, "csgo");
  if (!data) {
    // Fallback to defaults
    return {
      faceit_level: -1,
      faceit_elo: -1,
      faceit_kd: -1,
      faceit_date: new Date().getTime(),
      metadata: {
        faceit_matches_played: undefined,
        faceit_last_match: undefined,
        faceit_decay: false
      }
    } satisfies FaceITCSRank;
  }
  const faceit_metadata = await getFaceITMetaData(data.player_id);
  const decayedRank = applyDecay(
    "rank",
    data.rank,
    5,
    faceit_metadata.faceit_last_match
  );
  const decayedElo = applyDecay(
    "elo",
    data.elo,
    1150,
    faceit_metadata.faceit_last_match
  );
  const returnData = {
    faceit_level: decayedRank,
    faceit_elo: decayedElo,
    faceit_kd: faceit_metadata.faceit_kdr,
    faceit_date: new Date().getTime(),
    metadata: {
      faceit_matches_played: faceit_metadata.faceit_matches_played,
      faceit_last_match: faceit_metadata.faceit_last_match,
      faceit_decay: decayedRank !== data.rank || decayedElo !== data.elo
    }
  } satisfies FaceITCSRank;
  return returnData;
};

export const getFaceITCS2Rank = async (steam_id: string) => {
  const redisKey = `730-${steam_id}-faceit-cs2-rank`;
  const fromRedis = await redisClient.get(redisKey);
  if (fromRedis) {
    return JSON.parse(fromRedis) as FaceITCSRank;
  }
  const faceitRanks = await getFaceITGameRank(steam_id, "cs2");
  if (!faceitRanks) {
    // Fallback to CSGO rank
    const csgoFaceItRank = await getFaceITCSGORank(steam_id);
    await redisClient.set(
      redisKey,
      JSON.stringify(csgoFaceItRank),
      "EX",
      expireIn30Days
    );
    return csgoFaceItRank;
  }
  const faceit_metadata = await getFaceITMetaData(faceitRanks.player_id);
  const returnData = {
    faceit_level: faceitRanks.rank,
    faceit_elo: faceitRanks.elo,
    faceit_kd: faceit_metadata.faceit_kdr,
    faceit_date: new Date().getTime(),
    metadata: {
      faceit_matches_played: faceit_metadata.faceit_matches_played,
      faceit_last_match: faceit_metadata.faceit_last_match,
      faceit_decay: false
    }
  } satisfies FaceITCSRank;
  await redisClient.set(
    redisKey,
    JSON.stringify(returnData),
    "EX",
    expireIn30Days
  );
  return returnData;
};

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
