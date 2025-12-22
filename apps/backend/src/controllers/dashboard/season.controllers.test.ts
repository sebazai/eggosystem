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
import {
  SeasonPlatform,
  createMockSeason,
  createMockSeasonFormValues
} from "@eggosystem/types";
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

  const validSeasonData = createMockSeasonFormValues();

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

      mockGetSeasonById.mockResolvedValue(
        createMockSeason({
          id: 123,
          name: "Old Season",
          full_name: "Old Season Full Name",
          signup_start_date: "2024-01-01",
          signup_end_date: "2024-01-15",
          end_date: "2024-12-31",
          payment_link: null,
          registration_price: null
        })
      );

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

      mockGetSeasonById.mockResolvedValue(
        createMockSeason({
          id: 123,
          name: "Old Season",
          full_name: "Old Season Full Name",
          signup_start_date: "2024-01-01",
          signup_end_date: "2024-01-15",
          end_date: "2024-12-31",
          payment_link: null,
          registration_price: null
        })
      );

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

      mockGetSeasonById.mockResolvedValue(
        createMockSeason({
          id: 123,
          name: "Old Season",
          full_name: "Old Season Full Name",
          signup_start_date: "2024-01-01",
          signup_end_date: "2024-01-15",
          end_date: "2024-12-31",
          payment_link: null,
          registration_price: null
        })
      );

      const dbError = new Error("Database update failed");
      mockUpdateSeason.mockRejectedValue(dbError);

      await updateSeasonController(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });
  });
});
