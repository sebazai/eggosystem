import { type Request, type Response, type NextFunction } from "express";
import {
  getCasterDefaultUrl,
  setCasterDefaultUrl,
  deleteCasterDefaultUrl
} from "../models/caster-urls.models";
import type { RequestWithBody } from "@eggosystem/types";
import {
  BadRequestError,
  UnauthorizedError,
  ForbiddenError
} from "../utils/errors";
import { getRolesForAccountId } from "../services/auth.services";
import { z } from "zod";

const updateDefaultUrlSchema = z.object({
  default_stream_url: z
    .string()
    .url("Invalid stream URL format")
    .min(1, "Stream URL is required")
});

export const getCasterDefaultUrlController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.auth;
  if (!user) {
    return next(new UnauthorizedError("Authentication required"));
  }

  // Check if user has caster role
  const userRoles = await getRolesForAccountId(user.account_id);
  if (!userRoles.includes("caster")) {
    return next(new ForbiddenError("Caster role required"));
  }

  try {
    const defaultUrl = await getCasterDefaultUrl(user.account_id);

    res.json({
      default_stream_url: defaultUrl
    });
  } catch (error) {
    return next(error);
  }
};

export const updateCasterDefaultUrlController = async (
  req: RequestWithBody<{ default_stream_url: string }>,
  res: Response,
  next: NextFunction
) => {
  const user = req.auth;
  if (!user) {
    return next(new UnauthorizedError("Authentication required"));
  }

  // Check if user has caster role
  const userRoles = await getRolesForAccountId(user.account_id);
  if (!userRoles.includes("caster")) {
    return next(new ForbiddenError("Caster role required"));
  }

  // Validate request body
  try {
    updateDefaultUrlSchema.parse(req.body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new BadRequestError("Invalid request data"));
    }
    throw error;
  }

  try {
    const casterUrl = await setCasterDefaultUrl(
      user.account_id,
      req.body.default_stream_url
    );

    res.json({
      message: "Default stream URL updated successfully",
      caster_url: casterUrl
    });
  } catch (error) {
    return next(error);
  }
};

export const deleteCasterDefaultUrlController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = req.auth;
  if (!user) {
    return next(new UnauthorizedError("Authentication required"));
  }

  // Check if user has caster role
  const userRoles = await getRolesForAccountId(user.account_id);
  if (!userRoles.includes("caster")) {
    return next(new ForbiddenError("Caster role required"));
  }

  try {
    const deleted = await deleteCasterDefaultUrl(user.account_id);
    if (!deleted) {
      return next(new BadRequestError("No default stream URL to delete"));
    }

    res.json({
      message: "Default stream URL deleted successfully"
    });
  } catch (error) {
    return next(error);
  }
};
