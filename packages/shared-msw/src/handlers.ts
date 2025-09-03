import { getPlayerSummariesHandlers } from "./steam/GetPlayerSummaries-handlers";
import { getLeetifyHandlers } from "./leetify/handlers";
import { getOwnedGamesHandlers } from "./steam/GetOwnedGames-handlers";
import { faceitPlayerGameRankHandlers } from "./faceit/GameRank-handlers";
import { faceitMetadataHandlers } from "./faceit/Metadata-handlers";
import { faceitTeamHandlers } from "./faceit/Teams-handlers";
import { faceitMatchDetailsHandlers } from "./faceit/MatchDetails-handlers";
import { faceitDemoHandlers } from "./faceit/Demo-handlers";
import { faceitChampionshipHandlers } from "./faceit/ChampionshipDetails-handlers";
import { csrankkerHandlers } from "./csrankker/handlers";

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
