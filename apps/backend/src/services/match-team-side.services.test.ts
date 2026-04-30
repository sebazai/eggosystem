import { createMockSeasonLeagueTeam } from "@eggosystem/types";
import { syncMatchTeamSidesFromMatchDetailsPayload } from "./match-team-side.services";
import { runQuery } from "../db/mysqlRunQuery";
import { getSeasonLeagueTeamByExternalId } from "../models/season-league-team.models";
import { logger } from "../utils/app-logger";
import type { PoolConnection } from "mysql2/promise";

jest.mock("../db/mysqlRunQuery");
jest.mock("../models/season-league-team.models");
jest.mock("../utils/app-logger", () => ({
  logger: { warn: jest.fn(), info: jest.fn(), error: jest.fn() }
}));

const mockRunQuery = jest.mocked(runQuery);
const mockGetSeasonLeagueTeamByExternalId = jest.mocked(
  getSeasonLeagueTeamByExternalId
);
const mockLoggerWarn = jest.mocked(logger.warn);

function faceitTeamsDetails(faction1Id: string, faction2Id: string): unknown {
  return {
    teams: {
      faction1: { faction_id: faction1Id },
      faction2: { faction_id: faction2Id }
    }
  };
}

describe("syncMatchTeamSidesFromMatchDetailsPayload", () => {
  const roomId = "room-abc";
  let mockConnection: Partial<PoolConnection>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnection = { query: jest.fn() };
  });

  it("does not query when details are not an object", async () => {
    await syncMatchTeamSidesFromMatchDetailsPayload(roomId, null);
    await syncMatchTeamSidesFromMatchDetailsPayload(roomId, "x");
    expect(mockRunQuery).not.toHaveBeenCalled();
  });

  it("does not query when teams are missing or not an object", async () => {
    await syncMatchTeamSidesFromMatchDetailsPayload(roomId, {});
    await syncMatchTeamSidesFromMatchDetailsPayload(roomId, { teams: null });
    await syncMatchTeamSidesFromMatchDetailsPayload(roomId, { teams: "bad" });
    expect(mockRunQuery).not.toHaveBeenCalled();
  });

  it("does not query when a faction block is missing or lacks a string faction_id", async () => {
    await syncMatchTeamSidesFromMatchDetailsPayload(roomId, {
      teams: { faction1: { faction_id: "a" } }
    });
    await syncMatchTeamSidesFromMatchDetailsPayload(roomId, {
      teams: {
        faction1: { faction_id: "a" },
        faction2: { faction_id: 9 }
      }
    });
    expect(mockRunQuery).not.toHaveBeenCalled();
  });

  it("does not query when faction ids are empty or equal", async () => {
    await syncMatchTeamSidesFromMatchDetailsPayload(
      roomId,
      faceitTeamsDetails("", "b")
    );
    await syncMatchTeamSidesFromMatchDetailsPayload(
      roomId,
      faceitTeamsDetails("a", "")
    );
    await syncMatchTeamSidesFromMatchDetailsPayload(
      roomId,
      faceitTeamsDetails("same", "same")
    );
    expect(mockRunQuery).not.toHaveBeenCalled();
  });

  it("returns early when no match row ties the room to a single season", async () => {
    mockRunQuery.mockResolvedValueOnce([]);
    await syncMatchTeamSidesFromMatchDetailsPayload(
      roomId,
      faceitTeamsDetails("f1", "f2"),
      mockConnection as PoolConnection
    );
    expect(mockRunQuery).toHaveBeenCalledTimes(1);
    expect(mockGetSeasonLeagueTeamByExternalId).not.toHaveBeenCalled();
  });

  it("logs and skips when multiple seasons share the same external room id", async () => {
    mockRunQuery.mockResolvedValueOnce([{ season_id: 10 }, { season_id: 11 }]);
    await syncMatchTeamSidesFromMatchDetailsPayload(
      roomId,
      faceitTeamsDetails("f1", "f2")
    );
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      `[match_side] Multiple seasons for room ${roomId}; skip sync`
    );
    expect(mockGetSeasonLeagueTeamByExternalId).not.toHaveBeenCalled();
    expect(mockRunQuery).toHaveBeenCalledTimes(1);
  });

  it("does not update when either season league team cannot be resolved", async () => {
    mockRunQuery.mockResolvedValueOnce([{ season_id: 17 }]);
    mockGetSeasonLeagueTeamByExternalId.mockResolvedValueOnce(
      createMockSeasonLeagueTeam({ team_id: 1, season_id: 17 })
    );
    mockGetSeasonLeagueTeamByExternalId.mockResolvedValueOnce(undefined);
    await syncMatchTeamSidesFromMatchDetailsPayload(
      roomId,
      faceitTeamsDetails("f1", "f2")
    );
    expect(mockGetSeasonLeagueTeamByExternalId).toHaveBeenNthCalledWith(
      1,
      "f1",
      17,
      undefined
    );
    expect(mockGetSeasonLeagueTeamByExternalId).toHaveBeenNthCalledWith(
      2,
      "f2",
      17,
      undefined
    );
    expect(mockRunQuery).toHaveBeenCalledTimes(1);
  });

  it("does not update when both factions map to the same internal team", async () => {
    mockRunQuery.mockResolvedValueOnce([{ season_id: 17 }]);
    mockGetSeasonLeagueTeamByExternalId.mockResolvedValue(
      createMockSeasonLeagueTeam({ team_id: 42, season_id: 17 })
    );
    await syncMatchTeamSidesFromMatchDetailsPayload(
      roomId,
      faceitTeamsDetails("f1", "f2")
    );
    expect(mockRunQuery).toHaveBeenCalledTimes(1);
  });

  it("runs the side UPDATE when season and two distinct teams resolve", async () => {
    mockRunQuery
      .mockResolvedValueOnce([{ season_id: 17 }])
      .mockResolvedValueOnce(undefined);
    mockGetSeasonLeagueTeamByExternalId
      .mockResolvedValueOnce(
        createMockSeasonLeagueTeam({ team_id: 100, season_id: 17 })
      )
      .mockResolvedValueOnce(
        createMockSeasonLeagueTeam({ team_id: 200, season_id: 17 })
      );

    await syncMatchTeamSidesFromMatchDetailsPayload(
      roomId,
      faceitTeamsDetails("faceit-home", "faceit-away"),
      mockConnection as PoolConnection
    );

    expect(mockRunQuery).toHaveBeenCalledTimes(2);
    const updateCall = mockRunQuery.mock.calls[1];
    expect(updateCall?.[0]).toContain("UPDATE MatchTeams");
    expect(updateCall?.[1]).toEqual([roomId, 100, 200, 100, 200]);
    expect(updateCall?.[2]).toBe(mockConnection);
  });

  it("forwards the pool connection to the season query and team lookups", async () => {
    mockRunQuery.mockResolvedValueOnce([{ season_id: 3 }]);
    mockGetSeasonLeagueTeamByExternalId
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    await syncMatchTeamSidesFromMatchDetailsPayload(
      roomId,
      faceitTeamsDetails("a", "b"),
      mockConnection as PoolConnection
    );

    expect(mockRunQuery.mock.calls[0]?.[2]).toBe(mockConnection);
    expect(mockGetSeasonLeagueTeamByExternalId).toHaveBeenNthCalledWith(
      1,
      "a",
      3,
      mockConnection
    );
    expect(mockGetSeasonLeagueTeamByExternalId).toHaveBeenNthCalledWith(
      2,
      "b",
      3,
      mockConnection
    );
  });
});
