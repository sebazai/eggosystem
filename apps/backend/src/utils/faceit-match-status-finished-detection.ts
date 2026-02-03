/**
 * Detection helpers for FACEIT match_status_finished webhooks.
 * Used to distinguish forfeit/abort (epoch started_at) from actually played games,
 * e.g. for 2xBO1 rooms where one game can be forfeited and the other played.
 */

/** FACEIT uses this started_at when the match was aborted/forfeited (no real start). */
export const FACEIT_FORFEIT_STARTED_AT = "1970-01-01T00:00:00Z" as const;

/**
 * Returns true if the webhook payload indicates a forfeit/abort (match did not actually start).
 * FACEIT sends started_at === "1970-01-01T00:00:00Z" for aborted or forfeited matches.
 * Missing or undefined started_at is treated as non-forfeit (returns false).
 */
export function isForfeitPayload(payload: {
  started_at?: string | null;
}): boolean {
  return payload.started_at === FACEIT_FORFEIT_STARTED_AT;
}
