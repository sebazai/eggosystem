import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/app-logger";
import { uploadImageToService } from "../services/image-upload.services";
import * as teamLogoModels from "../models/team-logo.models";
import {
  UnauthorizedError,
  ForbiddenError,
  BadRequestError
} from "../utils/errors";

interface UploadTeamLogoRequestBody {
  team_id: number;
  image_data?: string; // Base64 encoded image data (format: "data:image/png;base64,..." or just base64 string)
  filename?: string; // Optional filename, will be inferred from image_data if not provided
  team_name?: string; // Optional team name to update
}

/**
 * Controller to update team logo and/or team name
 * Requires user to be authenticated and be a captain/co-captain of the team
 */
export const uploadTeamLogoController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.auth || !req.auth.account_id) {
    return next(new UnauthorizedError("Unauthorized"));
  }

  const body = req.body as UploadTeamLogoRequestBody;
  const accountId = req.auth.account_id as number;
  const teamId = body.team_id;
  const teamName = body.team_name; // Store locally to avoid modification

  if (!teamId) {
    return next(new BadRequestError("team_id is required"));
  }

  if (!body.image_data && !teamName) {
    return next(
      new BadRequestError("Either image_data or team_name must be provided")
    );
  }

  // Check if user is captain
  const isCaptain = await teamLogoModels.isUserTeamCaptain(accountId, teamId);
  if (!isCaptain) {
    return next(
      new ForbiddenError("Only team captains can update team information")
    );
  }

  try {
    let phash: string | undefined;

    logger.info(
      `Team details update request: teamId=${teamId}, hasImageData=${!!body.image_data}, hasTeamName=${!!teamName}`
    );

    // Handle image upload if provided
    if (body.image_data) {
      logger.info(
        `Processing image data: length=${body.image_data.length}, startsWith=${body.image_data.substring(0, 20)}...`
      );
      // Parse base64 image data
      let imageBuffer: Buffer;
      let filename: string;
      let contentType: string;

      if (body.image_data.startsWith("data:")) {
        // Format: "data:image/png;base64,iVBORw0KGgo..."
        const matches = body.image_data.match(/^data:([^;]+);base64,(.*)$/);
        if (!matches) {
          logger.error(
            `Invalid data URI format: ${body.image_data.substring(0, 50)}...`
          );
          return next(
            new BadRequestError(
              "Invalid image_data format. Expected data URI or base64 string"
            )
          );
        }
        contentType = matches[1];
        const base64Data = matches[2];
        imageBuffer = Buffer.from(base64Data, "base64");

        // Extract filename from content type or use provided filename
        const ext = contentType.split("/")[1] || "png";
        filename = body.filename || `team-${teamId}-logo.${ext}`;

        logger.info(
          `Parsed data URI: contentType=${contentType}, base64Length=${base64Data.length}, bufferLength=${imageBuffer.length}`
        );
      } else {
        // Assume it's just base64 data
        imageBuffer = Buffer.from(body.image_data, "base64");
        filename = body.filename || `team-${teamId}-logo.png`;
        contentType = "image/png"; // Default to PNG if not specified

        logger.info(`Parsed plain base64: bufferLength=${imageBuffer.length}`);
      }

      // Validate image buffer
      if (imageBuffer.length === 0) {
        logger.warn(`Image buffer is empty for ${filename} (${contentType})`);
        return next(new BadRequestError("Invalid image data"));
      }

      // Validate that the buffer contains valid image data using file-type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { fileTypeFromBuffer } = (await import("file-type")) as any;
      const detectedType = await fileTypeFromBuffer(imageBuffer);

      if (!detectedType) {
        logger.error(
          `Could not detect file type: size=${imageBuffer.length}, firstBytes=${imageBuffer.slice(0, Math.min(20, imageBuffer.length)).toString("hex")}`
        );
        return next(
          new BadRequestError("Invalid image data: unable to detect file type")
        );
      }

      // Check if detected type is a supported image format
      const supportedTypes = [
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/gif",
        "image/webp"
      ];
      const detectedMimeType = detectedType.mime;

      if (!supportedTypes.includes(detectedMimeType)) {
        logger.error(
          `Unsupported image type detected: ${detectedMimeType}, size=${imageBuffer.length}`
        );
        return next(
          new BadRequestError(
            `Unsupported image type: ${detectedMimeType}. Supported types: PNG, JPEG, GIF, WebP`
          )
        );
      }

      logger.info(
        `Image validation passed: detectedType=${detectedMimeType}, size=${imageBuffer.length} bytes`
      );

      logger.info(
        `Processing image upload: ${filename}, size=${imageBuffer.length} bytes, contentType=${contentType}`
      );

      // Get image service configuration from environment
      const imageServiceBaseUrl =
        process.env.IMAGE_SERVICE_BASE_URL || "https://img.kanaliiga.fi";
      const imageServiceApiKey = process.env.IMAGE_SERVICE_API_KEY;

      if (!imageServiceApiKey) {
        return next(
          new BadRequestError("Image service API key not configured")
        );
      }

      // Upload image to image service
      const uploadResult = await uploadImageToService(
        imageBuffer,
        filename,
        imageServiceBaseUrl,
        imageServiceApiKey
      );

      phash = uploadResult.phash;

      // Update team logo phash in database
      await teamLogoModels.updateTeamLogoPhash(teamId, uploadResult.phash);
    }

    // Handle team name update if provided
    if (teamName) {
      if (typeof teamName !== "string" || teamName.trim().length === 0) {
        return next(new BadRequestError("Team name cannot be empty"));
      }
      await teamLogoModels.updateTeamName(teamId, teamName.trim());
    }

    const messages: string[] = [];
    if (phash) {
      messages.push("Team logo updated successfully");
    }
    if (teamName) {
      messages.push("Team name updated successfully");
    }

    logger.info(
      `Team details update completed: teamId=${teamId}, accountId=${accountId}, phash=${phash}, teamName=${teamName ? "updated" : "not changed"}`
    );
    res.json({
      success: true,
      phash,
      message: messages.join(" and ")
    });
  } catch (error) {
    next(error);
  }
};
