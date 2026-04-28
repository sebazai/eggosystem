---
description: Conversational scoping for the DAG pipeline. Spawns intake_bot to turn an ambiguous request into a well-scoped GitLab issue with acceptance criteria. Stops at issue creation; you run /dag-execute <iid> next.
argument-hint: <free-form description of what you want>
---

# /dag-plan — Scope a request into a GitLab issue

Entry point for the DAG pipeline when you don't yet have a GitLab issue. Drives `intake_bot` to scope the request via `AskQuestion`, drafts a clean issue body with observable acceptance criteria, and creates the issue. The pipeline **stops there** — you review the issue, then run `/dag-execute <iid>` (or stack with `/pm-execute` if you prefer the legacy flow).

**Arguments**: `$ARGUMENTS`
The whole `$ARGUMENTS` string is the human's free-form request (e.g. "add a stream-url card to the dashboard so users can copy their link").

You are NOT `intake_bot`. You only:

1. Validate input.
2. Spawn `intake_bot` once.
3. Render the result.
4. Stop.

---

## Mandatory reads

1. `/workspace/.claude/skills/json-handoff/SKILL.md` — envelope contract.
2. `/workspace/.claude/agents/intake_bot.md` — the agent's spec.

---

## Phase 0 — Preparation

1. Refuse with a friendly message if `$ARGUMENTS` is empty or under 10 chars: "Describe what you want in a sentence or two — e.g. `/dag-plan add a stream-url card to the dashboard`."
2. Derive `<group/project>` from `rtk git remote -v`.
3. Print a status card:

```
/dag-plan
Project: <group/project>
Request: <first 80 chars of $ARGUMENTS>...
Phase: 0 → preparation OK
```

---

## Phase 1 — Spawn intake_bot

```
Task(subagent_type=intake_bot,
     prompt="Read /workspace/.claude/agents/intake_bot.md. Scope this request into a GitLab issue in project <group/project>. Request: <full $ARGUMENTS>. Return ONLY the JSON envelope.")
```

Parse the envelope per `/workspace/.claude/skills/json-handoff/SKILL.md`.

### Envelope handling

- `status="ok"` and `payload.ready_for_dag_execute == true` → render result, stop.
- `status="ok"` and `payload.ready_for_dag_execute == false` → render warning ("issue created but not ready for /dag-execute — check acceptance criteria"), stop.
- `status="blocked"` → print `errors[]` and `hitl_reason`, stop. Do NOT retry — `intake_bot` already had its `AskQuestion` round.
- `status="stuck"` → same as `blocked` for this command (intake either creates an issue or it doesn't).
- `hitl_required=true` → render `hitl_reason` to the human and stop. The human revises the request and re-runs `/dag-plan`.

### `AskQuestion` mid-run

`intake_bot` may call `AskQuestion` once during its run. The harness handles this transparently — your job is only to parse the final envelope.

---

## Phase 2 — Render result

On `status="ok"`, print:

```
✓ Issue created: !<issue_iid> — <title>
  URL:    <issue_url>
  Labels: <labels joined by ", ">
  ACs:    <acceptance_criteria_count>
  Ready:  <ready_for_dag_execute>

Next: /dag-execute <issue_iid>
```

On `hitl_required=true`, print:

```
⚠ Need more info before creating the issue:
  <hitl_reason>

Re-run /dag-plan with a more specific request, or open the issue manually in GitLab.
```

---

## Forbidden (orchestrator-level)

- Editing files yourself.
- Spawning any agent other than `intake_bot`.
- Running `/dag-execute` automatically — that is always a separate human-initiated step. The human gets to review the issue first.
- Looping `intake_bot` if it returns blocked/stuck — re-run is the human's choice.

---

## When to use this vs alternatives

| Entry point           | When                                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `/dag-plan <request>` | You have an idea but no GitLab issue. Want a quick conversational scoping pass.                                    |
| `/pm-plan` (legacy)   | Same as above but want the more thorough `pm_bot` flow with multi-round scoping.                                   |
| `/dag-execute <iid>`  | Issue already exists with acceptance criteria. Skip scoping, go straight to product/decompose/architect/implement. |

`/dag-plan` and `/pm-plan` produce equivalent GitLab issues; pick whichever you prefer for scoping. `/dag-execute` works against either.
