import { type Response, type NextFunction } from "express";
import {
  createSeasonController,
  updateSeasonController
} from "./season.controllers";
import {
  createSeason,
  updateSeason,
  getSeasonById
} from "../../models/season.models";
import type { RequestWithBody, RequestWithParams } from "@eggosystem/types";
import type { SeasonFormValues } from "@eggosystem/types";
import { SeasonPlatform } from "@eggosystem/types";
import { ZodError } from "zod";

// Mock the models
jest.mock("../../models/season.models");

const mockCreateSeason = createSeason as jest.MockedFunction<
  typeof createSeason
>;
const mockUpdateSeason = updateSeason as jest.MockedFunction<
  typeof updateSeason
>;
const mockGetSeasonById = getSeasonById as jest.MockedFunction<
  typeof getSeasonById
>;

describe("Dashboard Season Controllers", () => {
  let mockResponse: Response;
  let mockNext: NextFunction;
  let mockJson: jest.MockedFunction<Response["json"]>;
  let mockStatus: jest.MockedFunction<Response["status"]>;

  const validSeasonData: SeasonFormValues = {
    game_id: 1,
    game_type_id: 1,
    organizer_id: 1,
    name: "Test Season",
    full_name: "Test Season Full Name",
    signup_start_date: "2024-01-01T00:00:00",
    signup_end_date: "2024-01-15T23:59:59",
    start_date: "2024-02-01",
    end_date: "2024-12-31",
    platform: SeasonPlatform.Kanaliiga,
    is_round_robin_bo2_as_2xbo1: false,
    payment_link: "https://example.com/payment",
    registration_price: 150,
    has_vat: true,
    timezone: "Europe/Helsinki"
  };

  beforeEach(() => {
    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();

    mockResponse = {
      json: mockJson,
      status: mockStatus
    } as unknown as Response;

    mockNext = jest.fn();

    jest.clearAllMocks();
  });

  describe("createSeasonController", () => {
    it("should create a season successfully", async () => {
      const mockRequest = {
        body: validSeasonData
      } as RequestWithBody<SeasonFormValues>;

      mockCreateSeason.mockResolvedValue({ insertId: 123 });

      await createSeasonController(mockRequest, mockResponse, mockNext);

      expect(mockCreateSeason).toHaveBeenCalledWith(
        expect.objectContaining({
          game_id: validSeasonData.game_id,
          game_type_id: validSeasonData.game_type_id,
          organizer_id: validSeasonData.organizer_id,
          name: validSeasonData.name,
          full_name: validSeasonData.full_name,
          platform: validSeasonData.platform,
          is_round_robin_bo2_as_2xbo1:
            validSeasonData.is_round_robin_bo2_as_2xbo1,
          payment_link: validSeasonData.payment_link
        })
      );
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        message: "Season created successfully",
        seasonId: 123
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle validation errors", async () => {
      const invalidRequest = {
        body: {
          ...validSeasonData,
          game_id: "invalid" // Invalid type
        }
      } as unknown as RequestWithBody<SeasonFormValues>;

      await createSeasonController(invalidRequest, mockResponse, mockNext);

      expect(mockCreateSeason).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it("should handle database errors", async () => {
      const mockRequest = {
        body: validSeasonData
      } as RequestWithBody<SeasonFormValues>;

      const dbError = new Error("Database connection failed");
      mockCreateSeason.mockRejectedValue(dbError);

      await createSeasonController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });

  describe("updateSeasonController", () => {
    it("should update a season successfully", async () => {
      const mockRequest = {
        params: { id: "123" },
        body: validSeasonData
      } as RequestWithParams<{ id: string }> &
        RequestWithBody<SeasonFormValues>;

      mockGetSeasonById.mockResolvedValue({
        id: 123,
        game_id: 1,
        game_type_id: 1,
        organizer_id: 1,
        name: "Old Season",
        full_name: "Old Season Full Name",
        signup_start_date: "2024-01-01",
        signup_end_date: "2024-01-15",
        start_date: "2024-02-01",
        end_date: "2024-12-31",
        platform: SeasonPlatform.Kanaliiga,
        is_round_robin_bo2_as_2xbo1: false,
        payment_link: null,
        grand_final_round_one_only: false,
        registration_price: null,
        has_vat: true,
        early_bird_price_discount: null,
        early_bird_price_discount_end_date: null
      });

      mockUpdateSeason.mockResolvedValue({ affectedRows: 1 });

      await updateSeasonController(mockRequest, mockResponse, mockNext);

      expect(mockGetSeasonById).toHaveBeenCalledWith(123);
      expect(mockUpdateSeason).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          game_id: validSeasonData.game_id,
          game_type_id: validSeasonData.game_type_id,
          organizer_id: validSeasonData.organizer_id,
          name: validSeasonData.name,
          full_name: validSeasonData.full_name,
          platform: validSeasonData.platform,
          is_round_robin_bo2_as_2xbo1:
            validSeasonData.is_round_robin_bo2_as_2xbo1,
          payment_link: validSeasonData.payment_link
        })
      );
      expect(mockJson).toHaveBeenCalledWith({
        message: "Season updated successfully",
        seasonId: 123
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return 404 for non-existent season", async () => {
      const mockRequest = {
        params: { id: "999" },
        body: validSeasonData
      } as RequestWithParams<{ id: string }> &
        RequestWithBody<SeasonFormValues>;

      mockGetSeasonById.mockResolvedValue(undefined);

      await updateSeasonController(mockRequest, mockResponse, mockNext);

      expect(mockGetSeasonById).toHaveBeenCalledWith(999);
      expect(mockUpdateSeason).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: "Season not found" });
    });

    it("should handle validation errors", async () => {
      const mockRequest = {
        params: { id: "123" },
        body: {
          ...validSeasonData,
          platform: "invalid_platform" // Invalid platform
        }
      } as unknown as RequestWithParams<{ id: string }> &
        RequestWithBody<SeasonFormValues>;

      mockGetSeasonById.mockResolvedValue({
        id: 123,
        game_id: 1,
        game_type_id: 1,
        organizer_id: 1,
        name: "Old Season",
        full_name: "Old Season Full Name",
        signup_start_date: "2024-01-01",
        signup_end_date: "2024-01-15",
        start_date: "2024-02-01",
        end_date: "2024-12-31",
        platform: SeasonPlatform.Kanaliiga,
        is_round_robin_bo2_as_2xbo1: false,
        payment_link: null,
        grand_final_round_one_only: false,
        registration_price: null,
        has_vat: true,
        early_bird_price_discount: null,
        early_bird_price_discount_end_date: null
      });

      await updateSeasonController(mockRequest, mockResponse, mockNext);

      expect(mockUpdateSeason).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it("should handle database errors during update", async () => {
      const mockRequest = {
        params: { id: "123" },
        body: validSeasonData
      } as RequestWithParams<{ id: string }> &
        RequestWithBody<SeasonFormValues>;

      mockGetSeasonById.mockResolvedValue({
        id: 123,
        game_id: 1,
        game_type_id: 1,
        organizer_id: 1,
        name: "Old Season",
        full_name: "Old Season Full Name",
        signup_start_date: "2024-01-01",
        signup_end_date: "2024-01-15",
        start_date: "2024-02-01",
        end_date: "2024-12-31",
        platform: SeasonPlatform.Kanaliiga,
        is_round_robin_bo2_as_2xbo1: false,
        payment_link: null,
        grand_final_round_one_only: false,
        registration_price: null,
        has_vat: true,
        early_bird_price_discount: null,
        early_bird_price_discount_end_date: null
      });

      const dbError = new Error("Database update failed");
      mockUpdateSeason.mockRejectedValue(dbError);

      await updateSeasonController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });
});
