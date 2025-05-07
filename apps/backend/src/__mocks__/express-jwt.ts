import type { UserPayload } from "@eggosystem/types";
import type { Request, Response, NextFunction } from "express";

type ExpressJwtMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;

export const expressjwt = jest.fn((): ExpressJwtMiddleware => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.authorization === "Bearer valid_token") {
      req.auth = {
        provider_id: "76561198049745649",
        nickname: "subu",
        permissions: [],
        roles: [],
        account_id: 1,
        provider: "steam"
      } satisfies UserPayload; // Simulated authenticated user
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  };
});
