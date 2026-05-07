---
name: analyze-merged-merge-request-health
description: Read-only post-merge audit of a merged GitLab MR — observer_bot scans CI pipelines, optional Grafana/Sentry, git revert signals. Off the DAG orchestration critical path. Optional command wrappers under .cursor/commands and .claude/commands.
disable-model-invocation: true
---

# Analyze merged MR health (`observer_bot`)

**Client wrappers:** Optional pointer files may exist under `.cursor/commands/` / `.claude/commands/`. Prefer this skill name in docs.

**Canonical copy:** `.cursor/skills/analyze-merged-merge-request-health/SKILL.md`; mirror: `.claude/skills/analyze-merged-merge-request-health/SKILL.md`.

## How to invoke

- Provide **merged** MR IID as the first token.
- Optional: `grafana_url`, `sentry_url` as second and third tokens (same semantics as **`$ARGUMENTS`** when using a client wrapper).

**Agent spec:** **`/workspace/.cursor/agents/observer_bot.md`**

**Envelope:** **`/workspace/.cursor/skills/json-handoff/SKILL.md`**

**GitLab MCP:** Use your session’s tool to fetch the MR (**`get_merge_request`**, etc. — parameter names `project` vs `project_id` vary by MCP).

---

# Playbook

Spawn **`observer_bot`** only for **already merged** MRs. Separate from **`gitlab-issue-dag-orchestration`**; run manually or schedule.

---

## Steps

1. Parse arguments — refuse if MR IID missing.
2. Derive `<group/project>` from `rtk git remote -v`.
3. Load the MR via GitLab MCP; ensure **`state == "merged"`**. If not merged → `"MR is not merged; observability runs post-merge only"` and stop.
4. Spawn **`observer_bot`**:

```
Task(subagent_type=observer_bot,
     prompt="Read /workspace/.cursor/agents/observer_bot.md. Analyze post-merge health for MR !<mr_iid> in project <group/project>. grafana_url=<grafana_url|null>. sentry_url=<sentry_url|null>. Return ONLY the JSON envelope.")
```

5. Parse the envelope.

6. Render:

```
Observability for MR !<mr_iid>: <status>
Anomalies (<n>):
  - [<severity>] <description> (source: <source>)
Followups (<n>):
  - <recommendation>
```

7. If `payload.status == "issue_detected"` AND any anomaly is **`severity: "high"`** → offer a follow-up GitLab issue via **`AskQuestion`** only — never auto-create.

---

## Forbidden

- Editing repo files.
- Mutating GitLab (issues/MRs/pipelines) from this playbook.
- Running against an **unmerged** MR.
- Auto-creating follow-up issues without human confirmation.
