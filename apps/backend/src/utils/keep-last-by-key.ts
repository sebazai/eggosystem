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

/**
 * Collapse duplicate keys, keeping the item with the smallest numeric value
 * (e.g. earliest time_in_round per round).
 */
export function keepMinByKey<T>(
  items: readonly T[],
  keyOf: (item: T) => string,
  valueOf: (item: T) => number
): T[] {
  const byKey = new Map<string, T>();
  for (const item of items) {
    const key = keyOf(item);
    const existing = byKey.get(key);
    if (!existing || valueOf(item) < valueOf(existing)) {
      byKey.set(key, item);
    }
  }
  return [...byKey.values()];
}
