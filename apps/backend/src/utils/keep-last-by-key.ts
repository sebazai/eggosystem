/**
 * Collapse duplicate keys, keeping the last item — matches sequential
 * INSERT … ON DUPLICATE KEY UPDATE behaviour (last write wins).
 */
export function keepLastByKey<T>(
  items: readonly T[],
  keyOf: (item: T) => string
): T[] {
  const byKey = new Map<string, T>();
  for (const item of items) {
    byKey.set(keyOf(item), item);
  }
  return [...byKey.values()];
}
