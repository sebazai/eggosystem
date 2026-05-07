---
name: scope-request-to-gitlab-issue
description: Turns a vague product request into a well-scoped GitLab issue via intake_bot (AskQuestion, ACs). Stops at issue creation — run gitlab-issue-dag-orchestration next. Optional command wrappers live under .cursor/commands and .claude/commands.
disable-model-invocation: true
---

# Scope request → GitLab issue (DAG intake)

**Client wrappers:** Optional pointer files may exist under `.cursor/commands/` / `.claude/commands/`. Prefer this skill name in docs and agent instructions.

**Canonical copy:** `.cursor/skills/scope-request-to-gitlab-issue/SKILL.md`; mirror: `.claude/skills/scope-request-to-gitlab-issue/SKILL.md`.

## How to invoke

- **Via client wrapper (if present):** pass the entire request as `$ARGUMENTS`.
- **Via skill name:** paste the **full request text** — same semantics as **`$ARGUMENTS`**.

**Agent spec:** **`/workspace/.cursor/agents/intake_bot.md`**

**Envelope contract:** **`/workspace/.cursor/skills/json-handoff/SKILL.md`**

**GitLab MCP:** Use your session’s GitLab MCP tool names (`project`/`project_id`, `create_issue_note`, etc.); examples in older docs may say `mcp__gitlab_mcp__*` vs `mcp__GitLab__*` — substitute per schema.

---

# Playbook

Entry point when you **do not yet have** a GitLab issue. Spawn **`intake_bot`** once, render the envelope, stop. Never auto-chain into DAG orchestration — the human reviews the issue first.

**Orchestrator role:** Validate input → derive project → **`Task(intake_bot)`** → render — you are NOT `intake_bot`.

---

## Phase 0 — Preparation

1. Refuse if the request (`$ARGUMENTS`) is empty or under **10** characters:

   `"Describe what you want in a sentence or two — e.g. run scope-request-to-gitlab-issue with: add a stream-url card to the dashboard."`

2. Derive `<group/project>` from `rtk git remote -v`.

3. Print a status card:

```
scope-request-to-gitlab-issue
Project: <group/project>
Request: <first 80 chars of $ARGUMENTS>...
Phase: 0 → preparation OK
```

---

## Phase 1 — Spawn intake_bot

```
Task(subagent_type=intake_bot,
     prompt="Read /workspace/.cursor/agents/intake_bot.md. Scope this request into a GitLab issue in project <group/project>. Request: <full $ARGUMENTS>. Return ONLY the JSON envelope.")
```

Parse per **`json-handoff`**.

### Envelope handling

- `status="ok"` and `payload.ready_for_dag_execute == true` → Phase 2.
- `status="ok"` and `payload.ready_for_dag_execute == false` → render warning ("issue created but not ready for DAG orchestration — check acceptance criteria"), stop.
- `status="blocked"` → print `errors[]` / `hitl_reason`, stop. Do **not** retry.
- `status="stuck"` → treat like `blocked` for this flow.
- `hitl_required=true` → render `hitl_reason`, stop — human revises request and re-runs.

### `AskQuestion` mid-run

`intake_bot` may call `AskQuestion` once — the harness handles it; orchestrator parses only the **final** envelope.

---

## Phase 2 — Render result

On `status="ok"`:

```
✓ Issue created: !<issue_iid> — <title>
  URL:    <issue_url>
  Labels: <labels joined by ", ">
  ACs:    <acceptance_criteria_count>
  Ready:  <ready_for_dag_execute>

Next: gitlab-issue-dag-orchestration <issue_iid>
```

On `hitl_required=true`:

```
⚠ Need more info before creating the issue:
  <hitl_reason>

Re-run this skill with a more specific request, or open the issue manually in GitLab.
```

---

## Reference — flow diagram

```
human ─► scope-request-to-gitlab-issue <request>
        │
        ▼
   orchestrator  (validate, derive project)
        │
        ▼
   Task(intake_bot)
        │
        ├─ AskQuestion (≤ 1 round)
        │
        └─ create_issue (+ labels)
        │
        ▼
   envelope → render summary, STOP
        │
        ▼
   human ─► gitlab-issue-dag-orchestration <iid>
```

---

## Forbidden (orchestrator-level)

- Editing repo files yourself.
- Spawning any agent other than **`intake_bot`**.
- Auto-running **`gitlab-issue-dag-orchestration`** after issue creation.
- Looping **`intake_bot`** after `blocked`/`stuck` — re-run is the human’s choice.

---

## When to use vs alternatives

| Entry point                          | When                                             |
| ------------------------------------ | ------------------------------------------------ |
| **`scope-request-to-gitlab-issue`**  | Idea only; conversational scoping to a new issue |
| **`gitlab-issue-dag-orchestration`** | Issue already exists with acceptance criteria    |
