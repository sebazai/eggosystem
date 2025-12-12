import { logger } from "../utils/app-logger";
import { uploadImageToService } from "./image-upload.services";
import { validateImageBuffer } from "../utils/file-type-validator";
import { BadRequestError } from "../utils/errors";

interface SignupImageUploadResult {
  phash: string;
}

/**
 * Parse and validate base64 image data for signup
 * @param imageData - Base64 encoded image data (format: "data:image/png;base64,..." or just base64 string)
 * @param defaultFilename - Default filename if not determinable from data
 * @returns Parsed image buffer and metadata
 */
export function parseBase64ImageData(
  imageData: string,
  defaultFilename: string
): { buffer: Buffer; filename: string; contentType: string } {
  let imageBuffer: Buffer;
  let filename: string;
  let contentType: string;

  if (imageData.startsWith("data:")) {
    // Format: "data:image/png;base64,iVBORw0KGgo..."
    const matches = imageData.match(/^data:([^;]+);base64,(.*)$/);
    if (!matches) {
      throw new BadRequestError(
        "Invalid image_data format. Expected data URI or base64 string"
      );
    }
    contentType = matches[1];
    const base64Data = matches[2];
    imageBuffer = Buffer.from(base64Data, "base64");

    // Extract filename from content type or use provided filename
    const ext = contentType.split("/")[1] || "png";
    filename = defaultFilename.includes(".")
      ? defaultFilename
      : `${defaultFilename}.${ext}`;
  } else {
    // Assume it's just base64 data
    imageBuffer = Buffer.from(imageData, "base64");
    filename = defaultFilename.includes(".")
      ? defaultFilename
      : `${defaultFilename}.png`;
    contentType = "image/png"; // Default to PNG if not specified
  }

  return { buffer: imageBuffer, filename, contentType };
}

/**
 * Validate that the buffer contains valid image data
 */
export async function validateImageData(imageBuffer: Buffer): Promise<void> {
  if (imageBuffer.length === 0) {
    throw new BadRequestError("Invalid image data: empty buffer");
  }

  const detectedType = await validateImageBuffer(imageBuffer);
  if (!detectedType) {
    throw new BadRequestError("Invalid image data: unable to detect file type");
  }

  const supportedTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/webp"
  ];

  if (!supportedTypes.includes(detectedType.mime)) {
    throw new BadRequestError(
      `Unsupported image type: ${detectedType.mime}. Supported types: PNG, JPEG, GIF, WebP`
    );
  }
}

/**
 * Upload image from base64 data for signup forms
 * This is used when creating new organizations/teams during signup
 */
export async function uploadSignupImage(
  imageData: string,
  imageFilename: string | undefined,
  entityType: "organization" | "team",
  entityId: number
): Promise<SignupImageUploadResult> {
  const defaultFilename = `${entityType}-${entityId}-logo`;
  const { buffer, filename, contentType } = parseBase64ImageData(
    imageData,
    imageFilename || defaultFilename
  );

  // Validate the image
  await validateImageData(buffer);

  logger.info(
    `Processing ${entityType} image upload: ${filename}, size=${buffer.length} bytes, contentType=${contentType}`
  );

  // Get image service configuration
  const imageServiceBaseUrl =
    process.env.IMAGE_SERVICE_BASE_URL || "https://img.kanaliiga.fi";
  const imageServiceApiKey = process.env.IMAGE_SERVICE_API_KEY;

  if (!imageServiceApiKey) {
    throw new BadRequestError("Image service API key not configured");
  }

  // Upload to image service
  const uploadResult = await uploadImageToService(
    buffer,
    filename,
    imageServiceBaseUrl,
    imageServiceApiKey
  );

  logger.info(
    `Successfully uploaded ${entityType} logo: phash=${uploadResult.phash}`
  );

  return { phash: uploadResult.phash };
}
