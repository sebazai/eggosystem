# Orchestration playbook

Long-form workflow for the DAG-driven pipeline. **Full phased procedure:** [`gitlab-issue-dag-orchestration` skill](/workspace/.cursor/skills/gitlab-issue-dag-orchestration/SKILL.md). **Index:** [`/workspace/AGENTS.md`](/workspace/AGENTS.md). **Envelope contract:** [`/workspace/.cursor/skills/json-handoff/SKILL.md`](/workspace/.cursor/skills/json-handoff/SKILL.md).

## Entry points

- **Skill `gitlab-issue-dag-orchestration`** ([`SKILL.md`](../skills/gitlab-issue-dag-orchestration/SKILL.md)) — Product → Decompose → Architecture (HITL) → DAG implementation (**each task**: one orchestrator `implementer_bot` spawn runs **`adversary_bot` internally** ≤3 rounds, then opens Draft MR → CR → **`devops_bot` watches CI in the background** so other tasks can run) → Final Review → human merge. **`implements_after_gates`** (optional on `decomposer_bot` tasks) lowers the bar for starting **implementation** (`impl_ready`; e.g. **`mr_opened`** on stacked parents) while **`final_review_bot` still waits for every task `completed`** (CI green). A thin **slash-command stub** beside this repo points at that skill path.
- **Skill `analyze-merged-merge-request-health`** — post-merge analysis (CI logs, optional Grafana/Sentry, git revert detection). Off the critical path; optional client wrappers live under `.cursor/commands/` / `.claude/commands/` (`analyze-merged-merge-request-health.md`).

## Agents (10)

Definitions live under [`/workspace/.cursor/agents/`](/workspace/.cursor/agents/). Each returns a JSON envelope per [`/workspace/.cursor/skills/json-handoff/SKILL.md`](/workspace/.cursor/skills/json-handoff/SKILL.md) — no prose around it.

| Agent              | Role                                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `product_bot`      | Issue → stories with KPIs                                                                                                              |
| `decomposer_bot`   | Stories → task DAG (`depends_on[]`)                                                                                                    |
| `architect_bot`    | API + DB schema design (read-only MariaDB)                                                                                             |
| `implementer_bot`  | One task → quality gates; **`Task(adversary_bot)`** internally (≤3) before first Draft MR; post-MR pushes without respawning adversary |
| `ui_bot`           | shadcn/Tailwind components (sub-agent of implementer)                                                                                  |
| `adversary_bot`    | Pre-MR alignment critic; spawned **by** `implementer_bot` (**max 3** `rejected` rounds per pre-MR implementer session)                 |
| `code_review_bot`  | Per-task diff review                                                                                                                   |
| `final_review_bot` | Cross-task business validation                                                                                                         |
| `devops_bot`       | CI pipeline monitoring + retry-once                                                                                                    |
| `observer_bot`     | Post-merge health via skill **`analyze-merged-merge-request-health`**                                                                  |

## HITL gates (4)

1. Architecture sign-off (Phase 3 of **gitlab-issue-dag-orchestration**).
2. Implementer **`stuck`** (including **adversary non-convergence** after 3 internal rounds), Code Review rejects 3 rounds, or gate rounds exhausted.
3. Final Review rejected (cross-cutting or 3 rounds).
4. Merge approval — every MR is merged by the human via the GitLab UI; orchestrator never calls `mcp__gitlab_mcp__merge_merge_request`.

## Branching

- Branch per task: `feat-<iid>-<task_id>-<slug>` (e.g. `feat-247-T1-stream-route`).
- **`base_branch` (how implementers reuse upstream code):**
  - **No dependencies:** `base_branch = development`. Worktree: `rtk git worktree add … -b <branch> origin/development`. Draft MR **target = `development`**.
  - **Exactly one dependency (stacked MRs):** `base_branch = <parent task branch name>` (e.g. `feat-338-T2-…`). Worktree: `rtk git worktree add … -b <branch> origin/<parent-branch>`. Draft MR **target = parent branch** (not `development`) so the diff is only the child task and CI runs on top of the parent’s tree. **When to use:** the child must compile against unmerged parent work (typical linear chains). After the parent MR merges to `development`, **rebase the child branch onto current `development` and switch the MR target to `development`** (or merge the stack strictly in topo order if your GitLab prefers that — see Merge train below).
  - **Multiple dependencies:** there is no single “parent-only” base. Prefer **`development` plus merging each completed dependency branch into the task branch before implementation** (`rtk git merge origin/<dep-branch>` for each prerequisite in topo-safe order). Draft MR typically **targets `development`** once that branch carries all merged predecessors, or carries the merged commits locally so CI is faithful. Alternative: introduce a shared integration branch for the issue once and base later tasks on that (manual/orchestrator choice).
- **“Deepest dependency” tie-break** (single-dependency stacks): when tasks are independent until they funnel into one child, choose the dependency whose branch must land first (**topological order** among `depends_on`); linear chains simply use the immediate parent branch.
- One Draft MR per task; opened by `implementer_bot`. Orchestrator unmarks Draft after Final Review approves.
- **Merge train (after parents land on `development`):** for dependents that were stacked on a merged parent branch name, orchestrator/human rebases children onto `development` (`rtk git rebase --onto development <old_parent_tip> <child_branch>` or equivalent) and **`--force-with-lease` only after confirmation** (`ask` permission tier — see Phase 6 in **gitlab-issue-dag-orchestration**).

## Worktrees

- One worktree per task: `/workspace/.worktrees/<iid>-<task_id>/`.
- `rtk git worktree add` creates them; the orchestrator does this before spawning each `implementer_bot`.
- **Immediately after** `rtk git worktree add` (and after any integration merges for multi-dependency tasks), the orchestrator runs **`cd <worktree_path> && node scripts/bootstrap-worktree-env.mjs && rm -rf node_modules && rtk pnpm install --frozen-lockfile && rtk pnpm build`**: **`bootstrap-worktree-env.mjs`** copies `apps/backend/.env`, repo-root `.env.mcp`, and `apps/backend/*.pem` from the primary checkout once (.gitignored; source path defaults to stripping `/.worktrees/<task>/` or use **`WORKTREE_SECRET_SOURCE`**); then optional native bindings (e.g. `oxc-parser` → `@oxc-parser/binding-*`) install cleanly — incomplete installs otherwise break tools like **`pnpm knip`** only inside that worktree.
- `rtk git worktree remove --force` cleans up after merge (in `ask` permission tier — confirmed by human).
- Parallel task worktrees each run **`rtk pnpm install --frozen-lockfile`** then **`rtk pnpm build`** once on the **first** `implementer_bot` spawn for that worktree (`implementer_invocation_index == 1`) when needed — redundant but harmless after the orchestrator bootstrap above; orchestrator increments the index on every later **orchestrator-issued** `implementer_bot` re-invocation (Code Review, CI, gate retries, etc.) — **not** for `adversary_bot` sub-tasks the implementer spawns — so implementer **does not** repeat install unless manifests change or bootstrap failed. **`pnpm build`** from the worktree root may still be needed **again** later: **`@eggosystem/types`** publishes **`dist/`**, so after editing **`packages/types`** or when **typecheck / lint / knip** look like stale compiled output, run **`rtk pnpm build`** and retry gates — see [`implementer_bot.md`](implementer_bot.md) (**Dependency install**).

## Quality gates (per implementer task)

```bash
cd /workspace/.worktrees/<iid>-<task_id>
# Orchestrator post-worktree bootstrap + first implementer invocation may both run frozen install + build (see Worktrees above).
rtk pnpm format
# Then app-scoped lint, typecheck, and targeted unit tests (`jest --findRelatedTests`) in worktree order — see [implementer_bot.md](implementer_bot.md) (typecheck shell shape enforced by Cursor `preToolUse`; [.cursor/hooks.json](/workspace/.cursor/hooks.json)).
rtk pnpm knip
# If typecheck/lint/knip suggest outdated shared types: `rtk pnpm build` at worktree root, then rerun failing gates (stale dist/ — see implementer_bot).
# Do not run `pnpm test:e2e` here; commit with Husky skipped (see implementer_bot).
```

All must exit 0 before the implementer opens the Draft MR. Commits must use **`HUSKY=0 rtk git commit …`** so Husky does not re-run checks (`implementer_bot`). **`adversary_bot` runs inside `implementer_bot`** before that MR (**up to three** `rejected` rounds per pre-MR orchestrator dispatch; implementer returns one envelope to the orchestrator).

## Mechanical guardrails (Cursor)

Configured in [`/workspace/.cursor/hooks.json`](/workspace/.cursor/hooks.json); scripts mostly live under [`/workspace/.claude/hooks/`](/workspace/.claude/hooks/) and are invoked via [`.cursor/hooks/run-claude-project-hook.sh`](/workspace/.cursor/hooks/run-claude-project-hook.sh) (sets `CLAUDE_PROJECT_DIR`). Debug runs in Cursor **Settings → Hooks**.

| Hook            | Matcher / scope | Purpose                                                                                                                                                                                                  |
| --------------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `preToolUse`    | `Shell`         | Block wrong-dir e2e, enforce allowed typecheck CLI shape, remind directory execution rules (`block-e2e-wrong-dir`, `enforce-typecheck-command`, `warn-directory-execution`).                             |
| `postToolUse`   | `Task`          | `validate-envelope.sh` — stderr warnings on DAG envelope/schema issues; Cursor only: optional **`additional_context`** hint after successful `implementer_bot` envelopes (no `subagentStop` auto-loops). |
| `postToolUse`   | `Write`         | `warn-as-cast`, `warn-try-without-finally`                                                                                                                                                               |
| `afterFileEdit` | `Write`         | `format-edited-file.sh` — Prettier on saved files (**timeout 120s**).                                                                                                                                    |
| `stop`          | —               | Dirty TS/apps reminder (`remind-quality-gates.sh`).                                                                                                                                                      |
| `subagentStart` | —               | `audit-subagent-start.sh` — stderr audit only; **`permission: allow`** (non-DAG types get notice).                                                                                                       |
| `subagentStop`  | —               | `audit-subagent-stop.sh` — stderr audit only; **no `followup_message`** (avoid feedback loops).                                                                                                          |

Claude Code also runs `validate-envelope` on `PostToolUse`+`Task` via [`.claude/settings.json`](/workspace/.claude/settings.json). Legacy agent types (e.g. `developer_bot`, `pm_bot`) are ignored by the envelope validator.

## When to use which

- **`gitlab-issue-dag-orchestration`** — multi-MR per issue, structured JSON throughout, formal architecture HITL, parallel task execution. **`decomposer_bot`** aims for **coarse tasks** (often **1–3**: optional `db`, then `backend` / `frontend`), folding `packages/types` and small helpers into the feature MR; split further only for large diffs or hard dependencies. Cap **8** tasks per issue (HITL if more).
