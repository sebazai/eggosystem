/**
 * Downscale a browser `File` so the longest side is at most `maxSide` pixels,
 * then return a data URL suitable for `image_data` on the dashboard API.
 */
export async function resizeImageFileToDataUrl(
  file: File,
  maxSide: number
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = longest <= maxSide ? 1 : maxSide / longest;
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Canvas 2D context is not available");
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  const mime =
    file.type === "image/jpeg" || file.type === "image/jpg"
      ? "image/jpeg"
      : file.type === "image/webp"
        ? "image/webp"
        : "image/png";

  const quality = mime === "image/jpeg" ? 0.92 : undefined;
  const dataUrl = canvas.toDataURL(mime, quality);
  if (!dataUrl || dataUrl.length < 32) {
    throw new Error("Failed to encode resized image");
  }
  return dataUrl;
}
