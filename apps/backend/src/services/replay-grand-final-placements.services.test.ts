import { type Match } from "@eggosystem/types";
import {
  replayGrandFinalPlacements,
  type ReplayGrandFinalPlacementsResult
} from "./replay-grand-final-placements.services";
import {
  getMatch,
  getMatchesByExternalId,
  getGrandFinalMatchBySeasonAndLeague
} from "../models/match.models";
import { assignGrandFinalPlacementsForFinishedMatch } from "./placements.services";
import { NotFoundError, BadRequestError } from "../utils/errors";

jest.mock("../models/match.models", () => ({
  getMatch: jest.fn(),
  getMatchesByExternalId: jest.fn(),
  getGrandFinalMatchBySeasonAndLeague: jest.fn()
}));

jest.mock("./placements.services", () => ({
  assignGrandFinalPlacementsForFinishedMatch: jest.fn()
}));

const mockGetMatch = jest.mocked(getMatch);
const mockGetMatchesByExternalId = jest.mocked(getMatchesByExternalId);
const mockGetGrandFinalMatchBySeasonAndLeague = jest.mocked(
  getGrandFinalMatchBySeasonAndLeague
);
const mockAssign = jest.mocked(assignGrandFinalPlacementsForFinishedMatch);

const gfMatch: Match = {
  id: 100,
  group: 3,
  round: 1,
  external_match_room_id: "room-gf-1",
  season_id: 10,
  league_id: 20,
  stage: 2,
  start_timestamp: "2026-01-01T12:00:00.000Z",
  end_timestamp: "2026-01-01T14:00:00.000Z",
  best_of: 1,
  status: "FINISHED"
};

const appliedResult = {
  applied: true,
  skipped_reason: null,
  season_id: 10,
  league_id: 20,
  updated: [
    { team_id: 1, placement: 1 },
    { team_id: 2, placement: 2 },
    { team_id: 3, placement: 3 }
  ]
};

function expectReplayShape(
  result: ReplayGrandFinalPlacementsResult,
  expected: Partial<ReplayGrandFinalPlacementsResult>
) {
  expect(result).toMatchObject(expected);
}

describe("replayGrandFinalPlacements", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("replays placements by season_id and league_id", async () => {
    mockGetGrandFinalMatchBySeasonAndLeague.mockResolvedValue([gfMatch]);
    mockAssign.mockResolvedValue(appliedResult);

    const result = await replayGrandFinalPlacements({
      season_id: 10,
      league_id: 20
    });

    expectReplayShape(result, {
      applied: true,
      season_id: 10,
      league_id: 20,
      placements: appliedResult.updated
    });
    expect(mockGetGrandFinalMatchBySeasonAndLeague).toHaveBeenCalledWith(
      10,
      20
    );
    expect(mockAssign).toHaveBeenCalledWith(gfMatch);
  });

  it("throws NotFound when season and league have no grand final", async () => {
    mockGetGrandFinalMatchBySeasonAndLeague.mockResolvedValue([]);

    await expect(
      replayGrandFinalPlacements({ season_id: 10, league_id: 20 })
    ).rejects.toBeInstanceOf(NotFoundError);
    expect(mockAssign).not.toHaveBeenCalled();
  });

  it("replays placements by match_id for a grand final row", async () => {
    mockGetMatch.mockResolvedValue([gfMatch]);
    mockAssign.mockResolvedValue(appliedResult);

    const result = await replayGrandFinalPlacements({ match_id: 100 });

    expectReplayShape(result, {
      applied: true,
      season_id: 10,
      league_id: 20,
      stage_id: 2,
      external_match_room_id: "room-gf-1",
      placements: appliedResult.updated,
      skipped_reason: null
    });
    expect(mockAssign).toHaveBeenCalledWith(gfMatch);
  });

  it("throws BadRequest when match_id is not grand final", async () => {
    mockGetMatch.mockResolvedValue([{ ...gfMatch, group: 2, round: 1 }]);

    await expect(
      replayGrandFinalPlacements({ match_id: 100 })
    ).rejects.toBeInstanceOf(BadRequestError);
    expect(mockAssign).not.toHaveBeenCalled();
  });

  it("throws NotFound when match_id does not exist", async () => {
    mockGetMatch.mockResolvedValue([]);

    await expect(
      replayGrandFinalPlacements({ match_id: 999 })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("replays by external_match_room_id and picks the grand final hub row", async () => {
    const nonGf = { ...gfMatch, id: 99, group: 2, round: 2 };
    mockGetMatchesByExternalId.mockResolvedValue([nonGf, gfMatch]);
    mockAssign
      .mockResolvedValueOnce({
        applied: false,
        skipped_reason: "not_grand_final",
        season_id: 10,
        league_id: 20,
        updated: []
      })
      .mockResolvedValueOnce(appliedResult);

    const result = await replayGrandFinalPlacements({
      external_match_room_id: "room-gf-1"
    });

    expectReplayShape(result, {
      applied: true,
      placements: appliedResult.updated
    });
    expect(mockAssign).toHaveBeenCalledTimes(2);
  });

  it("returns not_grand_final when external room has no GF match", async () => {
    mockGetMatchesByExternalId.mockResolvedValue([
      { ...gfMatch, group: 2, round: 1 }
    ]);
    mockAssign.mockResolvedValue({
      applied: false,
      skipped_reason: "not_grand_final",
      season_id: 10,
      league_id: 20,
      updated: []
    });

    const result = await replayGrandFinalPlacements({
      external_match_room_id: "room-only-lb"
    });

    expectReplayShape(result, {
      applied: false,
      skipped_reason: "not_grand_final",
      placements: []
    });
  });

  it("throws NotFound when external_match_room_id has no matches", async () => {
    mockGetMatchesByExternalId.mockResolvedValue([]);

    await expect(
      replayGrandFinalPlacements({ external_match_room_id: "missing" })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
