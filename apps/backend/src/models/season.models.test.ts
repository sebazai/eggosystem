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

describe("Season Models", () => {
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
});
