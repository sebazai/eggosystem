import {
  createSeason,
  updateSeason,
  getSeasonById,
  getOrganizerActiveSeasonForAppId,
  getOrganizerActiveOrLatestSeasonForAppId
} from "./season.models";
import { runQuery } from "../db/mysqlRunQuery";
import { getConnection } from "../db/mysqlConnection";
import { redisClient } from "../utils/redisClient";
import { SeasonPlatform, createMockSeasonFormRaw } from "@eggosystem/types";
import type { PoolConnection } from "mysql2/promise";

jest.mock("../db/mysqlRunQuery");
jest.mock("../db/mysqlConnection");
jest.mock("./season-active-map-pool.models", () => ({
  setActiveMapPoolForSeason: jest.fn().mockResolvedValue(undefined),
  getActiveMapPoolBySeasonId: jest.fn().mockResolvedValue([1, 2, 3])
}));
jest.mock("./season-signup-settings.models", () => ({
  upsertSeasonSignupSettings: jest.fn().mockResolvedValue(undefined),
  getSeasonSignupSettingsBySeasonId: jest.fn().mockResolvedValue(undefined)
}));
jest.mock("../utils/redisClient", () => ({
  redisClient: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined)
  },
  expireInOneDay: 86400
}));

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;
const mockGetConnection = getConnection as jest.MockedFunction<
  typeof getConnection
>;
const mockRedisClient = redisClient as jest.Mocked<typeof redisClient>;

function getMockConnection(): PoolConnection {
  return {
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined)
  } as unknown as PoolConnection;
}

describe("Season Models", () => {
  let mockConnection: PoolConnection;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConnection = getMockConnection();
    mockGetConnection.mockResolvedValue(mockConnection);
  });

  describe("createSeason", () => {
    it("should create a season with all fields", async () => {
      const seasonData = createMockSeasonFormRaw({
        faceit_rank_required: true,
        premier_rank_required: true,
        hours_played_required: true
      });

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
          seasonData.discord_link,
          true,
          true,
          true
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
        has_vat: false,
        faceit_rank_required: true,
        premier_rank_required: true,
        hours_played_required: true
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
          true,
          true,
          true,
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
        expect.stringContaining("FROM Seasons s"),
        [999],
        undefined
      );
      expect(mockRunQuery.mock.calls[0][0]).toContain(
        "INNER JOIN SeasonSignupSettings"
      );
      expect(result).toBeUndefined();
    });
  });
});

describe("getOrganizerActiveSeasonForAppId", () => {
  const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

  const activeSeason = {
    season_id: 10,
    platform: SeasonPlatform.FACEIT,
    signup_start_date: null,
    signup_end_date: null,
    start_date: new Date("2025-01-01T00:00:00.000Z"),
    end_date: null,
    full_name: "Spring 2025"
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisClient.get.mockResolvedValue(null);
    mockRedisClient.set.mockResolvedValue("OK");
  });

  it("should return a currently running season (start_date past, end_date future)", async () => {
    mockRunQuery.mockResolvedValue([activeSeason]);

    const result = await getOrganizerActiveSeasonForAppId(1, 730);

    expect(result).toEqual(activeSeason);
    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining(
        "s.start_date <= NOW() AND (s.end_date IS NULL OR s.end_date >= NOW())"
      ),
      [730, 1, "comp"]
    );
  });

  it("should return a signup-open season (start_date future, signup window open)", async () => {
    mockRunQuery.mockResolvedValue([activeSeason]);

    const result = await getOrganizerActiveSeasonForAppId(1, 730);

    expect(result).toEqual(activeSeason);
    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining(
        "s.start_date > NOW() AND s.signup_start_date <= NOW() AND (s.signup_end_date IS NULL OR s.signup_end_date >= NOW())"
      ),
      [730, 1, "comp"]
    );
  });

  it("should return undefined when no matching season exists", async () => {
    mockRunQuery.mockResolvedValue([undefined]);

    const result = await getOrganizerActiveSeasonForAppId(1, 730);

    expect(result).toBeUndefined();
  });

  it("should return undefined when season has ended (end_date past)", async () => {
    // The SQL WHERE clause excludes ended seasons; simulate no rows returned
    mockRunQuery.mockResolvedValue([]);

    const result = await getOrganizerActiveSeasonForAppId(1, 730);

    expect(result).toBeUndefined();
  });

  it("should return undefined when future season signup is closed (signup_end_date past)", async () => {
    mockRunQuery.mockResolvedValue([]);

    const result = await getOrganizerActiveSeasonForAppId(1, 730);

    expect(result).toBeUndefined();
  });

  it("should prefer the most recently created season when multiple match (ORDER BY id DESC)", async () => {
    const newerSeason = {
      ...activeSeason,
      season_id: 20,
      full_name: "Summer 2025"
    };
    // runQuery returns only the first row (LIMIT 1) — the most recently created
    mockRunQuery.mockResolvedValue([newerSeason]);

    const result = await getOrganizerActiveSeasonForAppId(1, 730);

    expect(result?.season_id).toBe(20);
    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining("ORDER BY s.id DESC"),
      expect.any(Array)
    );
  });

  it("should use 'comp' as the default gametype when gametype is omitted", async () => {
    mockRunQuery.mockResolvedValue([activeSeason]);

    await getOrganizerActiveSeasonForAppId(1, 730);

    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining("LOWER(gt.name) = LOWER(?)"),
      [730, 1, "comp"]
    );
  });

  it("should resolve undefined gametype to comp for cache key and lookup", async () => {
    mockRunQuery.mockResolvedValue([activeSeason]);

    await getOrganizerActiveSeasonForAppId(1, 730, undefined);

    expect(mockRedisClient.get).toHaveBeenCalledWith(
      "1-730-comp-active-season"
    );
    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining("LOWER(gt.name) = LOWER(?)"),
      [730, 1, "comp"]
    );
  });

  it("should return cached season without hitting the database", async () => {
    mockRedisClient.get.mockResolvedValue(JSON.stringify(activeSeason));

    const result = await getOrganizerActiveSeasonForAppId(1, 730, "comp");

    // Cached data is JSON-deserialized, so Date fields come back as ISO strings.
    expect(result).toEqual(JSON.parse(JSON.stringify(activeSeason)));
    expect(mockRunQuery).not.toHaveBeenCalled();
  });

  it("should cache season in Redis after a database hit", async () => {
    mockRunQuery.mockResolvedValue([activeSeason]);

    await getOrganizerActiveSeasonForAppId(1, 730, "comp");

    expect(mockRedisClient.set).toHaveBeenCalledWith(
      "1-730-comp-active-season",
      JSON.stringify(activeSeason),
      "EX",
      86400
    );
  });

  it("should pass the lowercased gametype name to the query", async () => {
    mockRunQuery.mockResolvedValue([activeSeason]);

    await getOrganizerActiveSeasonForAppId(1, 730, "wingman");

    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining("LOWER(gt.name) = LOWER(?)"),
      [730, 1, "wingman"]
    );
  });

  it("should include the restored projection columns in the SELECT", async () => {
    mockRunQuery.mockResolvedValue([activeSeason]);

    await getOrganizerActiveSeasonForAppId(1, 730);

    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining("s.start_date"),
      expect.any(Array)
    );
    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining("s.end_date"),
      expect.any(Array)
    );
  });

  it("should propagate database errors", async () => {
    mockRunQuery.mockRejectedValue(new Error("DB connection lost"));

    await expect(getOrganizerActiveSeasonForAppId(1, 730)).rejects.toThrow(
      "DB connection lost"
    );
  });
});

describe("getOrganizerActiveOrLatestSeasonForAppId", () => {
  const runningSeason = {
    season_id: 11,
    platform: SeasonPlatform.FACEIT,
    signup_start_date: null,
    signup_end_date: null,
    start_date: new Date("2025-01-01T00:00:00.000Z"),
    end_date: new Date("2025-06-01T00:00:00.000Z"),
    full_name: "Spring 2025"
  };

  const finishedSeason = {
    season_id: 9,
    platform: SeasonPlatform.FACEIT,
    signup_start_date: null,
    signup_end_date: null,
    start_date: new Date("2024-01-01T00:00:00.000Z"),
    end_date: new Date("2024-06-01T00:00:00.000Z"),
    full_name: "Spring 2024"
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisClient.get.mockResolvedValue(null);
    mockRedisClient.set.mockResolvedValue("OK");
  });

  it("returns the currently running season", async () => {
    mockRunQuery.mockResolvedValue([runningSeason]);

    const result = await getOrganizerActiveOrLatestSeasonForAppId(1, 730);

    expect(result).toEqual(runningSeason);
    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining(
        "s.start_date <= NOW() AND (s.end_date IS NULL OR s.end_date >= NOW())"
      ),
      [730, 1, "comp", 730, 1, "comp"]
    );
  });

  it("falls back to the most recent finished season when none is running", async () => {
    mockRunQuery.mockResolvedValue([finishedSeason]);

    const result = await getOrganizerActiveOrLatestSeasonForAppId(1, 730);

    expect(result).toEqual(finishedSeason);
    // The fallback branch selects MAX(id) among ended seasons
    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining("SELECT MAX(s2.id)"),
      expect.any(Array)
    );
  });

  it("prefers a running season over the latest finished one (ORDER BY CASE)", async () => {
    mockRunQuery.mockResolvedValue([runningSeason]);

    const result = await getOrganizerActiveOrLatestSeasonForAppId(1, 730);

    expect(result?.season_id).toBe(11);
    const sql = mockRunQuery.mock.calls[0][0] as string;
    expect(sql).toContain("CASE");
    expect(sql).toMatch(/ORDER BY[\s\S]*s\.id DESC/);
  });

  it("returns undefined when no season exists at all", async () => {
    mockRunQuery.mockResolvedValue([]);

    const result = await getOrganizerActiveOrLatestSeasonForAppId(1, 730);

    expect(result).toBeUndefined();
  });

  it("defaults the gametype to comp and binds it for both branches", async () => {
    mockRunQuery.mockResolvedValue([runningSeason]);

    await getOrganizerActiveOrLatestSeasonForAppId(1, 730);

    expect(mockRunQuery).toHaveBeenCalledWith(
      expect.stringContaining("LOWER(gt.name) = LOWER(?)"),
      [730, 1, "comp", 730, 1, "comp"]
    );
  });

  it("passes a provided gametype through (case handled by SQL LOWER)", async () => {
    mockRunQuery.mockResolvedValue([runningSeason]);

    await getOrganizerActiveOrLatestSeasonForAppId(1, 730, "Wingman");

    expect(mockRunQuery).toHaveBeenCalledWith(expect.any(String), [
      730,
      1,
      "Wingman",
      730,
      1,
      "Wingman"
    ]);
  });

  it("uses a distinct cache key and returns the cached value without a DB hit", async () => {
    mockRedisClient.get.mockResolvedValue(JSON.stringify(runningSeason));

    const result = await getOrganizerActiveOrLatestSeasonForAppId(
      1,
      730,
      "comp"
    );

    expect(mockRedisClient.get).toHaveBeenCalledWith(
      "1-730-comp-active-or-latest-season"
    );
    expect(result).toEqual(JSON.parse(JSON.stringify(runningSeason)));
    expect(mockRunQuery).not.toHaveBeenCalled();
  });

  it("caches the season after a database hit", async () => {
    mockRunQuery.mockResolvedValue([runningSeason]);

    await getOrganizerActiveOrLatestSeasonForAppId(1, 730, "comp");

    expect(mockRedisClient.set).toHaveBeenCalledWith(
      "1-730-comp-active-or-latest-season",
      JSON.stringify(runningSeason),
      "EX",
      86400
    );
  });

  it("does not cache when no season is found", async () => {
    mockRunQuery.mockResolvedValue([]);

    await getOrganizerActiveOrLatestSeasonForAppId(1, 730);

    expect(mockRedisClient.set).not.toHaveBeenCalled();
  });

  it("propagates database errors", async () => {
    mockRunQuery.mockRejectedValue(new Error("DB connection lost"));

    await expect(
      getOrganizerActiveOrLatestSeasonForAppId(1, 730)
    ).rejects.toThrow("DB connection lost");
  });
});
