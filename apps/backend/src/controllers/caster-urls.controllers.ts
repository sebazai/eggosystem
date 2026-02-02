import { type Request, type Response, type NextFunction } from "express";
import {
  getCasterDefaultUrl,
  getCasterUrls,
  addCasterUrl,
  deleteCasterUrlById,
  setCasterDefaultUrlById,
  setCasterDefaultUrl,
  deleteCasterDefaultUrl
} from "../models/caster-urls.models";
import type { RequestWithBody, RequestWithParams } from "@eggosystem/types";
import { BadRequestError, NotFoundError } from "../utils/errors";
import { z } from "zod";

const updateDefaultUrlSchema = z.object({
  stream_url: z
    .url("Invalid stream URL format")
    .min(1, "Stream URL is required")
});

const addUrlSchema = z.object({
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

export const getCasterUrlsController = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const user = req.auth!; // Middleware ensures this is defined

  const urls = await getCasterUrls(user.account_id);

  res.json({ urls });
};

export const addCasterUrlController = async (
  req: RequestWithBody<{ stream_url: string }>,
  res: Response,
  _next: NextFunction
) => {
  const user = req.auth!; // Middleware ensures this is defined

  addUrlSchema.parse(req.body);

  const casterUrl = await addCasterUrl(user.account_id, req.body.stream_url);

  res.status(201).json({
    message: "Stream URL added successfully",
    caster_url: casterUrl
  });
};

export const deleteCasterUrlController = async (
  req: RequestWithParams<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  const user = req.auth!; // Middleware ensures this is defined
  const id = Number(req.params.id);
  if (Number.isNaN(id) || id <= 0) {
    return next(new BadRequestError("Invalid URL id"));
  }

  const deleted = await deleteCasterUrlById(user.account_id, id);
  if (!deleted) {
    return next(new NotFoundError("Caster URL not found"));
  }

  res.json({
    message: "Stream URL deleted successfully"
  });
};

export const setCasterUrlDefaultController = async (
  req: RequestWithParams<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  const user = req.auth!; // Middleware ensures this is defined
  const id = Number(req.params.id);
  if (Number.isNaN(id) || id <= 0) {
    return next(new BadRequestError("Invalid URL id"));
  }

  const casterUrl = await setCasterDefaultUrlById(user.account_id, id);
  if (!casterUrl) {
    return next(new NotFoundError("Caster URL not found"));
  }

  res.json({
    message: "Default stream URL updated successfully",
    caster_url: casterUrl
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
  _next: NextFunction
) => {
  const user = req.auth!; // Middleware ensures this is defined

  await deleteCasterDefaultUrl(user.account_id);

  res.json({
    message: "Default stream URL cleared successfully"
  });
};
