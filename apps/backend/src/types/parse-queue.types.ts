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
  status: ParsingStatus;
  timestamp?: string;
  result?: {
    parsed_data: Record<string, unknown>;
    processing_time: number;
    errors?: string[];
  };
  details: {
    processingTime: number;
    timestamp: string;
    errors?: string[];
  };
  metadata: {
    processor: string;
    version: string;
    requestId?: string;
  };
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
