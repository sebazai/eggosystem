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

  describe("timezone conversion", () => {
    it("should convert signup dates from GMT+8 timezone to UTC when creating", async () => {
      const mockRequest = {
        body: {
          ...validSeasonData,
          start_date: "2025-02-01",
          end_date: "2025-12-31",
          signup_start_date: "2025-01-15T18:30:00.000Z",
          signup_end_date: "2025-01-20T18:30:00.000Z",
          timezone: "Asia/Shanghai" // GMT+8
        }
      } as RequestWithBody<SeasonFormValues>;

      mockCreateSeason.mockResolvedValue({ insertId: 123 });

      await createSeasonController(mockRequest, mockResponse, mockNext);

      // Verify that dates were converted to UTC MySQL format
      expect(mockCreateSeason).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();

      // The dates should be in UTC format (18:30 GMT+8 = 10:30 UTC)
      const callArgs = mockCreateSeason.mock.calls[0][0];
      expect(callArgs.signup_start_date).toMatch(
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
      );
      expect(callArgs.signup_end_date).toMatch(
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
      );

      expect(callArgs.signup_start_date).toBe("2025-01-15 10:30:00");
      expect(callArgs.signup_end_date).toBe("2025-01-20 10:30:00");
    });

    it("should convert dates from GMT-5 timezone to UTC when creating", async () => {
      const mockRequest = {
        body: {
          ...validSeasonData,
          start_date: "2025-02-01",
          end_date: "2025-12-31",
          signup_start_date: "2025-01-15T10:30:00.000Z",
          signup_end_date: "2025-01-20T10:30:00.000Z",
          timezone: "America/New_York" // GMT-5 (EST)
        }
      } as RequestWithBody<SeasonFormValues>;

      mockCreateSeason.mockResolvedValue({ insertId: 123 });

      await createSeasonController(mockRequest, mockResponse, mockNext);

      expect(mockCreateSeason).toHaveBeenCalled();
      const callArgs = mockCreateSeason.mock.calls[0][0];
      // 10:30 AM EST = 3:30 PM UTC
      expect(callArgs.signup_start_date).toBe("2025-01-15 15:30:00");
      expect(callArgs.signup_end_date).toBe("2025-01-20 15:30:00");
    });

    it("should convert early_bird_price_discount_end_date with timezone", async () => {
      const mockRequest = {
        body: {
          ...validSeasonData,
          start_date: "2025-02-01",
          end_date: "2025-12-31",
          early_bird_price_discount_end_date: "2025-01-10T18:30:00.000Z",
          timezone: "Europe/Helsinki"
        }
      } as RequestWithBody<SeasonFormValues>;

      mockCreateSeason.mockResolvedValue({ insertId: 123 });

      await createSeasonController(mockRequest, mockResponse, mockNext);

      expect(mockCreateSeason).toHaveBeenCalled();
      const callArgs = mockCreateSeason.mock.calls[0][0];
      // 6:30 PM Helsinki (UTC+2 in winter) = 4:30 PM UTC
      expect(callArgs.early_bird_price_discount_end_date).toBe(
        "2025-01-10 16:30:00"
      );
    });

    it("should handle dates without timezone (treat as UTC)", async () => {
      const mockRequest = {
        body: {
          ...validSeasonData,
          start_date: "2025-02-01", // Ensure start_date is after signup dates
          end_date: "2025-12-31", // Ensure end_date is after start_date
          signup_start_date: "2025-01-15T10:30:00.000Z",
          signup_end_date: "2025-01-20T10:30:00.000Z",
          timezone: undefined // Explicitly remove timezone - should treat as UTC
        }
      } as RequestWithBody<SeasonFormValues>;

      mockCreateSeason.mockResolvedValue({ insertId: 123 });

      await createSeasonController(mockRequest, mockResponse, mockNext);

      expect(mockCreateSeason).toHaveBeenCalled();
      const callArgs = mockCreateSeason.mock.calls[0][0];
      expect(callArgs.signup_start_date).toMatch(
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
      );
      expect(callArgs.signup_end_date).toMatch(
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
      );
      const inputDate = new Date("2025-01-15T10:30:00.000Z");
      const outputDate = new Date(callArgs.signup_start_date + ":00Z");
      expect(outputDate.getTime()).toBe(inputDate.getTime());
      expect(callArgs.signup_start_date).toBe("2025-01-15 10:30:00");
      expect(callArgs.signup_end_date).toBe("2025-01-20 10:30:00");
    });

    it("should convert dates with timezone when updating", async () => {
      const mockRequest = {
        params: { id: "123" },
        body: {
          ...validSeasonData,
          start_date: "2025-02-01",
          end_date: "2025-12-31",
          signup_start_date: "2025-01-15T18:30:00.000Z",
          signup_end_date: "2025-01-20T18:30:00.000Z",
          timezone: "Asia/Shanghai"
        }
      } as RequestWithParams<{ id: string }> &
        RequestWithBody<SeasonFormValues>;

      mockGetSeasonById.mockResolvedValue(
        createMockSeason({
          id: 123,
          signup_start_date: "2025-01-15T10:30:00Z",
          signup_end_date: "2025-01-20T10:30:00Z"
        })
      );

      mockUpdateSeason.mockResolvedValue({ affectedRows: 1 });

      await updateSeasonController(mockRequest, mockResponse, mockNext);

      expect(mockUpdateSeason).toHaveBeenCalled();
      const callArgs = mockUpdateSeason.mock.calls[0][1];
      expect(callArgs.signup_start_date).toBe("2025-01-15 10:30:00");
      expect(callArgs.signup_end_date).toBe("2025-01-20 10:30:00");
    });

    it("should handle null date values", async () => {
      const mockRequest = {
        body: {
          ...validSeasonData,
          signup_start_date: null,
          signup_end_date: null,
          early_bird_price_discount_end_date: null
        }
      } as RequestWithBody<SeasonFormValues>;

      mockCreateSeason.mockResolvedValue({ insertId: 123 });

      await createSeasonController(mockRequest, mockResponse, mockNext);

      const callArgs = mockCreateSeason.mock.calls[0][0];
      expect(callArgs.signup_start_date).toBeNull();
      expect(callArgs.signup_end_date).toBeNull();
      expect(callArgs.early_bird_price_discount_end_date).toBeNull();
    });
  });
});
