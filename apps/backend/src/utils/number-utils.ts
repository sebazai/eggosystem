/**
 * Numeric helpers for API responses: MariaDB/mysql2 often returns DECIMAL-like
 * values as strings; models should normalize before `res.json`.
 */

/**
 * Coerce a DECIMAL or aggregate column from the driver (number or string) to
 * a plain number for JSON. Invalid values become `0`.
 */
export const coerceAvgScore = (
  value: string | number | null | undefined
): number => {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
};

/**
 * Kill/death ratio rounded to two decimals (same semantics as `toFixed(2)` on
 * the ratio). When there are no deaths, returns `1` (neutral default).
 */
export const roundSideKd = (kills: number, deaths: number): number =>
  deaths > 0 ? parseFloat((kills / deaths).toFixed(2)) : 1;
