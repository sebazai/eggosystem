import type {
  Match,
  ReplayGrandFinalPlacementsResponse
} from "@eggosystem/types";
import {
  getGrandFinalMatchBySeasonAndLeague,
  getMatch,
  getMatchesByExternalId
} from "../models/match.models";
import { NotFoundError, BadRequestError } from "../utils/errors";
import {
  assignGrandFinalPlacementsForFinishedMatch,
  isGrandFinalRoundOne,
  type AssignGrandFinalPlacementsResult
} from "./placements.services";

export type ReplayGrandFinalPlacementsResult =
  ReplayGrandFinalPlacementsResponse;

type MatchRowForReplay = Pick<
  Match,
  | "id"
  | "group"
  | "round"
  | "external_match_room_id"
  | "season_id"
  | "league_id"
  | "stage"
>;

function toReplayResponse(
  match: MatchRowForReplay | null,
  result: AssignGrandFinalPlacementsResult
): ReplayGrandFinalPlacementsResult {
  return {
    applied: result.applied,
    season_id: result.season_id,
    league_id: result.league_id,
    stage_id: match?.stage ?? null,
    external_match_room_id: match?.external_match_room_id ?? null,
    placements: result.updated,
    skipped_reason: result.skipped_reason
  };
}

async function replayFromMatchRow(
  match: MatchRowForReplay
): Promise<ReplayGrandFinalPlacementsResult> {
  const result = await assignGrandFinalPlacementsForFinishedMatch(match);
  return toReplayResponse(match, result);
}

async function replayFromMatchRows(
  matches: MatchRowForReplay[],
  requestedExternalRoomId: string | null
): Promise<ReplayGrandFinalPlacementsResult> {
  let lastNonGrandFinal: AssignGrandFinalPlacementsResult | null = null;
  let lastMatch: MatchRowForReplay | null = null;

  for (const match of matches) {
    lastMatch = match;
    const result = await assignGrandFinalPlacementsForFinishedMatch(match);
    if (result.applied) {
      return toReplayResponse(match, result);
    }
    if (result.skipped_reason !== "not_grand_final") {
      lastNonGrandFinal = result;
    }
  }

  if (lastNonGrandFinal != null && lastMatch != null) {
    return toReplayResponse(lastMatch, lastNonGrandFinal);
  }

  const first = matches[0];
  return {
    applied: false,
    season_id: first?.season_id ?? null,
    league_id: first?.league_id ?? null,
    stage_id: first?.stage ?? null,
    external_match_room_id:
      requestedExternalRoomId ?? first?.external_match_room_id ?? null,
    placements: [],
    skipped_reason: "not_grand_final"
  };
}

export async function replayGrandFinalPlacements(input: {
  external_match_room_id?: string;
  match_id?: number;
  season_id?: number;
  league_id?: number;
}): Promise<ReplayGrandFinalPlacementsResult> {
  const { external_match_room_id, match_id, season_id, league_id } = input;

  if (season_id != null && league_id != null) {
    const rows = await getGrandFinalMatchBySeasonAndLeague(
      season_id,
      league_id
    );
    const match = rows[0];
    if (!match) {
      throw new NotFoundError(
        "No grand final match found for season and league"
      );
    }
    return replayFromMatchRow(match);
  }

  if (match_id != null) {
    const rows = await getMatch(match_id);
    const match = rows?.[0];
    if (!match) {
      throw new NotFoundError("Match not found");
    }
    if (!isGrandFinalRoundOne(match.group, match.round)) {
      throw new BadRequestError(
        "match_id must reference a grand final match (group=3, round=1)"
      );
    }
    return replayFromMatchRow(match);
  }

  if (!external_match_room_id) {
    throw new BadRequestError(
      "Either external_match_room_id or match_id must be provided"
    );
  }

  const matches = await getMatchesByExternalId(external_match_room_id);
  if (matches.length === 0) {
    throw new NotFoundError("No matches found for external_match_room_id");
  }

  return replayFromMatchRows(matches, external_match_room_id);
}
