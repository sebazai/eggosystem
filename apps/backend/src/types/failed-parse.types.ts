// Failed Parse Queue Message Types

/**
 * Common interface for all failed parse messages
 */
export interface BaseFailedMessage {
  id?: number; // Database ID when stored
  queue_name: string; // Which queue this came from
  match_game_id: string;
  failed_at: string;
  final_error: string;
  original_message: Record<string, unknown>;
  created_at?: string; // Database timestamp
  updated_at?: string; // Database timestamp
  status?: "failed" | "requeued" | "resolved"; // Processing status
}

/**
 * Error details for parse_queue_failed messages (from demo parser worker)
 */
export interface ParseQueueFailedErrorHistory {
  error: string;
  timestamp: string;
  retry_count: number;
  worker_id: string;
  stage: string;
  demo_file: string;
  demo_size: number;
  json_file: string;
  json_size: number;
  error_type: string;
  detailed_logs: string;
}

/**
 * Message format from parse_queue_failed (Demo Parser → Hub)
 */
export interface ParseQueueFailedMessage extends BaseFailedMessage {
  error_history: ParseQueueFailedErrorHistory[];
  worker_id: string;
  message_type: "parse_queue";
}

/**
 * Message format from parsed_save_failed (Hub internal processing)
 */
export interface ParsedSaveFailedMessage extends BaseFailedMessage {
  errors: string[];
  details?: Record<string, unknown>;
  source: string;
  metadata: {
    processor: string;
    version: string;
  };
}

/**
 * Union type for all failed message types
 */
export type FailedParseMessage =
  | ParseQueueFailedMessage
  | ParsedSaveFailedMessage;

/**
 * Request format for reparse submission
 */
export interface ReparseRequest {
  message_ids: number[]; // Database IDs of messages to reparse
  priority?: number; // Optional priority override (1-10)
  source?: string; // Who requested the reparse
}

/**
 * Response format for reparse submission
 */
export interface ReparseResponse {
  success: boolean;
  requeued_count: number;
  failed_count: number;
  errors?: string[];
}

/**
 * Database row interface for failed_parse_messages table
 */
export interface FailedParseMessageRow {
  id: number;
  queue_name: string;
  match_game_id: string;
  failed_at: string;
  final_error: string;
  original_message: string; // JSON string in database
  error_details: string; // JSON string of error_history or errors
  worker_id?: string;
  message_type?: string;
  source?: string;
  status: "failed" | "requeued" | "resolved";
  created_at: string;
  updated_at: string;
}
