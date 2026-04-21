import type { Response, NextFunction } from "express";
import type { Request } from "express";
import { getCachedGroupedPublicSponsors } from "../services/marketing-sponsors.services";

/**
 * GET /api/v1/sponsors — public, grouped marketing sponsors for frontpage/footer.
 */
export const getPublicMarketingSponsorsController = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const data = await getCachedGroupedPublicSponsors();
  res.setHeader("Cache-Control", "public, max-age=300");
  res.status(200).json(data);
};
