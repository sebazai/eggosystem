import { type ChampionshipCreatedWebhook } from "@eggosystem/types";
import { getOrganizerFaceitActiveSeasonForApp } from "../models/organizer.models";
import { getSeasonLeagueBySeasonAndFaceitName } from "../models/season-league.models";
import { insertSeasonLeagueExternalId } from "../models/season-league-external-id.models";

export const addChampionshipToDatabase = async (
  championship: ChampionshipCreatedWebhook
) => {
  const externalChampionshipId = championship.payload.id;
  const externalChampionshipName = championship.payload.name;
  const faceitOrganizerId = championship.payload.organizer_id;
  const activeOrganizerSeason = await getOrganizerFaceitActiveSeasonForApp(
    faceitOrganizerId,
    730
  );

  if (!activeOrganizerSeason) {
    throw new Error("No active organizer season found");
  }

  const championshipType = championship.payload.type;
  // TODO: make more dynamic, If roundRobin, stage Regular, otherwise Playoff
  const stage = championshipType === "roundRobin" ? 1 : 2;
  // TODO: This could be a setting from Seasons
  const isBO2PlayedAs2xBO1 = championshipType === "roundRobin";
  // get league from name 11 DIV S3 Playoffs
  const nameSplit = externalChampionshipName.split(" ");
  const leagueName = nameSplit[0];

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
    isBO2PlayedAs2xBO1
  );
};
