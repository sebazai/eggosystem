import { createSeason, updateSeason, getSeasonById } from "./season.models";
import { runQuery } from "../db/mysqlRunQuery";
import { SeasonPlatform } from "@eggosystem/types";
import type { SeasonFormRaw, Season } from "@eggosystem/types";

jest.mock("../db/mysqlRunQuery");

const mockRunQuery = runQuery as jest.MockedFunction<typeof runQuery>;

describe("Season Models", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createSeason", () => {
    it("should create a season with all fields", async () => {
      const seasonData: SeasonFormRaw = {
        game_id: 1,
        game_type_id: 1,
        organizer_id: 1,
        name: "Test Season",
        full_name: "Test Season Full Name",
        signup_start_date: "2024-01-01 00:00:00",
        signup_end_date: "2024-01-15 23:59:59",
        start_date: "2024-02-01",
        end_date: "2024-12-31",
        platform: SeasonPlatform.Kanaliiga,
        is_round_robin_bo2_as_2xbo1: false,
        payment_link: "https://example.com/payment",
        registration_price: 150,
        has_vat: true
      };

      mockRunQuery.mockResolvedValue({ insertId: 123 });

      const result = await createSeason(seasonData);

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
          seasonData.payment_link
        ],
        undefined
      );
      expect(result).toEqual({ insertId: 123 });
    });

    it("should create a season with null optional fields", async () => {
      const seasonData: SeasonFormRaw = {
        game_id: 1,
        game_type_id: 1,
        organizer_id: 1,
        name: "Test Season",
        full_name: "Test Season Full Name",
        signup_start_date: null,
        signup_end_date: null,
        start_date: "2024-02-01",
        end_date: null,
        platform: SeasonPlatform.Kanaliiga,
        is_round_robin_bo2_as_2xbo1: false,
        payment_link: null,
        registration_price: null,
        has_vat: true
      };

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
        undefined
      );
      expect(result).toEqual({ insertId: 456 });
    });
  });

  describe("updateSeason", () => {
    it("should update a season with all fields", async () => {
      const seasonId = 123;
      const seasonData: SeasonFormRaw = {
        game_id: 1,
        game_type_id: 1,
        organizer_id: 1,
        name: "Updated Season",
        full_name: "Updated Season Full Name",
        signup_start_date: "2024-01-01 00:00:00",
        signup_end_date: "2024-01-15 23:59:59",
        start_date: "2024-02-01",
        end_date: "2024-12-31",
        platform: SeasonPlatform.FACEIT,
        is_round_robin_bo2_as_2xbo1: true,
        payment_link: "https://example.com/new-payment",
        registration_price: 200,
        has_vat: false
      };

      mockRunQuery.mockResolvedValue({ affectedRows: 1 });

      const result = await updateSeason(seasonId, seasonData);

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
          seasonId
        ],
        undefined
      );
      expect(result).toEqual({ affectedRows: 1 });
    });

    it("should update a season with null optional fields", async () => {
      const seasonId = 123;
      const seasonData: SeasonFormRaw = {
        game_id: 1,
        game_type_id: 1,
        organizer_id: 1,
        name: "Updated Season",
        full_name: "Updated Season Full Name",
        signup_start_date: null,
        signup_end_date: null,
        start_date: "2024-02-01",
        end_date: null,
        platform: SeasonPlatform.Kanaliiga,
        is_round_robin_bo2_as_2xbo1: false,
        payment_link: null,
        registration_price: null,
        has_vat: true
      };

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
        undefined
      );
      expect(result).toEqual({ affectedRows: 1 });
    });
  });

  describe("getSeasonById", () => {
    it("should return a season when found", async () => {
      const mockSeason: Season = {
        id: 123,
        game_id: 1,
        game_type_id: 1,
        organizer_id: 1,
        name: "Test Season",
        full_name: "Test Season Full Name",
        signup_start_date: "2024-01-01",
        signup_end_date: "2024-01-15",
        start_date: "2024-02-01",
        end_date: "2024-12-31",
        platform: SeasonPlatform.Kanaliiga,
        is_round_robin_bo2_as_2xbo1: false,
        payment_link: "https://example.com/payment",
        grand_final_round_one_only: false,
        registration_price: 150,
        has_vat: true
      };

      mockRunQuery.mockResolvedValue([mockSeason]);

      const result = await getSeasonById(123);

      expect(mockRunQuery).toHaveBeenCalledWith(
        "SELECT * FROM Seasons WHERE id = ?",
        [123],
        undefined
      );
      expect(result).toEqual(mockSeason);
    });

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
