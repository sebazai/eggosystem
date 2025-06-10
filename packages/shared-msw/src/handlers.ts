import { getPlayerSummariesHandlers } from "./steam/GetPlayerSummaries-handlers";
import { getLeetifyHandlers } from "./leetify/handlers";
import { getOwnedGamesHandlers } from "./steam/GetOwnedGames-handlers";
import { faceitPlayerGameRankHandlers } from "./faceit/GameRank-handlers";
import { faceitMetadataHandlers } from "./faceit/Metadata-handlers";
import { faceitTeamHandlers } from "./faceit/Teams-handlers";

const handlers = [
  ...getPlayerSummariesHandlers,
  ...getLeetifyHandlers,
  ...getOwnedGamesHandlers,
  ...faceitMetadataHandlers,
  ...faceitPlayerGameRankHandlers,
  ...faceitTeamHandlers
];

export { handlers };
