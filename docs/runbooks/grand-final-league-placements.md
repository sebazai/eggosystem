# Grand final league placements (1st / 2nd / 3rd)

Operators use this runbook when a league’s **SeasonLeagueTeams.placement** values are missing or wrong after a **manual grand-final demo upload** with `mark_finished: true`, but the grand final is already finished on FACEIT and in our `Matches` table.

Automatic placement assignment runs when:

- FACEIT sends `match_status_finished` for the grand final (group=3, round=1), or
- Staff uploads a demo via `POST /api/v1/dashboard/demos/manual/parse-queue` with `mark_finished: true` and the resolved match is the grand final.

If placements were skipped (wrong match id, FACEIT fetch failure, teams not resolved, etc.), use **remediation** below instead of re-uploading the demo.

## Identify affected leagues

1. Confirm the grand final **match** exists and is finished:
   - `Matches.group = 3` and `Matches.round = 1` for that season/league/stage.
   - `Matches.external_match_room_id` matches the FACEIT championship match room.
2. Check placements for the league:
   - `SeasonLeagueTeams` rows for that `season_id` + `league_id` should have `placement` **1**, **2**, and **3** for winner, GF loser, and LB-final loser (3rd may be null if there is no lower-bracket final in the bracket).
3. Typical symptoms:
   - Grand final demo was uploaded manually; `mark_finished` applied but `placements.applied` was false in the parse-queue response.
   - Historical cases before the automatic placement fix (issue #383).

## Remediation: replay grand-final placements

**Endpoint:** `POST /api/v1/dashboard/demos/placements/replay-grand-final`  
**Auth:** dashboard staff with `admin` or `helpdesk` (same as other `/demos` routes).

Provide **exactly one** of:

| Field                    | Use when                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `match_id`               | You know the internal `Matches.id` for the grand final (must be group=3, round=1).                           |
| `external_match_room_id` | You have the FACEIT match room id (hub may have multiple `Matches` rows; the handler picks the grand final). |

The handler re-fetches FACEIT match results and writes placements via the same logic as the webhook/manual path. It is **idempotent**: re-running overwrites `SeasonLeagueTeams.placement` for 1st/2nd/3rd.

### Example: by internal match id

```bash
curl -sS -X POST "${API_BASE}/api/v1/dashboard/demos/placements/replay-grand-final" \
  -H "Authorization: Bearer ${STAFF_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"match_id": 12345}'
```

### Example: by FACEIT match room id

```bash
curl -sS -X POST "${API_BASE}/api/v1/dashboard/demos/placements/replay-grand-final" \
  -H "Authorization: Bearer ${STAFF_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"external_match_room_id": "1-abc123-def456-7890"}'
```

### Response (200)

```json
{
  "applied": true,
  "season_id": 17,
  "league_id": 3,
  "stage_id": 2,
  "external_match_room_id": "1-abc123-def456-7890",
  "placements": [
    { "team_id": 101, "placement": 1 },
    { "team_id": 102, "placement": 2 },
    { "team_id": 103, "placement": 3 }
  ],
  "skipped_reason": null
}
```

When `applied` is false, inspect `skipped_reason` (e.g. `faceit_fetch_failed`, `teams_not_resolved`, `not_grand_final`) and fix upstream data before retrying.

## When to use manual demo upload instead

Use `POST /api/v1/dashboard/demos/manual/parse-queue` with `mark_finished: true` when you still need to:

- Enqueue demo parsing / stats ingestion, or
- Mark hub matches finished and trigger placements in one step for a **new** upload.

Use **replay-grand-final** when the match is already finished and demos are already processed; you only need to **restore league placements**.
