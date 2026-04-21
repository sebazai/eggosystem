/**
 * Parse `image_data` from team-logo / sponsor-style payloads:
 * either a full data URI (`data:image/png;base64,...`) or raw base64 bytes.
 */
type ParsedBase64Image =
  | {
      ok: true;
      imageBuffer: Buffer;
      filename: string;
      contentType: string;
    }
  | { ok: false; message: string };

export function parseBase64ImageData(
  image_data: string,
  filenameHint?: string
): ParsedBase64Image {
  if (!image_data || typeof image_data !== "string") {
    return { ok: false, message: "image_data is required" };
  }

  if (image_data.startsWith("data:")) {
    const matches = image_data.match(/^data:([^;]+);base64,(.*)$/);
    if (!matches) {
      return {
        ok: false,
        message: "Invalid image_data format. Expected data URI or base64 string"
      };
    }
    const contentType = matches[1];
    const base64Data = matches[2];
    const imageBuffer = Buffer.from(base64Data, "base64");
    const ext = contentType.split("/")[1] || "png";
    const filename = filenameHint || `upload.${ext}`;
    return { ok: true, imageBuffer, filename, contentType };
  }

  const imageBuffer = Buffer.from(image_data, "base64");
  const filename = filenameHint || "upload.png";
  const contentType = "image/png";
  return { ok: true, imageBuffer, filename, contentType };
}
