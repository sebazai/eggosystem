import "express";
import { type ParsedParams } from "@eggosystem/types";
import { type JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      parsedParams: ParsedParams;
      auth?: JwtPayload;
    }
  }
}
