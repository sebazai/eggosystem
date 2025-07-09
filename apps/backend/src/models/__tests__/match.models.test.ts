import { addMatchToDatabase } from "../match.models";
import { runQuery } from "../../db/mysqlRunQuery";
import { getConnection } from "../../db/mysqlConnection";
import { logger } from "../../utils/app-logger";
import { type FaceITMatchDetails } from "../../services/faceit.services";
import {
  type SeasonLeagueExternalId,
  type SeasonLeagueTeam
} from "@eggosystem/types";

// Mock dependencies
jest.mock("../../db/mysqlRunQuery");
jest.mock("../../db/mysqlConnection");
jest.mock("../../utils/app-logger");

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockGetConnection = getConnection as jest.MockedFunction<
  typeof getConnection
>;
const mockLogger = logger as jest.Mocked<typeof logger>;

describe("addMatchToDatabase", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockConnection: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock connection
    mockConnection = {
      beginTransaction: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn(),
      release: jest.fn()
    };

    mockGetConnection.mockResolvedValue(mockConnection);
  });

  const createMockMatchDetails = (
    overrides: Partial<FaceITMatchDetails> = {}
  ): FaceITMatchDetails => ({
    match_id: "test-match-id",
    best_of: 1,
    scheduled_at: 1640995200, // 2022-01-01 00:00:00 UTC
    started_at: 1640995800, // 2022-01-01 00:10:00 UTC
    finished_at: 1640999400, // 2022-01-01 01:10:00 UTC
    teams: {
      faction1: {
        faction_id: "team1-external-id",
        name: "Team One",
        roster: [],
        leader: "leader1",
        avatar: "avatar1.jpg",
        substituted: false,
        type: "premade"
      },
      faction2: {
        faction_id: "team2-external-id",
        name: "Team Two",
        roster: [],
        leader: "leader2",
        avatar: "avatar2.jpg",
        substituted: false,
        type: "premade"
      }
    },
    // Add other required properties to satisfy the interface
    version: 1,
    game: "cs2",
    region: "EU",
    competition_id: "test-competition",
    competition_type: "championship",
    competition_name: "Test Championship",
    organizer_id: "test-organizer",
    voting: {
      voted_entity_types: [],
      location: {
        entities: [],
        pick: []
      },
      map: {
        entities: [],
        pick: []
      }
    },
    calculate_elo: true,
    configured_at: 1640995200,
    demo_url: [],
    chat_room_id: "test-chat-room",
    results: {
      winner: "faction1",
      score: {
        faction1: 1,
        faction2: 0
      }
    },
    detailed_results: [],
    status: "finished",
    round: 1,
    group: 1,
    faceit_url: "https://faceit.com/test-match",
    ...overrides
  });

  const createMockSeasonLeagueExternalId = (
    overrides: Partial<SeasonLeagueExternalId> = {}
  ): SeasonLeagueExternalId => ({
    id: 1,
    external_id: "league-external-id",
    league_id: 1,
    season_id: 1,
    stage_id: 1,
    isBO2PlayedAs2xBO1: false,
    type: "roundRobin",
    ...overrides
  });

  const createMockSeasonLeagueTeam = (teamId: number): SeasonLeagueTeam => ({
    team_id: teamId,
    league_id: 1,
    season_id: 1,
    placement: null,
    position_offset: null
  });

  describe("Normal match (not BO2)", () => {
    it("should successfully add a normal match to database", async () => {
      const matchDetails = createMockMatchDetails();
      const externalLeagueId = "league-external-id";

      // Mock database responses
      mockRunQuery
        .mockResolvedValueOnce([createMockSeasonLeagueExternalId()]) // SeasonLeagueExternalId lookup
        .mockResolvedValueOnce([createMockSeasonLeagueTeam(1)]) // Team 1 lookup
        .mockResolvedValueOnce([createMockSeasonLeagueTeam(2)]) // Team 2 lookup
        .mockResolvedValueOnce([{ insertId: 100 }]) // Match insert
        .mockResolvedValueOnce([]) // First MatchTeams insert
        .mockResolvedValueOnce([]); // Second MatchTeams insert

      const result = await addMatchToDatabase(matchDetails, externalLeagueId);

      expect(result).toEqual({ matchIds: [100] });
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(mockConnection.rollback).not.toHaveBeenCalled();

      // Verify correct queries were called
      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT * FROM SeasonLeagueExternalIds WHERE external_id = ? LIMIT 1",
        [externalLeagueId],
        mockConnection
      );

      // Verify match insert with correct parameters
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO Matches"),
        [1, 1, 1, 1, "2022-01-01", "00:10:00", "01:10:00", "test-match-id"],
        mockConnection
      );

      // Verify MatchTeams inserts
      expect(mockRunQuery).toHaveBeenCalledWith(
        "INSERT INTO MatchTeams (match_id, team_id) VALUES (?, ?)",
        [100, 1],
        mockConnection
      );
      expect(mockRunQuery).toHaveBeenCalledWith(
        "INSERT INTO MatchTeams (match_id, team_id) VALUES (?, ?)",
        [100, 2],
        mockConnection
      );
    });

    it("should handle matches with null start_time and end_time", async () => {
      const matchDetails = createMockMatchDetails({
        started_at: undefined,
        finished_at: undefined
      });
      const externalLeagueId = "league-external-id";

      mockRunQuery
        .mockResolvedValueOnce([createMockSeasonLeagueExternalId()])
        .mockResolvedValueOnce([createMockSeasonLeagueTeam(1)])
        .mockResolvedValueOnce([createMockSeasonLeagueTeam(2)])
        .mockResolvedValueOnce([{ insertId: 100 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await addMatchToDatabase(matchDetails, externalLeagueId);

      // Verify default times are used
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO Matches"),
        [1, 1, 1, 1, "2022-01-01", "00:00:00", "00:00:00", "test-match-id"],
        mockConnection
      );
    });
  });

  describe("BO2 match played as 2x BO1", () => {
    it("should successfully add two matches for BO2 played as 2x BO1", async () => {
      const matchDetails = createMockMatchDetails({ best_of: 2 });
      const externalLeagueId = "league-external-id";

      // Mock database responses
      mockRunQuery
        .mockResolvedValueOnce([
          createMockSeasonLeagueExternalId({ isBO2PlayedAs2xBO1: true })
        ]) // SeasonLeagueExternalId lookup
        .mockResolvedValueOnce([createMockSeasonLeagueTeam(1)]) // Team 1 lookup
        .mockResolvedValueOnce([createMockSeasonLeagueTeam(2)]) // Team 2 lookup
        .mockResolvedValueOnce([{ insertId: 100 }]) // First match insert
        .mockResolvedValueOnce([{ insertId: 101 }]) // Second match insert
        .mockResolvedValueOnce([]) // First match, team 1 insert
        .mockResolvedValueOnce([]) // First match, team 2 insert
        .mockResolvedValueOnce([]) // Second match, team 1 insert
        .mockResolvedValueOnce([]); // Second match, team 2 insert

      const result = await addMatchToDatabase(matchDetails, externalLeagueId);

      expect(result).toEqual({ matchIds: [100, 101] });
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(mockConnection.rollback).not.toHaveBeenCalled();

      // Verify two match inserts with same parameters
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO Matches"),
        [1, 1, 1, 2, "2022-01-01", "00:10:00", "01:10:00", "test-match-id"],
        mockConnection
      );
      expect(mockRunQuery).toHaveBeenCalledTimes(9); // 1 lookup + 2 team lookups + 2 match inserts + 4 MatchTeams inserts

      // Verify MatchTeams inserts for both matches
      expect(mockRunQuery).toHaveBeenCalledWith(
        "INSERT INTO MatchTeams (match_id, team_id) VALUES (?, ?)",
        [100, 1],
        mockConnection
      );
      expect(mockRunQuery).toHaveBeenCalledWith(
        "INSERT INTO MatchTeams (match_id, team_id) VALUES (?, ?)",
        [100, 2],
        mockConnection
      );
      expect(mockRunQuery).toHaveBeenCalledWith(
        "INSERT INTO MatchTeams (match_id, team_id) VALUES (?, ?)",
        [101, 1],
        mockConnection
      );
      expect(mockRunQuery).toHaveBeenCalledWith(
        "INSERT INTO MatchTeams (match_id, team_id) VALUES (?, ?)",
        [101, 2],
        mockConnection
      );
    });
  });

  describe("Error handling", () => {
    it("should throw error when SeasonLeagueExternalId is not found", async () => {
      const matchDetails = createMockMatchDetails();
      const externalLeagueId = "non-existent-league";

      mockRunQuery.mockResolvedValueOnce([]); // Empty result for SeasonLeagueExternalId lookup

      await expect(
        addMatchToDatabase(matchDetails, externalLeagueId)
      ).rejects.toThrow(
        "No SeasonLeagueExternalId entry found for external_id: non-existent-league"
      );

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(mockConnection.commit).not.toHaveBeenCalled();
    });

    it("should throw error when team one is not found", async () => {
      const matchDetails = createMockMatchDetails();
      const externalLeagueId = "league-external-id";

      mockRunQuery
        .mockResolvedValueOnce([createMockSeasonLeagueExternalId()]) // SeasonLeagueExternalId lookup
        .mockResolvedValueOnce([]) // Team 1 lookup (empty result)
        .mockResolvedValueOnce([createMockSeasonLeagueTeam(2)]); // Team 2 lookup

      await expect(
        addMatchToDatabase(matchDetails, externalLeagueId)
      ).rejects.toThrow(
        "No SeasonLeagueTeam entry found for external_id: team1-external-id or team2-external-id"
      );

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(mockConnection.commit).not.toHaveBeenCalled();
    });

    it("should throw error when team two is not found", async () => {
      const matchDetails = createMockMatchDetails();
      const externalLeagueId = "league-external-id";

      mockRunQuery
        .mockResolvedValueOnce([createMockSeasonLeagueExternalId()]) // SeasonLeagueExternalId lookup
        .mockResolvedValueOnce([createMockSeasonLeagueTeam(1)]) // Team 1 lookup
        .mockResolvedValueOnce([]); // Team 2 lookup (empty result)

      await expect(
        addMatchToDatabase(matchDetails, externalLeagueId)
      ).rejects.toThrow(
        "No SeasonLeagueTeam entry found for external_id: team1-external-id or team2-external-id"
      );

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(mockConnection.commit).not.toHaveBeenCalled();
    });

    it("should throw error when both teams are not found", async () => {
      const matchDetails = createMockMatchDetails();
      const externalLeagueId = "league-external-id";

      mockRunQuery
        .mockResolvedValueOnce([createMockSeasonLeagueExternalId()]) // SeasonLeagueExternalId lookup
        .mockResolvedValueOnce([]) // Team 1 lookup (empty result)
        .mockResolvedValueOnce([]); // Team 2 lookup (empty result)

      await expect(
        addMatchToDatabase(matchDetails, externalLeagueId)
      ).rejects.toThrow(
        "No SeasonLeagueTeam entry found for external_id: team1-external-id or team2-external-id"
      );

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(mockConnection.commit).not.toHaveBeenCalled();
    });

    it("should handle database transaction failure and rollback", async () => {
      const matchDetails = createMockMatchDetails();
      const externalLeagueId = "league-external-id";

      mockRunQuery
        .mockResolvedValueOnce([createMockSeasonLeagueExternalId()]) // SeasonLeagueExternalId lookup
        .mockResolvedValueOnce([createMockSeasonLeagueTeam(1)]) // Team 1 lookup
        .mockResolvedValueOnce([createMockSeasonLeagueTeam(2)]) // Team 2 lookup
        .mockRejectedValueOnce(new Error("Database connection failed")); // Match insert fails

      await expect(
        addMatchToDatabase(matchDetails, externalLeagueId)
      ).rejects.toThrow("Database connection failed");

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(mockConnection.commit).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to insert match test-match-id into database",
        expect.any(Error)
      );
    });

    it("should handle error during BO2 match creation", async () => {
      const matchDetails = createMockMatchDetails({ best_of: 2 });
      const externalLeagueId = "league-external-id";

      mockRunQuery
        .mockResolvedValueOnce([
          createMockSeasonLeagueExternalId({ isBO2PlayedAs2xBO1: true })
        ]) // SeasonLeagueExternalId lookup
        .mockResolvedValueOnce([createMockSeasonLeagueTeam(1)]) // Team 1 lookup
        .mockResolvedValueOnce([createMockSeasonLeagueTeam(2)]) // Team 2 lookup
        .mockResolvedValueOnce([{ insertId: 100 }]) // First match insert
        .mockRejectedValueOnce(new Error("Second match insert failed")); // Second match insert fails

      await expect(
        addMatchToDatabase(matchDetails, externalLeagueId)
      ).rejects.toThrow("Second match insert failed");

      expect(mockConnection.rollback).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(mockConnection.commit).not.toHaveBeenCalled();
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to insert match test-match-id into database",
        expect.any(Error)
      );
    });
  });

  describe("Time formatting", () => {
    it("should correctly format Unix timestamps to database format", async () => {
      const matchDetails = createMockMatchDetails({
        scheduled_at: 1640995200, // 2022-01-01 00:00:00 UTC
        started_at: 1640995800, // 2022-01-01 00:10:00 UTC
        finished_at: 1640999400 // 2022-01-01 01:10:00 UTC
      });
      const externalLeagueId = "league-external-id";

      mockRunQuery
        .mockResolvedValueOnce([createMockSeasonLeagueExternalId()])
        .mockResolvedValueOnce([createMockSeasonLeagueTeam(1)])
        .mockResolvedValueOnce([createMockSeasonLeagueTeam(2)])
        .mockResolvedValueOnce([{ insertId: 100 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await addMatchToDatabase(matchDetails, externalLeagueId);

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO Matches"),
        [1, 1, 1, 1, "2022-01-01", "00:10:00", "01:10:00", "test-match-id"],
        mockConnection
      );
    });

    it("should handle edge case timestamps", async () => {
      const matchDetails = createMockMatchDetails({
        scheduled_at: 0, // 1970-01-01 00:00:00 UTC
        started_at: 0, // 1970-01-01 00:00:00 UTC
        finished_at: 0 // 1970-01-01 00:00:00 UTC
      });
      const externalLeagueId = "league-external-id";

      mockRunQuery
        .mockResolvedValueOnce([createMockSeasonLeagueExternalId()])
        .mockResolvedValueOnce([createMockSeasonLeagueTeam(1)])
        .mockResolvedValueOnce([createMockSeasonLeagueTeam(2)])
        .mockResolvedValueOnce([{ insertId: 100 }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await addMatchToDatabase(matchDetails, externalLeagueId);

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO Matches"),
        [1, 1, 1, 1, "1970-01-01", "00:00:00", "00:00:00", "test-match-id"],
        mockConnection
      );
    });
  });
});
