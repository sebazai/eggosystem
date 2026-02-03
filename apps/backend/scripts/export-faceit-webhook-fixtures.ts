#!/usr/bin/env node

/**
 * Export FACEIT webhook fixtures for the three 2xBO1 external_match_room_ids.
 * Use when DB (or restored backup) has FaceitWebhooks rows for these rooms.
 *
 * Usage (from repo root or apps/backend):
 *   pnpm --filter=backend export:faceit-webhook-fixtures
 *   cd apps/backend && pnpm export:faceit-webhook-fixtures
 */

import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}
if (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test") {
  dotenv.config({ path: [".env.development", ".env"], quiet: true });
}

import { runQuery } from "../src/db/mysqlRunQuery";

const ROOM_IDS = [
  "1-3e047cf2-6b8f-479b-8a47-7ca122a2116d",
  "1-d3b5d80b-4319-4eaa-a34c-4fc4d17a8d5f",
  "1-f55c14a9-b708-4abc-8ffb-be4993e469c1"
] as const;

const FIXTURES_DIR = path.join(
  __dirname,
  "../src/routes/v1/fixtures/faceit-webhooks"
);

interface WebhookRow {
  external_payload_id: string;
  event: string;
  received_at: string;
  data: string;
  details: string | null;
}

async function main(): Promise<void> {
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }

  const placeholders = ROOM_IDS.map(() => "?").join(", ");
  const rows = await runQuery<WebhookRow[]>(
    `SELECT external_payload_id, event, received_at, data, details
     FROM FaceitWebhooks
     WHERE external_payload_id IN (${placeholders})
       AND retry_count = 0
       AND COALESCE(manual_reprocess, 0) = 0
     ORDER BY external_payload_id, received_at`,
    [...ROOM_IDS]
  );

  const byRoom = new Map<
    string,
    Array<{ event: string; data: unknown; details: unknown }>
  >();
  for (const row of rows) {
    const payloadId = row.external_payload_id;
    if (!byRoom.has(payloadId)) {
      byRoom.set(payloadId, []);
    }
    const data = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
    const details =
      row.details == null
        ? null
        : typeof row.details === "string"
          ? JSON.parse(row.details)
          : row.details;
    byRoom.get(payloadId)!.push({ event: row.event, data, details });
  }

  for (const roomId of ROOM_IDS) {
    const list = byRoom.get(roomId) ?? [];
    const outPath = path.join(FIXTURES_DIR, `${roomId}.json`);
    fs.writeFileSync(outPath, JSON.stringify(list, null, 2), "utf8");
    console.warn(`Wrote ${list.length} webhooks to ${outPath}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
