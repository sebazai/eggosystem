---
name: json-handoff
description: Shared JSON envelope contract for all DAG-pipeline agents. Every agent return value MUST conform to this schema. The orchestrator (/dag-execute) and downstream agents parse return values strictly — non-conforming output is treated as a stuck task.
---

# JSON Envelope Contract

All agents in the DAG pipeline (`intake_bot`, `product_bot`, `decomposer_bot`, `architect_bot`, `implementer_bot`, `ui_bot`, `adversary_bot`, `code_review_bot`, `final_review_bot`, `devops_bot`, `observer_bot`) return a single JSON object as their final message. No prose before or after. No code fences. Just JSON.

## Envelope

```json
{
  "status": "ok" | "blocked" | "stuck",
  "agent": "<agent_name>",
  "payload": { /* role-specific, see per-agent schemas below */ },
  "hitl_required": false,
  "hitl_reason": null,
  "errors": []
}
```

### Field semantics

- **`status`** —
  - `"ok"` — agent completed its role successfully; `payload` is fully populated.
  - `"blocked"` — input was insufficient or a precondition failed (e.g. issue has `needs-human-decision` label). Orchestrator stops and surfaces `errors[]` to human.
  - `"stuck"` — agent attempted the work but couldn't reach a clean result (e.g. quality gate failed, code review rejected after 3 rounds). Orchestrator decides whether to retry or escalate based on retry counters.
- **`agent`** — exact name of the agent producing the output (matches the `name:` in its frontmatter).
- **`payload`** — role-specific data, schemas below.
- **`hitl_required`** — `true` if the agent is signalling that a human must decide before the pipeline continues.
- **`hitl_reason`** — human-readable explanation when `hitl_required=true`; `null` otherwise.
- **`errors`** — array of `{ code, message, context? }` objects describing failures. Empty when `status="ok"`.

### Strict rules

1. Output **only** the JSON object. No leading/trailing text. No markdown fences. The orchestrator does `JSON.parse(message)` — extra characters break it.
2. `agent` must match the agent's frontmatter `name`. Spoofing another agent's name is a contract violation.
3. When `status != "ok"`, `errors[]` must contain at least one entry.
4. When `hitl_required=true`, `hitl_reason` must be non-null.
5. The orchestrator may render the JSON to GitLab as a prose comment on issues/MRs; agents themselves must NOT post directly to GitLab unless their role explicitly requires it (only `implementer_bot` does — for branch/MR creation).

## Per-agent payload schemas

### `intake_bot.payload`

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

`ready_for_dag_execute` is `true` when title is set, body has `## Acceptance criteria` with ≥1 unchecked checkbox, and the issue does not carry `needs-human-decision`.

### `product_bot.payload`

```json
{
  "stories": [
    {
      "id": "S1",
      "title": "string",
      "description": "string",
      "acceptance_criteria": ["AC-1: ...", "AC-2: ..."]
    }
  ],
  "kpis": ["string"]
}
```

### `decomposer_bot.payload`

```json
{
  "tasks": [
    {
      "id": "T1",
      "title": "string",
      "description": "string",
      "depends_on": [],
      "type": "frontend" | "backend" | "db" | "integration" | "test" | "ui",
      "acceptance_criteria": ["AC-1", "AC-2"],
      "affected_workspace": "backend" | "frontend" | "types" | null
    },
    {
      "id": "T2",
      "title": "string",
      "description": "string",
      "depends_on": ["T1"],
      "implements_after_gates": { "T1": "mr_opened" },
      "type": "frontend" | "backend" | "db" | "integration" | "test" | "ui",
      "acceptance_criteria": ["AC-1", "AC-2"],
      "affected_workspace": "backend" | "frontend" | "types" | null
    }
  ]
}
```

Constraints:

- `id` values are unique across the array.
- Every entry in `depends_on` must reference another task's `id` in the same array.
- DAG must be acyclic. Orchestrator validates this; cycle → `stuck`.
- **`implements_after_gates`** (optional, per-task object) — keys are **upstream** task ids (`depends_on`). Each value sets when **this** task may **leave `pending`** and enter **`/dag-execute` §4a** (worktree bootstrap + implement). Omit a parent key ⇒ **`"completed"`** (backward compatible).
  - **`completed`** — upstream `state=="completed"` (CR + CI green).
  - **`mr_opened`** — upstream in **`review`**, **`ci`**, or **`completed`** (Draft MR exists after adversary; parent CI may still run).
  - **`code_review_ok`** — upstream **`ci`** or **`completed`**.
  - **`branch_published`** — `origin/<upstream.branch>` resolves (risky; use only when decomposition calls for it).

**Phase 5 (`final_review_bot`) still requires every task `completed`**, independent of **`implements_after_gates`**.

### `architect_bot.payload`

```json
{
  "api": [
    {
      "endpoint": "/v1/...",
      "method": "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
      "request": { /* shape */ },
      "response": { /* shape */ },
      "auth": "public" | "user" | "admin",
      "task_ids": ["T1"]
    }
  ],
  "database": [
    {
      "table": "snake_case_name",
      "fields": { "field_name": "type" },
      "migration_strategy": "create" | "alter" | "drop",
      "task_ids": ["T1"]
    }
  ],
  "risks": ["string"]
}
```

### `implementer_bot.payload`

```json
{
  "task_id": "T1",
  "branch": "feat-247-T1-stream-route",
  "base_branch": "development" | "feat-247-T0-...",
  "worktree_path": "/workspace/.worktrees/247-T1",
  "mr_iid": 1234,
  "mr_opened": true,
  "commits": ["abc123", "def456"],
  "gate_output": {
    "format": "pass" | "fail",
    "typecheck": "pass" | "fail",
    "lint": "pass" | "fail",
    "test": "pass" | "fail",
    "knip": "pass" | "fail",
    "e2e": "skipped",
    "adversary_alignment": "pass" | "skipped"
  },
  "summary": "one-line description for the MR title"
}
```

Use `mr_opened=false` (and omit `mr_iid` or set `mr_iid` to `null`) when the orchestrator set **`SkipMergeRequest: true`** for an adversary-loop iteration — quality gates ran and branch pushed, but Draft MR waits until `adversary_bot` approves. Final `implementer_bot` invocation for the task MUST set `mr_opened=true`, `mr_iid`, and gate_output `adversary_alignment`: `"pass"` after adversary approval.

**Orchestrator → prompt (not part of envelope):** pass **`implementer_invocation_index`** on every spawn (increment per `/workspace/.cursor/skills/dag-execute/SKILL.md` Phase 4). **`pnpm install --frozen-lockfile`** followed by **`pnpm build`** runs **only when that index first reaches the worktree** (`== 1`) except manifest/bootstrap exceptions — see **`implementer_bot.md`** **Dependency install**. Phase **4a** runs **`pnpm build`** immediately after **`pnpm install`** at worktree bootstrap.

### `ui_bot.payload`

```json
{
  "components": [
    {
      "name": "string",
      "path": "apps/frontend/src/...",
      "shadcn_used": ["button", "card"]
    }
  ]
}
```

### `code_review_bot.payload`

```json
{
  "task_id": "T1",
  "verdict": "approved" | "rejected",
  "issues": [
    {
      "type": "bug" | "security" | "performance" | "style" | "type_safety",
      "description": "string",
      "severity": "low" | "medium" | "high",
      "file": "apps/backend/src/...",
      "line": 42
    }
  ]
}
```

### `adversary_bot.payload`

```json
{
  "task_id": "T1",
  "verdict": "approved" | "rejected",
  "misalignments": [
    {
      "category": "business_requirement" | "architecture" | "acceptance_criteria" | "project_conventions",
      "description": "string",
      "severity": "low" | "medium" | "high",
      "remediation_hint": "string"
    }
  ]
}
```

### `final_review_bot.payload`

```json
{
  "verdict": "approved" | "rejected",
  "issues": [
    {
      "type": "missing_requirement" | "logic_gap" | "inconsistency",
      "description": "string",
      "severity": "low" | "medium" | "high",
      "task_ids_affected": ["T1", "T2"]
    }
  ]
}
```

### `devops_bot.payload`

```json
{
  "mr_iid": 1234,
  "pipeline_id": 56789,
  "status": "ready" | "failed" | "running",
  "checks": [
    { "name": "build", "result": "pass" | "fail" },
    { "name": "test", "result": "pass" | "fail" }
  ]
}
```

### `observer_bot.payload`

```json
{
  "mr_iid": 1234,
  "status": "healthy" | "issue_detected",
  "anomalies": [
    {
      "description": "string",
      "severity": "low" | "medium" | "high",
      "source": "gitlab_pipeline" | "grafana" | "sentry"
    }
  ],
  "recommended_followups": ["string"]
}
```

## Validation

A PostToolUse hook (`/workspace/.claude/hooks/validate-envelope.sh`) lints subagent output against this schema and warns (does not block) on mismatch. Agents that emit prose alongside JSON, or omit required fields, will trip the warning.
