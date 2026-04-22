import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { logger } from "../utils/app-logger";
import { BadRequestError, UnauthorizedError } from "../utils/errors";
import { uploadImageToService } from "../services/image-upload.services";
import { validateImageBuffer } from "../utils/file-type-validator";
import {
  updatePlayerAvatar,
  getPlayerBySteamId
} from "../models/player.models";

const uploadAvatarSchema = z.object({
  image_data: z.string().min(1, "Image data is required")
});

/**
 * Upload player avatar controller
 * Allows authenticated users to upload their own avatar
 */
export const uploadPlayerAvatarController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.auth || req.auth.provider !== "steam") {
      return next(new UnauthorizedError("Authentication required"));
    }

    const steamId = req.auth.provider_id;

    // Validate request body
    const validationResult = uploadAvatarSchema.safeParse(req.body);
    if (!validationResult.success) {
      return next(
        new BadRequestError(
          validationResult.error.issues.map((e) => e.message).join(", ")
        )
      );
    }

    const { image_data } = validationResult.data;

    // Parse base64 image data
    let imageBuffer: Buffer;
    let filename: string;

    if (image_data.startsWith("data:")) {
      // Format: "data:image/png;base64,iVBORw0KGgo..."
      const matches = image_data.match(/^data:([^;]+);base64,(.*)$/);
      if (!matches) {
        return next(
          new BadRequestError(
            "Invalid image_data format. Expected data URI or base64 string"
          )
        );
      }
      const contentType = matches[1];
      const base64Data = matches[2];
      imageBuffer = Buffer.from(base64Data, "base64");
      const ext = contentType.split("/")[1] || "png";
      filename = `avatar-${steamId}.${ext}`;
    } else {
      // Assume it's just base64 data
      imageBuffer = Buffer.from(image_data, "base64");
      filename = `avatar-${steamId}.png`;
    }

    // Validate the image
    if (imageBuffer.length === 0) {
      return next(new BadRequestError("Invalid image data: empty buffer"));
    }

    const detectedType = await validateImageBuffer(imageBuffer);
    if (!detectedType) {
      return next(
        new BadRequestError("Invalid image data: unable to detect file type")
      );
    }

    const supportedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/gif",
      "image/webp"
    ];

    if (!supportedTypes.includes(detectedType.mime)) {
      return next(
        new BadRequestError(
          `Unsupported image type: ${detectedType.mime}. Supported types: PNG, JPEG, GIF, WebP`
        )
      );
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (imageBuffer.length > maxSize) {
      return next(
        new BadRequestError(
          `Image too large: ${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB. Maximum size is 10MB`
        )
      );
    }

    // Verify player exists
    const [player] = await getPlayerBySteamId(steamId);
    if (!player) {
      return next(
        new BadRequestError(`Player with steam_id ${steamId} not found`)
      );
    }

    // Get image service configuration
    const imageServiceBaseUrl =
      process.env.IMAGE_SERVICE_URL || "https://img.kanaliiga.fi";
    const imageServiceApiKey = process.env.IMAGE_SERVICE_API_KEY;

    if (!imageServiceApiKey) {
      logger.error("IMAGE_SERVICE_API_KEY not configured");
      return next(new BadRequestError("Image service not configured"));
    }

    // Upload to image service
    logger.info(
      `Uploading avatar for player ${steamId}, size=${imageBuffer.length} bytes`
    );

    const uploadResult = await uploadImageToService(
      imageBuffer,
      filename,
      imageServiceBaseUrl,
      imageServiceApiKey
    );

    logger.info(
      `Avatar uploaded successfully for player ${steamId}: phash=${uploadResult.phash}`
    );

    // Update player avatar in database
    await updatePlayerAvatar(steamId, uploadResult.phash);

    res.json({
      message: "Avatar updated successfully",
      phash: uploadResult.phash
    });
  } catch (error) {
    logger.error("Error uploading player avatar:", error);
    return next(error);
  }
};
