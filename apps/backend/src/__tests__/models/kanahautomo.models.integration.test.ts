import {
  registerPlayerForKanahautomo,
  getKanahautomoOrganizationStatus
} from "../../models/kanahautomo.models";
import {
  insertTestKanahautomoRegistration,
  clearTestKanahautomoRegistrations,
  insertTestSeason,
  removeTestSeason,
  insertOneTestUser,
  cleanUpTestUser,
  insertTestOrganization,
  clearTestOrganization
} from "../../__utils__/seed-database";
import { runQuery } from "../../db/mysqlRunQuery";
import type { InsertSeason } from "@eggosystem/types";
import { SeasonPlatform } from "@eggosystem/types";

describe("Kanahautomo Models Integration Tests", () => {
  // Use unique steam IDs to avoid conflicts with existing data
  const testSteamId = "76561198999999991";
  const testSteamId2 = "76561198999999992";
  const testSteamId3 = "76561198999999993";
  const testSteamId4 = "76561198999999994";
  const testSteamId5 = "76561198999999995";
  const testSteamId6 = "76561198999999996";
  const testSteamId7 = "76561198999999997";
  const testSteamId8 = "76561198999999998";
  const testSteamId9 = "76561198999999999";
  const testSteamId10 = "76561198999999990";

  const testAccountId1 = 9991;
  const testAccountId2 = 9992;
  const testAccountId3 = 9993;
  const testAccountId4 = 9994;
  const testAccountId5 = 9995;
  const testAccountId6 = 9996;
  const testAccountId7 = 9997;
  const testAccountId8 = 9998;
  const testAccountId9 = 9999;
  const testAccountId10 = 9990;

  // Test organization IDs (will be set after creation)
  let testOrganizationId: number;
  let testOrganizationId2: number;

  const testSeason: InsertSeason = {
    id: 999,
    game_id: 1,
    name: "Test Season",
    full_name: "CS2 Test Season",
    signup_start_date: new Date("2024-01-01"),
    signup_end_date: new Date("2024-12-31"),
    platform: SeasonPlatform.FACEIT,
    start_date: new Date("2024-02-01"),
    end_date: null
  };

  beforeAll(async () => {
    // Set up test data
    await insertTestSeason(testSeason);
    await insertOneTestUser(testAccountId1, testSteamId, "TestPlayer1");
    await insertOneTestUser(testAccountId2, testSteamId2, "TestPlayer2");
    await insertOneTestUser(testAccountId3, testSteamId3, "TestPlayer3");
    await insertOneTestUser(testAccountId4, testSteamId4, "TestPlayer4");
    await insertOneTestUser(testAccountId5, testSteamId5, "TestPlayer5");
    await insertOneTestUser(testAccountId6, testSteamId6, "TestPlayer6");
    await insertOneTestUser(testAccountId7, testSteamId7, "TestPlayer7");
    await insertOneTestUser(testAccountId8, testSteamId8, "TestPlayer8");
    await insertOneTestUser(testAccountId9, testSteamId9, "TestPlayer9");
    await insertOneTestUser(testAccountId10, testSteamId10, "TestPlayer10");

    // Create test organizations with unique codes
    const org1 = await insertTestOrganization(
      "Test Kanahautomo Org 1",
      `TEST-ORG-1-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    );
    const org2 = await insertTestOrganization(
      "Test Kanahautomo Org 2",
      `TEST-ORG-2-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
    );
    testOrganizationId = org1.insertId;
    testOrganizationId2 = org2.insertId;
  });

  afterAll(async () => {
    // Clean up test data
    await cleanUpTestUser(testAccountId1);
    await cleanUpTestUser(testAccountId2);
    await cleanUpTestUser(testAccountId3);
    await cleanUpTestUser(testAccountId4);
    await cleanUpTestUser(testAccountId5);
    await cleanUpTestUser(testAccountId6);
    await cleanUpTestUser(testAccountId7);
    await cleanUpTestUser(testAccountId8);
    await cleanUpTestUser(testAccountId9);
    await cleanUpTestUser(testAccountId10);
    await removeTestSeason(999);

    // Clean up test organizations
    await clearTestOrganization("Test Kanahautomo Org 1");
    await clearTestOrganization("Test Kanahautomo Org 2");
  });

  beforeEach(async () => {
    // Clear kanahautomo registrations before each test
    await clearTestKanahautomoRegistrations();
  });

  describe("registerPlayerForKanahautomo", () => {
    it("should register a player for Kanahautomo in an organization", async () => {
      const result = await registerPlayerForKanahautomo(
        testSteamId,
        testOrganizationId,
        false
      );

      expect(result).toHaveProperty("insertId");
      expect(typeof result.insertId).toBe("number");

      // Verify the registration was actually created in the database
      const [registration] = await runQuery<
        Array<{
          id: number;
          steam_id: string;
          organization_id: number;
          accepted_terms: boolean;
          created_at: string;
        }>
      >("SELECT * FROM KanahautomoRegistrations WHERE id = ?", [
        result.insertId
      ]);

      expect(registration).toBeDefined();
      expect(registration.steam_id).toBe(testSteamId);
      expect(registration.organization_id).toBe(testOrganizationId);
      expect(registration.accepted_terms).toBe(false);
    });

    it("should throw error if player is already registered for the same organization", async () => {
      // First registration should succeed
      await registerPlayerForKanahautomo(
        testSteamId,
        testOrganizationId,
        false
      );

      // Second registration for same organization should fail due to unique constraint
      await expect(
        registerPlayerForKanahautomo(testSteamId, testOrganizationId, false)
      ).rejects.toThrow(
        "Player is already registered for Kanahautomo in this organization"
      );
    });

    it("should allow registration for different organizations", async () => {
      // Register for organization 1
      await registerPlayerForKanahautomo(
        testSteamId,
        testOrganizationId,
        false
      );

      // Should be able to register for organization 2
      const result = await registerPlayerForKanahautomo(
        testSteamId,
        testOrganizationId2,
        false
      );
      expect(result).toHaveProperty("insertId");
    });
  });

  describe("getKanahautomoOrganizationStatus", () => {
    it("should return registration count and status for each organization", async () => {
      // Insert registrations
      await insertTestKanahautomoRegistration(
        testSteamId,
        testOrganizationId,
        true
      );
      await insertTestKanahautomoRegistration(
        testSteamId2,
        testOrganizationId,
        true
      );
      await insertTestKanahautomoRegistration(
        testSteamId3,
        testOrganizationId2,
        true
      );

      const result = await getKanahautomoOrganizationStatus();

      expect(result.length).toBeGreaterThan(0);
      const org1Result = result.find(
        (r) => r.organization_id === testOrganizationId
      );
      const org2Result = result.find(
        (r) => r.organization_id === testOrganizationId2
      );

      expect(org1Result?.count).toBe(2);
      expect(org2Result?.count).toBe(1);
    });
  });
});
