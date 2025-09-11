export interface RedisKey {
  key: string;
  type: string;
  value: string | null;
  ttl: number;
}

export interface RedisKeysResponse {
  success: boolean;
  data: string[];
}

export interface RedisKeyDataResponse {
  success: boolean;
  data: RedisKey;
}

export interface RedisDeleteResponse {
  success: boolean;
  message: string;
}
