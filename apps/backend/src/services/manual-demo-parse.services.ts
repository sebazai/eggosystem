import { createHash } from "node:crypto";
import { getMatchIdByGameId } from "../models/match-game.models";
import { logger } from "../utils/app-logger";
import { NotFoundError } from "../utils/errors";
import {
  createDemoProcessingRequest,
  publishToParseQueue
} from "./parse-queue.services";

type ManualDemoParseSource = "manual" | "faceit";

const DEMO_URL_PREFIX_LEN = 64;

type DemoUrlLogFingerprint = {
  download_url_prefix: string;
  download_url_sha256_hex: string;
};

/**
 * Safe logging fingerprint for a demo URL (avoid putting full URL in logs).
 */
const fingerprintDemoUrlForLog = (
  downloadUrl: string
): DemoUrlLogFingerprint => {
  const download_url_prefix = downloadUrl.slice(0, DEMO_URL_PREFIX_LEN);
  const download_url_sha256_hex = createHash("sha256")
    .update(downloadUrl, "utf8")
    .digest("hex");
  return { download_url_prefix, download_url_sha256_hex };
};

/**
 * Validates match game then publishes to parse_queue. RabbitMQ failures are not silently treated as
 * success.
 */
export const enqueueManualDashboardDemoParse = async (input: {
  matchGameId: number;
  downloadUrl: string;
  priority: number;
  actorAccountId: number;
  source: ManualDemoParseSource;
  reparse: boolean;
}): Promise<{ match_game_id: number }> => {
  const {
    matchGameId,
    downloadUrl,
    priority,
    actorAccountId,
    source,
    reparse
  } = input;

  const matchRows = await getMatchIdByGameId(matchGameId);
  const matchRow = matchRows[0];
  if (!matchRow?.match_id) {
    throw new NotFoundError("Match game not found");
  }

  const parseMessage = createDemoProcessingRequest(
    matchGameId,
    downloadUrl,
    priority,
    source,
    reparse
  );

  const fingerprint = fingerprintDemoUrlForLog(downloadUrl);
  await publishToParseQueue(parseMessage);
  logger.info("Manual dashboard demo enqueued to parse_queue", {
    actorAccountId,
    matchGameId,
    downloadUrlPrefix: fingerprint.download_url_prefix,
    downloadUrlSha256: fingerprint.download_url_sha256_hex,
    source
  });

  return { match_game_id: matchGameId };
};
