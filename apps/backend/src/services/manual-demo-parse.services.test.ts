import type { Match } from "@eggosystem/types";
import { MatchStatus } from "@eggosystem/types";
import { getConnection } from "../db/mysqlConnection";
import { runQuery } from "../db/mysqlRunQuery";
import { formatDateForDatabase } from "../utils/date-utils";
import { getMatchIdByGameId } from "../models/match-game.models";
import {
  enqueueManualDashboardDemoParse,
  finishMatchWithComputedEndTime
} from "./manual-demo-parse.services";
import { publishToParseQueue } from "./parse-queue.services";

jest.mock("../db/mysqlRunQuery");
jest.mock("../db/mysqlConnection");
jest.mock("./parse-queue.services", () => ({
  createDemoProcessingRequest: jest.fn(() => ({})),
  publishToParseQueue: jest.fn()
}));
jest.mock("../models/match-game.models", () => ({
  getMatchIdByGameId: jest.fn()
}));

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockGetConnection = getConnection as jest.MockedFunction<
  typeof getConnection
>;
const mockGetMatchIdByGameId = getMatchIdByGameId as jest.MockedFunction<
  typeof getMatchIdByGameId
>;
const mockPublishToParseQueue = publishToParseQueue as jest.MockedFunction<
  typeof publishToParseQueue
>;

describe("enqueueManualDashboardDemoParse", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not touch DB mark path when mark_finished is false", async () => {
    mockGetMatchIdByGameId.mockResolvedValue([
      { match_id: 12, team_game_scores_staff_lock: 0 }
    ]);
    mockPublishToParseQueue.mockResolvedValue(undefined);

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
      }
    });

    expect(mockPublishToParseQueue).toHaveBeenCalledTimes(1);
    expect(mockGetConnection).not.toHaveBeenCalled();
  });

  it("runs mark_finished after publish using a DB transaction", async () => {
    mockGetMatchIdByGameId.mockResolvedValue([
      { match_id: 12, team_game_scores_staff_lock: 0 }
    ]);
    mockPublishToParseQueue.mockResolvedValue(undefined);

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
      .mockResolvedValue([] as never);

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

    expect(mockConn.beginTransaction).toHaveBeenCalledTimes(1);
    expect(mockConn.commit).toHaveBeenCalledTimes(1);
    expect(mockConn.release).toHaveBeenCalledTimes(1);
    expect(mockRunQuery).toHaveBeenCalledTimes(2);
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
    mockRunQuery.mockResolvedValue([] as never);

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
    mockRunQuery.mockResolvedValue([] as never);

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

  it("uses caller connection without beginning a new transaction", async () => {
    const mockConn = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };
    mockRunQuery.mockResolvedValue([] as never);

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
