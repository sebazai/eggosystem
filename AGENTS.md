# AGENTS.md — Agentic Workflow Harness

This file is the contract shared by every agent that operates on this repository. It defines the 7 **pipeline** role specialists (plus the Adversary sub-loop), the sandbox they run in, the handoff artifacts between them, and the human-in-the-loop (HITL) gates.

Every specialist **must** read this file and the skill file referenced in its agent definition before taking its first action.

> Enforcement: sandbox rules are applied by Claude Code via per-agent `tools:` frontmatter in [`.claude/agents/`](.claude/agents) plus the `permissions.allow`/`deny` lists in [`.claude/settings.json`](.claude/settings.json). Under Cursor, the same policy is documented in [`.cursor/agents/`](.cursor/agents) but not runtime-enforced; Cursor agents must self-police.

## Mission

Humans discuss a feature or bug with `pm_bot`. The PM scopes it into a GitLab issue with explicit acceptance criteria. `explorer_bot` decomposes it into a technical brief. `ops_bot` creates a worktree + branch and bootstraps it. `worktree_bot` (or the same `pnpm run worktree:ensure` step) verifies that pnpm and `node_modules` in that worktree are not a symlink to another clone—so workspace packages, Husky, and lint-staged resolve correctly. `developer_bot` implements, running the Adversary feedback loop until clean. `ops_bot` commits in chunks, pushes, and opens the MR. If a commit or hook fails, `ops_bot` hands back to `developer_bot`, which must re-run the full `pnpm` quality gates in the same worktree (no `HUSKY=0` or other hook bypass), then `ops_bot` tries again. `review_bot` audits against acceptance criteria. **Humans merge.**

## Pipeline

```mermaid
flowchart LR
    Human["Human (scope / HITL)"] -->|brief| PM[pm_bot]
    PM -->|create_issue| Issue[("GitLab Issue")]
    PM -->|delegate| Explorer[explorer_bot]
    PM -.plan-sprint / backlog-health.-> Duo["gitlab-assistant (Duo)"]
    Explorer -->|"Technical Brief note"| Issue
    Explorer --> Ops[ops_bot]
    Ops -->|worktree + branch| WT[(".worktrees/&lt;type&gt;-&lt;iid&gt;-&lt;slug&gt;")]
    WT --> WTB[worktree_bot]
    WTB -->|pnpm ok| Developer[developer_bot]
    Developer -->|"Write/Edit + pnpm test"| Code
    Developer -->|spawn| Adversary[adversary_bot]
    Adversary -->|"findings JSON"| Developer
    Adversary -. recursive .-> Adversary
    Developer -->|pass| Ops
    Ops -->|commit + push| Branch[(GitLab branch)]
    Ops -->|create_merge_request| MR[(GitLab MR)]
    Ops --> Review[review_bot]
    Review -.review-merge-request.-> Duo
    Review -->|draft notes batch| MR
    Review --> Human
    Human -->|accept + merge| MR
```

## The 7 pipeline specialists

| Role                                               | File             | Writes code                   | Touches git | Spawns                                          | Notes                                                         |
| -------------------------------------------------- | ---------------- | ----------------------------- | ----------- | ----------------------------------------------- | ------------------------------------------------------------- |
| [`pm_bot`](.claude/agents/pm_bot.md)               | Orchestrator     | No                            | No          | Explorer, Ops, worktree, Developer, Review, Duo | Human liaison                                                 |
| [`explorer_bot`](.claude/agents/explorer_bot.md)   | Researcher       | No                            | No          | —                                               | DB MCP readonly, WebSearch/WebFetch                           |
| [`ops_bot`](.claude/agents/ops_bot.md)             | Git + GitLab     | No                            | Yes         | —                                               | Only git-capable agent                                        |
| [`worktree_bot`](.claude/agents/worktree_bot.md)   | Worktree pnpm    | No (install layout only)      | No          | —                                               | Runs `pnpm run worktree:ensure` in the new worktree after Ops |
| [`developer_bot`](.claude/agents/developer_bot.md) | Implementer      | **Yes**                       | No          | Adversary + existing domain bots                | Runs quality gates                                            |
| [`adversary_bot`](.claude/agents/adversary_bot.md) | Hostile reviewer | No (lint/knip/typecheck only) | Read-only   | Adversary (depth ≤ 3)                           | Diff-anchored review; gate before Ops                         |
| [`review_bot`](.claude/agents/review_bot.md)       | PR auditor       | No                            | No          | Duo `review-merge-request`                      | Never approves/merges                                         |

Full policy per role lives in [`.cursor/agents/<role>.md`](.cursor/agents) (policy record) and [`.claude/agents/<role>.md`](.claude/agents) (runtime enforcement).

### Coexistence with existing domain bots

The following pre-existing specialists in [`.cursor/agents/`](.cursor/agents) remain available as **sub-specialists** that `developer_bot` can call via `Task` for domain depth — they are **not** part of the primary workflow:

- `backend_bot`, `frontend_bot`, `designer_bot`, `tester_bot`, `types_bot`, `refactor_bot`, `docs_bot`, `verifier_bot`

Only `developer_bot` may spawn them.

## Design standards gate (frontend diffs)

If the work includes frontend UI changes (especially under `apps/frontend/src/components/**` or `apps/frontend/src/app/**`), `developer_bot` must run a **design standards review** before invoking `adversary_bot` and before handing off to `ops_bot`.

- **Trigger paths** (non-exhaustive):
  - `apps/frontend/src/components/**`
  - `apps/frontend/src/app/**`
  - `apps/frontend/src/styles/**`
  - Tailwind/theme config or global CSS affecting UI tokens
- **Mechanism**:
  - `developer_bot` spawns `designer_bot` via `Task` with:
    - worktree path, issue IID, acceptance criteria
    - list of files changed (or “UI touched under …”)
    - request: “Review diff for design-system compliance per `.cursor/skills/design-review/SKILL.md`”
  - `designer_bot` returns `verdict: pass | needs_changes` and findings.
  - `developer_bot` addresses **blockers** (design-system drift / accessibility regressions) before proceeding to Adversary/Ops.

## Handoff contract

Every stage transition produces a typed artifact. Agents do not begin their stage until the previous artifact exists.

| From → To                    | Artifact                                                                                                                                                                                                                                                                                | Location                        |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Human → PM                   | Natural-language brief                                                                                                                                                                                                                                                                  | Chat                            |
| PM → Explorer                | GitLab issue IID + acceptance criteria                                                                                                                                                                                                                                                  | GitLab issue body               |
| Explorer → Ops               | Issue updated with `## Technical Brief` section (+ optional sub-issue IIDs linked)                                                                                                                                                                                                      | GitLab issue note / description |
| Ops → worktree (readiness)   | After Ops: `{ worktree_path, issue_iid }` + **`CONTEXT.local.md` stub** in the worktree root; `worktree_path` is **canonical** (e.g. `pwd -P`) and matches the file’s worktree field (see [`.cursor/templates/CONTEXT.local.template.md`](.cursor/templates/CONTEXT.local.template.md)) | `ops_bot` Bash in worktree only |
| Orchestrator → Developer     | Filled `CONTEXT.local.md` (acceptance criteria + Technical Brief) **or** the first `developer_bot` prompt contains that text so Developer can `Write` the file                                                                                                                          | Worktree + chat                 |
| worktree → Developer         | `status: "ok"` and `{ worktree_path, issue_iid }` — if `status` is not `ok`, do not start Developer                                                                                                                                                                                     | Tool return value               |
| (same session)               | Developer also needs `branch_name` from the Ops return payload (orchestrator holds it), and should **Read** `CONTEXT.local.md` before coding.                                                                                                                                           |                                 |
| Developer → Adversary        | "ready for review" note on issue: list of changed files + local gate output                                                                                                                                                                                                             | GitLab issue note + prompt      |
| Adversary → Developer (loop) | Findings JSON (`verdict`, `findings[]`)                                                                                                                                                                                                                                                 | Tool return value               |
| Adversary → Developer (pass) | `{ verdict: "pass", findings: [] }`                                                                                                                                                                                                                                                     | Tool return value               |
| Developer → Ops              | Note on issue: file list + ready-to-commit signal                                                                                                                                                                                                                                       | GitLab issue note               |
| Ops → Review                 | `{ mr_iid, commit_sha_range }`                                                                                                                                                                                                                                                          | Tool return value               |
| Review → Human               | Summary MR note with verdict + `needs-human-decision` label if non-clean. Review treats **issue + `## Technical Brief` + acceptance criteria** as the scope contract; if any are missing or ambiguous, it posts **clarifying draft notes** rather than inventing requirements.          | GitLab MR note                  |
| Human → GitLab               | Merge                                                                                                                                                                                                                                                                                   | GitLab UI / API                 |

## Adversarial feedback loop

```mermaid
stateDiagram-v2
    [*] --> Implementing
    Implementing --> LocalGreen: quality gates pass
    LocalGreen --> AdversaryCheck: spawn adversary_bot
    AdversaryCheck --> Implementing: verdict=fail
    AdversaryCheck --> ReadyForOps: verdict=pass
    Implementing --> HumanEscalation: 3+ rounds same file
    ReadyForOps --> [*]
    HumanEscalation --> [*]
```

- Rounds 1–2: Developer addresses findings and re-invokes Adversary.
- Round 3 on the same file range: Developer stops and returns a disagreement summary. PM pages the human.

## HITL gates (human is required)

1. **Scope / acceptance criteria** — PM asks `AskQuestion` before creating the issue when intent is ambiguous, cross-cutting, or has meaningful tradeoffs.
2. **Architecture & data modeling** — any schema/migration/trigger change is HITL; PM blocks Explorer until the human confirms approach.
3. **Adversary ↔ Developer non-convergence** — 3+ rounds on the same file range pages the human.
4. **Review verdict non-clean** — `needs-human-decision` label is added; no further automation.
5. **Merge** — `mcp__GitLab__approve_merge_request` / `accept_merge_request` are denied to every agent. Merge is **always** a human action.

## Sandboxing — deny-all + explicit allowlist

1. **Per-agent `tools:` frontmatter** in [`.claude/agents/<role>.md`](.claude/agents) is the primary allowlist. Tools not listed are unavailable to that agent.
2. **Repo-wide `permissions` in [`.claude/settings.json`](.claude/settings.json)** add a global `deny` for dangerous patterns (`git push --force`, `--no-verify`, `sudo`, `rm -rf /`, `curl | sh`, etc.) and an `allow` list for the exact shell patterns the pipeline needs. Destructive-but-sometimes-needed commands (`git reset --hard`, `git worktree remove`, `git branch -D`) require confirmation via the `ask` list.
3. **MCP surface** is constrained by `enabledMcpjsonServers` in settings; per-agent narrowing happens in `tools:` using the `mcp__<server>__<tool>` naming.
4. **Hooks** in [`.claude/hooks/`](.claude/hooks) provide defense-in-depth at the `PreToolUse` / `PostToolUse` / `Stop` phases (e.g. `block-e2e-wrong-dir`, `warn-as-cast`, `remind-quality-gates`).

Under Cursor the enforcement is policy-only. The [`.cursor/agents/`](.cursor/agents) files encode the same allow/deny as the Claude versions; agents self-report violations.

## MCP matrix

- **GitLab MCP (stdio, `project-0-workspace-GitLab`)** — `pm_bot` (issue tools), `ops_bot` (branch + MR transactional tools), `review_bot` (MR read + draft-note tools), `explorer_bot` (issue notes + links only). `developer_bot` and `adversary_bot` have **no** GitLab access.
- **Cursor Duo `gitlab-assistant`** — invoked via `Task(subagent_type=gitlab-assistant, ...)` for `plan-sprint`, `backlog-health` (PM), and `review-merge-request` (Review).
- **mariadb MCP (readonly)** — `explorer_bot`, `developer_bot`. Schema exploration only; application queries still use Knex (see [CLAUDE.md](CLAUDE.md)).
- **Playwright MCP** — `developer_bot` only (debug/assertion on dashboard flows). See [.cursor/skills/playwright-mcp-admin-auth/SKILL.md](.cursor/skills/playwright-mcp-admin-auth/SKILL.md).
- **shadcn/ui MCP** — `developer_bot` only (component discovery).
- **faceit MCP** — not wired to any of the 7 pipeline specialists by default; add explicitly if a feature requires it.

## Quality gates (Developer is responsible)

Copied from [CLAUDE.md](CLAUDE.md) — all must pass locally before invoking `adversary_bot`:

```bash
cd $(git rev-parse --show-toplevel)
rtk pnpm knip
rtk pnpm typecheck
rtk pnpm format:check
rtk pnpm lint
rtk pnpm reseed
rtk pnpm test          # affected workspaces
```

E2E (`rtk pnpm test:e2e`) runs only from the workspace root per [.cursor/skills/e2e-playwright/SKILL.md](.cursor/skills/e2e-playwright/SKILL.md).

`worktree_bot` (or `rtk pnpm run worktree:ensure` in the worktree) runs **before** these gates in `/pm-execute` so the install is for **this** worktree, not a symlinked `node_modules` from the primary clone. See [.cursor/skills/worktree-readiness/SKILL.md](.cursor/skills/worktree-readiness/SKILL.md).

## Worktrees

All work for an issue happens in a dedicated worktree created by `ops_bot`:

```
<repo>/.worktrees/<type>-<iid>-<slug>/
```

`.worktrees/` is gitignored. Branch naming and commit chunking rules are in [.cursor/skills/ops-git-worktrees/SKILL.md](.cursor/skills/ops-git-worktrees/SKILL.md). A dedicated worktree must get its own `pnpm install` layout; never point `node_modules` at the primary clone, or quality gates and Husky will resolve the wrong `packages/`.

## Skills index (per-domain)

Each specialist auto-reads its primary skill plus cross-cutting ones. Full list:

- [`pm-workflow`](.cursor/skills/pm-workflow/SKILL.md)
- [`explorer-research`](.cursor/skills/explorer-research/SKILL.md)
- [`ops-git-worktrees`](.cursor/skills/ops-git-worktrees/SKILL.md)
- [`worktree-readiness`](.cursor/skills/worktree-readiness/SKILL.md)
- [`developer-impl`](.cursor/skills/developer-impl/SKILL.md)
- [`adversarial-review`](.cursor/skills/adversarial-review/SKILL.md)
- [`code-review-checklist`](.cursor/skills/code-review-checklist/SKILL.md)

**Worktree context file:** Each active worktree should contain `CONTEXT.local.md` (see template [`.cursor/templates/CONTEXT.local.template.md`](.cursor/templates/CONTEXT.local.template.md)) so `developer_bot` and `Task` subagents share one **local** source of truth. `developer_bot` has no GitLab MCP; the file is how pasted issue scope survives session drops and subagent spawns. Optional **append-only** rows in the template’s stage log can record pipeline milestones (Explorer brief added, etc.).

Cross-cutting skills used by multiple specialists live in the same [`.cursor/skills/`](.cursor/skills) tree: `tdd-workflow`, `testing-strategy`, `type-safety`, `error-handling`, `eggosystem-types`, `eggosystem-msw`, `e2e-playwright`, `playwright-mcp-admin-auth`, `documentation-organization`, `onboarding`, plus the command skills (`quality-check`, `typecheck`, `lint-fix`, `format-code`, `build`, `clean`, `run-tests`, `setup-dev`, `fresh-start`, `db-status`, `db-reset`, `create-migration`, `run-migrations`, `rollback-migration`, `execute`).

## Non-negotiables (from [CLAUDE.md](CLAUDE.md))

- No unsafe type casts (`as SomeType`, `as unknown as SomeType`).
- No try/catch unless it owns cleanup (e.g. DB transactions).
- Reuse via exports, not duplication.
- No `--no-verify` / `--no-gpg-sign`.
- Commands prefixed with `cd $(git rev-parse --show-toplevel)` or the target workspace.
- E2E is always run from the workspace root via `rtk pnpm test:e2e`.
- Database triggers enforce business rules — application code alone cannot bypass them.

## Entry points (slash commands / skills)

Two ready-made commands wrap the pipeline. Both live as Claude Code slash commands **and** Cursor skills:

- **`/pm-plan <idea>`** — runs only the planning half: human ↔ `pm_bot` ↔ GitLab issue. Stops after `mcp__GitLab__create_issue`. Use this when starting a new feature or bug report.
  - Claude Code: [`.claude/commands/pm-plan.md`](.claude/commands/pm-plan.md)
  - Cursor skill: [`.cursor/skills/pm-plan/SKILL.md`](.cursor/skills/pm-plan/SKILL.md)
- **`/pm-execute <iid>`** — runs the execution half on an existing issue: Explorer → Ops → Developer (with Adversary loop) → Ops (opens a **ready** MR) → Review, then **review-fix loops** (Developer → Adversary → Ops push, re-Review) until the MR is in good shape or a HITL gate stops the loop. Stops at the merge HITL gate.
  - Claude Code: [`.claude/commands/pm-execute.md`](.claude/commands/pm-execute.md)
  - Cursor skill: [`.cursor/skills/pm-execute/SKILL.md`](.cursor/skills/pm-execute/SKILL.md)

Typical session:

```text
/pm-plan Allow casters to set a stream URL from their profile
 → Q&A with PM, issue #247 created.
/pm-execute 247
 → Explorer drafts brief (you confirm) → Ops cuts branch → Developer implements
   → Adversary audits → Ops commits & opens ready MR !312 → Review posts notes →
   (if needed) more Dev/Adversary/Ops passes on feedback → you merge MR !312 in the GitLab UI.
```

## Escalation

Any agent encountering a situation not covered here stops and returns control to its caller with a short rationale. The caller either re-plans or pages the human via `pm_bot`.
