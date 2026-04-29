# DAG-driven multi-agent workflow (`/dag-execute`)

## Slash commands

- **`/dag-execute <issue_iid>`** — Product → Decompose → Architecture (HITL) → DAG implementation (**each task**: `implementer_bot` ↔ `adversary_bot` ≤3 rounds → Draft MR → CR → CI) → Final Review → human merge.
- **`/observe <mr_iid>`** — post-merge analysis (CI logs, optional Grafana/Sentry, git revert detection). Off the critical path.

## Agents (10)

All in `/workspace/.claude/agents/`. Each returns a JSON envelope per `/workspace/.claude/skills/json-handoff/SKILL.md` — no prose around it.

| Agent              | Role                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `product_bot`      | Issue → stories with KPIs                                                                                                                        |
| `decomposer_bot`   | Stories → task DAG (`depends_on[]`)                                                                                                              |
| `architect_bot`    | API + DB schema design (read-only MariaDB)                                                                                                       |
| `implementer_bot`  | One task → quality gates; loops with **`adversary_bot`** → Draft MR                                                                              |
| `ui_bot`           | shadcn/Tailwind components (sub-agent of implementer)                                                                                            |
| `adversary_bot`    | Challenges implementation vs architecture, acceptance criteria, issue intent (**max 3** runs per task, before Draft MR); feeds `implementer_bot` |
| `code_review_bot`  | Per-task diff review                                                                                                                             |
| `final_review_bot` | Cross-task business validation                                                                                                                   |
| `devops_bot`       | CI pipeline monitoring + retry-once                                                                                                              |
| `observer_bot`     | Post-merge health (manual via `/observe`)                                                                                                        |

## HITL gates (4)

1. Architecture sign-off (Phase 3 of `/dag-execute`).
2. Implementer **`stuck`**, **`adversary_bot` rejects 3 rounds**, Code Review rejects 3 rounds, or gate rounds exhausted.
3. Final Review rejected (cross-cutting or 3 rounds).
4. Merge approval — every MR is merged by the human via the GitLab UI; orchestrator never calls `mcp__GitLab__merge_merge_request`.

## Branching

- Branch per task: `feat-<iid>-<task_id>-<slug>` (e.g. `feat-247-T1-stream-route`).
- **`base_branch` (how implementers reuse upstream code):**
  - **No dependencies:** `base_branch = development`. Worktree: `git worktree add … -b <branch> origin/development`. Draft MR **target = `development`**.
  - **Exactly one dependency (stacked MRs):** `base_branch = <parent task branch name>` (e.g. `feat-338-T2-…`). Worktree: `git worktree add … -b <branch> origin/<parent-branch>`. Draft MR **target = parent branch** (not `development`) so the diff is only the child task and CI runs on top of the parent’s tree. **When to use:** the child must compile against unmerged parent work (typical linear chains). After the parent MR merges to `development`, **rebase the child branch onto current `development` and switch the MR target to `development`** (or merge the stack strictly in topo order if your GitLab prefers that — see Merge train below).
  - **Multiple dependencies:** there is no single “parent-only” base. Prefer **`development` plus merging each completed dependency branch into the task branch before implementation** (`git merge origin/<dep-branch>` for each prerequisite in topo-safe order). Draft MR typically **targets `development`** once that branch carries all merged predecessors, or carries the merged commits locally so CI is faithful. Alternative: introduce a shared integration branch for the issue once and base later tasks on that (manual/orchestrator choice).
- **“Deepest dependency” tie-break** (single-dependency stacks): when tasks are independent until they funnel into one child, choose the dependency whose branch must land first (**topological order** among `depends_on`); linear chains simply use the immediate parent branch.
- One Draft MR per task; opened by `implementer_bot`. Orchestrator unmarks Draft after Final Review approves.
- **Merge train (after parents land on `development`):** for dependents that were stacked on a merged parent branch name, orchestrator/human rebases children onto `development` (`git rebase --onto development <old_parent_tip> <child_branch>` or equivalent) and **`--force-with-lease` only after confirmation** (`ask` permission tier — see Phase 6 in `/dag-execute`).

## Worktrees

- One worktree per task: `/workspace/.worktrees/<iid>-<task_id>/`.
- `git worktree add` creates them; the orchestrator does this before spawning each `implementer_bot`.
- `git worktree remove --force` cleans up after merge (in `ask` permission tier — confirmed by human).
- Parallel task worktrees each run **`pnpm install --frozen-lockfile`** once on the **first** `implementer_bot` spawn for that worktree (`implementer_invocation_index == 1`); orchestrator increments the index on every later re-invocation (adversary, Code Review, CI, etc.), so implementer **does not** repeat frozen install unless dependency manifests changed or bootstrap failed — see `.cursor/agents/implementer_bot.md` (**Dependency install**).

## Quality gates (per implementer task)

```bash
cd /workspace/.worktrees/<iid>-<task_id>
# pnpm install: first implementer invocation per worktree only (see implementer_bot.md)
rtk pnpm format
rtk pnpm --filter=<workspace> typecheck
rtk pnpm --filter=<workspace> lint
rtk pnpm --filter=<workspace> test
rtk pnpm knip
# Do not run `pnpm test:e2e` here; commit with Husky skipped (see implementer_bot).
```

All must exit 0 before the implementer opens the Draft MR. Commits must use **`HUSKY=0 rtk git commit …`** so Husky does not re-run checks (`implementer_bot`). **`adversary_bot` runs before** that MR (**up to three** attempts per task; orchestrator parses JSON only).

## Envelope validation

`PostToolUse:Task` hook at `/workspace/.claude/hooks/validate-envelope.sh` lints DAG-pipeline subagent output and warns (non-blocking) on schema mismatch. Legacy agents (e.g. `developer_bot`, `pm_bot`) are ignored by the hook.

## When to use which

- **`/dag-execute`** (new) — multi-MR per issue, structured JSON throughout, formal architecture HITL, parallel task execution. Best for issues that decompose cleanly into 2–8 independent tasks.

<!-- rtk-instructions v2 -->

# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:

```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## If RTK output is missing (use tee logs)

RTK may heavily filter output (especially on failures). **When a command fails and you need the full raw output, read the RTK tee log instead of re-running the command.**

- **Devcontainer (Linux) tee logs**: `~/.config/rtk/tee/`
- **Devcontainer (Linux) config**: `~/.config/rtk/config.toml`
- **macOS config**: `~/Library/Application Support/rtk/config.toml`

When a command fails, RTK saves the full output as above.

## RTK Commands by Workflow

### Build & Compile (80-90% savings)

```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (60-99% savings)

```bash
rtk cargo test          # Cargo test failures only (90%)
rtk go test             # Go test failures only (90%)
rtk jest                # Jest failures only (99.5%)
rtk vitest              # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk pytest              # Python test failures only (90%)
rtk rake test           # Ruby test failures only (90%)
rtk rspec               # RSpec test failures only (60%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)

```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)

```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)

```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)

```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%)
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)

```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)

```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)

```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands

```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category         | Commands                       | Typical Savings |
| ---------------- | ------------------------------ | --------------- |
| Tests            | vitest, playwright, cargo test | 90-99%          |
| Build            | next, tsc, lint, prettier      | 70-87%          |
| Git              | status, log, diff, add, commit | 59-80%          |
| GitHub           | gh pr, gh run, gh issue        | 26-87%          |
| Package Managers | pnpm, npm, npx                 | 70-90%          |
| Files            | ls, read, grep, find           | 60-75%          |
| Infrastructure   | docker, kubectl                | 85%             |
| Network          | curl, wget                     | 65-70%          |

Overall average: **60-90% token reduction** on common development operations.

<!-- /rtk-instructions -->
