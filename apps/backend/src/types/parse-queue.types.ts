// Parse Queue Message Types

/**
 * Message format for parse_queue (HUB → Demo Parser)
 */
export interface ParseQueueMessage {
  game_id: string;
  download_url: string;
  priority: number;
  created_at: string;
  source: string;
}

/**
 * Status types for parsing results
 */
export type ParsingStatus = "success" | "partial_success" | "failed";

/**
 * Message format for parse result queue (Demo Parser → HUB)
 */
export interface ParseResultMessage {
  game_id: string;
  demo_file: string;
  json_file: string;
  processed_at: string;
  processing_duration: number;
  worker_id: string;
  status: ParsingStatus;
  parsed_payload: ParsedPayload; // You'll implement this type
}

/**
 * Parsed payload type - to be implemented by you
 */
export interface ParsedPayload {
  // TODO: Implement the parsed payload structure
  // This will contain the actual parsed demo data
  [key: string]: unknown;
}

/**
 * Parse queue configuration
 */
export interface ParseQueueConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  parseQueueName: string;
  resultQueueName: string;
  errorQueueName: string;
  prefetchCount: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Default parse queue configuration
 */
export const DEFAULT_PARSE_QUEUE_CONFIG: ParseQueueConfig = {
  host: "eggo-rabbitmq",
  port: 5672,
  username: "test",
  password: "test",
  parseQueueName: "parse_queue",
  resultQueueName: "parse_result_queue",
  errorQueueName: "parse_error_queue",
  prefetchCount: 10,
  retryAttempts: 3,
  retryDelay: 5000
};
