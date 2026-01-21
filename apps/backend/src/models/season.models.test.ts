import { createSeason, updateSeason, getSeasonById } from "./season.models";
import { runQuery } from "../db/mysqlRunQuery";
import { getConnection } from "../db/mysqlConnection";
import { SeasonPlatform, createMockSeasonFormRaw } from "@eggosystem/types";
import type { PoolConnection } from "mysql2/promise";

jest.mock("../db/mysqlRunQuery");
jest.mock("../db/mysqlConnection");
jest.mock("./season-active-map-pool.models", () => ({
  setActiveMapPoolForSeason: jest.fn().mockResolvedValue(undefined),
  getActiveMapPoolBySeasonId: jest.fn().mockResolvedValue([1, 2, 3])
}));

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockGetConnection = getConnection as jest.MockedFunction<
  typeof getConnection
>;

function getMockConnection(): PoolConnection {
  return {
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined)
  } as unknown as PoolConnection;
}

describe.skip("Season Models", () => {
  let mockConnection: PoolConnection;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnection = getMockConnection();
    mockGetConnection.mockResolvedValue(mockConnection);
  });

  describe("createSeason", () => {
    it("should create a season with all fields", async () => {
      const seasonData = createMockSeasonFormRaw();

      mockRunQuery.mockResolvedValue({ insertId: 123 });

      const result = await createSeason(seasonData);

      expect(mockGetConnection).toHaveBeenCalled();
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO Seasons"),
        [
          seasonData.game_id,
          seasonData.game_type_id,
          seasonData.organizer_id,
          seasonData.name,
          seasonData.full_name,
          seasonData.signup_start_date,
          seasonData.signup_end_date,
          seasonData.start_date,
          seasonData.end_date,
          seasonData.platform,
          seasonData.is_round_robin_bo2_as_2xbo1,
          seasonData.payment_link,
          seasonData.registration_price,
          seasonData.has_vat,
          seasonData.early_bird_price_discount,
          seasonData.early_bird_price_discount_end_date,
          seasonData.rulebook_url,
          seasonData.discord_link
        ],
        mockConnection
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(result).toEqual({ insertId: 123 });
    });

    it("should create a season with null optional fields", async () => {
      const seasonData = createMockSeasonFormRaw({
        signup_start_date: null,
        signup_end_date: null,
        end_date: null,
        payment_link: null,
        registration_price: null
      });

      mockRunQuery.mockResolvedValue({ insertId: 456 });

      const result = await createSeason(seasonData);

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO Seasons"),
        expect.arrayContaining([
          seasonData.game_id,
          seasonData.name,
          null,
          null,
          null,
          null
        ]),
        mockConnection
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(result).toEqual({ insertId: 456 });
    });
  });

  describe("updateSeason", () => {
    it("should update a season with all fields", async () => {
      const seasonId = 123;
      const seasonData = createMockSeasonFormRaw({
        name: "Updated Season",
        full_name: "Updated Season Full Name",
        platform: SeasonPlatform.FACEIT,
        is_round_robin_bo2_as_2xbo1: true,
        payment_link: "https://example.com/new-payment",
        registration_price: 200,
        has_vat: false
      });

      mockRunQuery.mockResolvedValue({ affectedRows: 1 });

      const result = await updateSeason(seasonId, seasonData);

      expect(mockGetConnection).toHaveBeenCalled();
      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE Seasons SET"),
        [
          seasonData.game_id,
          seasonData.game_type_id,
          seasonData.organizer_id,
          seasonData.name,
          seasonData.full_name,
          seasonData.signup_start_date,
          seasonData.signup_end_date,
          seasonData.start_date,
          seasonData.end_date,
          seasonData.platform,
          seasonData.is_round_robin_bo2_as_2xbo1,
          seasonData.payment_link,
          seasonData.registration_price,
          seasonData.has_vat,
          seasonData.early_bird_price_discount,
          seasonData.early_bird_price_discount_end_date,
          seasonData.rulebook_url,
          seasonData.discord_link,
          seasonId
        ],
        mockConnection
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
      expect(result).toEqual({ affectedRows: 1 });
    });

    it("should update a season with null optional fields", async () => {
      const seasonId = 123;
      const seasonData = createMockSeasonFormRaw({
        name: "Updated Season",
        full_name: "Updated Season Full Name",
        signup_start_date: null,
        signup_end_date: null,
        end_date: null,
        payment_link: null,
        registration_price: null
      });

      mockRunQuery.mockResolvedValue({ affectedRows: 1 });

      const result = await updateSeason(seasonId, seasonData);

      expect(mockRunQuery).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE Seasons SET"),
        expect.arrayContaining([
          seasonData.game_id,
          seasonData.name,
          null,
          null,
          null,
          null,
          seasonId
        ]),
        mockConnection
      );
      expect(mockConnection.commit).toHaveBeenCalled();
      expect(result).toEqual({ affectedRows: 1 });
    });
  });

  describe("getSeasonById", () => {
    it("should return undefined when season not found", async () => {
      mockRunQuery.mockResolvedValue([undefined]);

      const result = await getSeasonById(999);

      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT * FROM Seasons WHERE id = ?",
        [999],
        undefined
      );
      expect(result).toBeUndefined();
    });
  });

  describe("getSeasonById integration", () => {
    let connection: PoolConnection;
    const testSeasonId = 9998;
    let realRunQuery: typeof runQuery;
    let realGetConnection: typeof getConnection;
    let realGetSeasonById: typeof getSeasonById;

    beforeAll(async () => {
      // Get real implementations for integration test
      // Clear module cache and require actual implementations
      jest.resetModules();
      jest.unmock("../db/mysqlRunQuery");
      jest.unmock("../db/mysqlConnection");
      jest.unmock("./season-active-map-pool.models");

      realRunQuery = jest.requireActual("../db/mysqlRunQuery").runQuery;
      realGetConnection = jest.requireActual(
        "../db/mysqlConnection"
      ).getConnection;
      const seasonModels = jest.requireActual("./season.models");
      realGetSeasonById = seasonModels.getSeasonById;
      connection = await realGetConnection();
    });

    afterAll(async () => {
      if (connection) {
        connection.release();
      }
      // Restore mocks for other tests
      jest.doMock("../db/mysqlRunQuery");
      jest.doMock("../db/mysqlConnection");
      jest.doMock("./season-active-map-pool.models", () => ({
        setActiveMapPoolForSeason: jest.fn().mockResolvedValue(undefined),
        getActiveMapPoolBySeasonId: jest.fn().mockResolvedValue([1, 2, 3])
      }));
    });

    beforeEach(async () => {
      // Clean up test data
      try {
        await realRunQuery(
          "DELETE FROM SeasonActiveMapPool WHERE season_id = ?",
          [testSeasonId],
          connection
        );
      } catch (error: unknown) {
        // Table might not exist if migrations haven't been run
        if (!(error as Error).message?.includes("doesn't exist")) {
          throw error;
        }
      }
      await realRunQuery(
        "DELETE FROM Seasons WHERE id = ?",
        [testSeasonId],
        connection
      );

      // Seed test season with specific dates in UTC
      await realRunQuery(
        `INSERT INTO Seasons (
          id, game_id, game_type_id, organizer_id, name, full_name,
          signup_start_date, signup_end_date, start_date, end_date,
          platform, is_round_robin_bo2_as_2xbo1, has_vat, registration_price
        ) VALUES (?, 1, 1, 1, 'Test Season', 'Test Season Full Name',
          ?, ?, '2024-02-01', ?,
          'faceit', false, true, ?)`,
        [
          testSeasonId,
          "2024-01-01 00:00:00", // UTC datetime
          "2024-01-15 00:00:00", // UTC datetime
          "2024-12-31",
          150
        ],
        connection
      );

      // Seed active map pool (required for getSeasonById)
      try {
        await realRunQuery(
          `INSERT INTO SeasonActiveMapPool (season_id, map_id) VALUES (?, ?), (?, ?), (?, ?)`,
          [testSeasonId, 1, testSeasonId, 2, testSeasonId, 3],
          connection
        );
      } catch (error: unknown) {
        // Table might not exist if migrations haven't been run
        if (!(error as Error).message?.includes("doesn't exist")) {
          throw error;
        }
      }
    });

    afterEach(async () => {
      // Clean up test data
      try {
        await realRunQuery(
          "DELETE FROM SeasonActiveMapPool WHERE season_id = ?",
          [testSeasonId],
          connection
        );
      } catch (error: unknown) {
        if (!(error as Error).message?.includes("doesn't exist")) {
          throw error;
        }
      }
      await realRunQuery(
        "DELETE FROM Seasons WHERE id = ?",
        [testSeasonId],
        connection
      );
    });

    it("should return a season when found with dates in UTC timezone", async () => {
      // Verify the season was inserted
      const [insertedSeason] = await realRunQuery<
        Array<{ id: number } | undefined>
      >("SELECT id FROM Seasons WHERE id = ?", [testSeasonId], connection);
      expect(insertedSeason).toBeDefined();
      expect(insertedSeason?.id).toBe(testSeasonId);

      // Use real implementation to ensure it uses the real database connection
      const result = await realGetSeasonById(testSeasonId, connection);

      expect(result).toBeDefined();
      expect(result?.id).toBe(testSeasonId);
      expect(result?.registration_price).toBe(150);

      // Dates should be Date objects (Express res.json() will serialize them to ISO strings)
      // MySQL TIMESTAMP fields are stored in UTC and returned as Date objects when dateStrings is false
      expect(result?.signup_start_date).toBeInstanceOf(Date);
      expect(result?.signup_end_date).toBeInstanceOf(Date);

      // Verify the Date objects represent the correct UTC time
      expect((result?.signup_start_date as unknown as Date).toISOString()).toBe(
        "2024-01-01T00:00:00.000Z"
      );
      expect((result?.signup_end_date as unknown as Date).toISOString()).toBe(
        "2024-01-15T00:00:00.000Z"
      );
    });
  });
});
