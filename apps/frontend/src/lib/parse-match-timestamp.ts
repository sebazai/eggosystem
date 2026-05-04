/**
 * Parse match API timestamps for display. If the string has no zone suffix,
 * treat it as UTC (append Z) so wall times align with backend semantics.
 */
export function parseMatchTimestampToDate(isoTimestamp: string): Date {
  const hasExplicitZone =
    /([zZ]|[+-]\d{2}:\d{2})$/.test(isoTimestamp) ||
    /([+-]\d{4})$/.test(isoTimestamp);
  return new Date(hasExplicitZone ? isoTimestamp : `${isoTimestamp}Z`);
}
