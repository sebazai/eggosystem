import { type Response, type NextFunction } from "express";
import {
  getOrganizerActiveSeasonForAppId,
  getOrganizerActiveOrLatestSeasonForAppId
} from "../models/season.models";
import {
  type RequestWithParamsAndQuery,
  type RequestWithParams
} from "@eggosystem/types";
import { getOrganizerByIdOrFail } from "../models/organizer.models";
import _ from "lodash";
import { BadRequestError, NotFoundError } from "../utils/errors";

export const getActiveSeasonForApp = async (
  req: RequestWithParamsAndQuery<
    { app_id: string; organizer_id: string },
    { gametype?: string }
  >,
  res: Response,
  next: NextFunction
) => {
  const app_id = Number(req.params.app_id);
  const organizer_id = Number(req.params.organizer_id);
  const gametype = req.query.gametype ?? defaultGameTypeForAppId(app_id);
  const activeSeason = await getOrganizerActiveOrLatestSeasonForAppId(
    organizer_id,
    app_id,
    gametype
  );
  if (!activeSeason) {
    return next(
      new NotFoundError(
        `No active season found for app ${app_id} and organizer ${organizer_id}`
      )
    );
  }
  res.json(activeSeason);
};

export const getActiveSignupOrActiveSeasonForAppController = async (
  req: RequestWithParamsAndQuery<
    { app_id: string; organizer_id: string },
    { gametype?: string }
  >,
  res: Response,
  next: NextFunction
) => {
  const app_id = Number(req.params.app_id);
  const organizer_id = Number(req.params.organizer_id);
  const gametype = req.query.gametype ?? defaultGameTypeForAppId(app_id);

  if (
    isNaN(app_id) ||
    isNaN(organizer_id) ||
    app_id <= 0 ||
    organizer_id <= 0
  ) {
    return next(
      new BadRequestError(
        `Invalid app ID or organizer ID: app_id=${app_id}, organizer_id=${organizer_id}`
      )
    );
  }

  const ActiveSignupOrActiveSeason = await getOrganizerActiveSeasonForAppId(
    organizer_id,
    app_id,
    gametype
  );
  res.json(ActiveSignupOrActiveSeason ?? null);
};

const defaultGameTypeForAppId = (app_id: number): string | undefined => {
  switch (app_id) {
    case 730:
      return "comp";
    // Add other defaults as needed, or return undefined
    default:
      return undefined;
  }
};

export const redirectToActiveSignup = async (
  req: RequestWithParams<{ app_id: string; organizer_id: string }> & {
    query: { gametype?: string };
  },
  res: Response,
  next: NextFunction
) => {
  const app_id = Number(req.params.app_id);
  const organizer_id = Number(req.params.organizer_id);

  if (
    isNaN(app_id) ||
    isNaN(organizer_id) ||
    app_id <= 0 ||
    organizer_id <= 0
  ) {
    return next(
      new BadRequestError(
        `Invalid app ID or organizer ID: app_id=${app_id}, organizer_id=${organizer_id}`
      )
    );
  }

  const gametype = req.query.gametype ?? defaultGameTypeForAppId(app_id);
  const resolvedGametype = gametype ?? "comp";

  // Get active signup season
  const activeSignupSeason = await getOrganizerActiveSeasonForAppId(
    organizer_id,
    app_id,
    gametype
  );

  if (!activeSignupSeason) {
    return next(
      new NotFoundError(
        `No active signup season found for app ${app_id}, organizer ${organizer_id}, and game type '${resolvedGametype}'`
      )
    );
  }

  // Redirect to frontend signup page
  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl || !frontendUrl.match(/^https:\/\/[a-z0-9.-]+/i)) {
    return next(new Error("Invalid FRONTEND_URL configuration"));
  }

  res.redirect(`${frontendUrl}/seasons/${activeSignupSeason.season_id}/signup`);
};

/**
 * Public GET organizer by id (name + whether it accepts caster applications).
 * Used for caster-application page metadata and validation.
 */
export const getOrganizerByIdPublic = async (
  req: RequestWithParams<{ organizer_id: string }>,
  res: Response,
  next: NextFunction
) => {
  const organizer_id = Number(req.params.organizer_id);
  if (isNaN(organizer_id) || organizer_id <= 0) {
    return next(new BadRequestError("Invalid organizer ID"));
  }
  const organizer = await getOrganizerByIdOrFail(organizer_id);
  res.json({
    id: organizer.id,
    name: organizer.name,
    accepts_caster_applications: Boolean(organizer.discord_guild_id)
  });
};
