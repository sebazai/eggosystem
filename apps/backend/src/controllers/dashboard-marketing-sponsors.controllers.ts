import type { Request, Response, NextFunction } from "express";
import { uploadImageToService } from "../services/image-upload.services";
import { validateImageBuffer } from "../utils/file-type-validator";
import { parseBase64ImageData } from "../utils/parse-base64-image-data";
import { normalizeExternalUrl } from "../utils/url-utils";
import {
  BadRequestError,
  InternalServerError,
  NotFoundError
} from "../utils/errors";
import * as sponsorModels from "../models/marketing-sponsor.models";
import { getGameByIdOrFail } from "../models/game.models";
import { invalidatePublicMarketingSponsorsCache } from "../services/marketing-sponsors.services";
import {
  createMarketingSponsorBodySchema,
  patchMarketingSponsorBodySchema,
  reorderMarketingSponsorsBodySchema
} from "../schemas/marketing-sponsor.schemas";

async function uploadMarketingSponsorImageFromPayload(
  image_data: string
): Promise<string> {
  const parsed = parseBase64ImageData(image_data);
  if (!parsed.ok) {
    throw new BadRequestError(parsed.message);
  }
  if (parsed.imageBuffer.length === 0) {
    throw new BadRequestError("Invalid image data");
  }
  const detectedType = await validateImageBuffer(parsed.imageBuffer);
  if (!detectedType) {
    throw new BadRequestError("Invalid image data: unable to detect file type");
  }
  const supportedTypes = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/webp"
  ];
  if (!supportedTypes.includes(detectedType.mime)) {
    throw new BadRequestError(
      `Unsupported image type: ${detectedType.mime}. Supported types: PNG, JPEG, GIF, WebP`
    );
  }
  const imageServiceBaseUrl =
    process.env.IMAGE_SERVICE_URL || "https://imgdev.kanaliiga.fi";
  const imageServiceApiKey = process.env.IMAGE_SERVICE_API_KEY;
  if (!imageServiceApiKey) {
    throw new InternalServerError("Image service API key not configured");
  }
  const uploadResult = await uploadImageToService(
    parsed.imageBuffer,
    parsed.filename,
    imageServiceBaseUrl,
    imageServiceApiKey
  );
  return uploadResult.phash;
}

export const listDashboardMarketingSponsorsController = async (
  _req: Request,
  res: Response,
  _next: NextFunction
): Promise<void> => {
  const sponsors = await sponsorModels.listAllMarketingSponsorsAdmin();
  res.json({ sponsors });
};

export const createDashboardMarketingSponsorController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const parsed = createMarketingSponsorBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return next(parsed.error);
  }

  const externalUrl = normalizeExternalUrl(parsed.data.external_url);
  if (parsed.data.tier === "game_wide") {
    await getGameByIdOrFail(parsed.data.game_id!);
  }
  const displayOrder =
    parsed.data.display_order ??
    (await sponsorModels.getNextDisplayOrderForTier(
      parsed.data.tier,
      parsed.data.tier === "game_wide" ? parsed.data.game_id : undefined
    ));

  const id = await sponsorModels.insertMarketingSponsor({
    tier: parsed.data.tier,
    game_id: parsed.data.tier === "game_wide" ? parsed.data.game_id! : null,
    display_name: parsed.data.display_name,
    external_url: externalUrl === undefined ? null : externalUrl,
    display_order: displayOrder,
    image_phash: null,
    footer_image_phash: null,
    enabled: false
  });

  if (parsed.data.image_data || parsed.data.footer_image_data) {
    try {
      if (parsed.data.image_data) {
        const imagePhash = await uploadMarketingSponsorImageFromPayload(
          parsed.data.image_data
        );
        const updated = await sponsorModels.updateMarketingSponsor(id, {
          image_phash: imagePhash
        });
        if (!updated) {
          await sponsorModels.deleteMarketingSponsor(id);
          return next(
            new InternalServerError(
              "Unable to save sponsor logo; the sponsor was not created"
            )
          );
        }
      }
      if (parsed.data.footer_image_data) {
        const footerPhash = await uploadMarketingSponsorImageFromPayload(
          parsed.data.footer_image_data
        );
        const updatedFooter = await sponsorModels.updateMarketingSponsor(id, {
          footer_image_phash: footerPhash
        });
        if (!updatedFooter) {
          await sponsorModels.deleteMarketingSponsor(id);
          return next(
            new InternalServerError(
              "Unable to save footer logo; the sponsor was not created"
            )
          );
        }
      }
    } catch (err: unknown) {
      await sponsorModels.deleteMarketingSponsor(id);
      if (
        err instanceof BadRequestError ||
        err instanceof InternalServerError ||
        err instanceof NotFoundError
      ) {
        return next(err);
      }
      return next(
        new InternalServerError(
          err instanceof Error ? err.message : "Failed to save sponsor images"
        )
      );
    }
  }

  await invalidatePublicMarketingSponsorsCache();
  res.status(201).json({ id });
};

export const patchDashboardMarketingSponsorController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return next(new BadRequestError("Invalid id"));
  }
  const parsed = patchMarketingSponsorBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return next(parsed.error);
  }

  const data = parsed.data;
  const current = await sponsorModels.getMarketingSponsorAdminById(id);
  if (!current) {
    return next(new NotFoundError("Sponsor not found"));
  }

  const nextTier = data.tier ?? current.tier;
  let nextGameId: number | null = current.game_id;
  if (nextTier !== "game_wide") {
    nextGameId = null;
  } else if (data.game_id !== undefined) {
    nextGameId = data.game_id;
  }
  if (
    nextTier === "game_wide" &&
    (nextGameId === null || nextGameId === undefined)
  ) {
    return next(
      new BadRequestError("game_wide sponsors must have a valid game_id")
    );
  }
  if (nextTier === "game_wide" && nextGameId !== null) {
    await getGameByIdOrFail(nextGameId);
  }

  const hasImageUpload =
    data.image_data !== undefined && data.clear_logo !== true;
  const hasClearLogo = data.clear_logo === true;
  const hasFooterImageUpload =
    data.footer_image_data !== undefined && data.clear_footer_logo !== true;
  const hasClearFooterLogo = data.clear_footer_logo === true;

  const nonImagePatch: Parameters<
    typeof sponsorModels.updateMarketingSponsor
  >[1] = {};

  if (data.display_name !== undefined) {
    nonImagePatch.display_name = data.display_name;
  }
  if (data.display_order !== undefined) {
    nonImagePatch.display_order = data.display_order;
  }
  if (data.enabled !== undefined) {
    nonImagePatch.enabled = data.enabled;
  }
  if (data.tier !== undefined) {
    nonImagePatch.tier = data.tier;
  }
  if (nextGameId !== current.game_id) {
    nonImagePatch.game_id = nextGameId;
  }
  if (data.external_url !== undefined) {
    nonImagePatch.external_url =
      normalizeExternalUrl(data.external_url) ?? null;
  }
  if (hasClearLogo) {
    nonImagePatch.image_phash = null;
  }
  if (hasClearFooterLogo) {
    nonImagePatch.footer_image_phash = null;
  }

  const hasNonImageKeys = Object.keys(nonImagePatch).length > 0;

  if (!hasNonImageKeys && !hasImageUpload && !hasFooterImageUpload) {
    return next(new BadRequestError("No fields to update"));
  }

  if (hasNonImageKeys) {
    const ok = await sponsorModels.updateMarketingSponsor(id, nonImagePatch);
    if (!ok) {
      return next(new NotFoundError("Sponsor not found"));
    }
  }

  if (hasImageUpload && data.image_data !== undefined) {
    const imagePhash = await uploadMarketingSponsorImageFromPayload(
      data.image_data
    );
    const ok = await sponsorModels.updateMarketingSponsor(id, {
      image_phash: imagePhash
    });
    if (!ok) {
      return next(new NotFoundError("Sponsor not found"));
    }
  }

  if (hasFooterImageUpload && data.footer_image_data !== undefined) {
    const footerPhash = await uploadMarketingSponsorImageFromPayload(
      data.footer_image_data
    );
    const ok = await sponsorModels.updateMarketingSponsor(id, {
      footer_image_phash: footerPhash
    });
    if (!ok) {
      return next(new NotFoundError("Sponsor not found"));
    }
  }
  await invalidatePublicMarketingSponsorsCache();
  res.json({ ok: true });
};

export const deleteDashboardMarketingSponsorController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return next(new BadRequestError("Invalid id"));
  }
  const deleted = await sponsorModels.deleteMarketingSponsor(id);
  if (!deleted) {
    return next(new NotFoundError("Sponsor not found"));
  }
  await invalidatePublicMarketingSponsorsCache();
  res.status(204).end();
};

export const reorderDashboardMarketingSponsorsController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const parsed = reorderMarketingSponsorsBodySchema.safeParse(req.body);
  if (!parsed.success) {
    return next(parsed.error);
  }
  const { tier, ordered_ids, game_id: scopeGameId } = parsed.data;
  const all = await sponsorModels.listAllMarketingSponsorsAdmin();
  const tierIds = new Set(
    all
      .filter(
        (s) =>
          s.tier === tier && (tier !== "game_wide" || s.game_id === scopeGameId)
      )
      .map((s) => s.id)
  );
  if (ordered_ids.length !== tierIds.size) {
    return next(
      new BadRequestError(
        "ordered_ids must list every sponsor in the tier exactly once"
      )
    );
  }
  for (const oid of ordered_ids) {
    if (!tierIds.has(oid)) {
      return next(
        new BadRequestError("ordered_ids contains an id not in this tier")
      );
    }
  }
  await sponsorModels.reorderMarketingSponsorsInTier(
    tier,
    ordered_ids,
    tier === "game_wide" ? scopeGameId : undefined
  );
  await invalidatePublicMarketingSponsorsCache();
  res.json({ ok: true });
};
