import {
  registerPlayerForKanahautomo,
  getKanahautomoRegistrationsByOrganization,
  getKanahautomoRegistrationsByPlayer,
  getKanahautomoRegistrationsByPlayerAndSeason,
  updateKanahautomoRegistrationStatus,
  getReadyToFormTeams,
  getKanahautomoOrganizationStatusForSeason,
  getKanahautomoRegistrationCounts
} from "../../models/kanahautomo.models";
import { runQuery } from "../../db/mysqlRunQuery";

// Mock the database connection
jest.mock("../../db/mysqlRunQuery");

describe("Kanahautomo Models", () => {
  const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registerPlayerForKanahautomo", () => {
    it("should register a player for Kanahautomo in an organization", async () => {
      const steamId = "76561198049745649";
      const organizationId = 5;
      const seasonId = 15;

      mockRunQuery.mockResolvedValueOnce({ insertId: 123 });

      const result = await registerPlayerForKanahautomo(
        steamId,
        organizationId,
        seasonId
      );

      expect(mockRunQuery).toHaveBeenCalledWith(
        "INSERT INTO KanahautomoRegistration (steam_id, season_id, organization_id, status) VALUES (?, ?, ?, 'active')",
        [steamId, seasonId, organizationId],
        undefined
      );
      expect(result).toEqual({ insertId: 123 });
    });

    it("should throw error if player is already registered", async () => {
      const steamId = "76561198049745649";
      const organizationId = 5;
      const seasonId = 15;

      // Mock duplicate key error
      const error = new Error("Duplicate entry");
      (error as Error & { code: string }).code = "ER_DUP_ENTRY";
      mockRunQuery.mockRejectedValueOnce(error);

      try {
        await registerPlayerForKanahautomo(steamId, organizationId, seasonId);
        throw new Error("Expected function to throw");
      } catch (error) {
        console.log("Actual error:", error);
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe(
          "Player is already registered for Kanahautomo in this season"
        );
      }
    });

    it("should throw error if player is already registered for the same season", async () => {
      const steamId = "steam123";
      const organizationId = 1;
      const seasonId = 1;

      // Mock successful first registration
      mockRunQuery.mockResolvedValueOnce({ insertId: 123 });

      // Mock duplicate key error for second registration
      const error = new Error("Duplicate entry");
      (error as Error & { code: string }).code = "ER_DUP_ENTRY";
      mockRunQuery.mockRejectedValueOnce(error);

      // First registration should succeed
      await registerPlayerForKanahautomo(steamId, organizationId, seasonId);

      // Second registration for same season should fail
      await expect(
        registerPlayerForKanahautomo(steamId, organizationId, seasonId)
      ).rejects.toThrow(
        "Player is already registered for Kanahautomo in this season"
      );
    });

    it("should allow registration for different seasons", async () => {
      const steamId = "steam123";
      const organizationId = 1;

      // Mock successful registrations for different seasons
      mockRunQuery.mockResolvedValueOnce({ insertId: 123 });
      mockRunQuery.mockResolvedValueOnce({ insertId: 124 });

      // Register for season 1
      await registerPlayerForKanahautomo(steamId, organizationId, 1);

      // Should be able to register for season 2
      await expect(
        registerPlayerForKanahautomo(steamId, organizationId, 2)
      ).resolves.not.toThrow();
    });

    it("should allow different players to register for the same season", async () => {
      const organizationId = 1;
      const seasonId = 1;

      // Mock successful registrations for different players
      mockRunQuery.mockResolvedValueOnce({ insertId: 123 });
      mockRunQuery.mockResolvedValueOnce({ insertId: 124 });

      // Player 1 registers for season 1
      await registerPlayerForKanahautomo("steam123", organizationId, seasonId);

      // Player 2 should be able to register for season 1
      await expect(
        registerPlayerForKanahautomo("steam456", organizationId, seasonId)
      ).resolves.not.toThrow();
    });

    it("should allow same player to register for different organizations in different seasons", async () => {
      const steamId = "steam123";

      // Mock successful registrations for different organizations/seasons
      mockRunQuery.mockResolvedValueOnce({ insertId: 123 });
      mockRunQuery.mockResolvedValueOnce({ insertId: 124 });

      // Register for organization 1, season 1
      await registerPlayerForKanahautomo(steamId, 1, 1);

      // Should be able to register for organization 2, season 2
      await expect(
        registerPlayerForKanahautomo(steamId, 2, 2)
      ).resolves.not.toThrow();
    });
  });

  describe("getKanahautomoRegistrationsByOrganization", () => {
    it("should return all active registrations for an organization", async () => {
      const organizationId = 5;
      const seasonId = 15;
      const mockRegistrations = [
        {
          id: 1,
          steam_id: "76561198049745649",
          season_id: 15,
          organization_id: 5,
          status: "active",
          created_at: "2024-01-01"
        },
        {
          id: 2,
          steam_id: "76561197963921578",
          season_id: 15,
          organization_id: 5,
          status: "active",
          created_at: "2024-01-02"
        }
      ];

      mockRunQuery.mockResolvedValueOnce(mockRegistrations);

      const result = await getKanahautomoRegistrationsByOrganization(
        organizationId,
        seasonId
      );

      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT * FROM KanahautomoRegistration WHERE organization_id = ? AND season_id = ? AND status = 'active' ORDER BY created_at ASC",
        [organizationId, seasonId]
      );
      expect(result).toEqual(mockRegistrations);
    });
  });

  describe("getKanahautomoRegistrationsByPlayer", () => {
    it("should return player's registration", async () => {
      const steamId = "76561198049745649";
      const mockRegistration = [
        {
          id: 1,
          steam_id: "76561198049745649",
          season_id: 15,
          organization_id: 5,
          status: "active",
          created_at: "2024-01-01"
        }
      ];

      mockRunQuery.mockResolvedValueOnce(mockRegistration);

      const result = await getKanahautomoRegistrationsByPlayer(steamId);

      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT * FROM KanahautomoRegistration WHERE steam_id = ? ORDER BY created_at DESC",
        [steamId]
      );
      expect(result).toEqual(mockRegistration);
    });
  });

  describe("getKanahautomoRegistrationsByPlayerAndSeason", () => {
    it("should return player registration for specific season", async () => {
      const steamId = "steam123";
      const seasonId = 1;
      const mockRegistration = [
        {
          id: 1,
          steam_id: "steam123",
          season_id: 1,
          organization_id: 1,
          status: "active",
          created_at: "2024-01-01"
        }
      ];

      mockRunQuery.mockResolvedValueOnce(mockRegistration);

      const registration = await getKanahautomoRegistrationsByPlayerAndSeason(
        steamId,
        seasonId
      );

      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT * FROM KanahautomoRegistration WHERE steam_id = ? AND season_id = ?",
        [steamId, seasonId]
      );
      expect(registration).toBeDefined();
      expect(registration?.[0]?.steam_id).toBe("steam123");
      expect(registration?.[0]?.organization_id).toBe(1);
      expect(registration?.[0]?.season_id).toBe(1);
    });

    it("should return empty array for non-existent player-season combination", async () => {
      const steamId = "nonexistent";
      const seasonId = 1;

      mockRunQuery.mockResolvedValueOnce([]);

      const registration = await getKanahautomoRegistrationsByPlayerAndSeason(
        steamId,
        seasonId
      );

      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT * FROM KanahautomoRegistration WHERE steam_id = ? AND season_id = ?",
        [steamId, seasonId]
      );
      expect(registration).toEqual([]);
    });

    it("should return empty array for player registered in different season", async () => {
      const steamId = "steam123";
      const seasonId = 2;

      mockRunQuery.mockResolvedValueOnce([]);

      const registration = await getKanahautomoRegistrationsByPlayerAndSeason(
        steamId,
        seasonId
      );

      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT * FROM KanahautomoRegistration WHERE steam_id = ? AND season_id = ?",
        [steamId, seasonId]
      );
      expect(registration).toEqual([]);
    });
  });

  describe("updateKanahautomoRegistrationStatus", () => {
    it("should update registration status to team_formed", async () => {
      const registrationId = 1;

      mockRunQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const result = await updateKanahautomoRegistrationStatus(
        registrationId,
        "team_formed"
      );

      expect(mockRunQuery).toHaveBeenCalledWith(
        "UPDATE KanahautomoRegistration SET status = ? WHERE id = ?",
        ["team_formed", registrationId]
      );
      expect(result).toEqual([{ affectedRows: 1 }]);
    });
  });

  describe("getReadyToFormTeams", () => {
    it("should return organizations with 5 or more active registrations", async () => {
      const seasonId = 15;
      const mockResults = [
        { organization_id: 5, player_count: 6 },
        { organization_id: 8, player_count: 5 }
      ];

      mockRunQuery.mockResolvedValueOnce(mockResults);

      const result = await getReadyToFormTeams(seasonId);

      expect(mockRunQuery).toHaveBeenCalledWith(
        `
    SELECT organization_id, COUNT(*) as player_count
    FROM KanahautomoRegistration
    WHERE status = 'active' AND season_id = ?
    GROUP BY organization_id
    HAVING COUNT(*) >= 5
    ORDER BY player_count DESC
  `,
        [seasonId]
      );
      expect(result).toEqual(mockResults);
    });
  });

  describe("getKanahautomoOrganizationStatusForSeason", () => {
    it("should return registration count and status for each organization for the given season", async () => {
      const seasonId = 1;
      const mockResults = [
        { organization_id: 1, organization_name: "Org 1", count: 6 },
        { organization_id: 2, organization_name: "Org 2", count: 3 }
      ];
      mockRunQuery.mockResolvedValueOnce(mockResults);

      const result = await getKanahautomoOrganizationStatusForSeason(seasonId);

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("SELECT"),
        [seasonId]
      );
      expect(result).toEqual([
        {
          organization_id: 1,
          organization_name: "Org 1",
          count: 6,
          status: "ready"
        },
        {
          organization_id: 2,
          organization_name: "Org 2",
          count: 3,
          status: "waiting"
        }
      ]);
    });
  });

  describe("getKanahautomoRegistrationCounts", () => {
    it("should return registration counts for all organizations", async () => {
      const mockResults = [
        {
          organization_id: 1,
          organization_name: "Test Org 1",
          registration_count: 3,
          has_discord_channel: true
        },
        {
          organization_id: 2,
          organization_name: "Test Org 2",
          registration_count: 1,
          has_discord_channel: false
        }
      ];

      (runQuery as jest.Mock).mockResolvedValue(mockResults);

      const result = await getKanahautomoRegistrationCounts();

      expect(runQuery).toHaveBeenCalledWith(expect.stringContaining("SELECT"));
      expect(result).toEqual(mockResults);
    });

    it("should return empty array when no registrations exist", async () => {
      (runQuery as jest.Mock).mockResolvedValue([]);

      const result = await getKanahautomoRegistrationCounts();

      expect(result).toEqual([]);
    });

    it("should handle database errors", async () => {
      const error = new Error("Database error");
      (runQuery as jest.Mock).mockRejectedValue(error);

      await expect(getKanahautomoRegistrationCounts()).rejects.toThrow(
        "Database error"
      );
    });
  });
});
