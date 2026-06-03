import type { Match } from "@eggosystem/types";
import { MatchStatus } from "@eggosystem/types";
import { getConnection } from "../db/mysqlConnection";
import { runQuery } from "../db/mysqlRunQuery";
import { formatDateForDatabase } from "../utils/date-utils";
import {
  getMatchIdByGameId,
  isChampionshipMatchGame
} from "../models/match-game.models";
import {
  enqueueManualDashboardDemoParse,
  finishMatchWithComputedEndTime
} from "./manual-demo-parse.services";
import { publishToParseQueue } from "./parse-queue.services";
import { sendDemoForAllStarPOTGClip } from "./allstar.services";
import { assignGrandFinalPlacementsForFinishedMatch } from "./placements.services";

jest.mock("../db/mysqlRunQuery");
jest.mock("../db/mysqlConnection");
jest.mock("./parse-queue.services", () => ({
  createDemoProcessingRequest: jest.fn(() => ({})),
  publishToParseQueue: jest.fn()
}));
jest.mock("../models/match-game.models", () => ({
  getMatchIdByGameId: jest.fn(),
  isChampionshipMatchGame: jest.fn()
}));
jest.mock("./allstar.services", () => ({
  sendDemoForAllStarPOTGClip: jest.fn()
}));
jest.mock("./placements.services", () => ({
  assignGrandFinalPlacementsForFinishedMatch: jest.fn()
}));

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockGetConnection = getConnection as jest.MockedFunction<
  typeof getConnection
>;
const mockGetMatchIdByGameId = getMatchIdByGameId as jest.MockedFunction<
  typeof getMatchIdByGameId
>;
const mockIsChampionshipMatchGame =
  isChampionshipMatchGame as jest.MockedFunction<
    typeof isChampionshipMatchGame
  >;
const mockPublishToParseQueue = publishToParseQueue as jest.MockedFunction<
  typeof publishToParseQueue
>;
const mockSendDemoForAllStarPOTGClip =
  sendDemoForAllStarPOTGClip as jest.MockedFunction<
    typeof sendDemoForAllStarPOTGClip
  >;
const mockAssignGrandFinalPlacementsForFinishedMatch =
  assignGrandFinalPlacementsForFinishedMatch as jest.MockedFunction<
    typeof assignGrandFinalPlacementsForFinishedMatch
  >;

const placementsNotRequested = {
  applied: false,
  skipped_reason: "not_requested",
  season_id: null,
  league_id: null,
  updated: []
};

describe("enqueueManualDashboardDemoParse", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAssignGrandFinalPlacementsForFinishedMatch.mockResolvedValue({
      applied: false,
      skipped_reason: "not_grand_final",
      season_id: 1,
      league_id: 1,
      updated: []
    });
  });

  it("does not touch DB mark path when mark_finished is false", async () => {
    mockGetMatchIdByGameId.mockResolvedValue([
      { match_id: 12, team_game_scores_staff_lock: 0 }
    ]);
    mockPublishToParseQueue.mockResolvedValue(undefined);
    mockIsChampionshipMatchGame.mockResolvedValue(false);

    await expect(
      enqueueManualDashboardDemoParse({
        matchGameId: 5,
        downloadUrl: "https://cdn.example/demo.dem.zst",
        priority: 4,
        actorAccountId: 1,
        source: "manual",
        reparse: false,
        mark_finished: false
      })
    ).resolves.toEqual({
      match_game_id: 5,
      mark_finished: {
        applied: false,
        match_ids: [],
        end_timestamp: null,
        skipped_reason: "not_requested"
      },
      placements: placementsNotRequested
    });

    expect(mockPublishToParseQueue).toHaveBeenCalledTimes(1);
    expect(mockGetConnection).not.toHaveBeenCalled();
    expect(mockSendDemoForAllStarPOTGClip).not.toHaveBeenCalled();
    expect(
      mockAssignGrandFinalPlacementsForFinishedMatch
    ).not.toHaveBeenCalled();
  });

  it("calls sendDemoForAllStarPOTGClip for championship matches", async () => {
    mockGetMatchIdByGameId.mockResolvedValue([
      { match_id: 12, team_game_scores_staff_lock: 0 }
    ]);
    mockPublishToParseQueue.mockResolvedValue(undefined);
    mockIsChampionshipMatchGame.mockResolvedValue(true);
    mockSendDemoForAllStarPOTGClip.mockResolvedValue({ success: true });

    await enqueueManualDashboardDemoParse({
      matchGameId: 5,
      downloadUrl: "https://cdn.example/demo.dem.zst",
      priority: 4,
      actorAccountId: 1,
      source: "manual",
      reparse: false,
      mark_finished: false
    });

    expect(mockSendDemoForAllStarPOTGClip).toHaveBeenCalledTimes(1);
    expect(mockSendDemoForAllStarPOTGClip).toHaveBeenCalledWith(
      5,
      "https://cdn.example/demo.dem.zst"
    );
  });

  it("does not call sendDemoForAllStarPOTGClip for non-championship matches", async () => {
    mockGetMatchIdByGameId.mockResolvedValue([
      { match_id: 12, team_game_scores_staff_lock: 0 }
    ]);
    mockPublishToParseQueue.mockResolvedValue(undefined);
    mockIsChampionshipMatchGame.mockResolvedValue(false);

    await enqueueManualDashboardDemoParse({
      matchGameId: 5,
      downloadUrl: "https://cdn.example/demo.dem.zst",
      priority: 4,
      actorAccountId: 1,
      source: "manual",
      reparse: false,
      mark_finished: false
    });

    expect(mockSendDemoForAllStarPOTGClip).not.toHaveBeenCalled();
  });

  it("calls sendDemoForAllStarPOTGClip when reparse is true (dedup handled internally)", async () => {
    mockGetMatchIdByGameId.mockResolvedValue([
      { match_id: 12, team_game_scores_staff_lock: 0 }
    ]);
    mockPublishToParseQueue.mockResolvedValue(undefined);
    mockIsChampionshipMatchGame.mockResolvedValue(true);
    mockSendDemoForAllStarPOTGClip.mockResolvedValue({
      success: true,
      message: "Demo processing request already exists for game"
    });

    await enqueueManualDashboardDemoParse({
      matchGameId: 5,
      downloadUrl: "https://cdn.example/demo.dem.zst",
      priority: 4,
      actorAccountId: 1,
      source: "manual",
      reparse: true,
      mark_finished: false
    });

    expect(mockSendDemoForAllStarPOTGClip).toHaveBeenCalledTimes(1);
  });

  it("runs mark_finished after publish using a DB transaction", async () => {
    mockGetMatchIdByGameId.mockResolvedValue([
      { match_id: 12, team_game_scores_staff_lock: 0 }
    ]);
    mockPublishToParseQueue.mockResolvedValue(undefined);
    mockIsChampionshipMatchGame.mockResolvedValue(false);

    const mockConn = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };
    mockGetConnection.mockResolvedValue(
      mockConn as unknown as Awaited<ReturnType<typeof getConnection>>
    );

    mockRunQuery
      .mockResolvedValueOnce([
        {
          id: 12,
          start_timestamp: "2025-06-01T10:00:00.000Z",
          best_of: 2,
          status: "ONGOING" satisfies Match["status"]
        }
      ])
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce([
        {
          id: 12,
          group: 3,
          round: 1,
          external_match_room_id: "gf-room-1",
          season_id: 99,
          league_id: 88,
          stage: 2
        }
      ]);

    mockAssignGrandFinalPlacementsForFinishedMatch.mockResolvedValue({
      applied: true,
      skipped_reason: null,
      season_id: 99,
      league_id: 88,
      updated: [
        { team_id: 1, placement: 1, team_name: "Team 1" },
        { team_id: 2, placement: 2, team_name: "Team 2" },
        { team_id: 3, placement: 3, team_name: "Team 3" }
      ]
    });

    const outcome = await enqueueManualDashboardDemoParse({
      matchGameId: 5,
      downloadUrl: "https://cdn.example/demo.dem.zst",
      priority: 4,
      actorAccountId: 1,
      source: "manual",
      reparse: false,
      mark_finished: true,
      finishMatchIds: [12]
    });

    expect(outcome.match_game_id).toBe(5);
    expect(outcome.mark_finished.applied).toBe(true);
    expect(outcome.mark_finished.match_ids).toEqual([12]);
    expect(outcome.placements.applied).toBe(true);
    expect(outcome.placements.updated).toHaveLength(3);

    expect(mockConn.beginTransaction).toHaveBeenCalledTimes(1);
    expect(mockConn.commit).toHaveBeenCalledTimes(1);
    expect(mockConn.release).toHaveBeenCalledTimes(1);
    expect(mockRunQuery).toHaveBeenCalledTimes(3);
    expect(mockAssignGrandFinalPlacementsForFinishedMatch).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 12,
        group: 3,
        round: 1,
        external_match_room_id: "gf-room-1"
      })
    );
  });

  it("returns not_grand_final placements for non-grand-final mark_finished", async () => {
    mockGetMatchIdByGameId.mockResolvedValue([
      { match_id: 12, team_game_scores_staff_lock: 0 }
    ]);
    mockPublishToParseQueue.mockResolvedValue(undefined);
    mockIsChampionshipMatchGame.mockResolvedValue(false);

    const mockConn = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };
    mockGetConnection.mockResolvedValue(
      mockConn as unknown as Awaited<ReturnType<typeof getConnection>>
    );

    mockRunQuery
      .mockResolvedValueOnce([
        {
          id: 12,
          start_timestamp: "2025-06-01T10:00:00.000Z",
          best_of: 2,
          status: "ONGOING" satisfies Match["status"]
        }
      ])
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce([
        {
          id: 12,
          group: 1,
          round: 4,
          external_match_room_id: "ub-room-1",
          season_id: 99,
          league_id: 88,
          stage: 2
        }
      ]);

    mockAssignGrandFinalPlacementsForFinishedMatch.mockResolvedValue({
      applied: false,
      skipped_reason: "not_grand_final",
      season_id: 99,
      league_id: 88,
      updated: []
    });

    const outcome = await enqueueManualDashboardDemoParse({
      matchGameId: 5,
      downloadUrl: "https://cdn.example/demo.dem.zst",
      priority: 4,
      actorAccountId: 1,
      source: "manual",
      reparse: false,
      mark_finished: true,
      finishMatchIds: [12]
    });

    expect(outcome.placements).toEqual({
      applied: false,
      skipped_reason: "not_grand_final",
      season_id: 99,
      league_id: 88,
      updated: []
    });
    expect(
      mockAssignGrandFinalPlacementsForFinishedMatch
    ).toHaveBeenCalledTimes(1);
  });

  it("returns skipped placements when mark_finished is not applied (all already finished)", async () => {
    mockGetMatchIdByGameId.mockResolvedValue([
      { match_id: 12, team_game_scores_staff_lock: 0 }
    ]);
    mockPublishToParseQueue.mockResolvedValue(undefined);
    mockIsChampionshipMatchGame.mockResolvedValue(false);

    const mockConn = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };
    mockGetConnection.mockResolvedValue(
      mockConn as unknown as Awaited<ReturnType<typeof getConnection>>
    );

    // Only one runQuery call: loadMatchesForComputedFinishByIds.
    // finishMatchWithComputedEndTime returns early (eligible=[]) so no UPDATE fires.
    mockRunQuery.mockResolvedValueOnce([
      {
        id: 12,
        start_timestamp: "2025-06-01T10:00:00.000Z",
        best_of: 2,
        status: "FINISHED" satisfies Match["status"]
      }
    ]);

    const outcome = await enqueueManualDashboardDemoParse({
      matchGameId: 5,
      downloadUrl: "https://cdn.example/demo.dem.zst",
      priority: 4,
      actorAccountId: 1,
      source: "manual",
      reparse: false,
      mark_finished: true,
      finishMatchIds: [12]
    });

    expect(outcome.mark_finished.applied).toBe(false);
    expect(outcome.placements).toEqual({
      applied: false,
      skipped_reason: expect.any(String),
      season_id: null,
      league_id: null,
      updated: []
    });
    expect(
      mockAssignGrandFinalPlacementsForFinishedMatch
    ).not.toHaveBeenCalled();
  });

  it("surfaces non-not_grand_final skipped reason via lastNonGrandFinal path", async () => {
    mockGetMatchIdByGameId.mockResolvedValue([
      { match_id: 12, team_game_scores_staff_lock: 0 }
    ]);
    mockPublishToParseQueue.mockResolvedValue(undefined);
    mockIsChampionshipMatchGame.mockResolvedValue(false);

    const mockConn = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };
    mockGetConnection.mockResolvedValue(
      mockConn as unknown as Awaited<ReturnType<typeof getConnection>>
    );

    mockRunQuery
      .mockResolvedValueOnce([
        {
          id: 12,
          start_timestamp: "2025-06-01T10:00:00.000Z",
          best_of: 1,
          status: "ONGOING" satisfies Match["status"]
        }
      ])
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce([
        {
          id: 12,
          group: 3,
          round: 1,
          external_match_room_id: "gf-room-1",
          season_id: 99,
          league_id: 88,
          stage: 2
        }
      ]);

    mockAssignGrandFinalPlacementsForFinishedMatch.mockResolvedValue({
      applied: false,
      skipped_reason: "faceit_fetch_failed",
      season_id: 99,
      league_id: 88,
      updated: []
    });

    const outcome = await enqueueManualDashboardDemoParse({
      matchGameId: 5,
      downloadUrl: "https://cdn.example/demo.dem.zst",
      priority: 4,
      actorAccountId: 1,
      source: "manual",
      reparse: false,
      mark_finished: true,
      finishMatchIds: [12]
    });

    expect(outcome.placements).toEqual({
      applied: false,
      skipped_reason: "faceit_fetch_failed",
      season_id: 99,
      league_id: 88,
      updated: []
    });
  });
});

describe("finishMatchWithComputedEndTime", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects empty input", async () => {
    const result = await finishMatchWithComputedEndTime([]);
    expect(result).toEqual({
      applied: false,
      match_ids: [],
      end_timestamp: null,
      skipped_reason: "No match rows were provided."
    });
    expect(mockGetConnection).not.toHaveBeenCalled();
  });

  it("rejects duplicate match ids", async () => {
    const result = await finishMatchWithComputedEndTime([
      {
        id: 1,
        start_timestamp: "2025-06-01T12:00:00.000Z",
        best_of: 1,
        status: "ONGOING" satisfies Match["status"]
      },
      {
        id: 1,
        start_timestamp: "2025-06-01T12:00:00.000Z",
        best_of: 1,
        status: "ONGOING" satisfies Match["status"]
      }
    ]);
    expect(result.applied).toBe(false);
    expect(result.skipped_reason).toContain("Duplicate match id");
  });

  it("rejects invalid start_timestamp", async () => {
    const result = await finishMatchWithComputedEndTime([
      {
        id: 1,
        start_timestamp: "not-a-date",
        best_of: 1,
        status: "ONGOING" satisfies Match["status"]
      }
    ]);
    expect(result.applied).toBe(false);
    expect(result.skipped_reason).toContain("start_timestamp");
  });

  it("rejects invalid best_of", async () => {
    const result = await finishMatchWithComputedEndTime([
      {
        id: 1,
        start_timestamp: "2025-06-01T12:00:00.000Z",
        best_of: 0,
        status: "ONGOING" satisfies Match["status"]
      }
    ]);
    expect(result.applied).toBe(false);
    expect(result.skipped_reason).toContain("best_of");
  });

  it("no-ops when all rows are terminal", async () => {
    const result = await finishMatchWithComputedEndTime([
      {
        id: 1,
        start_timestamp: "2025-06-01T12:00:00.000Z",
        best_of: 1,
        status: "FINISHED" satisfies Match["status"]
      },
      {
        id: 2,
        start_timestamp: "2025-06-01T12:00:00.000Z",
        best_of: 1,
        status: "FORFEIT" satisfies Match["status"]
      }
    ]);
    expect(result).toEqual({
      applied: false,
      match_ids: [],
      end_timestamp: null,
      skipped_reason:
        "All matches are already FINISHED or FORFEIT; no update applied."
    });
    expect(mockGetConnection).not.toHaveBeenCalled();
  });

  it("updates only non-terminal rows", async () => {
    const mockConn = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };
    mockGetConnection.mockResolvedValue(
      mockConn as unknown as Awaited<ReturnType<typeof getConnection>>
    );
    mockRunQuery.mockResolvedValue({ affectedRows: 1 });

    const start = "2025-06-01T10:00:00.000Z";
    const result = await finishMatchWithComputedEndTime([
      {
        id: 1,
        start_timestamp: start,
        best_of: 2,
        status: "FINISHED" satisfies Match["status"]
      },
      {
        id: 2,
        start_timestamp: start,
        best_of: 3,
        status: "ONGOING" satisfies Match["status"]
      }
    ]);

    expect(result.applied).toBe(true);
    expect(result.match_ids).toEqual([2]);
    expect(mockRunQuery).toHaveBeenCalledTimes(1);
    const endIso = "2025-06-01T13:00:00.000Z";
    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE Matches SET status"),
      [MatchStatus.FINISHED, formatDateForDatabase(endIso), 2],
      mockConn
    );
    expect(mockConn.commit).toHaveBeenCalled();
    expect(mockConn.release).toHaveBeenCalled();
  });

  it("runs multiple updates in one transaction", async () => {
    const mockConn = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };
    mockGetConnection.mockResolvedValue(
      mockConn as unknown as Awaited<ReturnType<typeof getConnection>>
    );
    mockRunQuery
      .mockResolvedValueOnce({ affectedRows: 1 })
      .mockResolvedValueOnce({ affectedRows: 1 });

    const start = "2025-06-01T10:00:00.000Z";
    const result = await finishMatchWithComputedEndTime([
      {
        id: 10,
        start_timestamp: start,
        best_of: 1,
        status: "ONGOING" satisfies Match["status"]
      },
      {
        id: 11,
        start_timestamp: start,
        best_of: 1,
        status: "ONGOING" satisfies Match["status"]
      }
    ]);

    expect(result.applied).toBe(true);
    expect(result.match_ids).toEqual([10, 11]);
    expect(mockRunQuery).toHaveBeenCalledTimes(2);
    expect(mockConn.beginTransaction).toHaveBeenCalledTimes(1);
    expect(mockConn.commit).toHaveBeenCalledTimes(1);
  });

  it("returns not applied when UPDATE affects 0 rows (race)", async () => {
    const mockConn = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };
    mockGetConnection.mockResolvedValue(
      mockConn as unknown as Awaited<ReturnType<typeof getConnection>>
    );
    mockRunQuery.mockResolvedValue({ affectedRows: 0 });

    const result = await finishMatchWithComputedEndTime([
      {
        id: 3,
        start_timestamp: "2025-06-01T10:00:00.000Z",
        best_of: 1,
        status: "ONGOING" satisfies Match["status"]
      }
    ]);

    expect(result).toEqual({
      applied: false,
      match_ids: [],
      end_timestamp: null,
      skipped_reason:
        "No rows were updated; matches may have been finished by another request."
    });
    expect(mockConn.rollback).toHaveBeenCalledTimes(1);
    expect(mockConn.commit).not.toHaveBeenCalled();
    expect(mockConn.release).toHaveBeenCalledTimes(1);
  });

  it("applies only ids with positive affectedRows when one races", async () => {
    const mockConn = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };
    mockGetConnection.mockResolvedValue(
      mockConn as unknown as Awaited<ReturnType<typeof getConnection>>
    );
    mockRunQuery
      .mockResolvedValueOnce({ affectedRows: 0 })
      .mockResolvedValueOnce({ affectedRows: 1 });

    const start = "2025-06-01T10:00:00.000Z";
    const result = await finishMatchWithComputedEndTime([
      {
        id: 20,
        start_timestamp: start,
        best_of: 1,
        status: "ONGOING" satisfies Match["status"]
      },
      {
        id: 21,
        start_timestamp: start,
        best_of: 1,
        status: "ONGOING" satisfies Match["status"]
      }
    ]);

    expect(result.applied).toBe(true);
    expect(result.match_ids).toEqual([21]);
    expect(mockConn.commit).toHaveBeenCalledTimes(1);
  });

  it("uses caller connection without beginning a new transaction", async () => {
    const mockConn = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };
    mockRunQuery.mockResolvedValue({ affectedRows: 1 });

    await finishMatchWithComputedEndTime(
      [
        {
          id: 5,
          start_timestamp: "2025-06-01T10:00:00.000Z",
          best_of: 1,
          status: "SCHEDULED" satisfies Match["status"]
        }
      ],
      { connection: mockConn as never }
    );

    expect(mockGetConnection).not.toHaveBeenCalled();
    expect(mockConn.beginTransaction).not.toHaveBeenCalled();
    expect(mockConn.commit).not.toHaveBeenCalled();
    expect(mockConn.release).not.toHaveBeenCalled();
    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      mockConn
    );
  });

  describe("forceFinishForfeit", () => {
    it("updates a FORFEIT match when forceFinishForfeit is true", async () => {
      const mockConn = {
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn()
      };
      mockGetConnection.mockResolvedValue(
        mockConn as unknown as Awaited<ReturnType<typeof getConnection>>
      );
      mockRunQuery.mockResolvedValue({ affectedRows: 1 });

      const start = "2025-06-01T10:00:00.000Z";
      const result = await finishMatchWithComputedEndTime(
        [
          {
            id: 7,
            start_timestamp: start,
            best_of: 1,
            status: "FORFEIT" satisfies Match["status"]
          }
        ],
        { forceFinishForfeit: true }
      );

      expect(result.applied).toBe(true);
      expect(result.match_ids).toEqual([7]);
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringMatching(/status\s*!=\s*'FINISHED'/),
        [
          MatchStatus.FINISHED,
          formatDateForDatabase("2025-06-01T11:00:00.000Z"),
          7
        ],
        mockConn
      );
    });

    it("no-ops when all rows are FINISHED even with forceFinishForfeit", async () => {
      const result = await finishMatchWithComputedEndTime(
        [
          {
            id: 8,
            start_timestamp: "2025-06-01T10:00:00.000Z",
            best_of: 1,
            status: "FINISHED" satisfies Match["status"]
          }
        ],
        { forceFinishForfeit: true }
      );

      expect(result).toEqual({
        applied: false,
        match_ids: [],
        end_timestamp: null,
        skipped_reason: "All matches are already FINISHED; no update applied."
      });
      expect(mockGetConnection).not.toHaveBeenCalled();
    });

    it("updates FORFEIT but skips FINISHED in a mixed pair with forceFinishForfeit", async () => {
      const mockConn = {
        beginTransaction: jest.fn(),
        commit: jest.fn(),
        rollback: jest.fn(),
        release: jest.fn()
      };
      mockGetConnection.mockResolvedValue(
        mockConn as unknown as Awaited<ReturnType<typeof getConnection>>
      );
      mockRunQuery.mockResolvedValue({ affectedRows: 1 });

      const start = "2025-06-01T10:00:00.000Z";
      const result = await finishMatchWithComputedEndTime(
        [
          {
            id: 9,
            start_timestamp: start,
            best_of: 1,
            status: "FINISHED" satisfies Match["status"]
          },
          {
            id: 10,
            start_timestamp: start,
            best_of: 1,
            status: "FORFEIT" satisfies Match["status"]
          }
        ],
        { forceFinishForfeit: true }
      );

      expect(result.applied).toBe(true);
      expect(result.match_ids).toEqual([10]);
      expect(mockRunQuery).toHaveBeenCalledTimes(1);
    });
  });

  it("rolls back and rethrows on failure", async () => {
    const mockConn = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };
    mockGetConnection.mockResolvedValue(
      mockConn as unknown as Awaited<ReturnType<typeof getConnection>>
    );
    mockRunQuery.mockRejectedValue(new Error("db error"));

    await expect(
      finishMatchWithComputedEndTime([
        {
          id: 1,
          start_timestamp: "2025-06-01T10:00:00.000Z",
          best_of: 1,
          status: "ONGOING" satisfies Match["status"]
        }
      ])
    ).rejects.toThrow("db error");

    expect(mockConn.rollback).toHaveBeenCalled();
    expect(mockConn.release).toHaveBeenCalled();
  });
});
