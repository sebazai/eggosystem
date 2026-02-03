# FACEIT webhook fixtures (2xBO1 integration tests)

Fixtures are **dug from backup**: export from a database that has `FaceitWebhooks` rows for the three 2xBO1 external_match_room_ids.

## Export

From the backend app directory, run:

```bash
pnpm export:faceit-webhook-fixtures
```

Or with ts-node (with DB env vars set):

```bash
cd apps/backend && NODE_ENV=development ts-node scripts/export-faceit-webhook-fixtures.ts
```

The script queries `FaceitWebhooks` for:

- `external_payload_id IN ('1-3e047cf2-6b8f-479b-8a47-7ca122a2116d', '1-d3b5d80b-4319-4eaa-a34c-4fc4d17a8d5f', '1-f55c14a9-b708-4abc-8ffb-be4993e469c1')`
- `retry_count = 0`
- `COALESCE(manual_reprocess, 0) = 0`
- `ORDER BY received_at`

and writes one JSON file per room to this directory: `{external_payload_id}.json`. Each file is an array of `{ event, data, details }` (parsed from the `data` and `details` columns).

If your DB has no such rows (e.g. empty or different backup), restore the backup that contains these webhooks first, then run the export.

## Request body (POST) and required keys per event type

The integration test POSTs each row’s **data** as the webhook body to `POST /api/v1/faceit/webhook`. The route expects the full envelope. Validators live in `@eggosystem/types` (e.g. `packages/types/src/faceit/webhooks/`). Base shape for all events: **BaseWebhookSchema** + **event** + **payload**.

| Event type                   | Required top-level keys                                                                           | Required payload keys (in addition to id, organizer_id, region, game, entity)     |
| ---------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **match_object_created**     | transaction_id, event_id, third_party_id, app_id, timestamp, retry_count, version, event, payload | entity: { id, name, type }, version, created_at, updated_at                       |
| **match_status_configuring** | same                                                                                              | version, entity, teams[], created_at, updated_at                                  |
| **match_status_ready**       | same                                                                                              | version, entity, teams[], created_at, updated_at                                  |
| **match_status_finished**    | same                                                                                              | version, entity, teams[], created_at, updated_at, **started_at**, **finished_at** |
| **match_demo_ready**         | same                                                                                              | entity, created_at, updated_at, version, **demo_url**, teams[]                    |

- **entity**: `{ id, name, type }` with `type === "championship"` for these tests.
- **BaseWebhookSchema**: transaction_id, event_id, third_party_id, app_id, timestamp, retry_count, version.
- For **match_status_finished** forfeit path the route uses **validateMatchStatusFinishedAfterAbortWebhook**; `started_at === "1970-01-01T00:00:00Z"` implies forfeit.

Exported fixture **data** from backup already contains these keys; the test uses parsed JSON of `data` as the POST body only.
