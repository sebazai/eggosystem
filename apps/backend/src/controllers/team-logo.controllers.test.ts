import type { Request, Response, NextFunction } from "express";
import { uploadTeamLogoController } from "./team-logo.controllers";
import * as imageUploadService from "../services/image-upload.services";
import * as teamLogoModels from "../models/team-logo.models";
import * as fileTypeValidator from "../utils/file-type-validator";
import type {
  UnauthorizedError as _UnauthorizedError,
  ForbiddenError as _ForbiddenError,
  BadRequestError as _BadRequestError
} from "../utils/errors";

jest.mock("../services/image-upload.services");
jest.mock("../models/team-logo.models");
jest.mock("../utils/file-type-validator");

const mockUploadImageToService =
  imageUploadService.uploadImageToService as jest.MockedFunction<
    typeof imageUploadService.uploadImageToService
  >;
const mockIsUserTeamCaptain =
  teamLogoModels.isUserTeamCaptain as jest.MockedFunction<
    typeof teamLogoModels.isUserTeamCaptain
  >;
const mockUpdateTeamLogoPhash =
  teamLogoModels.updateTeamLogoPhash as jest.MockedFunction<
    typeof teamLogoModels.updateTeamLogoPhash
  >;
const mockUpdateTeamName = teamLogoModels.updateTeamName as jest.MockedFunction<
  typeof teamLogoModels.updateTeamName
>;
const mockValidateImageBuffer =
  fileTypeValidator.validateImageBuffer as jest.MockedFunction<
    typeof fileTypeValidator.validateImageBuffer
  >;

describe("Team Logo Controllers", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up environment variables
    process.env.IMAGE_SERVICE_URL = "https://imgdev.kanaliiga.fi";
    process.env.IMAGE_SERVICE_API_KEY = "test-api-key";

    // Mock file-type validator to return valid PNG by default
    mockValidateImageBuffer.mockResolvedValue({
      ext: "png",
      mime: "image/png"
    });

    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnThis();

    mockReq = {
      auth: {
        account_id: 123,
        provider_id: "76561198000000001",
        permissions: [],
        roles: [],
        nickname: "TestPlayer",
        provider: "steam"
      },
      body: {
        team_id: 1,
        image_data:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        filename: "test-logo.png"
      }
    };

    mockRes = {
      json: mockJson,
      status: mockStatus
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    delete process.env.IMAGE_SERVICE_URL;
    delete process.env.IMAGE_SERVICE_API_KEY;
  });

  describe("uploadTeamLogoController", () => {
    it("should upload logo successfully for captain", async () => {
      mockIsUserTeamCaptain.mockResolvedValue(true);
      mockUploadImageToService.mockResolvedValue({
        id: 1,
        uuid: "123e4567-e89b-12d3-a456-426614174000",
        filename: "test-logo.png",
        content_type: "image/png",
        created_at: "2025-11-30T12:00:00Z",
        phash: "abc123def456",
        message: "Image uploaded successfully",
        duplicate: false
      });
      mockUpdateTeamLogoPhash.mockResolvedValue(undefined);

      await uploadTeamLogoController(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockIsUserTeamCaptain).toHaveBeenCalledWith(123, 1);
      expect(mockUploadImageToService).toHaveBeenCalled();
      expect(mockUpdateTeamLogoPhash).toHaveBeenCalledWith(1, "abc123def456");
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        phash: "abc123def456",
        message: "Team logo updated successfully"
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should return error if user is not authenticated", async () => {
      mockReq.auth = undefined;

      await uploadTeamLogoController(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Unauthorized",
          status: 401
        })
      );
      expect(mockIsUserTeamCaptain).not.toHaveBeenCalled();
    });

    it("should work with non-Steam providers", async () => {
      mockReq.auth = {
        account_id: 123,
        provider_id: "discord-123",
        permissions: [],
        roles: [],
        nickname: "TestPlayer",
        provider: "discord"
      };

      mockIsUserTeamCaptain.mockResolvedValue(true);
      mockUpdateTeamName.mockResolvedValue(undefined);
      mockReq.body = {
        team_id: 1,
        team_name: "Test Team"
      };

      await uploadTeamLogoController(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      // Should work fine with non-Steam providers
      expect(mockIsUserTeamCaptain).toHaveBeenCalledWith(123, 1);
      expect(mockJson).toHaveBeenCalled();
    });

    it("should return error if team_id is missing", async () => {
      mockReq.body = {
        image_data: "data:image/png;base64,iVBORw0KGgo="
      };

      await uploadTeamLogoController(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "team_id is required"
        })
      );
      expect(mockIsUserTeamCaptain).not.toHaveBeenCalled();
    });

    it("should return error if both image_data and team_name are missing", async () => {
      mockReq.body = {
        team_id: 1
      };

      await uploadTeamLogoController(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Either image_data or team_name must be provided"
        })
      );
      expect(mockIsUserTeamCaptain).not.toHaveBeenCalled();
    });

    it("should return error if user is not captain or co-captain", async () => {
      mockIsUserTeamCaptain.mockResolvedValue(false);

      await uploadTeamLogoController(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockIsUserTeamCaptain).toHaveBeenCalledWith(123, 1);
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Only team captains can update team information",
          status: 403
        })
      );
      expect(mockUploadImageToService).not.toHaveBeenCalled();
    });

    it("should handle base64 string without data URI prefix", async () => {
      mockReq.body = {
        team_id: 1,
        image_data:
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
      };

      mockIsUserTeamCaptain.mockResolvedValue(true);
      mockUploadImageToService.mockResolvedValue({
        id: 1,
        uuid: "123e4567-e89b-12d3-a456-426614174000",
        filename: "team-1-logo.png",
        content_type: "image/png",
        created_at: "2025-11-30T12:00:00Z",
        phash: "abc123def456",
        message: "Image uploaded successfully",
        duplicate: false
      });
      mockUpdateTeamLogoPhash.mockResolvedValue(undefined);

      await uploadTeamLogoController(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockUploadImageToService).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        phash: "abc123def456",
        message: "Team logo updated successfully"
      });
    });

    it("should return error if image service API key is not configured", async () => {
      delete process.env.IMAGE_SERVICE_API_KEY;
      mockIsUserTeamCaptain.mockResolvedValue(true);

      await uploadTeamLogoController(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Image service API key not configured"
        })
      );
      expect(mockUploadImageToService).not.toHaveBeenCalled();
    });

    it("should return error if image data is invalid", async () => {
      mockReq.body = {
        team_id: 1,
        image_data: "data:image/png;base64,invalid!!!"
      };

      mockIsUserTeamCaptain.mockResolvedValue(true);
      // Mock validateImageBuffer to return undefined for invalid data
      mockValidateImageBuffer.mockResolvedValue(undefined);

      await uploadTeamLogoController(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      // Should handle the error gracefully
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("unable to detect file type")
        })
      );
    });

    it("should handle upload service errors", async () => {
      mockIsUserTeamCaptain.mockResolvedValue(true);
      mockUploadImageToService.mockRejectedValueOnce(
        new Error("Image service unavailable")
      );

      await uploadTeamLogoController(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Image service unavailable"
        })
      );
      expect(mockUpdateTeamLogoPhash).not.toHaveBeenCalled();
    });

    it("should handle database update errors", async () => {
      mockIsUserTeamCaptain.mockResolvedValue(true);
      mockUploadImageToService.mockResolvedValue({
        id: 1,
        uuid: "123e4567-e89b-12d3-a456-426614174000",
        filename: "test-logo.png",
        content_type: "image/png",
        created_at: "2025-11-30T12:00:00Z",
        phash: "abc123def456",
        message: "Image uploaded successfully",
        duplicate: false
      });
      mockUpdateTeamLogoPhash.mockRejectedValueOnce(
        new Error("Database error")
      );

      await uploadTeamLogoController(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Database error"
        })
      );
    });

    it("should update team name successfully", async () => {
      mockReq.body = {
        team_id: 1,
        team_name: "New Team Name"
      };

      mockIsUserTeamCaptain.mockResolvedValue(true);
      mockUpdateTeamName.mockResolvedValue(undefined);

      await uploadTeamLogoController(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockIsUserTeamCaptain).toHaveBeenCalledWith(123, 1);
      expect(mockUpdateTeamName).toHaveBeenCalledWith(1, "New Team Name");
      expect(mockUploadImageToService).not.toHaveBeenCalled();
      expect(mockUpdateTeamLogoPhash).not.toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        phash: undefined,
        message: "Team name updated successfully"
      });
    });

    it("should update both logo and team name successfully", async () => {
      mockReq.body = {
        team_id: 1,
        image_data: "data:image/png;base64,iVBORw0KGgo=",
        team_name: "New Team Name"
      };

      mockIsUserTeamCaptain.mockResolvedValue(true);
      mockUploadImageToService.mockResolvedValue({
        id: 1,
        uuid: "123e4567-e89b-12d3-a456-426614174000",
        filename: "test-logo.png",
        content_type: "image/png",
        created_at: "2025-11-30T12:00:00Z",
        phash: "abc123def456",
        message: "Image uploaded successfully",
        duplicate: false
      });
      mockUpdateTeamLogoPhash.mockResolvedValue(undefined);
      mockUpdateTeamName.mockResolvedValue(undefined);

      await uploadTeamLogoController(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      // Check that the response is correct (both logo and team name were updated)
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        phash: "abc123def456",
        message:
          "Team logo updated successfully and Team name updated successfully"
      });
    });

    it("should return error if team name is empty", async () => {
      mockReq.body = {
        team_id: 1,
        team_name: "   "
      };

      mockIsUserTeamCaptain.mockResolvedValue(true);

      await uploadTeamLogoController(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Team name cannot be empty"
        })
      );
      expect(mockUpdateTeamName).not.toHaveBeenCalled();
    });

    it("should handle empty image buffer", async () => {
      mockReq.body = {
        team_id: 1,
        image_data: "data:image/png;base64,"
      };

      mockIsUserTeamCaptain.mockResolvedValue(true);

      await uploadTeamLogoController(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Invalid image data"
        })
      );
      expect(mockUploadImageToService).not.toHaveBeenCalled();
    });

    it("should handle invalid base64 data", async () => {
      mockReq.body = {
        team_id: 1,
        image_data: "data:image/png;base64,!!!invalid!!!"
      };

      mockIsUserTeamCaptain.mockResolvedValue(true);
      // Mock validateImageBuffer to return undefined for invalid data
      mockValidateImageBuffer.mockResolvedValue(undefined);

      await uploadTeamLogoController(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      // Should handle the error gracefully
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining("unable to detect file type")
        })
      );
    });

    it("should handle very long team names", async () => {
      const longName = "A".repeat(300);
      mockReq.body = {
        team_id: 1,
        team_name: longName
      };

      mockIsUserTeamCaptain.mockResolvedValue(true);
      mockUpdateTeamName.mockResolvedValue(undefined);

      await uploadTeamLogoController(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockUpdateTeamName).toHaveBeenCalledWith(1, longName);
    });

    it("should handle team name with special characters", async () => {
      const specialName = 'Team & Co. <Test> "Name"';
      mockReq.body = {
        team_id: 1,
        team_name: specialName
      };

      mockIsUserTeamCaptain.mockResolvedValue(true);
      mockUpdateTeamName.mockResolvedValue(undefined);

      await uploadTeamLogoController(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockUpdateTeamName).toHaveBeenCalledWith(1, specialName);
    });

    it("should handle image upload timeout", async () => {
      mockIsUserTeamCaptain.mockResolvedValue(true);
      mockUploadImageToService.mockRejectedValueOnce(
        new Error("Network timeout")
      );

      await uploadTeamLogoController(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Network timeout"
        })
      );
      expect(mockUpdateTeamLogoPhash).not.toHaveBeenCalled();
    });
  });
});
