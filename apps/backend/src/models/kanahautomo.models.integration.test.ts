import {
  registerPlayerForKanahautomo,
  insertKanahautomoGameTypes,
  getKanahautomoOrganizationStatus
} from "./kanahautomo.models";
import {
  insertTestKanahautomoRegistration,
  clearTestKanahautomoRegistrations,
  insertTestSeason,
  removeTestSeason,
  insertOneTestUser,
  cleanUpTestUser,
  insertTestOrganization,
  clearTestOrganization
} from "../__utils__/seed-database";
import { runQuery } from "../db/mysqlRunQuery";
import type { InsertSeason } from "@eggosystem/types";
import { SeasonPlatform, createMockInsertSeason } from "@eggosystem/types";

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

  // Pick IDs that are unlikely to collide with seeded data.
  const testAccountId1 = 9_900_001;
  const testAccountId2 = 9_900_002;
  const testAccountId3 = 9_900_003;
  const testAccountId4 = 9_900_004;
  const testAccountId5 = 9_900_005;
  const testAccountId6 = 9_900_006;
  const testAccountId7 = 9_900_007;
  const testAccountId8 = 9_900_008;
  const testAccountId9 = 9_900_009;
  const testAccountId10 = 9_900_010;

  // Test organization IDs (will be set after creation)
  let testOrganizationId: number;
  let testOrganizationId2: number;

  const testSeason: InsertSeason = createMockInsertSeason({
    id: 999,
    name: "Test Season",
    full_name: "CS2 Test Season",
    signup_start_date: new Date("2024-01-01"),
    signup_end_date: new Date("2024-12-31"),
    platform: SeasonPlatform.FACEIT,
    start_date: new Date("2024-02-01"),
    end_date: null
  });
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
      // The error will be a database ER_DUP_ENTRY error, which will be handled by middleware
      await expect(
        registerPlayerForKanahautomo(testSteamId, testOrganizationId, false)
      ).rejects.toThrow();

      // Verify it's an ER_DUP_ENTRY error that middleware can handle
      try {
        await registerPlayerForKanahautomo(
          testSteamId,
          testOrganizationId,
          false
        );
        throw new Error("Expected error to be thrown");
      } catch (error: unknown) {
        expect(error).toBeDefined();
        // Verify it's a database error with ER_DUP_ENTRY code
        expect(
          error &&
            typeof error === "object" &&
            "code" in error &&
            (error as { code?: string }).code === "ER_DUP_ENTRY"
        ).toBe(true);
        // Verify the error message contains "Duplicate entry"
        if (error instanceof Error) {
          expect(error.message).toContain("Duplicate entry");
        }
      }
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

  describe("insertKanahautomoGameTypes", () => {
    it("should insert selected game types for a registration", async () => {
      // First create a registration
      const registration = await registerPlayerForKanahautomo(
        testSteamId,
        testOrganizationId,
        false
      );

      const gameTypes = {
        cs: true,
        csWingman: false,
        pubgDuo: true,
        pubgSquad: false,
        rocketLeague: false,
        dota: false
      };

      await insertKanahautomoGameTypes(registration.insertId, gameTypes);

      // Verify the game types were inserted
      const gameTypeRegistrations = await runQuery<
        Array<{
          kanahautomo_registration_id: number;
          game_type_id: number;
        }>
      >(
        "SELECT kanahautomo_registration_id, game_type_id FROM KanahautomoRegistrationGameTypes WHERE kanahautomo_registration_id = ? ORDER BY game_type_id",
        [registration.insertId]
      );

      expect(gameTypeRegistrations).toHaveLength(2);
      expect(gameTypeRegistrations[0].game_type_id).toBe(1); // CS2 Comp
      expect(gameTypeRegistrations[1].game_type_id).toBe(3); // PUBG Duo
    });

    it("should insert all selected game types", async () => {
      const registration = await registerPlayerForKanahautomo(
        testSteamId2,
        testOrganizationId,
        false
      );

      const gameTypes = {
        cs: true,
        csWingman: true,
        pubgDuo: true,
        pubgSquad: true,
        rocketLeague: true,
        dota: true
      };

      await insertKanahautomoGameTypes(registration.insertId, gameTypes);

      const gameTypeRegistrations = await runQuery<
        Array<{
          kanahautomo_registration_id: number;
          game_type_id: number;
        }>
      >(
        "SELECT kanahautomo_registration_id, game_type_id FROM KanahautomoRegistrationGameTypes WHERE kanahautomo_registration_id = ? ORDER BY game_type_id",
        [registration.insertId]
      );

      expect(gameTypeRegistrations).toHaveLength(6);
      const gameTypeIds = gameTypeRegistrations.map((r) => r.game_type_id);
      expect(gameTypeIds).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("should throw error if no game types are selected", async () => {
      const registration = await registerPlayerForKanahautomo(
        testSteamId3,
        testOrganizationId,
        false
      );

      const gameTypes = {
        cs: false,
        csWingman: false,
        pubgDuo: false,
        pubgSquad: false,
        rocketLeague: false,
        dota: false
      };

      await expect(
        insertKanahautomoGameTypes(registration.insertId, gameTypes)
      ).rejects.toThrow("At least one game type must be selected");
    });

    it("should handle single game type selection", async () => {
      const registration = await registerPlayerForKanahautomo(
        testSteamId4,
        testOrganizationId,
        false
      );

      const gameTypes = {
        cs: false,
        csWingman: false,
        pubgDuo: false,
        pubgSquad: false,
        rocketLeague: true,
        dota: false
      };

      await insertKanahautomoGameTypes(registration.insertId, gameTypes);

      const gameTypeRegistrations = await runQuery<
        Array<{
          kanahautomo_registration_id: number;
          game_type_id: number;
        }>
      >(
        "SELECT kanahautomo_registration_id, game_type_id FROM KanahautomoRegistrationGameTypes WHERE kanahautomo_registration_id = ?",
        [registration.insertId]
      );

      expect(gameTypeRegistrations).toHaveLength(1);
      expect(gameTypeRegistrations[0].game_type_id).toBe(5); // Rocket League Standard
    });
  });
});
