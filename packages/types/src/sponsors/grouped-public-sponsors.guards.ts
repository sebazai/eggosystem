import type {
  GameWideMarketingSponsorsResponse,
  GroupedPublicSponsors,
  PublicMarketingSponsor
} from "./PublicMarketingSponsor.interface";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPositiveIntegerId(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isNonNegativeIntegerOrder(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    Number.isFinite(value) &&
    value >= 0
  );
}

function isStringOrNull(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

/**
 * Runtime validation for public sponsor rows (Redis cache, edge fetch).
 */
export function isPublicMarketingSponsor(
  value: unknown
): value is PublicMarketingSponsor {
  if (!isRecord(value)) {
    return false;
  }
  if (!isPositiveIntegerId(value["id"])) {
    return false;
  }
  if (typeof value["display_name"] !== "string") {
    return false;
  }
  if (!isNonNegativeIntegerOrder(value["display_order"])) {
    return false;
  }
  if (!isStringOrNull(value["external_url"])) {
    return false;
  }
  if (!isStringOrNull(value["image_phash"])) {
    return false;
  }
  if (!isStringOrNull(value["footer_image_phash"])) {
    return false;
  }
  return true;
}

export function isPublicMarketingSponsorList(
  value: unknown
): value is PublicMarketingSponsor[] {
  return (
    Array.isArray(value) &&
    value.every((item) => isPublicMarketingSponsor(item))
  );
}

/**
 * Validates grouped public sponsors payloads (e.g. Redis JSON, public API body).
 */
export function isGroupedPublicSponsors(
  value: unknown
): value is GroupedPublicSponsors {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isPublicMarketingSponsorList(value["game_wide_sponsors"]) &&
    isPublicMarketingSponsorList(value["main_partners"]) &&
    isPublicMarketingSponsorList(value["supporting_organizations"])
  );
}

export function isGameWideMarketingSponsorsResponse(
  value: unknown
): value is GameWideMarketingSponsorsResponse {
  if (!isRecord(value)) {
    return false;
  }
  return isPublicMarketingSponsorList(value["sponsors"]);
}
