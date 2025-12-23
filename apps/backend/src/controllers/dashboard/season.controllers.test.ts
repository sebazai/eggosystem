import { type Response, type NextFunction } from "express";
import {
  createSeasonController,
  updateSeasonController,
  getSeasonByIdController
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
  let mockNext: jest.MockedFunction<NextFunction>;
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

  describe("date formatting", () => {
    it("should format UTC ISO strings to MySQL format when creating", async () => {
      const mockRequest = {
        body: {
          ...validSeasonData,
          start_date: "2025-02-01",
          end_date: "2025-12-31",
          // Frontend sends UTC ISO strings (already converted from local time)
          signup_start_date: "2025-01-15T18:30:00.000Z",
          signup_end_date: "2025-01-20T18:30:00.000Z"
        }
      } as RequestWithBody<SeasonFormValues>;

      mockCreateSeason.mockResolvedValue({ insertId: 123 });

      await createSeasonController(mockRequest, mockResponse, mockNext);

      expect(mockCreateSeason).toHaveBeenCalled();
      expect(mockNext).not.toHaveBeenCalled();

      // Backend should format UTC ISO strings to MySQL format (no conversion, just formatting)
      const callArgs = mockCreateSeason.mock.calls[0][0];
      expect(callArgs.signup_start_date).toMatch(
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
      );
      expect(callArgs.signup_end_date).toMatch(
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
      );
      // 18:30 UTC should be stored as 18:30 (no conversion)
      expect(callArgs.signup_start_date).toBe("2025-01-15 18:30:00");
      expect(callArgs.signup_end_date).toBe("2025-01-20 18:30:00");
    });

    it("should format early_bird_price_discount_end_date correctly", async () => {
      const mockRequest = {
        body: {
          ...validSeasonData,
          start_date: "2025-02-01",
          end_date: "2025-12-31",
          early_bird_price_discount_end_date: "2025-01-10T16:30:00.000Z"
        }
      } as RequestWithBody<SeasonFormValues>;

      mockCreateSeason.mockResolvedValue({ insertId: 123 });

      await createSeasonController(mockRequest, mockResponse, mockNext);

      expect(mockCreateSeason).toHaveBeenCalled();
      const callArgs = mockCreateSeason.mock.calls[0][0];
      // UTC ISO string should be formatted to MySQL format
      expect(callArgs.early_bird_price_discount_end_date).toBe(
        "2025-01-10 16:30:00"
      );
    });

    it("should format UTC ISO strings correctly (timezone field is ignored)", async () => {
      const mockRequest = {
        body: {
          ...validSeasonData,
          start_date: "2025-02-01",
          end_date: "2025-12-31",
          signup_start_date: "2025-01-15T10:30:00.000Z",
          signup_end_date: "2025-01-20T10:30:00.000Z",
          timezone: "Europe/Helsinki" // This field is ignored - dates are already in UTC
        }
      } as RequestWithBody<SeasonFormValues>;

      mockCreateSeason.mockResolvedValue({ insertId: 123 });

      await createSeasonController(mockRequest, mockResponse, mockNext);

      expect(mockCreateSeason).toHaveBeenCalled();
      const callArgs = mockCreateSeason.mock.calls[0][0];
      // Dates are stored as-is (no timezone conversion)
      expect(callArgs.signup_start_date).toBe("2025-01-15 10:30:00");
      expect(callArgs.signup_end_date).toBe("2025-01-20 10:30:00");
    });

    it("should format dates when updating", async () => {
      const mockRequest = {
        params: { id: "123" },
        body: {
          ...validSeasonData,
          start_date: "2025-02-01",
          end_date: "2025-12-31",
          signup_start_date: "2025-01-15T18:30:00.000Z",
          signup_end_date: "2025-01-20T18:30:00.000Z"
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
      // UTC ISO strings should be formatted to MySQL format
      expect(callArgs.signup_start_date).toBe("2025-01-15 18:30:00");
      expect(callArgs.signup_end_date).toBe("2025-01-20 18:30:00");
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

  describe("active_map_pool validation", () => {
    it("should create a season with valid active_map_pool", async () => {
      const mockRequest = {
        body: {
          ...validSeasonData,
          active_map_pool: [1, 2, 3]
        }
      } as RequestWithBody<SeasonFormValues>;

      mockCreateSeason.mockResolvedValue({ insertId: 123 });

      await createSeasonController(mockRequest, mockResponse, mockNext);

      expect(mockCreateSeason).toHaveBeenCalledWith(
        expect.objectContaining({
          active_map_pool: [1, 2, 3]
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject empty active_map_pool array", async () => {
      const mockRequest = {
        body: {
          ...validSeasonData,
          active_map_pool: []
        }
      } as unknown as RequestWithBody<SeasonFormValues>;

      await createSeasonController(mockRequest, mockResponse, mockNext);

      expect(mockCreateSeason).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
      const zodError = mockNext.mock.calls[0]?.[0] as unknown as ZodError;
      expect(zodError?.issues[0]?.message).toContain(
        "At least one map must be selected"
      );
    });

    it("should reject missing active_map_pool field", async () => {
      const mockRequest = {
        body: {
          ...validSeasonData
        }
      } as RequestWithBody<SeasonFormValues>;
      // Remove active_map_pool to simulate missing field
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (mockRequest.body as any).active_map_pool;

      await createSeasonController(mockRequest, mockResponse, mockNext);

      expect(mockCreateSeason).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
    });

    it("should update a season with valid active_map_pool", async () => {
      const mockRequest = {
        params: { id: "123" },
        body: {
          ...validSeasonData,
          active_map_pool: [4, 5, 6]
        }
      } as RequestWithParams<{ id: string }> &
        RequestWithBody<SeasonFormValues>;

      mockGetSeasonById.mockResolvedValue(
        createMockSeason({
          id: 123,
          active_map_pool: [1, 2, 3]
        })
      );

      mockUpdateSeason.mockResolvedValue({ affectedRows: 1 });

      await updateSeasonController(mockRequest, mockResponse, mockNext);

      expect(mockUpdateSeason).toHaveBeenCalledWith(
        123,
        expect.objectContaining({
          active_map_pool: [4, 5, 6]
        })
      );
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should reject empty active_map_pool array when updating", async () => {
      const mockRequest = {
        params: { id: "123" },
        body: {
          ...validSeasonData,
          active_map_pool: []
        }
      } as RequestWithParams<{ id: string }> &
        RequestWithBody<SeasonFormValues>;

      mockGetSeasonById.mockResolvedValue(
        createMockSeason({
          id: 123,
          active_map_pool: [1, 2, 3]
        })
      );

      await updateSeasonController(mockRequest, mockResponse, mockNext);

      expect(mockUpdateSeason).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(expect.any(ZodError));
      const zodError = mockNext.mock.calls[0]?.[0] as unknown as ZodError;
      expect(zodError?.issues[0]?.message).toContain(
        "At least one map must be selected"
      );
    });

    it("should include active_map_pool in getSeasonById response", async () => {
      const mockRequest = {
        params: { id: "123" }
      } as RequestWithParams<{ id: string }>;

      const mockSeason = createMockSeason({
        id: 123,
        active_map_pool: [1, 2, 3, 4]
      });

      mockGetSeasonById.mockResolvedValue(mockSeason);

      await getSeasonByIdController(mockRequest, mockResponse);

      expect(mockGetSeasonById).toHaveBeenCalledWith(123);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          active_map_pool: [1, 2, 3, 4]
        })
      );
    });
  });
});
