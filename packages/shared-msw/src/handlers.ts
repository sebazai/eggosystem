import { getPlayerSummariesHandlers } from "./steam/GetPlayerSummaries-handlers";
import { getLeetifyHandlers } from "./leetify/handlers";
import { getOwnedGamesHandlers } from "./steam/GetOwnedGames-handlers";
import { faceitPlayerGameRankHandlers } from "./faceit/GameRank-handlers";
import { faceitMetadataHandlers } from "./faceit/Metadata-handlers";
import { faceitTeamHandlers } from "./faceit/Teams-handlers";
import { faceitMatchDetailsHandlers } from "./faceit/MatchDetails-handlers";

const handlers = [
  ...getPlayerSummariesHandlers,
  ...getLeetifyHandlers,
  ...getOwnedGamesHandlers,
  ...faceitMetadataHandlers,
  ...faceitPlayerGameRankHandlers,
  ...faceitTeamHandlers,
  ...faceitMatchDetailsHandlers
];

export { handlers };
