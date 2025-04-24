import type { Request, Response, NextFunction } from "express";

type AuthMiddleware = (req: Request, res: Response, next: NextFunction) => void;

const passportMock = {
  use: jest.fn(), // Mock passport.use to prevent real strategy execution
  authenticate: jest.fn(
    (
      _strategy: string,
      _options: { session: boolean; failureRedirect: string }
    ): AuthMiddleware => {
      return (req: Request, res: Response, next: NextFunction) => {
        if (req.headers.authorization === "Bearer valid_token") {
          req.user = {
            steamId: "76561198049745649",
            displayName: "sububobi"
          };
          return next();
        }
        return next();
      };
    }
  ),
  initialize: jest.fn(
    () => (req: Request, res: Response, next: NextFunction) => next()
  ) // Mock passport.initialize()
};

export default passportMock;
