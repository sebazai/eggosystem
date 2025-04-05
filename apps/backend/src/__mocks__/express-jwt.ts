import type { Request, Response, NextFunction } from "express";

type ExpressJwtMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void;

export const expressjwt = jest.fn((): ExpressJwtMiddleware => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.authorization === "Bearer valid_token") {
      req.auth = { steamId: "76561198049745649", displayName: "subu" }; // Simulated authenticated user
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  };
});
