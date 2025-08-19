import { type Request, type Response } from "express";
import { redisClient } from "../../utils/redisClient";
import { type FlaggedMatches } from "@eggosystem/types";

export const getFlaggedMatchesController = async (
  req: Request,
  res: Response
) => {
  const keys = await redisClient.keys("match:invalid_players:*");
  const matches = await Promise.all(
    keys.map(async (key) => {
      const value = await redisClient.get(key);
      if (!value) {
        return null;
      }
      return JSON.parse(value) as FlaggedMatches;
    })
  );
  res.json({
    matches: matches.filter((match): match is FlaggedMatches => match !== null)
  });
};
