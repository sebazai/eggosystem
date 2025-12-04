/**
 * Helper module to validate file types using the file-type library
 * This wrapper makes it easier to mock in tests
 */

export async function validateImageBuffer(
  buffer: Buffer
): Promise<{ ext: string; mime: string } | undefined> {
  // Dynamic import of file-type (ESM module)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { fileTypeFromBuffer } = (await import("file-type")) as any;
  return await fileTypeFromBuffer(buffer);
}
