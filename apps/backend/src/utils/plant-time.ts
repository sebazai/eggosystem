/** Parser sends 0 when there was no plant — store and expose as null, not zero. */
export function plantTimeSecondsOrNull(
  timeInRound: number | null | undefined
): number | null {
  if (timeInRound == null || timeInRound === 0) return null;
  return timeInRound;
}
