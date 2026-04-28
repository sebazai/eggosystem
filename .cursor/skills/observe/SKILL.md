---
name: observe
description: Post-merge observability for a merged MR — runs observer_bot to scan post-merge CI pipelines, optional Grafana/Sentry, and git log for reverts. Read-only; off the dag-execute critical path.
disable-model-invocation: true
---

# observe (Cursor skill)

Orchestration playbook for **`/observe`**; same behavior as [.claude/commands/observe.md](../../../.claude/commands/observe.md). Under Cursor invoke this skill when you want post-merge analysis.

## How to invoke

Open a Cursor chat and ask the agent to run the **observe** skill for merged MR IID `<mr_iid>`. Optional Grafana and Sentry base URLs may follow.

---

# /observe — Post-merge analysis

Spawn `observer_bot` against an already-merged MR. This is intentionally separate from `/dag-execute`: the pipeline ships without it, but you can run it on demand (or schedule it) to audit a merge's downstream health.

**Arguments**: `$ARGUMENTS`

- 1st token = `<mr_iid>` (required) — a merged MR.
- 2nd token = `<grafana_url>` (optional) — base URL for relevant dashboards.
- 3rd token = `<sentry_url>` (optional) — Sentry project URL.

---

## Mandatory reads

1. `/workspace/.cursor/skills/json-handoff/SKILL.md` — envelope contract.
2. `/workspace/.cursor/agents/observer_bot.md` — the agent's spec.

---

## Process

1. Parse arguments. Refuse to proceed if `<mr_iid>` is missing.
2. Derive `<group/project>` from `rtk git remote -v`.
3. Verify the MR is merged: `mcp__GitLab__get_merge_request(<group/project>, <mr_iid>)` and check `state == "merged"`. If not merged → print "MR is not merged; observability runs post-merge only" and stop.
4. Spawn the observer:

```
Task(subagent_type=observer_bot,
     prompt="Read /workspace/.cursor/agents/observer_bot.md. Analyze post-merge health for MR !<mr_iid> in project <group/project>. grafana_url=<grafana_url|null>. sentry_url=<sentry_url|null>. Return ONLY the JSON envelope.")
```

5. Parse the envelope.
6. Render the result for the human:

```
Observability for MR !<mr_iid>: <status>
Anomalies (<n>):
  - [<severity>] <description> (source: <source>)
Followups (<n>):
  - <recommendation>
```

7. If `payload.status == "issue_detected"` AND any anomaly is `severity: "high"`:
   - Offer to open a follow-up GitLab issue (don't auto-create — ask first via `AskQuestion`).

---

## Forbidden

- Editing files.
- Mutating GitLab (issues, MRs, pipelines).
- Calling observer for an unmerged MR.
- Auto-creating follow-up issues without human confirmation.
