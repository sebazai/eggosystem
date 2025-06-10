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
  faceitMultipleGamesSteamId
} from "./faceit/test-ids";

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
  faceitNotFoundSteamId,
  faceitNetworkErrorSteamId,
  faceitInvalidJsonSteamId,
  faceitInvalidGameDataSteamId,
  faceitRateLimitSteamId,
  faceitMultipleGamesSteamId
};
