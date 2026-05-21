import type { Request, Response, NextFunction } from "express";
import { BadRequestError } from "../../utils/errors";
import { logger } from "../../utils/app-logger";
import {
  getSeasonNewsletterEligiblePlayers,
  type NewsletterConsentType
} from "../../models/user-policy-acceptance.models";
import { enqueueBulkNewsletterEmails } from "../../services/newsletter-queue.services";
import type { NewsletterEmailJobData } from "../../services/newsletter-queue.services";

const VALID_CONSENT_TYPES: NewsletterConsentType[] = [
  "newsletter",
  "marketing",
  "both"
];

export const getNewsletterRecipientsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const seasonId = parseInt(req.query.season_id as string, 10);
    const consentType = (req.query.consent_type as string) ?? "newsletter";

    if (!seasonId || isNaN(seasonId)) {
      return next(new BadRequestError("season_id is required"));
    }

    if (!VALID_CONSENT_TYPES.includes(consentType as NewsletterConsentType)) {
      return next(
        new BadRequestError(
          `consent_type must be one of: ${VALID_CONSENT_TYPES.join(", ")}`
        )
      );
    }

    const players = await getSeasonNewsletterEligiblePlayers(
      seasonId,
      consentType as NewsletterConsentType
    );

    res.json({
      count: players.length,
      players: players.slice(0, 10).map((p) => ({
        nickname: p.nickname,
        email: p.email
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const sendNewsletterController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      season_id,
      subject,
      text_content,
      html_content,
      consent_type = "newsletter"
    } = req.body as {
      season_id: number;
      subject: string;
      text_content?: string;
      html_content?: string;
      consent_type?: string;
    };

    if (!season_id || isNaN(Number(season_id))) {
      return next(new BadRequestError("season_id is required"));
    }

    if (!subject?.trim()) {
      return next(new BadRequestError("subject is required"));
    }

    if (!text_content?.trim() && !html_content?.trim()) {
      return next(
        new BadRequestError(
          "At least one of text_content or html_content is required"
        )
      );
    }

    if (!VALID_CONSENT_TYPES.includes(consent_type as NewsletterConsentType)) {
      return next(
        new BadRequestError(
          `consent_type must be one of: ${VALID_CONSENT_TYPES.join(", ")}`
        )
      );
    }

    const players = await getSeasonNewsletterEligiblePlayers(
      Number(season_id),
      consent_type as NewsletterConsentType
    );

    if (players.length === 0) {
      res.json({ enqueued: 0, message: "No eligible recipients found" });
      return;
    }

    const jobs: NewsletterEmailJobData[] = players.map((p) => ({
      to: p.email,
      accountId: p.account_id,
      subject,
      textContent: text_content?.trim() || undefined,
      htmlContent: html_content?.trim() || undefined,
      seasonId: Number(season_id),
      playerNickname: p.nickname
    }));

    const result = await enqueueBulkNewsletterEmails(jobs);

    logger.info(
      `Newsletter enqueued for season ${season_id}: ${result.enqueued} recipients`
    );

    res.json({ enqueued: result.enqueued });
  } catch (error) {
    next(error);
  }
};
