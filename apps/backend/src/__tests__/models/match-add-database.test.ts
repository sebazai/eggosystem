import { addMatchToDatabase } from "../../models/match.models";
import { runQuery } from "../../db/mysqlRunQuery";
import { getConnection } from "../../db/mysqlConnection";
import { logger } from "../../utils/app-logger";
import {
  type DetailsObjectCreated,
  type SeasonLeagueExternalId,
  type SeasonLeagueTeam,
  FaceitGame,
  FaceitMatchStatus
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
  let mockDate: jest.SpyInstance;

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

    // Mock Date to return predictable values
    // Mock a Saturday (day 6) so next Wednesday is predictable
    const RealDate = Date;
    const fixedDate = new RealDate("2022-01-01T10:00:00.000Z"); // Saturday
    mockDate = jest
      .spyOn(global, "Date")
      .mockImplementation((arg?: string | number | Date) => {
        if (arg) return new RealDate(arg);
        return fixedDate;
      });
    // @ts-expect-error Mocking static property
    mockDate.now = jest.fn(() => fixedDate.getTime());
  });

  afterEach(() => {
    mockDate.mockRestore();
  });

  const createMockMatchDetails = (
    overrides: Partial<DetailsObjectCreated> = {}
  ): DetailsObjectCreated => ({
    match_id: "test-match-id",
    version: 1,
    game: FaceitGame.CS2,
    region: "EU",
    competition_id: "test-competition",
    competition_type: "championship",
    competition_name: "Test Championship",
    organizer_id: "test-organizer",
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
    calculate_elo: true,
    chat_room_id: "test-chat-room",
    best_of: 1,
    status: FaceitMatchStatus.CREATED,
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
        [1, 1, 1, 1, "2022-01-05", "19:00:00", null, "test-match-id"],
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
      const matchDetails = createMockMatchDetails();
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
        [1, 1, 1, 1, "2022-01-05", "19:00:00", null, "test-match-id"],
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
        [1, 1, 1, 2, "2022-01-05", "19:00:00", null, "test-match-id"],
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

      // First query: SeasonLeagueExternalId lookup - empty result
      mockRunQuery.mockResolvedValueOnce([]);

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

      // First query: SeasonLeagueExternalId lookup - success
      // Second query: Team 1 lookup - empty result
      // Third query: Team 2 lookup - empty result
      mockRunQuery
        .mockResolvedValueOnce([createMockSeasonLeagueExternalId()])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

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

      // First query: SeasonLeagueExternalId lookup - success
      // Second query: Team 1 lookup - success
      // Third query: Team 2 lookup - success
      // Fourth query: Match insert - fails
      mockRunQuery
        .mockResolvedValueOnce([createMockSeasonLeagueExternalId()])
        .mockResolvedValueOnce([createMockSeasonLeagueTeam(1)])
        .mockResolvedValueOnce([createMockSeasonLeagueTeam(2)])
        .mockRejectedValueOnce(new Error("Database connection failed"));

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

      // First query: SeasonLeagueExternalId lookup - success with BO2 flag
      // Second query: Team 1 lookup - success
      // Third query: Team 2 lookup - success
      // Fourth query: First match insert - success
      // Fifth query: Second match insert - fails
      mockRunQuery
        .mockResolvedValueOnce([
          createMockSeasonLeagueExternalId({ isBO2PlayedAs2xBO1: true })
        ])
        .mockResolvedValueOnce([createMockSeasonLeagueTeam(1)])
        .mockResolvedValueOnce([createMockSeasonLeagueTeam(2)])
        .mockResolvedValueOnce([{ insertId: 100 }])
        .mockRejectedValueOnce(new Error("Second match insert failed"));

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
      const matchDetails = createMockMatchDetails();
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
        [1, 1, 1, 1, "2022-01-05", "19:00:00", null, "test-match-id"],
        mockConnection
      );
    });

    it("should handle edge case timestamps", async () => {
      const matchDetails = createMockMatchDetails();
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
        [1, 1, 1, 1, "2022-01-05", "19:00:00", null, "test-match-id"],
        mockConnection
      );
    });
  });
});
