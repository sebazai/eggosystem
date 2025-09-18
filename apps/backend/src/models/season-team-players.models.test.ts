import {
  validatePlayersInTeams,
  getSeasonTeamPlayersBySteamIds
} from "./season-team-players.models";
import { getSeasonLeagueTeamByExternalId } from "./season-league-team.models";
import { getHubMatchesByExternalMatchRoomId } from "./match.models";
import { redisClient } from "../utils/redisClient";
import type {
  FaceitMatchTeams,
  SeasonTeamPlayer,
  SeasonLeagueTeam
} from "@eggosystem/types";

// Mock dependencies
jest.mock("./season-league-team.models");
jest.mock("./match.models");
jest.mock("../utils/redisClient");
jest.mock("../db/mysqlRunQuery");

const mockGetSeasonLeagueTeamByExternalId =
  getSeasonLeagueTeamByExternalId as jest.MockedFunction<
    typeof getSeasonLeagueTeamByExternalId
  >;
const mockGetHubMatchesByExternalMatchRoomId =
  getHubMatchesByExternalMatchRoomId as jest.MockedFunction<
    typeof getHubMatchesByExternalMatchRoomId
  >;
const mockRedisClient = redisClient as jest.Mocked<typeof redisClient>;

describe("season-team-players.models", () => {
  describe("validatePlayersInTeams", () => {
    const mockTeams: FaceitMatchTeams = {
      faction1: {
        faction_id: "team1-external-id",
        leader: "leader1",
        avatar: "avatar1.jpg",
        roster: [
          {
            player_id: "player1",
            nickname: "Player1",
            avatar: "player1.jpg",
            membership: "member",
            game_player_id: "steam123",
            game_player_name: "Player1",
            game_skill_level: 10,
            anticheat_required: true
          },
          {
            player_id: "player2",
            nickname: "Player2",
            avatar: "player2.jpg",
            membership: "member",
            game_player_id: "steam456",
            game_player_name: "Player2",
            game_skill_level: 8,
            anticheat_required: true
          }
        ],
        substituted: false,
        name: "Team 1",
        type: "premade"
      },
      faction2: {
        faction_id: "team2-external-id",
        leader: "leader2",
        avatar: "avatar2.jpg",
        roster: [
          {
            player_id: "player3",
            nickname: "Player3",
            avatar: "player3.jpg",
            membership: "member",
            game_player_id: "steam789",
            game_player_name: "Player3",
            game_skill_level: 9,
            anticheat_required: true
          }
        ],
        substituted: false,
        name: "Team 2",
        type: "premade"
      }
    };

    const mockSeasonLeagueTeam1: SeasonLeagueTeam = {
      season_id: 1,
      team_id: 101,
      league_id: 1,
      placement: null,
      position_offset: null
    };

    const mockSeasonLeagueTeam2: SeasonLeagueTeam = {
      season_id: 1,
      team_id: 102,
      league_id: 1,
      placement: null,
      position_offset: null
    };

    const mockSeasonTeamPlayers: SeasonTeamPlayer[] = [
      {
        season_id: 1,
        team_id: 101,
        steam_id: "steam123",
        role: "primary",
        is_captain: false,
        is_co_captain: false,
        match_id: null
      },
      {
        season_id: 1,
        team_id: 101,
        steam_id: "steam456",
        role: "primary",
        is_captain: false,
        is_co_captain: false,
        match_id: null
      }
    ];

    const mockMatchIds = [{ id: 1001 }, { id: 1002 }];

    beforeEach(() => {
      jest.clearAllMocks();
      mockRedisClient.set.mockResolvedValue("OK");
      mockGetHubMatchesByExternalMatchRoomId.mockResolvedValue(mockMatchIds);
    });

    describe("successful validation", () => {
      it("should validate all players successfully when all players have null match_id", async () => {
        // Arrange
        mockGetSeasonLeagueTeamByExternalId
          .mockResolvedValueOnce(mockSeasonLeagueTeam1)
          .mockResolvedValueOnce(mockSeasonLeagueTeam2);

        // Mock the internal getSeasonTeamPlayersBySteamIds calls
        const mockRunQuery = jest.requireMock("../db/mysqlRunQuery").runQuery;
        mockRunQuery
          .mockResolvedValueOnce(mockSeasonTeamPlayers) // Team 1 players (all have null match_id)
          .mockResolvedValueOnce([
            {
              season_id: 1,
              team_id: 102,
              steam_id: "steam789",
              role: "primary",
              is_captain: false,
              is_co_captain: false,
              match_id: null
            }
          ]); // Team 2 players (all have null match_id)

        // Act
        await validatePlayersInTeams(mockTeams, "match123");

        // Assert
        expect(mockGetHubMatchesByExternalMatchRoomId).toHaveBeenCalledWith(
          "match123"
        );
        expect(mockGetSeasonLeagueTeamByExternalId).toHaveBeenCalledTimes(2);
        expect(mockGetSeasonLeagueTeamByExternalId).toHaveBeenCalledWith(
          "team1-external-id"
        );
        expect(mockGetSeasonLeagueTeamByExternalId).toHaveBeenCalledWith(
          "team2-external-id"
        );

        expect(mockRunQuery).toHaveBeenCalledTimes(2);
        expect(mockRunQuery).toHaveBeenCalledWith(
          "SELECT * FROM SeasonTeamPlayers WHERE season_id = ? AND team_id = ? AND steam_id IN (?,?)",
          [1, 101, "steam123", "steam456"]
        );
        expect(mockRunQuery).toHaveBeenCalledWith(
          "SELECT * FROM SeasonTeamPlayers WHERE season_id = ? AND team_id = ? AND steam_id IN (?)",
          [1, 102, "steam789"]
        );

        // Should not call Redis set since all players have null match_id (no substitutes from other matches)
        expect(mockRedisClient.set).not.toHaveBeenCalled();
      });
    });

    describe("error scenarios", () => {
      it("should throw error when external match is not found", async () => {
        // Arrange
        mockGetHubMatchesByExternalMatchRoomId.mockResolvedValue(null);

        // Act & Assert
        await expect(
          validatePlayersInTeams(mockTeams, "match123")
        ).rejects.toThrow(
          "Match with external_match_room_id match123 not found"
        );

        expect(mockGetHubMatchesByExternalMatchRoomId).toHaveBeenCalledWith(
          "match123"
        );
        expect(mockGetSeasonLeagueTeamByExternalId).not.toHaveBeenCalled();
      });

      it("should throw error when first team is not found", async () => {
        // Arrange
        mockGetSeasonLeagueTeamByExternalId.mockResolvedValueOnce(undefined);

        // Act & Assert
        await expect(
          validatePlayersInTeams(mockTeams, "match123")
        ).rejects.toThrow(
          "Team with external_team_id team1-external-id not found"
        );

        expect(mockGetHubMatchesByExternalMatchRoomId).toHaveBeenCalledWith(
          "match123"
        );
        expect(mockGetSeasonLeagueTeamByExternalId).toHaveBeenCalledTimes(1);
        expect(mockGetSeasonLeagueTeamByExternalId).toHaveBeenCalledWith(
          "team1-external-id"
        );
      });

      it("should throw error when second team is not found", async () => {
        // Arrange
        mockGetSeasonLeagueTeamByExternalId
          .mockResolvedValueOnce(mockSeasonLeagueTeam1)
          .mockResolvedValueOnce(undefined);

        // Mock the internal getSeasonTeamPlayersBySteamIds call for first team
        const mockRunQuery = jest.requireMock("../db/mysqlRunQuery").runQuery;
        mockRunQuery.mockResolvedValueOnce(mockSeasonTeamPlayers);

        // Act & Assert
        await expect(
          validatePlayersInTeams(mockTeams, "match123")
        ).rejects.toThrow(
          "Team with external_team_id team2-external-id not found"
        );

        expect(mockGetHubMatchesByExternalMatchRoomId).toHaveBeenCalledWith(
          "match123"
        );
        expect(mockGetSeasonLeagueTeamByExternalId).toHaveBeenCalledTimes(2);
        expect(mockGetSeasonLeagueTeamByExternalId).toHaveBeenCalledWith(
          "team1-external-id"
        );
        expect(mockGetSeasonLeagueTeamByExternalId).toHaveBeenCalledWith(
          "team2-external-id"
        );
      });
    });

    describe("invalid players scenarios", () => {
      it("should flag invalid players in Redis when some players are not registered", async () => {
        // Arrange
        mockGetSeasonLeagueTeamByExternalId
          .mockResolvedValueOnce(mockSeasonLeagueTeam1)
          .mockResolvedValueOnce(mockSeasonLeagueTeam2);

        // Mock that only one player from team 1 is registered, but team 1 has 2 players
        const mockRunQuery = jest.requireMock("../db/mysqlRunQuery").runQuery;
        mockRunQuery
          .mockResolvedValueOnce([
            {
              season_id: 1,
              team_id: 101,
              steam_id: "steam123",
              role: "primary",
              is_captain: false,
              is_co_captain: false,
              match_id: null
            }
          ]) // Only one player found
          .mockResolvedValueOnce([
            {
              season_id: 1,
              team_id: 102,
              steam_id: "steam789",
              role: "primary",
              is_captain: false,
              is_co_captain: false,
              match_id: null
            }
          ]); // All team 2 players found

        // Act
        await validatePlayersInTeams(mockTeams, "match123");

        // Assert
        expect(mockGetHubMatchesByExternalMatchRoomId).toHaveBeenCalledWith(
          "match123"
        );
        expect(mockRedisClient.set).toHaveBeenCalledTimes(1);
        expect(mockRedisClient.set).toHaveBeenCalledWith(
          "match:invalid_players:match123",
          JSON.stringify({
            external_match_id: "match123",
            steam_ids: ["steam123", "steam456"],
            players_in_season_team_players: ["steam123"],
            team_id: 101,
            match_ids: [1001, 1002],
            players_added_for_this_match: []
          })
        );
      });

      it("should flag invalid players for both teams when both have unregistered players", async () => {
        // Arrange
        mockGetSeasonLeagueTeamByExternalId
          .mockResolvedValueOnce(mockSeasonLeagueTeam1)
          .mockResolvedValueOnce(mockSeasonLeagueTeam2);

        // Mock that both teams have unregistered players
        const mockRunQuery = jest.requireMock("../db/mysqlRunQuery").runQuery;
        mockRunQuery
          .mockResolvedValueOnce([]) // No players found for team 1
          .mockResolvedValueOnce([]); // No players found for team 2

        // Act
        await validatePlayersInTeams(mockTeams, "match123");

        // Assert
        expect(mockGetHubMatchesByExternalMatchRoomId).toHaveBeenCalledWith(
          "match123"
        );
        expect(mockRedisClient.set).toHaveBeenCalledTimes(2);

        // First call for team 1
        expect(mockRedisClient.set).toHaveBeenNthCalledWith(
          1,
          "match:invalid_players:match123",
          JSON.stringify({
            external_match_id: "match123",
            steam_ids: ["steam123", "steam456"],
            players_in_season_team_players: [],
            team_id: 101,
            match_ids: [1001, 1002],
            players_added_for_this_match: []
          })
        );

        // Second call for team 2
        expect(mockRedisClient.set).toHaveBeenNthCalledWith(
          2,
          "match:invalid_players:match123",
          JSON.stringify({
            external_match_id: "match123",
            steam_ids: ["steam789"],
            players_in_season_team_players: [],
            team_id: 102,
            match_ids: [1001, 1002],
            players_added_for_this_match: []
          })
        );
      });

      it("should not flag players when all players are registered with null match_id", async () => {
        // Arrange
        mockGetSeasonLeagueTeamByExternalId
          .mockResolvedValueOnce(mockSeasonLeagueTeam1)
          .mockResolvedValueOnce(mockSeasonLeagueTeam2);

        // Mock that all players are registered with null match_id (no substitutes from other matches)
        const mockRunQuery = jest.requireMock("../db/mysqlRunQuery").runQuery;
        mockRunQuery
          .mockResolvedValueOnce(mockSeasonTeamPlayers) // All team 1 players found (null match_id)
          .mockResolvedValueOnce([
            {
              season_id: 1,
              team_id: 102,
              steam_id: "steam789",
              role: "primary",
              is_captain: false,
              is_co_captain: false,
              match_id: null
            }
          ]); // All team 2 players found (null match_id)

        // Act
        await validatePlayersInTeams(mockTeams, "match123");

        // Assert
        expect(mockGetHubMatchesByExternalMatchRoomId).toHaveBeenCalledWith(
          "match123"
        );
        expect(mockRedisClient.set).not.toHaveBeenCalled();
      });
    });

    describe("match_id validation scenarios", () => {
      it("should validate successfully when players with match_id are in the valid match ids", async () => {
        // Arrange
        mockGetSeasonLeagueTeamByExternalId
          .mockResolvedValueOnce(mockSeasonLeagueTeam1)
          .mockResolvedValueOnce(mockSeasonLeagueTeam2);

        const mockRunQuery = jest.requireMock("../db/mysqlRunQuery").runQuery;
        mockRunQuery
          .mockResolvedValueOnce([
            {
              season_id: 1,
              team_id: 101,
              steam_id: "steam123",
              role: "substitute",
              is_captain: false,
              is_co_captain: false,
              match_id: 1001 // Valid match id
            },
            {
              season_id: 1,
              team_id: 101,
              steam_id: "steam456",
              role: "primary",
              is_captain: false,
              is_co_captain: false,
              match_id: null
            }
          ])
          .mockResolvedValueOnce([
            {
              season_id: 1,
              team_id: 102,
              steam_id: "steam789",
              role: "substitute",
              is_captain: false,
              is_co_captain: false,
              match_id: 1002 // Valid match id
            }
          ]);

        // Act
        await validatePlayersInTeams(mockTeams, "match123");

        // Assert
        expect(mockGetHubMatchesByExternalMatchRoomId).toHaveBeenCalledWith(
          "match123"
        );
        expect(mockRedisClient.set).not.toHaveBeenCalled();
      });

      it("should flag players when some players with match_id are not in valid match ids", async () => {
        // Arrange
        mockGetSeasonLeagueTeamByExternalId
          .mockResolvedValueOnce(mockSeasonLeagueTeam1)
          .mockResolvedValueOnce(mockSeasonLeagueTeam2);

        const mockRunQuery = jest.requireMock("../db/mysqlRunQuery").runQuery;
        mockRunQuery
          .mockResolvedValueOnce([
            {
              season_id: 1,
              team_id: 101,
              steam_id: "steam123",
              role: "substitute",
              is_captain: false,
              is_co_captain: false,
              match_id: 9999 // Invalid match id (not in mockMatchIds)
            },
            {
              season_id: 1,
              team_id: 101,
              steam_id: "steam456",
              role: "primary",
              is_captain: false,
              is_co_captain: false,
              match_id: null
            }
          ])
          .mockResolvedValueOnce([
            {
              season_id: 1,
              team_id: 102,
              steam_id: "steam789",
              role: "primary",
              is_captain: false,
              is_co_captain: false,
              match_id: null
            }
          ]);

        // Act
        await validatePlayersInTeams(mockTeams, "match123");

        // Assert
        expect(mockGetHubMatchesByExternalMatchRoomId).toHaveBeenCalledWith(
          "match123"
        );
        expect(mockRedisClient.set).toHaveBeenCalledWith(
          "match:invalid_players:match123",
          JSON.stringify({
            external_match_id: "match123",
            steam_ids: ["steam123", "steam456"],
            players_in_season_team_players: ["steam123", "steam456"],
            team_id: 101,
            match_ids: [1001, 1002],
            players_added_for_this_match: ["steam123"]
          })
        );
      });

      it("should include players_added_for_this_match in Redis when players have valid match_ids", async () => {
        // Arrange
        mockGetSeasonLeagueTeamByExternalId
          .mockResolvedValueOnce(mockSeasonLeagueTeam1)
          .mockResolvedValueOnce(mockSeasonLeagueTeam2);

        const mockRunQuery = jest.requireMock("../db/mysqlRunQuery").runQuery;
        mockRunQuery
          .mockResolvedValueOnce([
            {
              season_id: 1,
              team_id: 101,
              steam_id: "steam123",
              role: "substitute",
              is_captain: false,
              is_co_captain: false,
              match_id: 1001 // Valid match id
            }
            // Missing steam456 - only 1 player found when 2 expected
          ])
          .mockResolvedValueOnce([
            {
              season_id: 1,
              team_id: 102,
              steam_id: "steam789",
              role: "primary",
              is_captain: false,
              is_co_captain: false,
              match_id: null
            }
          ]);

        // Act
        await validatePlayersInTeams(mockTeams, "match123");

        // Assert
        expect(mockRedisClient.set).toHaveBeenCalledWith(
          "match:invalid_players:match123",
          JSON.stringify({
            external_match_id: "match123",
            steam_ids: ["steam123", "steam456"],
            players_in_season_team_players: ["steam123"],
            team_id: 101,
            match_ids: [1001, 1002],
            players_added_for_this_match: ["steam123"]
          })
        );
      });
    });

    describe("role validation scenarios", () => {
      it("should validate successfully when players with match_id have substitute role", async () => {
        // Arrange
        mockGetSeasonLeagueTeamByExternalId
          .mockResolvedValueOnce(mockSeasonLeagueTeam1)
          .mockResolvedValueOnce(mockSeasonLeagueTeam2);

        const mockRunQuery = jest.requireMock("../db/mysqlRunQuery").runQuery;
        mockRunQuery
          .mockResolvedValueOnce([
            {
              season_id: 1,
              team_id: 101,
              steam_id: "steam123",
              role: "substitute", // Correct role for player with match_id
              is_captain: false,
              is_co_captain: false,
              match_id: 1001
            },
            {
              season_id: 1,
              team_id: 101,
              steam_id: "steam456",
              role: "primary", // Correct role for player without match_id
              is_captain: false,
              is_co_captain: false,
              match_id: null
            }
          ])
          .mockResolvedValueOnce([
            {
              season_id: 1,
              team_id: 102,
              steam_id: "steam789",
              role: "primary",
              is_captain: false,
              is_co_captain: false,
              match_id: null
            }
          ]);

        // Act
        await validatePlayersInTeams(mockTeams, "match123");

        // Assert - No Redis call should be made since all validations pass
        expect(mockRedisClient.set).not.toHaveBeenCalled();
      });

      it("should handle mix of primary and substitute players correctly", async () => {
        // Arrange
        mockGetSeasonLeagueTeamByExternalId
          .mockResolvedValueOnce(mockSeasonLeagueTeam1)
          .mockResolvedValueOnce(mockSeasonLeagueTeam2);

        const mockRunQuery = jest.requireMock("../db/mysqlRunQuery").runQuery;
        mockRunQuery
          .mockResolvedValueOnce([
            {
              season_id: 1,
              team_id: 101,
              steam_id: "steam123",
              role: "primary", // Should have null match_id for primary
              is_captain: false,
              is_co_captain: false,
              match_id: null
            },
            {
              season_id: 1,
              team_id: 101,
              steam_id: "steam456",
              role: "substitute", // Should have match_id for substitute
              is_captain: false,
              is_co_captain: false,
              match_id: 1001
            }
          ])
          .mockResolvedValueOnce([
            {
              season_id: 1,
              team_id: 102,
              steam_id: "steam789",
              role: "substitute",
              is_captain: false,
              is_co_captain: false,
              match_id: 1002
            }
          ]);

        // Act
        await validatePlayersInTeams(mockTeams, "match123");

        // Assert - All validations should pass
        expect(mockRedisClient.set).not.toHaveBeenCalled();
      });
    });

    describe("boundary analysis scenarios", () => {
      it("should handle single match id in array", async () => {
        // Arrange
        mockGetHubMatchesByExternalMatchRoomId.mockResolvedValue([
          { id: 1001 }
        ]);
        mockGetSeasonLeagueTeamByExternalId
          .mockResolvedValueOnce(mockSeasonLeagueTeam1)
          .mockResolvedValueOnce(mockSeasonLeagueTeam2);

        const mockRunQuery = jest.requireMock("../db/mysqlRunQuery").runQuery;
        mockRunQuery
          .mockResolvedValueOnce(mockSeasonTeamPlayers)
          .mockResolvedValueOnce([
            {
              season_id: 1,
              team_id: 102,
              steam_id: "steam789",
              role: "primary",
              is_captain: false,
              is_co_captain: false,
              match_id: null
            }
          ]);

        // Act
        await validatePlayersInTeams(mockTeams, "match123");

        // Assert
        expect(mockRedisClient.set).not.toHaveBeenCalled();
      });

      it("should handle maximum typical roster size", async () => {
        // Arrange - Create teams with 10 players each (maximum typical roster)
        const largeTeams: FaceitMatchTeams = {
          faction1: {
            faction_id: "team1-external-id",
            leader: "leader1",
            avatar: "avatar1.jpg",
            roster: Array.from({ length: 10 }, (_, i) => ({
              player_id: `player${i + 1}`,
              nickname: `Player${i + 1}`,
              avatar: `player${i + 1}.jpg`,
              membership: "member" as const,
              game_player_id: `steam${100 + i}`,
              game_player_name: `Player${i + 1}`,
              game_skill_level: 10,
              anticheat_required: true
            })),
            substituted: false,
            name: "Large Team 1",
            type: "premade"
          },
          faction2: {
            faction_id: "team2-external-id",
            leader: "leader2",
            avatar: "avatar2.jpg",
            roster: Array.from({ length: 10 }, (_, i) => ({
              player_id: `player${i + 11}`,
              nickname: `Player${i + 11}`,
              avatar: `player${i + 11}.jpg`,
              membership: "member" as const,
              game_player_id: `steam${200 + i}`,
              game_player_name: `Player${i + 11}`,
              game_skill_level: 8,
              anticheat_required: true
            })),
            substituted: false,
            name: "Large Team 2",
            type: "premade"
          }
        };

        mockGetSeasonLeagueTeamByExternalId
          .mockResolvedValueOnce(mockSeasonLeagueTeam1)
          .mockResolvedValueOnce(mockSeasonLeagueTeam2);

        const mockRunQuery = jest.requireMock("../db/mysqlRunQuery").runQuery;
        mockRunQuery
          .mockResolvedValueOnce(
            Array.from({ length: 10 }, (_, i) => ({
              season_id: 1,
              team_id: 101,
              steam_id: `steam${100 + i}`,
              role: "primary",
              is_captain: i === 0,
              is_co_captain: i === 1,
              match_id: null
            }))
          )
          .mockResolvedValueOnce(
            Array.from({ length: 10 }, (_, i) => ({
              season_id: 1,
              team_id: 102,
              steam_id: `steam${200 + i}`,
              role: "primary",
              is_captain: i === 0,
              is_co_captain: i === 1,
              match_id: null
            }))
          );

        // Act
        await validatePlayersInTeams(largeTeams, "match123");

        // Assert - All players should be valid
        expect(mockRedisClient.set).not.toHaveBeenCalled();
      });

      it("should handle empty match_ids array from database", async () => {
        // Arrange
        mockGetHubMatchesByExternalMatchRoomId.mockResolvedValue([]);

        // Act & Assert
        await expect(
          validatePlayersInTeams(mockTeams, "match123")
        ).rejects.toThrow(
          "Match with external_match_room_id match123 not found"
        );

        expect(mockGetHubMatchesByExternalMatchRoomId).toHaveBeenCalledWith(
          "match123"
        );
        expect(mockGetSeasonLeagueTeamByExternalId).not.toHaveBeenCalled();
      });
    });

    describe("edge cases", () => {
      it("should handle teams with empty rosters", async () => {
        // Arrange
        const teamsWithEmptyRoster: FaceitMatchTeams = {
          faction1: {
            ...mockTeams.faction1,
            roster: []
          },
          faction2: {
            ...mockTeams.faction2,
            roster: []
          }
        };

        mockGetSeasonLeagueTeamByExternalId
          .mockResolvedValueOnce(mockSeasonLeagueTeam1)
          .mockResolvedValueOnce(mockSeasonLeagueTeam2);

        const mockRunQuery = jest.requireMock("../db/mysqlRunQuery").runQuery;
        mockRunQuery
          .mockResolvedValueOnce([]) // Empty roster returns empty array
          .mockResolvedValueOnce([]); // Empty roster returns empty array

        // Act
        await validatePlayersInTeams(teamsWithEmptyRoster, "match123");

        // Assert
        expect(mockGetHubMatchesByExternalMatchRoomId).toHaveBeenCalledWith(
          "match123"
        );
        expect(mockRunQuery).toHaveBeenCalledWith(
          "SELECT * FROM SeasonTeamPlayers WHERE season_id = ? AND team_id = ? AND steam_id IN ()",
          [1, 101]
        );
        expect(mockRedisClient.set).not.toHaveBeenCalled(); // No invalid players to flag
      });

      it("should handle teams with single player", async () => {
        // Arrange
        const teamsWithSinglePlayer: FaceitMatchTeams = {
          faction1: {
            ...mockTeams.faction1,
            roster: [mockTeams.faction1.roster[0]] // Only one player
          },
          faction2: {
            ...mockTeams.faction2,
            roster: [mockTeams.faction2.roster[0]] // Only one player
          }
        };

        mockGetSeasonLeagueTeamByExternalId
          .mockResolvedValueOnce(mockSeasonLeagueTeam1)
          .mockResolvedValueOnce(mockSeasonLeagueTeam2);

        const mockRunQuery = jest.requireMock("../db/mysqlRunQuery").runQuery;
        mockRunQuery
          .mockResolvedValueOnce([
            {
              season_id: 1,
              team_id: 101,
              steam_id: "steam123",
              role: "primary",
              is_captain: false,
              is_co_captain: false,
              match_id: null
            }
          ])
          .mockResolvedValueOnce([
            {
              season_id: 1,
              team_id: 102,
              steam_id: "steam789",
              role: "primary",
              is_captain: false,
              is_co_captain: false,
              match_id: null
            }
          ]);

        // Act
        await validatePlayersInTeams(teamsWithSinglePlayer, "match123");

        // Assert
        expect(mockGetHubMatchesByExternalMatchRoomId).toHaveBeenCalledWith(
          "match123"
        );
        expect(mockRunQuery).toHaveBeenCalledWith(
          "SELECT * FROM SeasonTeamPlayers WHERE season_id = ? AND team_id = ? AND steam_id IN (?)",
          [1, 101, "steam123"]
        );
        expect(mockRedisClient.set).not.toHaveBeenCalled();
      });
    });
  });

  describe("getSeasonTeamPlayersBySteamIds", () => {
    it("should query database with correct parameters", async () => {
      // Arrange
      const seasonId = 1;
      const steamIds = ["steam123", "steam456", "steam789"];
      const mockSeasonTeamPlayers: SeasonTeamPlayer[] = [
        {
          season_id: 1,
          team_id: 101,
          steam_id: "steam123",
          role: "primary",
          is_captain: false,
          is_co_captain: false,
          match_id: null
        },
        {
          season_id: 1,
          team_id: 101,
          steam_id: "steam456",
          role: "primary",
          is_captain: false,
          is_co_captain: false,
          match_id: null
        }
      ];

      const mockRunQuery = jest.requireMock("../db/mysqlRunQuery").runQuery;
      mockRunQuery.mockResolvedValue(mockSeasonTeamPlayers);

      // Act
      const result = await getSeasonTeamPlayersBySteamIds(
        seasonId,
        101,
        steamIds
      );

      // Assert
      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT * FROM SeasonTeamPlayers WHERE season_id = ? AND team_id = ? AND steam_id IN (?,?,?)",
        [seasonId, 101, ...steamIds]
      );
      expect(result).toEqual(mockSeasonTeamPlayers);
    });

    it("should return empty array when no players found", async () => {
      // Arrange
      const seasonId = 1;
      const steamIds = ["steam123"];
      const mockRunQuery = jest.requireMock("../db/mysqlRunQuery").runQuery;
      mockRunQuery.mockResolvedValue([]);

      // Act
      const result = await getSeasonTeamPlayersBySteamIds(
        seasonId,
        101,
        steamIds
      );

      // Assert
      expect(result).toEqual([]);
    });
  });
});
