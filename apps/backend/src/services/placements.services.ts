import { type ChampionshipDetailsFinished } from "@eggosystem/types";
import {
  getSeasonLeagueTeamByExternalId,
  updateSeasonLeagueTeamPlacement
} from "../models/season-league-team.models";
import {
  getLowerBracketFinalMatch,
  getMatchTeamIdsByMatchId
} from "../models/match.models";
import { logger } from "../utils/app-logger";

export const setLeaguePlacements = async (
  matchDetails: ChampionshipDetailsFinished,
  seasonId: number,
  leagueId: number,
  stageId: number
): Promise<void> => {
  const { faction1, faction2 } = matchDetails.teams;
  const winnerFaction = matchDetails.results.winner;

  const [team1, team2] = await Promise.all([
    getSeasonLeagueTeamByExternalId(faction1.faction_id, seasonId),
    getSeasonLeagueTeamByExternalId(faction2.faction_id, seasonId)
  ]);

  if (!team1 || !team2) {
    logger.warn(
      `[placements] Could not resolve teams for grand final season=${seasonId} league=${leagueId}: ` +
        `faction1=${faction1.faction_id} team1=${team1?.team_id} faction2=${faction2.faction_id} team2=${team2?.team_id}`
    );
    return;
  }

  const winnerTeam = winnerFaction === "faction1" ? team1 : team2;
  const loserTeam = winnerFaction === "faction1" ? team2 : team1;

  await Promise.all([
    updateSeasonLeagueTeamPlacement(seasonId, leagueId, winnerTeam.team_id, 1),
    updateSeasonLeagueTeamPlacement(seasonId, leagueId, loserTeam.team_id, 2)
  ]);

  const lbFinal = await getLowerBracketFinalMatch(seasonId, leagueId, stageId);
  if (!lbFinal) {
    logger.warn(
      `[placements] No LB final found for season=${seasonId} league=${leagueId} stage=${stageId}, skipping 3rd place`
    );
    return;
  }

  const grandFinalTeamIds = new Set([winnerTeam.team_id, loserTeam.team_id]);
  const lbTeamIds = await getMatchTeamIdsByMatchId(lbFinal.id);
  const thirdPlaceTeamId = lbTeamIds.find((id) => !grandFinalTeamIds.has(id));

  if (thirdPlaceTeamId == null) {
    logger.warn(
      `[placements] Could not identify 3rd-place team for season=${seasonId} league=${leagueId}`
    );
    return;
  }

  await updateSeasonLeagueTeamPlacement(
    seasonId,
    leagueId,
    thirdPlaceTeamId,
    3
  );
};
