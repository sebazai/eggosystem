---
name: dag-plan
description: Conversational scoping for the DAG pipeline. Spawns intake_bot to turn an ambiguous request into a well-scoped GitLab issue with acceptance criteria. Stops at issue creation; you run /dag-execute <iid> next.
disable-model-invocation: true
---

# dag-plan (Cursor skill)

Scoping playbook for **`/dag-plan`**; same behavior as [.claude/commands/dag-plan.md](../../../.claude/commands/dag-plan.md). Under Cursor this skill is the user-invoked entry point.

## How to invoke

```
/dag-plan add a stream-url card to the dashboard so users can copy their link
```

The whole text after `/dag-plan ` is the request.

## What it does

1. Reads `/workspace/.cursor/skills/json-handoff/SKILL.md` for the envelope contract.
2. Validates input (≥10 chars).
3. Derives `<group/project>` from `rtk git remote -v`.
4. Spawns `intake_bot` once with the request.
5. Renders the resulting GitLab issue summary and stops.

## Sequence

```
human ─► /dag-plan <request>
        │
        ▼
   orchestrator
        │  (validate, derive project)
        ▼
   Task(intake_bot, request, project)
        │
        ├─ AskQuestion (≤ 1 round) ◄──── human clarifies
        │
        ├─ Grep/Glob (cheap codebase sanity check, optional)
        │
        ├─ list_labels / create_label (if needed)
        │
        ├─ create_issue
        │
        ▼
   envelope: { issue_iid, issue_url, labels, ACs, ready }
        │
        ▼
   render summary, stop
        │
        ▼
   human ─► /dag-execute <issue_iid>   (separate run)
```

## Envelope expectations (`intake_bot.payload`)

```json
{
  "issue_iid": 247,
  "issue_url": "https://gitlab.com/<group>/<project>/-/issues/247",
  "title": "Add stream-url card to dashboard",
  "labels": ["feat", "frontend"],
  "acceptance_criteria_count": 3,
  "ready_for_dag_execute": true,
  "next_command": "/dag-execute 247"
}
```

`ready_for_dag_execute=true` requires:

- Title set
- `## Acceptance criteria` section with ≥1 unchecked checkbox
- No `needs-human-decision` label

## HITL handling

- `intake_bot` may call `AskQuestion` ONCE during its run for ambiguity reduction. The harness handles the round-trip transparently.
- If after that the agent still can't scope cleanly, it returns `hitl_required=true` with `hitl_reason`. The orchestrator surfaces it and stops — the human revises the request and re-runs `/dag-plan`.

## Forbidden

- Spawning any other agent.
- Auto-chaining into `/dag-execute` — always a separate human-initiated step.
- Looping `intake_bot` on blocked/stuck — re-run is the human's choice.

## When to use

| Entry point           | When                                                          |
| --------------------- | ------------------------------------------------------------- |
| `/dag-plan <request>` | You have an idea but no GitLab issue. Conversational scoping. |
| `/pm-plan` (legacy)   | Multi-round scoping with `pm_bot`.                            |
| `/dag-execute <iid>`  | Issue already exists with acceptance criteria. Skip scoping.  |

`/dag-plan` and `/pm-plan` produce equivalent GitLab issues; `/dag-execute` works against either.
