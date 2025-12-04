/**
 * Helper module to validate file types using the file-type library
 * This wrapper makes it easier to mock in tests
 */

export async function validateImageBuffer(
  buffer: Buffer
): Promise<{ ext: string; mime: string } | undefined> {
  // Dynamic import of file-type (ESM module)
  // NOTE: The type definitions say fromBuffer is a named export, but at runtime
  // it's actually under default.fromBuffer. This is a bug in file-type's types.
  // We use 'as any' to work around the incorrect type definitions.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fileType = (await import("file-type")) as any;
  return await fileType.default.fromBuffer(buffer);
}
