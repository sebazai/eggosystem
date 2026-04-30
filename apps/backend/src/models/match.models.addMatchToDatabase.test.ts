import { addMatchToDatabase } from "./match.models";
import { getSeasonLeagueExternalIdByExternalIdWithSeasonSettings } from "./season-league-external-id.models";
import { getSeasonLeagueTeamByExternalId } from "./season-league-team.models";
import { runQuery } from "../db/mysqlRunQuery";
import { getConnection } from "../db/mysqlConnection";
import { validMatchDetailsMatchCreated } from "@eggosystem/shared-msw";
import {
  type ChampionshipDetailsObjectCreated,
  FaceitMatchStatus
} from "@eggosystem/types";
import type { PoolConnection } from "mysql2/promise";

// Mock all dependencies
jest.mock("../models/season-league-external-id.models");
jest.mock("../models/season-league-team.models");
jest.mock("../db/mysqlRunQuery");
jest.mock("../db/mysqlConnection");

const mockGetSeasonLeagueExternalIdByExternalId =
  getSeasonLeagueExternalIdByExternalIdWithSeasonSettings as jest.MockedFunction<
    typeof getSeasonLeagueExternalIdByExternalIdWithSeasonSettings
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
        is_round_robin_bo2_as_2xbo1: false,
        type: "roundRobin",
        external_league_name: "Test League"
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
        is_round_robin_bo2_as_2xbo1: false,
        type: "roundRobin",
        external_league_name: "Test League"
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

  describe("when is_round_robin_bo2_as_2xbo1 is false", () => {
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
        is_round_robin_bo2_as_2xbo1: false,
        type: "roundRobin",
        external_league_name: "Test League"
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
      mockRunQuery.mockResolvedValueOnce({ insertId: 100 });
      // Mock team to match associations
      mockRunQuery.mockResolvedValueOnce([]);
      mockRunQuery.mockResolvedValueOnce([]);

      const result = await addMatchToDatabase(matchDetails, externalLeagueId);

      expect(result).toEqual({
        matchIds: [100],
        is_round_robin_bo2_as_2xbo1: false
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
          expect.any(String), // start_timestamp (MySQL datetime format: YYYY-MM-DD HH:mm:ss)
          null, // end_timestamp
          matchDetails.match_id,
          matchDetails.status,
          matchDetails.round,
          matchDetails.group
        ],
        mockConnection
      );
    });
  });

  describe("when is_round_robin_bo2_as_2xbo1 is true", () => {
    it("should create two matches successfully", async () => {
      const matchDetails = {
        ...validMatchDetailsMatchCreated,
        best_of: 2
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
        is_round_robin_bo2_as_2xbo1: true,
        type: "roundRobin",
        external_league_name: "Test League"
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

      const result = await addMatchToDatabase(matchDetails, externalLeagueId);

      expect(result).toEqual({
        matchIds: [100, 101],
        is_round_robin_bo2_as_2xbo1: true
      });

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();

      // Verify two match insertions
      expect(mockRunQuery).toHaveBeenCalledTimes(7); // 1 check + 2 insertions + 4 team associations
    });

    it("assigns faction1 home and faction2 away on first BO1, swaps sides on second BO1", async () => {
      const matchDetails = {
        ...validMatchDetailsMatchCreated,
        best_of: 2
      };
      const externalLeagueId = "test-league-id";

      mockRunQuery.mockResolvedValueOnce([]);
      mockGetSeasonLeagueExternalIdByExternalId.mockResolvedValueOnce({
        id: 1,
        external_id: externalLeagueId,
        league_id: 1,
        season_id: 1,
        stage_id: 1,
        is_round_robin_bo2_as_2xbo1: true,
        type: "roundRobin",
        external_league_name: "Test League"
      });
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

      const firstMatchId = 1001;
      const secondMatchId = 1002;
      mockRunQuery.mockResolvedValueOnce({ insertId: firstMatchId });
      mockRunQuery.mockResolvedValueOnce({ insertId: secondMatchId });
      mockRunQuery.mockResolvedValueOnce([]);
      mockRunQuery.mockResolvedValueOnce([]);
      mockRunQuery.mockResolvedValueOnce([]);
      mockRunQuery.mockResolvedValueOnce([]);

      await addMatchToDatabase(matchDetails, externalLeagueId);

      const insertMatchTeamsParams = mockRunQuery.mock.calls
        .filter(
          ([q]) => typeof q === "string" && q.includes("INSERT INTO MatchTeams")
        )
        .map(([, params]) => params);

      expect(insertMatchTeamsParams).toHaveLength(4);
      expect(insertMatchTeamsParams).toEqual(
        expect.arrayContaining([
          [firstMatchId, 1, 1, 100, "home"],
          [firstMatchId, 1, 1, 200, "away"],
          [secondMatchId, 1, 1, 100, "away"],
          [secondMatchId, 1, 1, 200, "home"]
        ])
      );
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
        is_round_robin_bo2_as_2xbo1: false,
        type: "roundRobin",
        external_league_name: "Test League"
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
      mockRunQuery.mockResolvedValueOnce({ insertId: 100 });
      // Mock team to match associations
      mockRunQuery.mockResolvedValueOnce([]);
      mockRunQuery.mockResolvedValueOnce([]);

      await addMatchToDatabase(matchDetails, externalLeagueId);

      // Verify the scheduled_at timestamp is converted correctly
      // formatDateForDatabase converts ISO to MySQL datetime format (YYYY-MM-DD HH:mm:ss)
      const expectedTimestamp = new Date(1703123456 * 1000)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO Matches"),
        expect.arrayContaining([
          expect.any(Number), // league_id
          expect.any(Number), // season_id
          expect.any(Number), // stage_id
          matchDetails.best_of,
          expectedTimestamp, // start_timestamp (MySQL datetime format)
          null, // end_timestamp
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
        is_round_robin_bo2_as_2xbo1: false,
        type: "roundRobin",
        external_league_name: "Test League"
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
      mockRunQuery.mockResolvedValueOnce({ insertId: 100 });
      // Mock team to match associations
      mockRunQuery.mockResolvedValueOnce([]);
      mockRunQuery.mockResolvedValueOnce([]);

      await addMatchToDatabase(matchDetails, externalLeagueId);

      // Verify default date/time is used (next Wednesday at 20:00 Helsinki time)
      // DST conversion varies: 20:00 Helsinki = 17:00 UTC (summer) or 18:00 UTC (winter)
      // formatDateForDatabase returns MySQL datetime format (YYYY-MM-DD HH:mm:ss)
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO Matches"),
        expect.arrayContaining([
          expect.any(Number), // league_id
          expect.any(Number), // season_id
          expect.any(Number), // stage_id
          matchDetails.best_of,
          expect.stringMatching(/^\d{4}-\d{2}-\d{2} (17|18):00:00$/), // start_timestamp (MySQL datetime format, DST-dependent)
          null, // end_timestamp
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
        is_round_robin_bo2_as_2xbo1: false,
        type: "roundRobin",
        external_league_name: "Test League"
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
      mockRunQuery
        .mockResolvedValueOnce([]) // Check for existing matches
        .mockRejectedValueOnce(dbError); // Match insertion fails

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
        is_round_robin_bo2_as_2xbo1: false,
        type: "roundRobin",
        external_league_name: "Test League"
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
      mockRunQuery.mockResolvedValueOnce({ insertId: 1000 });
      // Mock team to match associations
      mockRunQuery.mockResolvedValueOnce([]);
      mockRunQuery.mockResolvedValueOnce([]);

      await addMatchToDatabase(matchDetails, externalLeagueId);

      // Verify team associations
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO MatchTeams"),
        [1000, 1, 1, 100, "home"],
        mockConnection
      );
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO MatchTeams"),
        [1000, 1, 1, 200, "away"],
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
        is_round_robin_bo2_as_2xbo1: false,
        type: "roundRobin",
        external_league_name: "Test League"
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

      // Mock match insertion and team associations
      mockRunQuery
        .mockResolvedValueOnce({ insertId: 100 }) // Match insertion
        .mockResolvedValueOnce([]) // First team association
        .mockResolvedValueOnce([]); // Second team association

      const result = await addMatchToDatabase(matchDetails, externalLeagueId);

      expect(result).toEqual({
        matchIds: [100],
        is_round_robin_bo2_as_2xbo1: false
      });
    });
  });
});
