import { type Request, type Response, type NextFunction } from "express";
import {
  getCasterDefaultUrl,
  setCasterDefaultUrl,
  deleteCasterDefaultUrl
} from "../models/caster-urls.models";
import type { RequestWithBody } from "@eggosystem/types";
import { BadRequestError } from "../utils/errors";
import { z } from "zod";

const updateDefaultUrlSchema = z.object({
  stream_url: z
    .url("Invalid stream URL format")
    .min(1, "Stream URL is required")
});

export const getCasterDefaultUrlController = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const user = req.auth!; // Middleware ensures this is defined

  const defaultUrl = await getCasterDefaultUrl(user.account_id);

  res.json({
    stream_url: defaultUrl
  });
};

export const updateCasterDefaultUrlController = async (
  req: RequestWithBody<{ stream_url: string }>,
  res: Response,
  _next: NextFunction
) => {
  const user = req.auth!; // Middleware ensures this is defined

  // Validate request body
  updateDefaultUrlSchema.parse(req.body);

  const casterUrl = await setCasterDefaultUrl(
    user.account_id,
    req.body.stream_url
  );

  res.json({
    message: "Default stream URL updated successfully",
    caster_url: casterUrl
  });
};

export const deleteCasterDefaultUrlController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.auth!; // Middleware ensures this is defined

  const deleted = await deleteCasterDefaultUrl(user.account_id);
  if (!deleted) {
    return next(new BadRequestError("No default stream URL to delete"));
  }

  res.json({
    message: "Default stream URL deleted successfully"
  });
};
