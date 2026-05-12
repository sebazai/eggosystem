export interface RedisKey {
  key: string;
  type: string;
  value: string | null;
  ttl: number;
}

export interface RedisKeysResponse {
  success: boolean;
  data: string[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface RedisKeyDataResponse {
  success: boolean;
  data: RedisKey;
}

export interface RedisDeleteResponse {
  success: boolean;
  message: string;
}

export interface RedisFlushStandingsCacheResponse {
  success: boolean;
  deletedCount: number;
  message: string;
}
