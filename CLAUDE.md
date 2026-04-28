# CLAUDE.md

The role of this file is to describe common mistakes and confusion points that agents might encounter as they work in this project. If you ever encounter something in the project that surprises you, please alert the developer working with you and indicate that this is the case in the AgentMD file to help prevent future agents from having the same issue.

# DAG-driven multi-agent workflow (`/dag-execute`)

## Slash commands

- **`/dag-execute <issue_iid>`** — full pipeline: Product → Decompose → Architecture (HITL) → DAG implementation (parallel, one MR per task) → Final Review → human merge.
- **`/observe <mr_iid>`** — post-merge analysis (CI logs, optional Grafana/Sentry, git revert detection). Off the critical path.

## Agents (10)

All in `/workspace/.claude/agents/`. Each returns a JSON envelope per `/workspace/.claude/skills/json-handoff/SKILL.md` — no prose around it.

| Agent              | Role                                                  |
| ------------------ | ----------------------------------------------------- |
| `product_bot`      | Issue → stories with KPIs                             |
| `decomposer_bot`   | Stories → task DAG (`depends_on[]`)                   |
| `architect_bot`    | API + DB schema design (read-only MariaDB)            |
| `implementer_bot`  | One task in one worktree → Draft MR                   |
| `ui_bot`           | shadcn/Tailwind components (sub-agent of implementer) |
| `code_review_bot`  | Per-task diff review                                  |
| `qa_bot`           | Per-task Playwright validation                        |
| `final_review_bot` | Cross-task business validation                        |
| `devops_bot`       | CI pipeline monitoring + retry-once                   |
| `observer_bot`     | Post-merge health (manual via `/observe`)             |

## HITL gates (4)

1. Architecture sign-off (Phase 3 of `/dag-execute`).
2. Implementer ↔ Code Review or QA non-convergence (3 rounds).
3. Final Review rejected (cross-cutting or 3 rounds).
4. Merge approval — every MR is merged by the human via the GitLab UI; orchestrator never calls `mcp__GitLab__merge_merge_request`.

## Branching

- Branch per task: `feat-<iid>-<task_id>-<slug>` (e.g. `feat-247-T1-stream-route`).
- Base branch: `development` if no deps; else the latest pushed branch of the deepest dependency.
- One Draft MR per task; opened by `implementer_bot`. Orchestrator unmarks Draft after Final Review approves.
- After a parent MR merges: orchestrator rebases dependents (`git rebase --onto development <old_parent> <child>`; `--force-with-lease` confirmed by human via the `ask` permission tier).

## Worktrees

- One worktree per task: `/workspace/.worktrees/<iid>-<task_id>/`.
- `git worktree add` creates them; the orchestrator does this before spawning each `implementer_bot`.
- `git worktree remove --force` cleans up after merge (in `ask` permission tier — confirmed by human).
- Parallel `pnpm install` uses `--frozen-lockfile` to prevent store corruption.

## Quality gates (per implementer task)

```bash
cd /workspace/.worktrees/<iid>-<task_id>
rtk pnpm install --frozen-lockfile
rtk pnpm --filter=<workspace> typecheck
rtk pnpm --filter=<workspace> lint
rtk pnpm --filter=<workspace> test
rtk pnpm knip
rtk pnpm test:e2e   # only when type ∈ {frontend, integration, ui}; runs from repo root
```

All must exit 0 before the implementer pushes its MR.

## Envelope validation

`PostToolUse:Task` hook at `/workspace/.claude/hooks/validate-envelope.sh` lints DAG-pipeline subagent output and warns (non-blocking) on schema mismatch. Legacy agents (e.g. `developer_bot`, `pm_bot`) are ignored by the hook.

## When to use which

- **`/dag-execute`** (new) — multi-MR per issue, structured JSON throughout, formal architecture HITL, parallel task execution. Best for issues that decompose cleanly into 2–8 independent tasks.
