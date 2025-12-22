import type { MatchGameClip } from "./MatchGameClips.interface";

/**
 * Creates a mock MatchGameClip object with sensible defaults.
 * Accepts partial overrides to customize specific fields.
 *
 * @param overrides - Partial MatchGameClip object to override defaults
 * @returns Complete MatchGameClip object with defaults and overrides applied
 *
 * @example
 * ```typescript
 * // Use all defaults
 * const matchGameClip = createMockMatchGameClip();
 *
 * // Override specific fields
 * const customMatchGameClip = createMockMatchGameClip({
 *   match_game_id: 123,
 *   clip_status: "Processed",
 *   clip_url: "https://example.com/clip.mp4"
 * });
 * ```
 */
export const createMockMatchGameClip = (
  overrides?: Partial<MatchGameClip>
): MatchGameClip => {
  return {
    id: 1,
    match_game_id: 1,
    clip_steam_id: null,
    clip_status: "Submitted",
    clip_type: "potg",
    clip_id: null,
    clip_request_id: null,
    clip_url: null,
    clip_thumbnail_url: null,
    clip_snapshot_url: null,
    clip_title: null,
    clip_length: null,
    additional_data: null,
    ...overrides
  };
};
