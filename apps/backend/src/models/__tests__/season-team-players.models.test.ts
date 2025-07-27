import {
  validatePlayersInTeams,
  getSeasonTeamPlayersBySteamIds
} from "../season-team-players.models";
import { getSeasonLeagueTeamByExternalId } from "../season-league-team.models";
import { redisClient } from "../../utils/redisClient";
import type {
  FaceitMatchTeams,
  SeasonTeamPlayer,
  SeasonLeagueTeam
} from "@eggosystem/types";

// Mock dependencies
jest.mock("../season-league-team.models");
jest.mock("../../utils/redisClient");
jest.mock("../../db/mysqlRunQuery");

const mockGetSeasonLeagueTeamByExternalId =
  getSeasonLeagueTeamByExternalId as jest.MockedFunction<
    typeof getSeasonLeagueTeamByExternalId
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
        is_co_captain: false
      },
      {
        season_id: 1,
        team_id: 101,
        steam_id: "steam456",
        role: "primary",
        is_captain: false,
        is_co_captain: false
      }
    ];

    beforeEach(() => {
      jest.clearAllMocks();
      mockRedisClient.set.mockResolvedValue("OK");
    });

    describe("successful validation", () => {
      it("should validate all players successfully when all players are registered", async () => {
        // Arrange
        mockGetSeasonLeagueTeamByExternalId
          .mockResolvedValueOnce(mockSeasonLeagueTeam1)
          .mockResolvedValueOnce(mockSeasonLeagueTeam2);

        // Mock the internal getSeasonTeamPlayersBySteamIds calls
        const mockRunQuery = jest.requireMock(
          "../../db/mysqlRunQuery"
        ).runQuery;
        mockRunQuery
          .mockResolvedValueOnce(mockSeasonTeamPlayers) // Team 1 players
          .mockResolvedValueOnce([
            {
              season_id: 1,
              team_id: 102,
              steam_id: "steam789",
              role: "primary",
              is_captain: false,
              is_co_captain: false
            }
          ]); // Team 2 players

        // Act
        await validatePlayersInTeams(mockTeams, "match123");

        // Assert
        expect(mockGetSeasonLeagueTeamByExternalId).toHaveBeenCalledTimes(2);
        expect(mockGetSeasonLeagueTeamByExternalId).toHaveBeenCalledWith(
          "team1-external-id"
        );
        expect(mockGetSeasonLeagueTeamByExternalId).toHaveBeenCalledWith(
          "team2-external-id"
        );

        expect(mockRunQuery).toHaveBeenCalledTimes(2);
        expect(mockRunQuery).toHaveBeenCalledWith(
          "SELECT * FROM SeasonTeamPlayers WHERE steam_id IN (?)",
          [["steam123", "steam456"]]
        );
        expect(mockRunQuery).toHaveBeenCalledWith(
          "SELECT * FROM SeasonTeamPlayers WHERE steam_id IN (?)",
          [["steam789"]]
        );

        // Should not call Redis set since all players are valid
        expect(mockRedisClient.set).not.toHaveBeenCalled();
      });
    });

    describe("team not found scenarios", () => {
      it("should throw error when first team is not found", async () => {
        // Arrange
        mockGetSeasonLeagueTeamByExternalId.mockResolvedValueOnce(undefined);

        // Act & Assert
        await expect(
          validatePlayersInTeams(mockTeams, "match123")
        ).rejects.toThrow(
          "Team with external_team_id team1-external-id not found"
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
        const mockRunQuery = jest.requireMock(
          "../../db/mysqlRunQuery"
        ).runQuery;
        mockRunQuery.mockResolvedValueOnce([mockSeasonTeamPlayers]);

        // Act & Assert
        await expect(
          validatePlayersInTeams(mockTeams, "match123")
        ).rejects.toThrow(
          "Team with external_team_id team2-external-id not found"
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
        const mockRunQuery = jest.requireMock(
          "../../db/mysqlRunQuery"
        ).runQuery;
        mockRunQuery
          .mockResolvedValueOnce([
            {
              season_id: 1,
              team_id: 101,
              steam_id: "steam123",
              role: "primary",
              is_captain: false,
              is_co_captain: false
            }
          ]) // Only one player found
          .mockResolvedValueOnce([
            {
              season_id: 1,
              team_id: 102,
              steam_id: "steam789",
              role: "primary",
              is_captain: false,
              is_co_captain: false
            }
          ]); // All team 2 players found

        // Act
        await validatePlayersInTeams(mockTeams, "match123");

        // Assert
        expect(mockRedisClient.set).toHaveBeenCalledTimes(1);
        expect(mockRedisClient.set).toHaveBeenCalledWith(
          "match:invalid_players:match123",
          JSON.stringify({
            external_match_id: "match123",
            steam_ids: ["steam123", "steam456"],
            team_id: 101
          })
        );
      });

      it("should flag invalid players for both teams when both have unregistered players", async () => {
        // Arrange
        mockGetSeasonLeagueTeamByExternalId
          .mockResolvedValueOnce(mockSeasonLeagueTeam1)
          .mockResolvedValueOnce(mockSeasonLeagueTeam2);

        // Mock that both teams have unregistered players
        const mockRunQuery = jest.requireMock(
          "../../db/mysqlRunQuery"
        ).runQuery;
        mockRunQuery
          .mockResolvedValueOnce([]) // No players found for team 1
          .mockResolvedValueOnce([]); // No players found for team 2

        // Act
        await validatePlayersInTeams(mockTeams, "match123");

        // Assert
        expect(mockRedisClient.set).toHaveBeenCalledTimes(2);

        // First call for team 1
        expect(mockRedisClient.set).toHaveBeenNthCalledWith(
          1,
          "match:invalid_players:match123",
          JSON.stringify({
            external_match_id: "match123",
            steam_ids: ["steam123", "steam456"],
            team_id: 101
          })
        );

        // Second call for team 2
        expect(mockRedisClient.set).toHaveBeenNthCalledWith(
          2,
          "match:invalid_players:match123",
          JSON.stringify({
            external_match_id: "match123",
            steam_ids: ["steam789"],
            team_id: 102
          })
        );
      });

      it("should not flag players when all players are registered", async () => {
        // Arrange
        mockGetSeasonLeagueTeamByExternalId
          .mockResolvedValueOnce(mockSeasonLeagueTeam1)
          .mockResolvedValueOnce(mockSeasonLeagueTeam2);

        // Mock that all players are registered
        const mockRunQuery = jest.requireMock(
          "../../db/mysqlRunQuery"
        ).runQuery;
        mockRunQuery
          .mockResolvedValueOnce(mockSeasonTeamPlayers) // All team 1 players found
          .mockResolvedValueOnce([
            {
              season_id: 1,
              team_id: 102,
              steam_id: "steam789",
              role: "primary",
              is_captain: false,
              is_co_captain: false
            }
          ]); // All team 2 players found

        // Act
        await validatePlayersInTeams(mockTeams, "match123");

        // Assert
        expect(mockRedisClient.set).not.toHaveBeenCalled();
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

        const mockRunQuery = jest.requireMock(
          "../../db/mysqlRunQuery"
        ).runQuery;
        mockRunQuery
          .mockResolvedValueOnce([]) // Empty roster returns empty array
          .mockResolvedValueOnce([]); // Empty roster returns empty array

        // Act
        await validatePlayersInTeams(teamsWithEmptyRoster, "match123");

        // Assert
        expect(mockRunQuery).toHaveBeenCalledWith(
          "SELECT * FROM SeasonTeamPlayers WHERE steam_id IN (?)",
          [[]]
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

        const mockRunQuery = jest.requireMock(
          "../../db/mysqlRunQuery"
        ).runQuery;
        mockRunQuery
          .mockResolvedValueOnce([
            {
              season_id: 1,
              team_id: 101,
              steam_id: "steam123",
              role: "primary",
              is_captain: false,
              is_co_captain: false
            }
          ])
          .mockResolvedValueOnce([
            {
              season_id: 1,
              team_id: 102,
              steam_id: "steam789",
              role: "primary",
              is_captain: false,
              is_co_captain: false
            }
          ]);

        // Act
        await validatePlayersInTeams(teamsWithSinglePlayer, "match123");

        // Assert
        expect(mockRunQuery).toHaveBeenCalledWith(
          "SELECT * FROM SeasonTeamPlayers WHERE steam_id IN (?)",
          [["steam123"]]
        );
        expect(mockRedisClient.set).not.toHaveBeenCalled();
      });
    });
  });

  describe("getSeasonTeamPlayersBySteamIds", () => {
    it("should query database with correct parameters", async () => {
      // Arrange
      const steamIds = ["steam123", "steam456", "steam789"];
      const mockSeasonTeamPlayers: SeasonTeamPlayer[] = [
        {
          season_id: 1,
          team_id: 101,
          steam_id: "steam123",
          role: "primary",
          is_captain: false,
          is_co_captain: false
        },
        {
          season_id: 1,
          team_id: 101,
          steam_id: "steam456",
          role: "primary",
          is_captain: false,
          is_co_captain: false
        }
      ];

      const mockRunQuery = jest.requireMock("../../db/mysqlRunQuery").runQuery;
      mockRunQuery.mockResolvedValue(mockSeasonTeamPlayers);

      // Act
      const result = await getSeasonTeamPlayersBySteamIds(steamIds);

      // Assert
      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT * FROM SeasonTeamPlayers WHERE steam_id IN (?)",
        [steamIds]
      );
      expect(result).toEqual(mockSeasonTeamPlayers);
    });

    it("should return empty array when no players found", async () => {
      // Arrange
      const steamIds = ["steam123"];
      const mockRunQuery = jest.requireMock("../../db/mysqlRunQuery").runQuery;
      mockRunQuery.mockResolvedValue([]);

      // Act
      const result = await getSeasonTeamPlayersBySteamIds(steamIds);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
