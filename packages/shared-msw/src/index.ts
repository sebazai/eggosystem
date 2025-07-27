import { setupServer, type SetupServerApi } from "msw/node";
import { handlers } from "./handlers";
import {
  leetifyValidSteamId,
  leetifyNotFoundSteamId,
  leetifyNetworkErrorSteamId,
  leetifyInvalidJsonSteamId,
  leetifyNoPremierRankSteamId,
  leetifyInvalidGameDataSteamId,
  leetifyRateLimitSteamId,
  leetifyMultipleGamesSteamId
} from "./leetify/handlers";

import {
  faceitValidSteamId,
  faceitNotFoundSteamId,
  faceitNetworkErrorSteamId,
  faceitInvalidJsonSteamId,
  faceitInvalidGameDataSteamId,
  faceitRateLimitSteamId,
  faceitMultipleGamesSteamId,
  faceitValidSteamIdDecayed,
  faceitCs2EmptyMetadataSteamId
} from "./faceit/test-ids";

import { validMatchDetails } from "./faceit/MatchDetails-handlers";

export const mswServer: SetupServerApi = setupServer(...handlers);
export {
  leetifyValidSteamId,
  leetifyNotFoundSteamId,
  leetifyNetworkErrorSteamId,
  leetifyInvalidJsonSteamId,
  leetifyNoPremierRankSteamId,
  leetifyInvalidGameDataSteamId,
  leetifyRateLimitSteamId,
  leetifyMultipleGamesSteamId,
  faceitValidSteamId,
  faceitValidSteamIdDecayed,
  faceitNotFoundSteamId,
  faceitNetworkErrorSteamId,
  faceitInvalidJsonSteamId,
  faceitInvalidGameDataSteamId,
  faceitRateLimitSteamId,
  faceitMultipleGamesSteamId,
  faceitCs2EmptyMetadataSteamId
};

export { validSignupData, invalidSignupData } from "./fixtures";
export { validMatchDetails };

export { http, HttpResponse } from "msw";
