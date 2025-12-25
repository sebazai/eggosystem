/**
 * Helper module to validate file types using the file-type library
 * This wrapper makes it easier to mock in tests
 */

export async function validateImageBuffer(
  buffer: Buffer
): Promise<{ ext: string; mime: string } | undefined> {
  // Dynamic import of file-type (ESM module)
  // In file-type v17+, the function is exported as fileTypeFromBuffer
  const { fileTypeFromBuffer } = await import("file-type");
  return await fileTypeFromBuffer(buffer);
}
