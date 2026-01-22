import request from "supertest";
import express from "express";
import { runQuery } from "../../db/mysqlRunQuery";
import { getConnection } from "../../db/mysqlConnection";
import type { PoolConnection } from "mysql2/promise";
import { expressErrorHandler } from "../../middlewares/express-error-handler";
import seasonRouter from "../../routes/v1/dashboard/season.routes";
import { generateTestJWT } from "../../utils/auth-test-utils";

// Mock the auth middleware
jest.mock("../../middlewares/auth.middleware", () => ({
  checkPermissions: jest.fn(
    () => (req: unknown, res: unknown, next: express.NextFunction) => next()
  )
}));

describe("Season Controllers Integration Tests - Active Map Pool", () => {
  let app: express.Application;
  let connection: PoolConnection;
  const testSeasonId = 9998;

  beforeAll(async () => {
    connection = await getConnection();

    app = express();
    app.use(express.json());
    app.use("/api/v1/dashboard/seasons", seasonRouter);
    app.use(expressErrorHandler);
  });

  afterAll(async () => {
    if (connection) {
      connection.release();
    }
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  const cleanupTestData = async () => {
    await runQuery(
      "DELETE FROM SeasonActiveMapPool WHERE season_id = ?",
      [testSeasonId],
      connection
    );
    await runQuery(
      "DELETE FROM Seasons WHERE id = ?",
      [testSeasonId],
      connection
    );
  };

  describe("POST /api/v1/dashboard/seasons", () => {
    it("should create a season with active_map_pool", async () => {
      const adminJWT = generateTestJWT();
      const seasonData = {
        game_id: 1,
        game_type_id: 1,
        organizer_id: 1,
        name: "Test Season",
        full_name: "Test Season Full Name",
        start_date: "2024-02-01",
        end_date: "2024-12-31",
        platform: "faceit",
        is_round_robin_bo2_as_2xbo1: false,
        has_vat: true,
        active_map_pool: [1, 2, 3]
      };

      const response = await request(app)
        .post("/api/v1/dashboard/seasons")
        .set("Authorization", `Bearer ${adminJWT}`)
        .send(seasonData)
        .expect(201);

      expect(response.body).toHaveProperty("seasonId");
      const createdSeasonId = response.body.seasonId;

      // Verify active_map_pool was saved
      const mapPool = await runQuery<Array<{ map_id: number }>>(
        "SELECT map_id FROM SeasonActiveMapPool WHERE season_id = ? ORDER BY map_id ASC",
        [createdSeasonId],
        connection
      );
      expect(mapPool.map((row) => row.map_id)).toEqual([1, 2, 3]);

      // Clean up
      await runQuery(
        "DELETE FROM SeasonActiveMapPool WHERE season_id = ?",
        [createdSeasonId],
        connection
      );
      await runQuery(
        "DELETE FROM Seasons WHERE id = ?",
        [createdSeasonId],
        connection
      );
    });

    it("should reject empty active_map_pool array", async () => {
      const adminJWT = generateTestJWT();
      const seasonData = {
        game_id: 1,
        game_type_id: 1,
        organizer_id: 1,
        name: "Test Season",
        full_name: "Test Season Full Name",
        start_date: "2024-02-01",
        end_date: "2024-12-31",
        platform: "faceit",
        is_round_robin_bo2_as_2xbo1: false,
        has_vat: true,
        active_map_pool: []
      };

      const response = await request(app)
        .post("/api/v1/dashboard/seasons")
        .set("Authorization", `Bearer ${adminJWT}`)
        .send(seasonData)
        .expect(400);

      expect(response.body).toHaveProperty("issues");
      expect(response.body.issues[0]?.message).toContain(
        "At least one map must be selected"
      );
    });

    it("should reject missing active_map_pool field", async () => {
      const adminJWT = generateTestJWT();
      const seasonData = {
        game_id: 1,
        game_type_id: 1,
        organizer_id: 1,
        name: "Test Season",
        full_name: "Test Season Full Name",
        start_date: "2024-02-01",
        end_date: "2024-12-31",
        platform: "faceit",
        is_round_robin_bo2_as_2xbo1: false,
        has_vat: true
        // active_map_pool is missing
      };

      const response = await request(app)
        .post("/api/v1/dashboard/seasons")
        .set("Authorization", `Bearer ${adminJWT}`)
        .send(seasonData)
        .expect(400);

      expect(response.body).toHaveProperty("issues");
    });
  });

  describe("PUT /api/v1/dashboard/seasons/:id", () => {
    beforeEach(async () => {
      // Create a test season
      await runQuery(
        `INSERT INTO Seasons (id, game_id, game_type_id, organizer_id, name, full_name, start_date, end_date, platform, is_round_robin_bo2_as_2xbo1, has_vat)
         VALUES (?, 1, 1, 1, 'Test Season', 'Test Season Full Name', '2024-01-01', '2024-12-31', 'faceit', false, true)`,
        [testSeasonId],
        connection
      );
      // Add initial map pool
      await runQuery(
        `INSERT INTO SeasonActiveMapPool (season_id, map_id) VALUES (?, ?), (?, ?)`,
        [testSeasonId, 1, testSeasonId, 2],
        connection
      );
    });

    it("should update a season with new active_map_pool", async () => {
      const adminJWT = generateTestJWT();
      const seasonData = {
        game_id: 1,
        game_type_id: 1,
        organizer_id: 1,
        name: "Updated Season",
        full_name: "Updated Season Full Name",
        start_date: "2024-01-01",
        end_date: "2024-12-31",
        platform: "faceit",
        is_round_robin_bo2_as_2xbo1: false,
        has_vat: true,
        active_map_pool: [3, 4, 5]
      };

      await request(app)
        .put(`/api/v1/dashboard/seasons/${testSeasonId}`)
        .set("Authorization", `Bearer ${adminJWT}`)
        .send(seasonData)
        .expect(200);

      // Verify active_map_pool was updated
      const mapPool = await runQuery<Array<{ map_id: number }>>(
        "SELECT map_id FROM SeasonActiveMapPool WHERE season_id = ? ORDER BY map_id ASC",
        [testSeasonId],
        connection
      );
      expect(mapPool.map((row) => row.map_id)).toEqual([3, 4, 5]);
      expect(mapPool.map((row) => row.map_id)).not.toContain(1);
      expect(mapPool.map((row) => row.map_id)).not.toContain(2);
    });

    it("should reject empty active_map_pool array when updating", async () => {
      const adminJWT = generateTestJWT();
      const seasonData = {
        game_id: 1,
        game_type_id: 1,
        organizer_id: 1,
        name: "Updated Season",
        full_name: "Updated Season Full Name",
        start_date: "2024-01-01",
        end_date: "2024-12-31",
        platform: "faceit",
        is_round_robin_bo2_as_2xbo1: false,
        has_vat: true,
        active_map_pool: []
      };

      const response = await request(app)
        .put(`/api/v1/dashboard/seasons/${testSeasonId}`)
        .set("Authorization", `Bearer ${adminJWT}`)
        .send(seasonData)
        .expect(400);

      expect(response.body).toHaveProperty("issues");
      expect(response.body.issues[0]?.message).toContain(
        "At least one map must be selected"
      );
    });
  });

  describe("GET /api/v1/dashboard/seasons/:id", () => {
    beforeEach(async () => {
      // Create a test season
      await runQuery(
        `INSERT INTO Seasons (id, game_id, game_type_id, organizer_id, name, full_name, start_date, end_date, platform, is_round_robin_bo2_as_2xbo1, has_vat)
         VALUES (?, 1, 1, 1, 'Test Season', 'Test Season Full Name', '2024-01-01', '2024-12-31', 'faceit', false, true)`,
        [testSeasonId],
        connection
      );
      // Add map pool
      await runQuery(
        `INSERT INTO SeasonActiveMapPool (season_id, map_id) VALUES (?, ?), (?, ?), (?, ?)`,
        [testSeasonId, 1, testSeasonId, 2, testSeasonId, 3],
        connection
      );
    });

    it("should return season with active_map_pool", async () => {
      const adminJWT = generateTestJWT();

      const response = await request(app)
        .get(`/api/v1/dashboard/seasons/${testSeasonId}`)
        .set("Authorization", `Bearer ${adminJWT}`)
        .expect(200);

      expect(response.body).toHaveProperty("active_map_pool");
      expect(response.body.active_map_pool).toEqual([1, 2, 3]);
    });
  });
});

describe("Season Controllers Integration Tests - Date/Time UTC Conversion", () => {
  let app: express.Application;
  let connection: PoolConnection;
  const testSeasonId = 9997;

  beforeAll(async () => {
    connection = await getConnection();

    app = express();
    app.use(express.json());
    app.use("/api/v1/dashboard/seasons", seasonRouter);
    app.use(expressErrorHandler);
  });

  afterAll(async () => {
    if (connection) {
      connection.release();
    }
  });

  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  const cleanupTestData = async () => {
    await runQuery(
      "DELETE FROM SeasonActiveMapPool WHERE season_id = ?",
      [testSeasonId],
      connection
    ).catch(() => {});
    await runQuery(
      "DELETE FROM Seasons WHERE id = ?",
      [testSeasonId],
      connection
    );
  };

  describe("POST /api/v1/dashboard/seasons - Date/Time UTC Conversion", () => {
    it("should store UTC ISO date strings as UTC in database and return UTC ISO strings", async () => {
      const adminJWT = generateTestJWT();
      // Frontend sends UTC ISO strings (already converted from local time)
      // Example: User in Helsinki (UTC+2) selects 20:30 local time, frontend converts to 18:30 UTC
      const seasonData = {
        game_id: 1,
        game_type_id: 1,
        organizer_id: 1,
        name: "Test Season UTC",
        full_name: "Test Season UTC Full Name",
        start_date: "2024-02-01",
        end_date: "2024-12-31",
        signup_start_date: "2024-01-15T18:30:00.000Z", // 18:30 UTC
        signup_end_date: "2024-01-20T20:45:00.000Z", // 20:45 UTC
        early_bird_price_discount_end_date: "2024-01-10T16:00:00.000Z", // 16:00 UTC
        platform: "faceit",
        is_round_robin_bo2_as_2xbo1: false,
        has_vat: true,
        active_map_pool: [1, 2, 3]
      };

      const response = await request(app)
        .post("/api/v1/dashboard/seasons")
        .set("Authorization", `Bearer ${adminJWT}`)
        .send(seasonData)
        .expect(201);

      expect(response.body).toHaveProperty("seasonId");
      const createdSeasonId = response.body.seasonId;

      // Verify dates are stored correctly in database as UTC
      const [storedSeason] = await runQuery<
        Array<{
          signup_start_date: Date | null;
          signup_end_date: Date | null;
          early_bird_price_discount_end_date: Date | null;
        }>
      >(
        "SELECT signup_start_date, signup_end_date, early_bird_price_discount_end_date FROM Seasons WHERE id = ?",
        [createdSeasonId],
        connection
      );

      expect(storedSeason).toBeDefined();
      // MySQL TIMESTAMP fields are stored in UTC and returned as Date objects
      expect(storedSeason?.signup_start_date).toBeInstanceOf(Date);
      expect(storedSeason?.signup_end_date).toBeInstanceOf(Date);
      expect(storedSeason?.early_bird_price_discount_end_date).toBeInstanceOf(
        Date
      );

      // Verify the Date objects represent the correct UTC time
      expect((storedSeason?.signup_start_date as Date).toISOString()).toBe(
        "2024-01-15T18:30:00.000Z"
      );
      expect((storedSeason?.signup_end_date as Date).toISOString()).toBe(
        "2024-01-20T20:45:00.000Z"
      );
      expect(
        (storedSeason?.early_bird_price_discount_end_date as Date).toISOString()
      ).toBe("2024-01-10T16:00:00.000Z");

      // Verify reading back via API returns UTC ISO strings
      const getResponse = await request(app)
        .get(`/api/v1/dashboard/seasons/${createdSeasonId}`)
        .set("Authorization", `Bearer ${adminJWT}`)
        .expect(200);

      expect(getResponse.body.signup_start_date).toBe(
        "2024-01-15T18:30:00.000Z"
      );
      expect(getResponse.body.signup_end_date).toBe("2024-01-20T20:45:00.000Z");
      expect(getResponse.body.early_bird_price_discount_end_date).toBe(
        "2024-01-10T16:00:00.000Z"
      );

      // Clean up
      await runQuery(
        "DELETE FROM SeasonActiveMapPool WHERE season_id = ?",
        [createdSeasonId],
        connection
      );
      await runQuery(
        "DELETE FROM Seasons WHERE id = ?",
        [createdSeasonId],
        connection
      );
    });
  });

  describe("PUT /api/v1/dashboard/seasons/:id - Date/Time UTC Conversion", () => {
    beforeEach(async () => {
      // Create a test season with initial dates
      await runQuery(
        `INSERT INTO Seasons (
          id, game_id, game_type_id, organizer_id, name, full_name,
          signup_start_date, signup_end_date, start_date, end_date,
          platform, is_round_robin_bo2_as_2xbo1, has_vat
        ) VALUES (?, 1, 1, 1, 'Test Season', 'Test Season Full Name',
          '2024-01-01 10:00:00', '2024-01-15 12:00:00', '2024-02-01', '2024-12-31',
          'faceit', false, true)`,
        [testSeasonId],
        connection
      );
      // Add map pool
      await runQuery(
        `INSERT INTO SeasonActiveMapPool (season_id, map_id) VALUES (?, ?), (?, ?)`,
        [testSeasonId, 1, testSeasonId, 2],
        connection
      );
    });

    it("should update UTC ISO date strings and store as UTC in database", async () => {
      const adminJWT = generateTestJWT();
      // Frontend sends updated UTC ISO strings (already converted from local time)
      const seasonData = {
        game_id: 1,
        game_type_id: 1,
        organizer_id: 1,
        name: "Updated Season UTC",
        full_name: "Updated Season UTC Full Name",
        start_date: "2024-02-01",
        end_date: "2024-12-31",
        signup_start_date: "2024-01-20T14:30:00.000Z", // Updated to 14:30 UTC
        signup_end_date: "2024-01-25T16:15:00.000Z", // Updated to 16:15 UTC
        early_bird_price_discount_end_date: "2024-01-12T10:00:00.000Z", // New field
        platform: "faceit",
        is_round_robin_bo2_as_2xbo1: false,
        has_vat: true,
        active_map_pool: [3, 4, 5]
      };

      await request(app)
        .put(`/api/v1/dashboard/seasons/${testSeasonId}`)
        .set("Authorization", `Bearer ${adminJWT}`)
        .send(seasonData)
        .expect(200);

      // Verify dates are stored correctly in database as UTC
      const [storedSeason] = await runQuery<
        Array<{
          signup_start_date: Date | null;
          signup_end_date: Date | null;
          early_bird_price_discount_end_date: Date | null;
        }>
      >(
        "SELECT signup_start_date, signup_end_date, early_bird_price_discount_end_date FROM Seasons WHERE id = ?",
        [testSeasonId],
        connection
      );

      expect(storedSeason).toBeDefined();
      expect(storedSeason?.signup_start_date).toBeInstanceOf(Date);
      expect(storedSeason?.signup_end_date).toBeInstanceOf(Date);
      expect(storedSeason?.early_bird_price_discount_end_date).toBeInstanceOf(
        Date
      );

      // Verify the Date objects represent the correct UTC time
      expect((storedSeason?.signup_start_date as Date).toISOString()).toBe(
        "2024-01-20T14:30:00.000Z"
      );
      expect((storedSeason?.signup_end_date as Date).toISOString()).toBe(
        "2024-01-25T16:15:00.000Z"
      );
      expect(
        (storedSeason?.early_bird_price_discount_end_date as Date).toISOString()
      ).toBe("2024-01-12T10:00:00.000Z");

      // Verify reading back via API returns UTC ISO strings
      const getResponse = await request(app)
        .get(`/api/v1/dashboard/seasons/${testSeasonId}`)
        .set("Authorization", `Bearer ${adminJWT}`)
        .expect(200);

      expect(getResponse.body.signup_start_date).toBe(
        "2024-01-20T14:30:00.000Z"
      );
      expect(getResponse.body.signup_end_date).toBe("2024-01-25T16:15:00.000Z");
      expect(getResponse.body.early_bird_price_discount_end_date).toBe(
        "2024-01-12T10:00:00.000Z"
      );
    });
  });
});
