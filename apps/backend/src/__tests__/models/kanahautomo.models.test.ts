import {
  registerPlayerForKanahautomo,
  getKanahautomoRegistrationsByOrganization,
  getKanahautomoRegistrationsByPlayer,
  updateKanahautomoRegistrationStatus,
  getReadyToFormTeams
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

      mockRunQuery.mockResolvedValueOnce([{ insertId: 123 }]);

      const result = await registerPlayerForKanahautomo(
        steamId,
        organizationId
      );

      expect(mockRunQuery).toHaveBeenCalledWith(
        "INSERT INTO KanahautomoRegistration (steam_id, organization_id, status) VALUES (?, ?, 'active')",
        [steamId, organizationId]
      );
      expect(result).toEqual([{ insertId: 123 }]);
    });

    it("should throw error if player is already registered", async () => {
      const steamId = "76561198049745649";
      const organizationId = 5;

      // Mock duplicate key error
      const error = new Error("Duplicate entry");
      (error as Error & { code: string }).code = "ER_DUP_ENTRY";
      mockRunQuery.mockRejectedValueOnce(error);

      await expect(
        registerPlayerForKanahautomo(steamId, organizationId)
      ).rejects.toThrow("Player is already registered for Kanahautomo");
    });
  });

  describe("getKanahautomoRegistrationsByOrganization", () => {
    it("should return all active registrations for an organization", async () => {
      const organizationId = 5;
      const mockRegistrations = [
        {
          id: 1,
          steam_id: "76561198049745649",
          organization_id: 5,
          status: "active",
          created_at: "2024-01-01"
        },
        {
          id: 2,
          steam_id: "76561197963921578",
          organization_id: 5,
          status: "active",
          created_at: "2024-01-02"
        }
      ];

      mockRunQuery.mockResolvedValueOnce(mockRegistrations);

      const result =
        await getKanahautomoRegistrationsByOrganization(organizationId);

      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT * FROM KanahautomoRegistration WHERE organization_id = ? AND status = 'active' ORDER BY created_at ASC",
        [organizationId]
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
          organization_id: 5,
          status: "active",
          created_at: "2024-01-01"
        }
      ];

      mockRunQuery.mockResolvedValueOnce(mockRegistration);

      const result = await getKanahautomoRegistrationsByPlayer(steamId);

      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT * FROM KanahautomoRegistration WHERE steam_id = ?",
        [steamId]
      );
      expect(result).toEqual(mockRegistration);
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
      const mockResults = [
        { organization_id: 5, player_count: 6 },
        { organization_id: 8, player_count: 5 }
      ];

      mockRunQuery.mockResolvedValueOnce(mockResults);

      const result = await getReadyToFormTeams();

      expect(mockRunQuery).toHaveBeenCalledWith(`
    SELECT organization_id, COUNT(*) as player_count
    FROM KanahautomoRegistration
    WHERE status = 'active'
    GROUP BY organization_id
    HAVING COUNT(*) >= 5
    ORDER BY player_count DESC
  `);
      expect(result).toEqual(mockResults);
    });
  });
});
