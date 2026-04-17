import { setupServer } from "msw/node";
import { handlers } from "./handlers.js";
import {
  leetifyValidSteamId,
  leetifyNotFoundSteamId,
  leetifyNetworkErrorSteamId,
  leetifyInvalidJsonSteamId,
  leetifyNoPremierRankSteamId,
  leetifyInvalidGameDataSteamId,
  leetifyRateLimitSteamId,
  leetifyMultipleGamesSteamId
} from "./leetify/handlers.js";

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
} from "./faceit/test-ids.js";

import {
  csrankkerValidSteamId,
  csrankkerNotFoundSteamId,
  csrankkerNetworkErrorSteamId,
  csrankkerInvalidJsonSteamId,
  csrankkerHighKanaEloSteamId,
  csrankkerMediumKanaEloSteamId,
  csrankkerLowKanaEloSteamId
} from "./csrankker/test-ids.js";

export const mswServer = setupServer(...handlers);
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
  faceitCs2EmptyMetadataSteamId,
  csrankkerValidSteamId,
  csrankkerNotFoundSteamId,
  csrankkerNetworkErrorSteamId,
  csrankkerInvalidJsonSteamId,
  csrankkerHighKanaEloSteamId,
  csrankkerMediumKanaEloSteamId,
  csrankkerLowKanaEloSteamId
};

export { validSignupData, invalidSignupData } from "./fixtures/index.js";
export {
  validMatchDetailsMatchCreated,
  validMatchDetailsMatchDemoReady,
  validMatchDetailsMatchStatusReadyMatchmaking,
  validMatchDetailsMatchStatusFinished,
  validMatchDetailsMatchScheduledTeamValidation
} from "./faceit/MatchDetails-handlers.js";

export { http, HttpResponse } from "msw";
