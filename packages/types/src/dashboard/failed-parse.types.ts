// Frontend types for failed parse messages

export interface FailedParseMessage {
  id: number;
  queue_name: string;
  game_id: string;
  failed_at: string;
  final_error: string;
  original_message: Record<string, unknown>;
  error_details: Record<string, unknown> | unknown[] | unknown;
  worker_id?: string;
  message_type?: string;
  source?: string;
  status: "failed" | "requeued" | "resolved";
  created_at: string;
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
  message_ids: number[];
  priority?: number;
  source?: string;
}

export interface ReparseResponse {
  success: boolean;
  requeued_count: number;
  failed_count: number;
  errors?: string[];
}
