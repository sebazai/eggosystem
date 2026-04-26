// Frontend types for failed parse messages

export interface FailedParseMessage {
  id: number;
  queue_name: string;
  match_game_id: string;
  /**
   * Failure timestamp in UTC, ISO 8601 format with 'Z' indicator (e.g., '2025-01-15T10:30:00.000Z')
   * Stored as TIMESTAMP in database (UTC). Returned as Date object from models, serialized to ISO string by Express res.json()
   */
  failed_at: string;
  final_error: string;
  original_message: Record<string, unknown>;
  error_details: Record<string, unknown> | unknown[] | unknown;
  worker_id?: string;
  message_type?: string;
  source?: string;
  status: "failed" | "requeued" | "resolved";
  /**
   * Creation timestamp in UTC, ISO 8601 format with 'Z' indicator (e.g., '2025-01-15T10:30:00.000Z')
   * Stored as TIMESTAMP in database (UTC). Returned as Date object from models, serialized to ISO string by Express res.json()
   */
  created_at: string;
  /**
   * Last update timestamp in UTC, ISO 8601 format with 'Z' indicator (e.g., '2025-01-15T10:30:00.000Z')
   * Stored as TIMESTAMP in database (UTC). Returned as Date object from models, serialized to ISO string by Express res.json()
   */
  updated_at: string;
  _rabbitMQMessage?: unknown; // Internal RabbitMQ message reference
}

export interface FailedParseMessagesResponse {
  messages: FailedParseMessage[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
  filters: {
    queue_name?: string;
    status?: string;
  };
}

export interface FailedParseStats {
  total_count: number;
  failed_count: number;
  requeued_count: number;
  resolved_count: number;
  queue_name: string;
}

export interface FailedParseStatsResponse {
  stats: FailedParseStats[];
}

export interface ReparseRequest {
  /** Match game IDs to requeue for reparse. Only messages with these IDs are acked and requeued. */
  match_game_ids: number[];
  priority?: number;
}

export type FailedParseJobKind = "reparse" | "requeue2ddata" | "requeueAll";

export type FailedParseJobEventStatus =
  | "started"
  | "progress"
  | "completed"
  | "failed";

/** Payload streamed over SSE (`event: failed-parse-job`) for background requeue jobs. */
export interface FailedParseJobEvent {
  job_id: string;
  kind: FailedParseJobKind;
  status: FailedParseJobEventStatus;
  requested_count?: number;
  match_game_ids?: number[];
  /** How many items have been processed so far (best-effort). */
  processed_count?: number;
  /** Total items expected to be processed (when known). */
  total_count?: number;
  requeued_count?: number;
  failed_count?: number;
  /** Match game ids requeued since the previous progress event (best-effort). */
  requeued_match_game_ids?: Array<number | string>;
  errors?: string[];
  message?: string;
}

export interface ReparseResponse {
  success: boolean;
  requeued_count: number;
  failed_count: number;
  errors?: string[];
  /**
   * When true, the backend has accepted the request and is processing it asynchronously.
   * `requeued_count`/`failed_count` will likely be 0 in the immediate response.
   */
  queued?: boolean;
  /** Number of items requested to be requeued (best-effort informational). */
  requested_count?: number;
  /** BullMQ job id to correlate with SSE `FailedParseJobEvent.job_id` when `queued` is true. */
  job_id?: string;
}

export interface Requeue2ddataItem {
  match_game_id: string;
  demo_path: string;
}

export interface Requeue2ddataRequest {
  items: Requeue2ddataItem[];
}

export interface Requeue2ddataResponse {
  success: boolean;
  requeued_count: number;
  failed_count: number;
  errors?: string[];
  /**
   * When true, the backend has accepted the request and is processing it asynchronously.
   * `requeued_count`/`failed_count` will likely be 0 in the immediate response.
   */
  queued?: boolean;
  /** Number of items requested to be requeued (best-effort informational). */
  requested_count?: number;
  /** BullMQ job id to correlate with SSE `FailedParseJobEvent.job_id` when `queued` is true. */
  job_id?: string;
}
