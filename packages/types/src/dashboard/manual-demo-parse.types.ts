/**
 * Request body for POST /api/v1/dashboard/demos/manual/parse-queue
 */
export interface ManualDemoParseQueueRequest {
  match_game_id?: number;
  match_id?: number;
  map_order?: number;
  external_match_room_id?: string;
  download_url: string;
  priority?: number;
  reparse?: boolean;
  /**
   * When true, the backend will mark the associated match as finished
   * after the demo is enqueued. The match end_time is derived as
   * start_time + best_of hours.
   * @default false
   */
  mark_finished?: boolean;
}

/**
 * Result of the mark-finished operation, echoed in the parse-queue response.
 */
export interface ManualDemoParseMarkFinishedResult {
  /** Whether the mark-finished action was applied. */
  applied: boolean;
  /** IDs of the matches that were marked as finished. */
  match_ids: number[];
  /**
   * The end timestamp applied to the match(es), ISO 8601 UTC string,
   * or null when the action was not applied.
   */
  end_timestamp: string | null;
  /**
   * Human-readable reason why the action was skipped, or null when
   * the action was applied successfully.
   */
  skipped_reason: string | null;
}

/**
 * Response body for POST /api/v1/dashboard/demos/manual/parse-queue
 */
export interface ManualDemoParseQueueResponse {
  status: "enqueued";
  match_game_id: number;
  /** Present when mark_finished was included in the request. */
  mark_finished?: ManualDemoParseMarkFinishedResult;
}
