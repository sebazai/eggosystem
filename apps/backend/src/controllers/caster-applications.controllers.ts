import type { Request, Response, NextFunction } from "express";
import type { RequestWithBody, RequestWithParams } from "@eggosystem/types";
import {
  createCasterApplication,
  getCasterApplicationByAccountAndOrganizer,
  getCasterApplicationsByAccountId,
  getAllCasterApplications,
  approveCasterApplication,
  rejectCasterApplication,
  getPendingApplicationsCount,
  getOrganizersWithCasterApplications,
  getCasterApplicationById
} from "../models/caster-applications.models";
import { getOrganizerByIdOrFail } from "../models/organizer.models";
import {
  getAccountById,
  getNicknameByAccountId,
  hasSteamLinked
} from "../models/account.models";
import {
  getDiscordInfoByAccountId,
  getDiscordIdByAccountId
} from "../models/discord.models";
import { userHasRole } from "../models/account-roles.models";
import {
  getCasterDefaultUrl,
  setCasterDefaultUrl
} from "../models/caster-urls.models";
import {
  assignCasterRoleInDiscord,
  notifyNewCasterApplicationInDiscord,
  notifyCasterApprovedInDiscord,
  notifyCasterRejectedInDiscord
} from "../services/discord-organizer.services";
import {
  sendCasterApprovalEmail,
  sendCasterRejectionEmail
} from "../services/email.services";
import {
  casterApplicationSubmitBodySchema,
  casterApplicationRejectBodySchema
} from "../schemas/caster-applications.schemas";
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError
} from "../utils/errors";

export const submitCasterApplicationController = async (
  req: RequestWithParams<{ organizer_id: string }> & Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const accountId = req.auth?.account_id;
  if (!accountId) {
    next(new BadRequestError("Unauthorized"));
    return;
  }
  const organizerId = Number(req.params.organizer_id);
  if (Number.isNaN(organizerId) || organizerId < 1) {
    next(new BadRequestError("Invalid organizer_id"));
    return;
  }
  const parsed = casterApplicationSubmitBodySchema.safeParse(req.body);
  if (!parsed.success) {
    const messages = parsed.error.issues
      .map((i: { message?: string }) => i.message)
      .join("; ");
    next(new BadRequestError(messages));
    return;
  }
  const { caster_url, approved_terms_and_conditions } = parsed.data;

  try {
    const organizer = await getOrganizerByIdOrFail(organizerId);
    if (!organizer.discord_guild_id) {
      next(
        new BadRequestError("Organizer does not support caster applications")
      );
      return;
    }
    const account = await getAccountById(accountId);
    if (!account.work_email_verified) {
      next(new BadRequestError("Verify your work email before applying"));
      return;
    }
    const discordInfo = await getDiscordInfoByAccountId(accountId);
    if (!discordInfo) {
      next(new BadRequestError("Link your Discord account before applying"));
      return;
    }
    const steamLinked = await hasSteamLinked(accountId);
    if (!steamLinked) {
      next(new BadRequestError("Link your Steam account before applying"));
      return;
    }
    const hasCaster = await userHasRole(accountId, "caster");
    if (hasCaster) {
      next(new BadRequestError("You already have the caster role"));
      return;
    }
    const existing = await getCasterApplicationByAccountAndOrganizer(
      accountId,
      organizerId
    );
    if (existing && existing.approved_at !== null) {
      next(new BadRequestError("Application already approved"));
      return;
    }
    if (existing && existing.rejected_at === null) {
      next(new BadRequestError("Application already pending"));
      return;
    }

    const application = await createCasterApplication(
      organizerId,
      accountId,
      caster_url,
      approved_terms_and_conditions === true
    );
    const dashboardUrl = process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/dashboard/caster-applications`
      : undefined;
    notifyNewCasterApplicationInDiscord(
      organizerId,
      discordInfo.discordUsername,
      dashboardUrl
    ).catch(() => {});

    res.status(201).json({
      message: "Application submitted",
      application: {
        id: application.id,
        organizer_id: application.organizer_id,
        account_id: application.account_id,
        status: "pending"
      }
    });
  } catch (err) {
    if (err instanceof NotFoundError) next(err);
    else next(err);
  }
};

export const getMyCasterApplicationsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const accountId = req.auth?.account_id;
  if (!accountId) {
    next(new UnauthorizedError("Unauthorized"));
    return;
  }
  const organizerIdParam = req.query.organizer_id;
  const organizerId =
    organizerIdParam !== undefined && organizerIdParam !== ""
      ? Number(organizerIdParam)
      : undefined;
  if (
    organizerId !== undefined &&
    (Number.isNaN(organizerId) || organizerId < 1)
  ) {
    next(new BadRequestError("Invalid organizer_id"));
    return;
  }
  try {
    if (organizerId !== undefined) {
      const app = await getCasterApplicationByAccountAndOrganizer(
        accountId,
        organizerId
      );
      res.json({
        applications: app ? [app] : []
      });
    } else {
      const applications = await getCasterApplicationsByAccountId(accountId);
      res.json({ applications });
    }
  } catch (err) {
    next(err);
  }
};

export const getOrganizersWithCasterApplicationsController = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const organizers = await getOrganizersWithCasterApplications();
    res.json({ organizers });
  } catch (err) {
    next(err);
  }
};

export const getCasterApplicationsByOrganizerController = async (
  req: RequestWithParams<{ organizer_id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const organizerId = Number(req.params.organizer_id);
  if (Number.isNaN(organizerId) || organizerId < 1) {
    next(new BadRequestError("Invalid organizer_id"));
    return;
  }
  try {
    await getOrganizerByIdOrFail(organizerId);
    const applications = await getAllCasterApplications(organizerId);
    res.json({ applications });
  } catch (err) {
    if (err instanceof NotFoundError) next(err);
    else next(err);
  }
};

export const getAllCasterApplicationsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const organizerIdParam = req.query.organizer_id;
  const organizerId =
    organizerIdParam !== undefined && organizerIdParam !== ""
      ? Number(organizerIdParam)
      : undefined;
  if (
    organizerId !== undefined &&
    (Number.isNaN(organizerId) || organizerId < 1)
  ) {
    next(new BadRequestError("Invalid organizer_id"));
    return;
  }
  try {
    const applications = await getAllCasterApplications(organizerId);
    res.json({ applications });
  } catch (err) {
    next(err);
  }
};

export const getPendingCountController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const organizerIdParam = req.query.organizer_id;
  const organizerId =
    organizerIdParam !== undefined && organizerIdParam !== ""
      ? Number(organizerIdParam)
      : undefined;
  if (
    organizerId !== undefined &&
    (Number.isNaN(organizerId) || organizerId < 1)
  ) {
    next(new BadRequestError("Invalid organizer_id"));
    return;
  }
  try {
    const count = await getPendingApplicationsCount(organizerId);
    res.json({ count });
  } catch (err) {
    next(err);
  }
};

export const approveCasterApplicationController = async (
  req: RequestWithParams<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const approvedByAccountId = req.auth?.account_id;
  if (!approvedByAccountId) {
    next(new BadRequestError("Unauthorized"));
    return;
  }
  const applicationId = Number(req.params.id);
  if (Number.isNaN(applicationId) || applicationId < 1) {
    next(new BadRequestError("Invalid application id"));
    return;
  }
  try {
    const application = await getCasterApplicationById(applicationId);
    if (!application) {
      next(new NotFoundError("Application not found"));
      return;
    }
    const organizer = await getOrganizerByIdOrFail(application.organizer_id);
    const updated = await approveCasterApplication(
      applicationId,
      approvedByAccountId
    );
    const discordUserId = await getDiscordIdByAccountId(application.account_id);
    if (organizer.discord_guild_id && discordUserId) {
      assignCasterRoleInDiscord(
        organizer.discord_guild_id,
        discordUserId,
        organizer.discord_caster_role_id
      ).catch(() => {});
    }
    const discordUsername =
      (await getDiscordInfoByAccountId(application.account_id))
        ?.discordUsername ?? null;
    const approvedByNickname =
      (await getNicknameByAccountId(approvedByAccountId)) ?? null;
    const approvedByDisplay =
      approvedByNickname ?? `account_id ${approvedByAccountId}`;
    notifyCasterApprovedInDiscord(
      application.organizer_id,
      discordUsername,
      approvedByDisplay
    ).catch(() => {});

    const account = await getAccountById(application.account_id);
    if (account.work_email) {
      const casterChannelLink =
        organizer.discord_guild_id && organizer.discord_caster_channel_id
          ? `https://discord.com/channels/${organizer.discord_guild_id}/${organizer.discord_caster_channel_id}`
          : null;
      sendCasterApprovalEmail(account.work_email, casterChannelLink).catch(
        () => {}
      );
    }

    if (application.caster_url?.trim()) {
      const existingUrl = await getCasterDefaultUrl(application.account_id);
      if (existingUrl === null) {
        setCasterDefaultUrl(
          application.account_id,
          application.caster_url.trim()
        ).catch(() => {});
      }
    }

    res.json({
      message: "Application approved",
      application: updated
    });
  } catch (err) {
    if (err instanceof NotFoundError) next(err);
    else next(err);
  }
};

export const rejectCasterApplicationController = async (
  req: RequestWithParams<{ id: string }> &
    RequestWithBody<{ rejection_reason: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const rejectedByAccountId = req.auth?.account_id;
  if (!rejectedByAccountId) {
    next(new BadRequestError("Unauthorized"));
    return;
  }
  const applicationId = Number(req.params.id);
  if (Number.isNaN(applicationId) || applicationId < 1) {
    next(new BadRequestError("Invalid application id"));
    return;
  }
  const parsed = casterApplicationRejectBodySchema.safeParse(req.body);
  if (!parsed.success) {
    const messages = parsed.error.issues
      .map((i: { message?: string }) => i.message)
      .join("; ");
    next(new BadRequestError(messages));
    return;
  }
  const { rejection_reason } = parsed.data;
  try {
    const application = await getCasterApplicationById(applicationId);
    if (!application) {
      next(new NotFoundError("Application not found"));
      return;
    }
    const updated = await rejectCasterApplication(
      applicationId,
      rejectedByAccountId,
      rejection_reason
    );
    const discordUsername =
      (await getDiscordInfoByAccountId(application.account_id))
        ?.discordUsername ?? null;
    const rejectedByNickname =
      (await getNicknameByAccountId(rejectedByAccountId)) ?? null;
    const rejectedByDisplay =
      rejectedByNickname ?? `account_id ${rejectedByAccountId}`;
    notifyCasterRejectedInDiscord(
      application.organizer_id,
      discordUsername,
      rejection_reason,
      rejectedByDisplay
    ).catch(() => {});

    const account = await getAccountById(application.account_id);
    if (account.work_email) {
      sendCasterRejectionEmail(account.work_email, rejection_reason).catch(
        () => {}
      );
    }

    res.json({
      message: "Application rejected",
      application: updated
    });
  } catch (err) {
    if (err instanceof NotFoundError) next(err);
    else next(err);
  }
};
