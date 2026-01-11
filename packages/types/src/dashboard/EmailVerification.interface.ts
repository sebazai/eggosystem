import type { Nullable } from "@eggosystem/types";

export interface EmailVerificationLookupResult {
  accountId: number;
  steamId: string;
  nickname: string;
  workEmail: Nullable<string>;
  workEmailVerified: boolean;
  workEmailToken: Nullable<string>;
  workEmailTokenExpiresAt: Nullable<string>;
  isTokenValid: boolean;
  verificationUrl: Nullable<string>;
}

export interface EmailVerificationRegenerateResponse {
  success: boolean;
  token: string;
  expiresAt: string;
  verificationUrl: string;
}
