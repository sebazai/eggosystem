import { logger } from "../utils/app-logger";
import FormData from "form-data";
import https from "https";
import http from "http";

interface ImageServiceResponse {
  id: number;
  uuid: string;
  filename: string;
  content_type: string;
  created_at: string;
  phash: string;
  message: string;
  duplicate: boolean;
}

/**
 * Get content type based on file extension
 */
function getContentType(filename: string): string {
  const ext = filename.toLowerCase().split(".").pop();
  const contentTypes: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    webp: "image/webp"
  };
  return contentTypes[ext ?? ""] || "application/octet-stream";
}

/**
 * Upload an image file to the image service
 * @param fileBuffer - The file buffer to upload
 * @param filename - The original filename
 * @param imageServiceBaseUrl - Base URL of the image service
 * @param apiKey - API key for authentication
 * @returns The image service response with phash
 */
export async function uploadImageToService(
  fileBuffer: Buffer,
  filename: string,
  imageServiceBaseUrl: string,
  apiKey: string
): Promise<ImageServiceResponse> {
  const contentType = getContentType(filename);

  // Use the form-data package which is compatible with Node.js http/https
  const formData = new FormData();

  // Append the buffer directly - form-data package handles Buffer correctly
  formData.append("file", fileBuffer, {
    filename: filename,
    contentType: contentType
  });

  // Debug: Log FormData contents (without the binary data)
  logger.info(
    `FormData created with file: ${filename}, contentType: ${contentType}, size: ${fileBuffer.length} bytes, firstBytes: ${fileBuffer.slice(0, 8).toString("hex")}`
  );

  const uploadUrl = `${imageServiceBaseUrl}/images`;

  // Check if this is a valid image by checking the first few bytes
  const isPng =
    fileBuffer.length > 8 &&
    fileBuffer
      .slice(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isJpeg =
    fileBuffer.length > 2 &&
    fileBuffer.slice(0, 2).equals(Buffer.from([0xff, 0xd8]));

  logger.info(
    `Uploading image ${filename} (${fileBuffer.length} bytes, ${contentType}) to ${uploadUrl}. Detected: PNG=${isPng}, JPEG=${isJpeg}`
  );

  // Use Node.js http/https modules with form-data (which is designed for this)
  const parsedUrl = new URL(uploadUrl);
  const isHttps = parsedUrl.protocol === "https:";
  const httpModule = isHttps ? https : http;

  const response = await new Promise<{ statusCode: number; body: string }>(
    (resolve, reject) => {
      const req = httpModule.request(
        {
          method: "PUT",
          hostname: parsedUrl.hostname,
          port: parsedUrl.port || (isHttps ? 443 : 80),
          path: parsedUrl.pathname,
          headers: {
            "X-API-KEY": apiKey,
            ...formData.getHeaders()
          }
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => {
            body += chunk;
          });
          res.on("end", () => {
            resolve({ statusCode: res.statusCode ?? 0, body });
          });
        }
      );

      req.on("error", (error) => {
        logger.error(`Network error uploading image to ${uploadUrl}: ${error}`);
        reject(new Error(`Network error uploading image: ${error}`));
      });

      // Pipe the form data to the request
      formData.pipe(req);
    }
  );

  // Check status code
  const statusCode = response.statusCode;
  const responseText = response.body;
  const isOk = statusCode >= 200 && statusCode < 300;

  logger.info(
    `Image service response: status=${statusCode}, isOk=${isOk}, body=${responseText}`
  );

  if (!isOk) {
    logger.error(
      `Failed to upload image to service: ${statusCode} - ${responseText}`
    );
    throw new Error(`Failed to upload image: ${statusCode} - ${responseText}`);
  }

  // Parse JSON response only if status is OK
  let result: ImageServiceResponse;
  try {
    result = JSON.parse(responseText) as ImageServiceResponse;
  } catch (parseError) {
    logger.error(
      `Failed to parse image service response. Status: ${statusCode}, Response text: ${responseText}`
    );
    throw new Error(`Invalid response from image service: ${responseText}`);
  }

  // Validate that phash is present and not empty
  if (!result.phash || result.phash.trim() === "") {
    logger.error(
      `Image service returned empty phash for ${filename}. Full response: ${JSON.stringify(result)}`
    );
    throw new Error("Image service returned empty phash");
  }

  // Check for the problematic default phash that indicates image processing failed
  if (result.phash === "8000000000000000") {
    logger.error(
      `Image service returned default phash (8000000000000000) for ${filename}, indicating image processing failed. Full response: ${JSON.stringify(result)}`
    );
    throw new Error(
      "Image service failed to process image - returned default phash"
    );
  }

  // Log successful upload with all details for debugging
  logger.info(
    `Successfully uploaded image ${filename} to ${imageServiceBaseUrl}. FULL RESPONSE: ${JSON.stringify(result)}`
  );

  // Verify the image is immediately accessible (optional check)
  const verifyUrl = `${imageServiceBaseUrl}/images/by-hash/phash/${result.phash}`;
  try {
    const verifyResponse = await fetch(verifyUrl, { method: "HEAD" });
    if (!verifyResponse.ok && verifyResponse.status !== 405) {
      logger.warn(
        `Uploaded image with phash ${result.phash} is not immediately accessible at ${verifyUrl}. Status: ${verifyResponse.status}. This might be normal if the service needs time to process.`
      );
    }
  } catch (verifyError) {
    logger.warn(
      `Could not verify image accessibility for phash ${result.phash}: ${verifyError}`
    );
  }

  return result;
}
