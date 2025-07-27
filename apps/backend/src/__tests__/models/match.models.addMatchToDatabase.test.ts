import { addMatchToDatabase } from "../../models/match.models";
import { getSeasonLeagueExternalIdByExternalId } from "../../models/season-league-external-id.models";
import { getSeasonLeagueTeamByExternalId } from "../../models/season-league-team.models";
import { runQuery } from "../../db/mysqlRunQuery";
import { getConnection } from "../../db/mysqlConnection";
import { validMatchDetailsMatchCreated } from "@eggosystem/shared-msw";
import {
  type ChampionshipDetailsObjectCreated,
  FaceitMatchStatus,
  MatchStatus
} from "@eggosystem/types";
import type { PoolConnection } from "mysql2/promise";

// Mock all dependencies
jest.mock("../../models/season-league-external-id.models");
jest.mock("../../models/season-league-team.models");
jest.mock("../../db/mysqlRunQuery");
jest.mock("../../db/mysqlConnection");

const mockGetSeasonLeagueExternalIdByExternalId =
  getSeasonLeagueExternalIdByExternalId as jest.MockedFunction<
    typeof getSeasonLeagueExternalIdByExternalId
  >;

const mockGetSeasonLeagueTeamByExternalId =
  getSeasonLeagueTeamByExternalId as jest.MockedFunction<
    typeof getSeasonLeagueTeamByExternalId
  >;

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockGetConnection = getConnection as jest.MockedFunction<
  typeof getConnection
>;

describe("addMatchToDatabase", () => {
  let mockConnection: Partial<PoolConnection>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock connection
    mockConnection = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };

    mockGetConnection.mockResolvedValue(mockConnection as PoolConnection);
  });

  describe("when match is in CHECK_IN status", () => {
    it("should skip processing and return early", async () => {
      const matchDetails = {
        ...validMatchDetailsMatchCreated,
        status: FaceitMatchStatus.CHECK_IN
      } satisfies ChampionshipDetailsObjectCreated;

      const result = await addMatchToDatabase(matchDetails, "test-league-id");

      expect(result).toBeUndefined();
      expect(mockGetConnection).not.toHaveBeenCalled();
      expect(mockConnection.beginTransaction).not.toHaveBeenCalled();
    });
  });

  describe("when match already exists", () => {
    it("should skip processing and return early", async () => {
      const matchDetails = validMatchDetailsMatchCreated;
      const externalLeagueId = "test-league-id";

      // Mock existing match
      mockRunQuery.mockResolvedValueOnce([
        { id: 1, external_match_room_id: matchDetails.match_id }
      ]);

      const result = await addMatchToDatabase(matchDetails, externalLeagueId);

      expect(result).toBeUndefined();
      expect(mockConnection.commit).not.toHaveBeenCalled();
      expect(mockConnection.rollback).not.toHaveBeenCalled();
    });
  });

  describe("when season league external ID is not found", () => {
    it("should throw an error", async () => {
      const matchDetails = validMatchDetailsMatchCreated;
      const externalLeagueId = "non-existent-league-id";

      // Mock no existing match
      mockRunQuery.mockResolvedValueOnce([]);
      // Mock no season league external ID found
      mockGetSeasonLeagueExternalIdByExternalId.mockResolvedValueOnce(
        undefined
      );

      await expect(
        addMatchToDatabase(matchDetails, externalLeagueId)
      ).rejects.toThrow(
        `No SeasonLeagueExternalId entry found for external_id: ${externalLeagueId}`
      );

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe("when team external IDs are not found", () => {
    it("should throw an error when team one is not found", async () => {
      const matchDetails = validMatchDetailsMatchCreated;
      const externalLeagueId = "test-league-id";

      // Mock no existing match
      mockRunQuery.mockResolvedValueOnce([]);
      // Mock season league external ID found
      mockGetSeasonLeagueExternalIdByExternalId.mockResolvedValueOnce({
        id: 1,
        external_id: externalLeagueId,
        league_id: 1,
        season_id: 1,
        stage_id: 1,
        isBO2PlayedAs2xBO1: false,
        type: "roundRobin"
      });
      // Mock team one not found
      mockGetSeasonLeagueTeamByExternalId.mockResolvedValueOnce(undefined);

      await expect(
        addMatchToDatabase(matchDetails, externalLeagueId)
      ).rejects.toThrow(
        `No SeasonLeagueTeam entry found for external_id: ${matchDetails.teams.faction1.faction_id} or ${matchDetails.teams.faction2.faction_id}`
      );

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    it("should throw an error when team two is not found", async () => {
      const matchDetails = validMatchDetailsMatchCreated;
      const externalLeagueId = "test-league-id";

      // Mock no existing match
      mockRunQuery.mockResolvedValueOnce([]);
      // Mock season league external ID found
      mockGetSeasonLeagueExternalIdByExternalId.mockResolvedValueOnce({
        id: 1,
        external_id: externalLeagueId,
        league_id: 1,
        season_id: 1,
        stage_id: 1,
        isBO2PlayedAs2xBO1: false,
        type: "roundRobin"
      });
      // Mock team one found, team two not found
      mockGetSeasonLeagueTeamByExternalId
        .mockResolvedValueOnce({
          season_id: 1,
          team_id: 1,
          league_id: 1,
          placement: null,
          position_offset: null
        })
        .mockResolvedValueOnce(undefined);

      await expect(
        addMatchToDatabase(matchDetails, externalLeagueId)
      ).rejects.toThrow(
        `No SeasonLeagueTeam entry found for external_id: ${matchDetails.teams.faction1.faction_id} or ${matchDetails.teams.faction2.faction_id}`
      );

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });
  });

  describe("when isBO2PlayedAs2xBO1 is false", () => {
    it("should create a single match successfully", async () => {
      const matchDetails = validMatchDetailsMatchCreated;
      const externalLeagueId = "test-league-id";

      // Mock no existing match
      mockRunQuery.mockResolvedValueOnce([]);
      // Mock season league external ID found
      mockGetSeasonLeagueExternalIdByExternalId.mockResolvedValueOnce({
        id: 1,
        external_id: externalLeagueId,
        league_id: 1,
        season_id: 1,
        stage_id: 1,
        isBO2PlayedAs2xBO1: false,
        type: "roundRobin"
      });
      // Mock teams found
      mockGetSeasonLeagueTeamByExternalId
        .mockResolvedValueOnce({
          season_id: 1,
          team_id: 1,
          league_id: 1,
          placement: null,
          position_offset: null
        })
        .mockResolvedValueOnce({
          season_id: 1,
          team_id: 2,
          league_id: 1,
          placement: null,
          position_offset: null
        });

      // Mock match insertion
      mockRunQuery.mockResolvedValueOnce([{ insertId: 100 }]);
      // Mock team to match associations
      mockRunQuery.mockResolvedValueOnce([]);
      mockRunQuery.mockResolvedValueOnce([]);
      // Mock status update
      mockRunQuery.mockResolvedValueOnce([]);

      const result = await addMatchToDatabase(matchDetails, externalLeagueId);

      expect(result).toEqual({
        matchIds: [100],
        isBO2PlayedAs2xBO1: false
      });

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();

      // Verify match insertion query
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO Matches"),
        [
          1, // league_id
          1, // season_id
          1, // stage_id
          matchDetails.best_of,
          expect.any(String), // match_date
          expect.any(String), // start_time
          null, // end_time
          matchDetails.match_id,
          matchDetails.status,
          matchDetails.round,
          matchDetails.group
        ],
        mockConnection
      );
    });
  });

  describe("when isBO2PlayedAs2xBO1 is true", () => {
    it("should create two matches successfully", async () => {
      const matchDetails = validMatchDetailsMatchCreated;
      const externalLeagueId = "test-league-id";

      // Mock no existing match
      mockRunQuery.mockResolvedValueOnce([]);
      // Mock season league external ID found
      mockGetSeasonLeagueExternalIdByExternalId.mockResolvedValueOnce({
        id: 1,
        external_id: externalLeagueId,
        league_id: 1,
        season_id: 1,
        stage_id: 1,
        isBO2PlayedAs2xBO1: true,
        type: "roundRobin"
      });
      // Mock teams found
      mockGetSeasonLeagueTeamByExternalId
        .mockResolvedValueOnce({
          season_id: 1,
          team_id: 1,
          league_id: 1,
          placement: null,
          position_offset: null
        })
        .mockResolvedValueOnce({
          season_id: 1,
          team_id: 2,
          league_id: 1,
          placement: null,
          position_offset: null
        });

      // Mock match insertions
      mockRunQuery.mockResolvedValueOnce({ insertId: 100 });
      mockRunQuery.mockResolvedValueOnce({ insertId: 101 });
      // Mock team to match associations (4 calls for 2 matches)
      mockRunQuery.mockResolvedValueOnce([]);
      mockRunQuery.mockResolvedValueOnce([]);
      mockRunQuery.mockResolvedValueOnce([]);
      mockRunQuery.mockResolvedValueOnce([]);
      // Mock status update
      mockRunQuery.mockResolvedValueOnce([]);

      const result = await addMatchToDatabase(matchDetails, externalLeagueId);

      expect(result).toEqual({
        matchIds: [100, 101],
        isBO2PlayedAs2xBO1: true
      });

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();

      // Verify two match insertions
      expect(mockRunQuery).toHaveBeenCalledTimes(8); // 1 check + 2 insertions + 4 team associations + 1 status update
    });
  });

  describe("date and time handling", () => {
    it("should use scheduled_at when provided", async () => {
      const matchDetails = {
        ...validMatchDetailsMatchCreated,
        scheduled_at: 1703123456 // Unix timestamp
      };
      const externalLeagueId = "test-league-id";

      // Mock no existing match
      mockRunQuery.mockResolvedValueOnce([]);
      // Mock season league external ID found
      mockGetSeasonLeagueExternalIdByExternalId.mockResolvedValueOnce({
        id: 1,
        external_id: externalLeagueId,
        league_id: 1,
        season_id: 1,
        stage_id: 1,
        isBO2PlayedAs2xBO1: false,
        type: "roundRobin"
      });
      // Mock teams found
      mockGetSeasonLeagueTeamByExternalId
        .mockResolvedValueOnce({
          season_id: 1,
          team_id: 1,
          league_id: 1,
          placement: null,
          position_offset: null
        })
        .mockResolvedValueOnce({
          season_id: 1,
          team_id: 2,
          league_id: 1,
          placement: null,
          position_offset: null
        });

      // Mock match insertion
      mockRunQuery.mockResolvedValueOnce([{ insertId: 100 }]);
      // Mock team to match associations
      mockRunQuery.mockResolvedValueOnce([]);
      mockRunQuery.mockResolvedValueOnce([]);
      // Mock status update
      mockRunQuery.mockResolvedValueOnce([]);

      await addMatchToDatabase(matchDetails, externalLeagueId);

      // Verify the scheduled_at timestamp is converted correctly
      const expectedDate = new Date(1703123456 * 1000)
        .toISOString()
        .slice(0, 10);
      const expectedTime = new Date(1703123456 * 1000)
        .toISOString()
        .slice(11, 19);

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO Matches"),
        expect.arrayContaining([
          expect.any(Number), // league_id
          expect.any(Number), // season_id
          expect.any(Number), // stage_id
          matchDetails.best_of,
          expectedDate, // match_date
          expectedTime, // start_time
          null, // end_time
          matchDetails.match_id,
          matchDetails.status,
          matchDetails.round,
          matchDetails.group
        ]),
        mockConnection
      );
    });

    it("should use default date/time when scheduled_at is not provided", async () => {
      const matchDetails = {
        ...validMatchDetailsMatchCreated,
        scheduled_at: 0
      };
      const externalLeagueId = "test-league-id";

      // Mock no existing match
      mockRunQuery.mockResolvedValueOnce([]);
      // Mock season league external ID found
      mockGetSeasonLeagueExternalIdByExternalId.mockResolvedValueOnce({
        id: 1,
        external_id: externalLeagueId,
        league_id: 1,
        season_id: 1,
        stage_id: 1,
        isBO2PlayedAs2xBO1: false,
        type: "roundRobin"
      });
      // Mock teams found
      mockGetSeasonLeagueTeamByExternalId
        .mockResolvedValueOnce({
          season_id: 1,
          team_id: 1,
          league_id: 1,
          placement: null,
          position_offset: null
        })
        .mockResolvedValueOnce({
          season_id: 1,
          team_id: 2,
          league_id: 1,
          placement: null,
          position_offset: null
        });

      // Mock match insertion
      mockRunQuery.mockResolvedValueOnce([{ insertId: 100 }]);
      // Mock team to match associations
      mockRunQuery.mockResolvedValueOnce([]);
      mockRunQuery.mockResolvedValueOnce([]);
      // Mock status update
      mockRunQuery.mockResolvedValueOnce([]);

      await addMatchToDatabase(matchDetails, externalLeagueId);

      // Verify default date/time is used (next Wednesday at 19:00)
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO Matches"),
        expect.arrayContaining([
          expect.any(Number), // league_id
          expect.any(Number), // season_id
          expect.any(Number), // stage_id
          matchDetails.best_of,
          expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), // match_date format
          "19:00:00", // start_time
          null, // end_time
          matchDetails.match_id,
          matchDetails.status,
          matchDetails.round,
          matchDetails.group
        ]),
        mockConnection
      );
    });
  });

  describe("error handling", () => {
    it("should rollback transaction and throw error when database operation fails", async () => {
      const matchDetails = validMatchDetailsMatchCreated;
      const externalLeagueId = "test-league-id";

      // Mock no existing match
      mockRunQuery.mockResolvedValueOnce([]);
      // Mock season league external ID found
      mockGetSeasonLeagueExternalIdByExternalId.mockResolvedValueOnce({
        id: 1,
        external_id: externalLeagueId,
        league_id: 1,
        season_id: 1,
        stage_id: 1,
        isBO2PlayedAs2xBO1: false,
        type: "roundRobin"
      });
      // Mock teams found
      mockGetSeasonLeagueTeamByExternalId
        .mockResolvedValueOnce({
          season_id: 1,
          team_id: 1,
          league_id: 1,
          placement: null,
          position_offset: null
        })
        .mockResolvedValueOnce({
          season_id: 1,
          team_id: 2,
          league_id: 1,
          placement: null,
          position_offset: null
        });

      // Mock match insertion failure
      const dbError = new Error("Database connection failed");
      mockRunQuery.mockRejectedValueOnce(dbError);

      await expect(
        addMatchToDatabase(matchDetails, externalLeagueId)
      ).rejects.toThrow("Database connection failed");

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(mockConnection.commit).not.toHaveBeenCalled();
    });

    it("should handle connection errors gracefully", async () => {
      const matchDetails = validMatchDetailsMatchCreated;
      const externalLeagueId = "test-league-id";

      // Mock connection failure
      mockGetConnection.mockRejectedValueOnce(new Error("Connection failed"));

      await expect(
        addMatchToDatabase(matchDetails, externalLeagueId)
      ).rejects.toThrow("Connection failed");

      expect(mockConnection?.rollback).not.toHaveBeenCalled();
      expect(mockConnection?.release).not.toHaveBeenCalled();
    });
  });

  describe("team association", () => {
    it("should associate both teams with the match", async () => {
      const matchDetails = validMatchDetailsMatchCreated;
      const externalLeagueId = "test-league-id";

      // Mock no existing match
      mockRunQuery.mockResolvedValueOnce([]);
      // Mock season league external ID found
      mockGetSeasonLeagueExternalIdByExternalId.mockResolvedValueOnce({
        id: 1,
        external_id: externalLeagueId,
        league_id: 1,
        season_id: 1,
        stage_id: 1,
        isBO2PlayedAs2xBO1: false,
        type: "roundRobin"
      });
      // Mock teams found
      mockGetSeasonLeagueTeamByExternalId
        .mockResolvedValueOnce({
          season_id: 1,
          team_id: 100,
          league_id: 1,
          placement: null,
          position_offset: null
        })
        .mockResolvedValueOnce({
          season_id: 1,
          team_id: 200,
          league_id: 1,
          placement: null,
          position_offset: null
        });

      // Mock match insertion
      mockRunQuery.mockResolvedValueOnce([{ insertId: 1000 }]);
      // Mock team to match associations
      mockRunQuery.mockResolvedValueOnce([]);
      mockRunQuery.mockResolvedValueOnce([]);
      // Mock status update
      mockRunQuery.mockResolvedValueOnce([]);

      await addMatchToDatabase(matchDetails, externalLeagueId);

      // Verify team associations
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO MatchTeams"),
        [1000, 100], // match_id, team_id
        mockConnection
      );
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO MatchTeams"),
        [1000, 200], // match_id, team_id
        mockConnection
      );
    });
  });

  describe("status update", () => {
    it("should update match status to SCHEDULED", async () => {
      const matchDetails = validMatchDetailsMatchCreated;
      const externalLeagueId = "test-league-id";

      // Mock no existing match
      mockRunQuery.mockResolvedValueOnce([]);
      // Mock season league external ID found
      mockGetSeasonLeagueExternalIdByExternalId.mockResolvedValueOnce({
        id: 1,
        external_id: externalLeagueId,
        league_id: 1,
        season_id: 1,
        stage_id: 1,
        isBO2PlayedAs2xBO1: false,
        type: "roundRobin"
      });
      // Mock teams found
      mockGetSeasonLeagueTeamByExternalId
        .mockResolvedValueOnce({
          season_id: 1,
          team_id: 1,
          league_id: 1,
          placement: null,
          position_offset: null
        })
        .mockResolvedValueOnce({
          season_id: 1,
          team_id: 2,
          league_id: 1,
          placement: null,
          position_offset: null
        });

      // Mock match insertion
      mockRunQuery.mockResolvedValueOnce([{ insertId: 100 }]);
      // Mock team to match associations
      mockRunQuery.mockResolvedValueOnce([]);
      mockRunQuery.mockResolvedValueOnce([]);
      // Mock status update
      mockRunQuery.mockResolvedValueOnce([]);

      await addMatchToDatabase(matchDetails, externalLeagueId);

      // Verify status update
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE Matches SET status = ?"),
        [MatchStatus.SCHEDULED, matchDetails.match_id],
        mockConnection
      );
    });
  });

  describe("edge cases", () => {
    it("should handle match with zero scheduled_at", async () => {
      const matchDetails = {
        ...validMatchDetailsMatchCreated,
        scheduled_at: 0
      };
      const externalLeagueId = "test-league-id";

      // Mock no existing match
      mockRunQuery.mockResolvedValueOnce([]);
      // Mock season league external ID found
      mockGetSeasonLeagueExternalIdByExternalId.mockResolvedValueOnce({
        id: 1,
        external_id: externalLeagueId,
        league_id: 1,
        season_id: 1,
        stage_id: 1,
        isBO2PlayedAs2xBO1: false,
        type: "roundRobin"
      });
      // Mock teams found
      mockGetSeasonLeagueTeamByExternalId
        .mockResolvedValueOnce({
          season_id: 1,
          team_id: 1,
          league_id: 1,
          placement: null,
          position_offset: null
        })
        .mockResolvedValueOnce({
          season_id: 1,
          team_id: 2,
          league_id: 1,
          placement: null,
          position_offset: null
        });

      // Mock match insertion
      mockRunQuery.mockResolvedValueOnce([{ insertId: 100 }]);
      // Mock team to match associations
      mockRunQuery.mockResolvedValueOnce([]);
      mockRunQuery.mockResolvedValueOnce([]);
      // Mock status update
      mockRunQuery.mockResolvedValueOnce([]);

      const result = await addMatchToDatabase(matchDetails, externalLeagueId);

      expect(result).toEqual({
        matchIds: [100],
        isBO2PlayedAs2xBO1: false
      });
    });
  });
});
