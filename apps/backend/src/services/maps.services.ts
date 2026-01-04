import { runQuery } from "../db/mysqlRunQuery";

/**
 * Get map names by their IDs
 * @param mapIds - Array of map IDs
 * @returns Array of map names in the same order as input IDs
 */
export const getMapNamesByIds = async (mapIds: number[]): Promise<string[]> => {
  if (!mapIds || mapIds.length === 0) {
    return [];
  }

  const placeholders = mapIds.map(() => "?").join(", ");
  const query = `SELECT id, name FROM Maps WHERE id IN (${placeholders})`;

  const results = await runQuery<
    Array<{
      id: number;
      name: string;
    }>
  >(query, mapIds);

  // Create a map for quick lookup
  const mapIdToName = new Map<number, string>();
  results.forEach((map) => {
    mapIdToName.set(map.id, map.name);
  });

  // Return names in the same order as input IDs
  return mapIds
    .map((id) => mapIdToName.get(id))
    .filter((name): name is string => name !== undefined);
};
