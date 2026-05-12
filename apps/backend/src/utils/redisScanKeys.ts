import type Redis from "ioredis";

/**
 * Collects all keys matching a glob pattern using SCAN instead of KEYS.
 * KEYS blocks the entire Redis server; SCAN yields incrementally and is safe for production.
 */
export async function scanKeysMatchingPattern(
  client: Redis,
  pattern: string
): Promise<string[]> {
  const seen = new Set<string>();
  let cursor = "0";
  do {
    const [nextCursor, batch] = await client.scan(
      cursor,
      "MATCH",
      pattern,
      "COUNT",
      500
    );
    cursor = nextCursor;
    for (const key of batch) {
      seen.add(key);
    }
  } while (cursor !== "0");

  return Array.from(seen).sort();
}
