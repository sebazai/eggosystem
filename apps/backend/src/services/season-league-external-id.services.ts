import { type ChampionshipCreatedWebhook } from "@eggosystem/types";
import { getOrganizerFaceitActiveSeasonForApp } from "../models/organizer.models";
import { getSeasonLeagueBySeasonAndFaceitName } from "../models/season-league.models";
import { insertSeasonLeagueExternalId } from "../models/season-league-external-id.models";
import { convertFaceitGameToAppId } from "./faceit.services";

export const addChampionshipToDatabase = async (
  championship: ChampionshipCreatedWebhook
) => {
  const externalChampionshipId = championship.payload.id;
  const externalChampionshipName = championship.payload.name;
  const faceitOrganizerId = championship.payload.organizer_id;
  const activeOrganizerSeason = await getOrganizerFaceitActiveSeasonForApp(
    faceitOrganizerId,
    convertFaceitGameToAppId(championship.app_id)
  );

  if (!activeOrganizerSeason) {
    throw new Error("No active organizer season found");
  }

  const championshipType = championship.payload.type;
  // TODO: make more dynamic, If roundRobin, stage Regular, otherwise Playoff
  const stage = championshipType === "roundRobin" ? 1 : 2;
  // get league from name 11 DIV S3 Playoffs
  const nameSplit = externalChampionshipName.split(" ");
  const leagueName = nameSplit[0];
  // Add manual_group if name contains Lohko A, Lohko B, etc.
  const manualGroup = externalChampionshipName.match(/Lohko (\w+)/)?.[1];
  const manualGroupNumber =
    manualGroup === "A" ? 1 : manualGroup === "B" ? 2 : null;

  const seasonLeague = await getSeasonLeagueBySeasonAndFaceitName(
    activeOrganizerSeason.id,
    leagueName
  );

  if (!seasonLeague) {
    throw new Error("Season league not found");
  }

  await insertSeasonLeagueExternalId(
    externalChampionshipId,
    externalChampionshipName,
    seasonLeague.season_id,
    seasonLeague.league_id,
    stage,
    championshipType,
    manualGroupNumber
  );
};
