import { getPlayerSummariesHandlers } from "./steam/GetPlayerSummaries-handlers.js";
import { getLeetifyHandlers } from "./leetify/handlers.js";
import { getOwnedGamesHandlers } from "./steam/GetOwnedGames-handlers.js";
import { faceitPlayerGameRankHandlers } from "./faceit/GameRank-handlers.js";
import { faceitMetadataHandlers } from "./faceit/Metadata-handlers.js";
import { faceitTeamHandlers } from "./faceit/Teams-handlers.js";
import { faceitMatchDetailsHandlers } from "./faceit/MatchDetails-handlers.js";
import { faceitDemoHandlers } from "./faceit/Demo-handlers.js";
import { faceitChampionshipHandlers } from "./faceit/ChampionshipDetails-handlers.js";
import { csrankkerHandlers } from "./csrankker/handlers.js";

const handlers = [
  ...getPlayerSummariesHandlers,
  ...getLeetifyHandlers,
  ...getOwnedGamesHandlers,
  ...faceitMetadataHandlers,
  ...faceitPlayerGameRankHandlers,
  ...faceitTeamHandlers,
  ...faceitMatchDetailsHandlers,
  ...faceitDemoHandlers,
  ...faceitChampionshipHandlers,
  ...csrankkerHandlers
];

export { handlers };
