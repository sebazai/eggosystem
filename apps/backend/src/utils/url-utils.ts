import { BadRequestError } from "./errors";

/** Absolute http(s) URL, or null if empty; undefined passes through. */
export function normalizeExternalUrl(
  raw: string | null | undefined
): string | null | undefined {
  if (raw === undefined) {
    return undefined;
  }
  if (raw === null) {
    return null;
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (!URL.canParse(trimmed)) {
    throw new BadRequestError("external_url must be a valid absolute URL");
  }
  const url = new URL(trimmed);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new BadRequestError("external_url must use http or https");
  }
  return trimmed;
}
