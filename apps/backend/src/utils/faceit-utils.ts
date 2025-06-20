import { getMonthDifference } from "./date-utils";
import { BadRequestError } from "./errors";

export const FACEIT_DEFAULT_ELO = 750;
export const FACEIT_DEFAULT_KD = 0.95;

export const faceitEloToLevel = (elo: number) => {
  if (elo >= 2001) return 10;
  if (elo >= 1751) return 9;
  if (elo >= 1531) return 8;
  if (elo >= 1351) return 7;
  if (elo >= 1201) return 6;
  if (elo >= 1051) return 5;
  if (elo >= 901) return 4;
  if (elo >= 751) return 3;
  if (elo >= 501) return 2;
  if (elo >= 100) return 1;
  throw new BadRequestError("Invalid FaceIT ELO");
};

export const applyDecay = (
  last_value: number,
  decay_threshold_value: number,
  last_match: number
) => {
  const clamp = (num: number, min: number) => Math.max(num, min);
  const currentTime = new Date().getTime();
  const monthsDiff = getMonthDifference(last_match, currentTime);

  let decay = 0;

  if (monthsDiff >= 6) decay = last_value * 0.05; // 5%
  if (monthsDiff >= 12) decay = last_value * 0.1; // 10%
  if (monthsDiff >= 18) decay = last_value * 0.2; // 20%

  // We do not want to decay ranks that are below the threshold value
  if (decay_threshold_value > last_value) {
    decay_threshold_value = last_value;
  }

  return clamp(last_value - Math.round(decay), decay_threshold_value);
};
