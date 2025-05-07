import "jsonwebtoken";

declare module "jsonwebtoken" {
  export interface JwtPayload {
    account_id: number;
    provider_id: string;
    permissions: string[];
    roles: string[];
    nickname: string;
    provider: "steam";
  }
}
