import {
  type ChampionshipDetailsFinished,
  type Match
} from "@eggosystem/types";
import {
  clearPodiumPlacementsForSeasonLeague,
  getSeasonLeagueTeamByExternalId,
  updateSeasonLeagueTeamPlacement
} from "../models/season-league-team.models";
import { getTeamById } from "../models/team.models";
import {
  getLowerBracketFinalMatch,
  getMatchTeamIdsByMatchId
} from "../models/match.models";
import { getFaceITMatchDetails } from "./faceit-match.services";
import { logger } from "../utils/app-logger";

interface GrandFinalPlacementUpdate {
  team_id: number;
  placement: number;
  team_name: string;
}

export interface AssignGrandFinalPlacementsResult {
  applied: boolean;
  skipped_reason: string | null;
  season_id: number | null;
  league_id: number | null;
  updated: GrandFinalPlacementUpdate[];
}

const isGrandFinalRoundOne = (
  group: number | undefined,
  round: number | undefined
): boolean => group === 3 && round === 1;

async function resolvePlacementTeamName(
  teamId: number,
  namesByTeamId: Map<number, string>
): Promise<string> {
  const fromMatch = namesByTeamId.get(teamId);
  if (fromMatch != null && fromMatch.length > 0) {
    return fromMatch;
  }
  const [team] = await getTeamById(teamId);
  return team?.name ?? `Team #${teamId}`;
}

function placementsSkipped(
  skippedReason: string,
  seasonId: number | null = null,
  leagueId: number | null = null
): AssignGrandFinalPlacementsResult {
  return {
    applied: false,
    skipped_reason: skippedReason,
    season_id: seasonId,
    league_id: leagueId,
    updated: []
  };
}

const setLeaguePlacements = async (
  matchDetails: ChampionshipDetailsFinished,
  seasonId: number,
  leagueId: number,
  stageId: number
): Promise<{
  updated: GrandFinalPlacementUpdate[];
  skipped_reason: string | null;
}> => {
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
    return { updated: [], skipped_reason: "teams_not_resolved" };
  }

  const winnerTeam = winnerFaction === "faction1" ? team1 : team2;
  const loserTeam = winnerFaction === "faction1" ? team2 : team1;
  const namesByTeamId = new Map<number, string>([
    [team1.team_id, matchDetails.teams.faction1.name],
    [team2.team_id, matchDetails.teams.faction2.name]
  ]);

  await clearPodiumPlacementsForSeasonLeague(seasonId, leagueId);

  await Promise.all([
    updateSeasonLeagueTeamPlacement(seasonId, leagueId, winnerTeam.team_id, 1),
    updateSeasonLeagueTeamPlacement(seasonId, leagueId, loserTeam.team_id, 2)
  ]);

  const updated: GrandFinalPlacementUpdate[] = [
    {
      team_id: winnerTeam.team_id,
      placement: 1,
      team_name: await resolvePlacementTeamName(
        winnerTeam.team_id,
        namesByTeamId
      )
    },
    {
      team_id: loserTeam.team_id,
      placement: 2,
      team_name: await resolvePlacementTeamName(
        loserTeam.team_id,
        namesByTeamId
      )
    }
  ];

  const lbFinal = await getLowerBracketFinalMatch(seasonId, leagueId, stageId);
  if (!lbFinal) {
    logger.warn(
      `[placements] No LB final found for season=${seasonId} league=${leagueId} stage=${stageId}, skipping 3rd place`
    );
    return { updated, skipped_reason: null };
  }

  const grandFinalTeamIds = new Set([winnerTeam.team_id, loserTeam.team_id]);
  const lbTeamIds = await getMatchTeamIdsByMatchId(lbFinal.id);
  const thirdPlaceTeamId = lbTeamIds.find((id) => !grandFinalTeamIds.has(id));

  if (thirdPlaceTeamId == null) {
    logger.warn(
      `[placements] Could not identify 3rd-place team for season=${seasonId} league=${leagueId}`
    );
    return { updated, skipped_reason: null };
  }

  await updateSeasonLeagueTeamPlacement(
    seasonId,
    leagueId,
    thirdPlaceTeamId,
    3
  );
  updated.push({
    team_id: thirdPlaceTeamId,
    placement: 3,
    team_name: await resolvePlacementTeamName(thirdPlaceTeamId, namesByTeamId)
  });

  return { updated, skipped_reason: null };
};

export async function assignGrandFinalPlacementsIfEligible(input: {
  matchDetails: ChampionshipDetailsFinished;
  seasonId: number;
  leagueId: number;
  stageId: number;
}): Promise<AssignGrandFinalPlacementsResult> {
  const { matchDetails, seasonId, leagueId, stageId } = input;

  if (!isGrandFinalRoundOne(matchDetails.group, matchDetails.round)) {
    return placementsSkipped("not_grand_final", seasonId, leagueId);
  }

  const { updated, skipped_reason } = await setLeaguePlacements(
    matchDetails,
    seasonId,
    leagueId,
    stageId
  );

  if (updated.length === 0) {
    return placementsSkipped(
      skipped_reason ?? "teams_not_resolved",
      seasonId,
      leagueId
    );
  }

  return {
    applied: true,
    skipped_reason: null,
    season_id: seasonId,
    league_id: leagueId,
    updated
  };
}

async function fetchGrandFinalMatchDetails(
  externalMatchRoomId: string
): Promise<ChampionshipDetailsFinished | null> {
  try {
    const details =
      await getFaceITMatchDetails<ChampionshipDetailsFinished>(
        externalMatchRoomId
      );
    if (
      details?.teams?.faction1?.faction_id == null ||
      details?.teams?.faction2?.faction_id == null ||
      details?.results?.winner == null
    ) {
      return null;
    }
    return details;
  } catch {
    return null;
  }
}

type FinishedMatchForPlacements = Pick<
  Match,
  | "id"
  | "group"
  | "round"
  | "external_match_room_id"
  | "season_id"
  | "league_id"
  | "stage"
>;

export async function assignGrandFinalPlacementsForFinishedMatch(
  match: FinishedMatchForPlacements
): Promise<AssignGrandFinalPlacementsResult> {
  if (!isGrandFinalRoundOne(match.group, match.round)) {
    return placementsSkipped(
      "not_grand_final",
      match.season_id,
      match.league_id
    );
  }

  if (!match.external_match_room_id) {
    return placementsSkipped(
      "missing_external_match_room_id",
      match.season_id,
      match.league_id
    );
  }

  const matchDetails = await fetchGrandFinalMatchDetails(
    match.external_match_room_id
  );
  if (matchDetails == null) {
    return placementsSkipped(
      "faceit_fetch_failed",
      match.season_id,
      match.league_id
    );
  }

  return assignGrandFinalPlacementsIfEligible({
    matchDetails,
    seasonId: match.season_id,
    leagueId: match.league_id,
    stageId: match.stage
  });
}
