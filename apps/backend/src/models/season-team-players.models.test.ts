import {
  validatePlayersInTeams,
  getSeasonTeamPlayersBySteamIds,
  discardSeasonTeamPlayer
} from "./season-team-players.models";
import { getSeasonLeagueTeamByExternalId } from "./season-league-team.models";
import { getHubMatchesByExternalMatchRoomId } from "./match.models";
import { notifyFlaggedMatchInDiscord } from "../services/discord-organizer.services";
import { redisClient } from "../utils/redisClient";
import type { FaceitMatchTeams, SeasonTeamPlayer } from "@eggosystem/types";
import {
  createMockSeasonLeagueTeam,
  createMockSeasonTeamPlayer
} from "@eggosystem/types";
import type { PoolConnection } from "mysql2/promise";

// Mock dependencies
jest.mock("./season-league-team.models");
jest.mock("./match.models");
jest.mock("../utils/redisClient");
jest.mock("../db/mysqlRunQuery");
jest.mock("../services/discord-organizer.services", () => ({
  notifyFlaggedMatchInDiscord: jest.fn().mockResolvedValue(undefined)
}));

const mockGetSeasonLeagueTeamByExternalId =
  getSeasonLeagueTeamByExternalId as jest.MockedFunction<
    typeof getSeasonLeagueTeamByExternalId
  >;
const mockGetHubMatchesByExternalMatchRoomId =
  getHubMatchesByExternalMatchRoomId as jest.MockedFunction<
    typeof getHubMatchesByExternalMatchRoomId
  >;
const mockRedisClient = redisClient as jest.Mocked<typeof redisClient>;
const mockNotifyFlaggedMatchInDiscord =
  notifyFlaggedMatchInDiscord as jest.MockedFunction<
    typeof notifyFlaggedMatchInDiscord
  >;

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

    const mockSeasonLeagueTeam1 = createMockSeasonLeagueTeam({
      season_id: 1,
      team_id: 101,
      league_id: 1
    });

    const mockSeasonLeagueTeam2 = createMockSeasonLeagueTeam({
      season_id: 1,
      team_id: 102,
      league_id: 1
    });

    const mockSeasonTeamPlayers: SeasonTeamPlayer[] = [
      createMockSeasonTeamPlayer({
        season_id: 1,
        team_id: 101,
        steam_id: "steam123"
      }),
      createMockSeasonTeamPlayer({
        season_id: 1,
        team_id: 101,
        steam_id: "steam456"
      })
    ];

    const mockMatchIds = [
      { id: 1001, status: "ONGOING" as const },
      { id: 1002, status: "ONGOING" as const }
    ];
    const seasonId = 1;

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
            createMockSeasonTeamPlayer({
              season_id: 1,
              team_id: 102,
              steam_id: "steam789"
            })
          ]); // Team 2 players (all have null match_id)

        // Act
        await validatePlayersInTeams(seasonId, mockTeams, "match123");

        // Assert
        expect(mockGetHubMatchesByExternalMatchRoomId).toHaveBeenCalledWith(
          "match123"
        );
        expect(mockGetSeasonLeagueTeamByExternalId).toHaveBeenCalledTimes(2);
        expect(mockGetSeasonLeagueTeamByExternalId).toHaveBeenCalledWith(
          "team1-external-id",
          seasonId
        );
        expect(mockGetSeasonLeagueTeamByExternalId).toHaveBeenCalledWith(
          "team2-external-id",
          seasonId
        );

        expect(mockRunQuery).toHaveBeenCalledTimes(2);
        expect(mockRunQuery).toHaveBeenCalledWith(
          "SELECT * FROM SeasonTeamPlayers WHERE season_id = ? AND team_id = ? AND steam_id IN (?,?) AND discarded_at IS NULL",
          [1, 101, "steam123", "steam456"]
        );
        expect(mockRunQuery).toHaveBeenCalledWith(
          "SELECT * FROM SeasonTeamPlayers WHERE season_id = ? AND team_id = ? AND steam_id IN (?) AND discarded_at IS NULL",
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
          validatePlayersInTeams(seasonId, mockTeams, "match123")
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
          validatePlayersInTeams(seasonId, mockTeams, "match123")
        ).rejects.toThrow(
          "Team with external_team_id team1-external-id not found"
        );

        expect(mockGetHubMatchesByExternalMatchRoomId).toHaveBeenCalledWith(
          "match123"
        );
        expect(mockGetSeasonLeagueTeamByExternalId).toHaveBeenCalledTimes(1);
        expect(mockGetSeasonLeagueTeamByExternalId).toHaveBeenCalledWith(
          "team1-external-id",
          seasonId
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
          validatePlayersInTeams(seasonId, mockTeams, "match123")
        ).rejects.toThrow(
          "Team with external_team_id team2-external-id not found"
        );

        expect(mockGetHubMatchesByExternalMatchRoomId).toHaveBeenCalledWith(
          "match123"
        );
        expect(mockGetSeasonLeagueTeamByExternalId).toHaveBeenCalledTimes(2);
        expect(mockGetSeasonLeagueTeamByExternalId).toHaveBeenCalledWith(
          "team1-external-id",
          seasonId
        );
        expect(mockGetSeasonLeagueTeamByExternalId).toHaveBeenCalledWith(
          "team2-external-id",
          seasonId
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
            createMockSeasonTeamPlayer({
              season_id: 1,
              team_id: 101,
              steam_id: "steam123"
            })
          ]) // Only one player found (team 1)
          .mockResolvedValueOnce([{ organizer_id: 1 }]) // getOrganizerIdBySeasonId after flag
          .mockResolvedValueOnce([
            createMockSeasonTeamPlayer({
              season_id: 1,
              team_id: 102,
              steam_id: "steam789"
            })
          ]); // All team 2 players found

        // Act
        await validatePlayersInTeams(seasonId, mockTeams, "match123");

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
        expect(mockNotifyFlaggedMatchInDiscord).toHaveBeenCalledTimes(1);
        expect(mockNotifyFlaggedMatchInDiscord).toHaveBeenCalledWith(1, {
          external_match_id: "match123",
          steam_ids: ["steam123", "steam456"],
          players_in_season_team_players: ["steam123"],
          team_id: 101,
          match_ids: [1001, 1002],
          players_added_for_this_match: []
        });
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
          .mockResolvedValueOnce([{ organizer_id: 1 }]) // getOrganizerIdBySeasonId after first flag
          .mockResolvedValueOnce([]) // No players found for team 2
          .mockResolvedValueOnce([{ organizer_id: 1 }]); // getOrganizerIdBySeasonId after second flag

        // Act
        await validatePlayersInTeams(seasonId, mockTeams, "match123");

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
            createMockSeasonTeamPlayer({
              season_id: 1,
              team_id: 102,
              steam_id: "steam789"
            })
          ]); // All team 2 players found (null match_id)

        // Act
        await validatePlayersInTeams(seasonId, mockTeams, "match123");

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
            createMockSeasonTeamPlayer({
              season_id: 1,
              team_id: 101,
              steam_id: "steam123",
              role: "substitute",
              match_id: 1001 // Valid match id
            }),
            createMockSeasonTeamPlayer({
              season_id: 1,
              team_id: 101,
              steam_id: "steam456",
              match_id: null
            })
          ])
          .mockResolvedValueOnce([
            createMockSeasonTeamPlayer({
              season_id: 1,
              team_id: 102,
              steam_id: "steam789",
              role: "substitute",
              match_id: 1002 // Valid match id
            })
          ]);

        // Act
        await validatePlayersInTeams(seasonId, mockTeams, "match123");

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
            createMockSeasonTeamPlayer({
              season_id: 1,
              team_id: 101,
              steam_id: "steam123",
              role: "substitute",
              match_id: 9999 // Invalid match id (not in mockMatchIds)
            }),
            createMockSeasonTeamPlayer({
              season_id: 1,
              team_id: 101,
              steam_id: "steam456",
              match_id: null
            })
          ])
          .mockResolvedValueOnce([{ organizer_id: 1 }]) // getOrganizerIdBySeasonId after flag
          .mockResolvedValueOnce([
            createMockSeasonTeamPlayer({
              season_id: 1,
              team_id: 102,
              steam_id: "steam789",
              match_id: null
            })
          ]);

        // Act
        await validatePlayersInTeams(seasonId, mockTeams, "match123");

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
            createMockSeasonTeamPlayer({
              season_id: 1,
              team_id: 101,
              steam_id: "steam123",
              role: "substitute",
              match_id: 1001 // Valid match id
            })
            // Missing steam456 - only 1 player found when 2 expected
          ])
          .mockResolvedValueOnce([{ organizer_id: 1 }]) // getOrganizerIdBySeasonId after flag
          .mockResolvedValueOnce([
            createMockSeasonTeamPlayer({
              season_id: 1,
              team_id: 102,
              steam_id: "steam789",
              match_id: null
            })
          ]);

        // Act
        await validatePlayersInTeams(seasonId, mockTeams, "match123");

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
            createMockSeasonTeamPlayer({
              season_id: 1,
              team_id: 101,
              steam_id: "steam123",
              role: "substitute", // Correct role for player with match_id
              match_id: 1001
            }),
            createMockSeasonTeamPlayer({
              season_id: 1,
              team_id: 101,
              steam_id: "steam456",
              match_id: null
            })
          ])
          .mockResolvedValueOnce([
            createMockSeasonTeamPlayer({
              season_id: 1,
              team_id: 102,
              steam_id: "steam789",
              match_id: null
            })
          ]);

        // Act
        await validatePlayersInTeams(seasonId, mockTeams, "match123");

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
            createMockSeasonTeamPlayer({
              season_id: 1,
              team_id: 101,
              steam_id: "steam123",
              match_id: null
            }),
            createMockSeasonTeamPlayer({
              season_id: 1,
              team_id: 101,
              steam_id: "steam456",
              role: "substitute", // Should have match_id for substitute
              match_id: 1001
            })
          ])
          .mockResolvedValueOnce([
            createMockSeasonTeamPlayer({
              season_id: 1,
              team_id: 102,
              steam_id: "steam789",
              role: "substitute",
              match_id: 1002
            })
          ]);

        // Act
        await validatePlayersInTeams(seasonId, mockTeams, "match123");

        // Assert - All validations should pass
        expect(mockRedisClient.set).not.toHaveBeenCalled();
      });
    });

    describe("boundary analysis scenarios", () => {
      it("should handle single match id in array", async () => {
        // Arrange
        mockGetHubMatchesByExternalMatchRoomId.mockResolvedValue([
          { id: 1001, status: "ONGOING" as const }
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
        await validatePlayersInTeams(seasonId, mockTeams, "match123");

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
            Array.from({ length: 10 }, (_, i) =>
              createMockSeasonTeamPlayer({
                season_id: 1,
                team_id: 101,
                steam_id: `steam${100 + i}`,
                is_captain: i === 0,
                is_co_captain: i === 1,
                match_id: null
              })
            )
          )
          .mockResolvedValueOnce(
            Array.from({ length: 10 }, (_, i) =>
              createMockSeasonTeamPlayer({
                season_id: 1,
                team_id: 102,
                steam_id: `steam${200 + i}`,
                is_captain: i === 0,
                is_co_captain: i === 1,
                match_id: null
              })
            )
          );

        // Act
        await validatePlayersInTeams(seasonId, largeTeams, "match123");

        // Assert - All players should be valid
        expect(mockRedisClient.set).not.toHaveBeenCalled();
      });

      it("should handle empty match_ids array from database", async () => {
        // Arrange
        mockGetHubMatchesByExternalMatchRoomId.mockResolvedValue([]);

        // Act & Assert
        await expect(
          validatePlayersInTeams(seasonId, mockTeams, "match123")
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
        await validatePlayersInTeams(
          seasonId,
          teamsWithEmptyRoster,
          "match123"
        );

        // Assert
        expect(mockGetHubMatchesByExternalMatchRoomId).toHaveBeenCalledWith(
          "match123"
        );
        expect(mockRunQuery).toHaveBeenCalledWith(
          "SELECT * FROM SeasonTeamPlayers WHERE season_id = ? AND team_id = ? AND steam_id IN () AND discarded_at IS NULL",
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
            createMockSeasonTeamPlayer({
              season_id: 1,
              team_id: 101,
              steam_id: "steam123"
            })
          ])
          .mockResolvedValueOnce([
            createMockSeasonTeamPlayer({
              season_id: 1,
              team_id: 102,
              steam_id: "steam789"
            })
          ]);

        // Act
        await validatePlayersInTeams(
          seasonId,
          teamsWithSinglePlayer,
          "match123"
        );

        // Assert
        expect(mockGetHubMatchesByExternalMatchRoomId).toHaveBeenCalledWith(
          "match123"
        );
        expect(mockRunQuery).toHaveBeenCalledWith(
          "SELECT * FROM SeasonTeamPlayers WHERE season_id = ? AND team_id = ? AND steam_id IN (?) AND discarded_at IS NULL",
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
        createMockSeasonTeamPlayer({
          season_id: 1,
          team_id: 101,
          steam_id: "steam123"
        }),
        createMockSeasonTeamPlayer({
          season_id: 1,
          team_id: 101,
          steam_id: "steam456"
        })
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
        "SELECT * FROM SeasonTeamPlayers WHERE season_id = ? AND team_id = ? AND steam_id IN (?,?,?) AND discarded_at IS NULL",
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

  describe("discardSeasonTeamPlayer", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      const mockRunQuery = jest.requireMock("../db/mysqlRunQuery").runQuery;
      mockRunQuery.mockReset();
    });

    it("should discard a player successfully", async () => {
      // Arrange
      const seasonId = 1;
      const teamId = 101;
      const steamId = "steam123";
      const accountId = 42;
      const mockConnection = {} as unknown as PoolConnection;

      const mockRunQuery = jest.requireMock("../db/mysqlRunQuery").runQuery;
      mockRunQuery
        .mockResolvedValueOnce([
          createMockSeasonTeamPlayer({
            season_id: seasonId,
            team_id: teamId,
            steam_id: steamId
          })
        ]) // First call: check if player exists
        .mockResolvedValueOnce({ affectedRows: 1 }); // Second call: update

      // Act
      await discardSeasonTeamPlayer(
        seasonId,
        teamId,
        steamId,
        accountId,
        mockConnection
      );

      // Assert
      expect(mockRunQuery).toHaveBeenCalledTimes(2);
      expect(mockRunQuery).toHaveBeenNthCalledWith(
        1,
        "SELECT * FROM SeasonTeamPlayers WHERE season_id = ? AND team_id = ? AND steam_id = ? AND discarded_at IS NULL",
        [seasonId, teamId, steamId],
        mockConnection
      );
      expect(mockRunQuery).toHaveBeenNthCalledWith(
        2,
        "UPDATE SeasonTeamPlayers SET discarded_at = NOW(), discarded_by = ? WHERE season_id = ? AND team_id = ? AND steam_id = ?",
        [accountId, seasonId, teamId, steamId],
        mockConnection
      );
    });

    it("should throw error if player not found", async () => {
      // Arrange
      const seasonId = 1;
      const teamId = 101;
      const steamId = "steam123";
      const accountId = 42;
      const mockConnection = {} as unknown as PoolConnection;

      const mockRunQuery = jest.requireMock("../db/mysqlRunQuery").runQuery;
      mockRunQuery.mockResolvedValueOnce([]); // Player not found

      // Act & Assert
      await expect(
        discardSeasonTeamPlayer(
          seasonId,
          teamId,
          steamId,
          accountId,
          mockConnection
        )
      ).rejects.toThrow(
        `Player with steam_id ${steamId} not found in team ${teamId} for season ${seasonId}`
      );
    });

    it("should throw error if player already discarded", async () => {
      // Arrange
      const seasonId = 1;
      const teamId = 101;
      const steamId = "steam123";
      const accountId = 42;
      const mockConnection = {} as unknown as PoolConnection;

      const mockRunQuery = jest.requireMock("../db/mysqlRunQuery").runQuery;
      mockRunQuery.mockResolvedValueOnce([
        createMockSeasonTeamPlayer({
          season_id: seasonId,
          team_id: teamId,
          steam_id: steamId,
          discarded_at: new Date(),
          discarded_by: 1
        })
      ]); // Player already discarded

      // Act & Assert
      await expect(
        discardSeasonTeamPlayer(
          seasonId,
          teamId,
          steamId,
          accountId,
          mockConnection
        )
      ).rejects.toThrow(
        `Player with steam_id ${steamId} is already discarded from team ${teamId} for season ${seasonId}`
      );
    });

    it("should throw error if player is a captain", async () => {
      // Arrange
      const seasonId = 1;
      const teamId = 101;
      const steamId = "steam123";
      const accountId = 42;
      const mockConnection = {} as unknown as PoolConnection;

      const mockRunQuery = jest.requireMock("../db/mysqlRunQuery").runQuery;
      mockRunQuery.mockResolvedValueOnce([
        createMockSeasonTeamPlayer({
          season_id: seasonId,
          team_id: teamId,
          steam_id: steamId,
          is_captain: true
        })
      ]); // Player is a captain

      // Act & Assert
      await expect(
        discardSeasonTeamPlayer(
          seasonId,
          teamId,
          steamId,
          accountId,
          mockConnection
        )
      ).rejects.toThrow(
        "Please assign a new captain in role management for the team before removing the current captain"
      );
    });
  });
});
