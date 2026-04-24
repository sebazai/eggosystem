---
name: worktree-readiness
description: Verify and repair pnpm + node_modules in a dedicated git worktree so Husky, lint-staged, and quality gates resolve the correct workspace
---

# Worktree readiness (`worktree_bot`)

Read this before acting as `worktree_bot`. This specialist runs **after** `ops_bot` creates a worktree and **before** `developer_bot` implements. It only touches **untracked** install state (`node_modules` layout) and the repo’s existing `pnpm run worktree:ensure` script.

## Problem this solves

- Symlinking or copying `node_modules` from the **primary** clone into a worktree breaks pnpm’s workspace links (packages resolve under the wrong `packages/`, e.g. `/workspace/packages` instead of `.worktrees/.../packages`).
- Husky prepends `node_modules/.bin` to `PATH`; a broken install makes pre-commit and local gates look flaky “only in worktrees”.

**Never** shortcut with a `node_modules` → primary-clone symlink. The global pnpm **content store** is still shared; each worktree only needs its own local link tree (`pnpm install` in that worktree).

## Inputs

- `worktree_path` — absolute path to the new worktree (same as Ops handoff to Developer).
- `issue_iid` — for logging (optional).

## What to run

1. `cd` to the worktree root and run:

   ```bash
   cd <worktree_path>
   rtk pnpm run worktree:ensure
   ```

2. The script (see `scripts/ensure-worktree-pnpm.mjs`):
   - Detects a `node_modules` that is a **symlink to outside** the worktree.
   - Verifies `require.resolve('@eggosystem/eslint/base')` (a published export of a root workspace dep) is under the worktree.
   - If not ok: removes shallow `node_modules` in the root, `apps/*`, and `packages/*`, then runs `pnpm install`.

3. If `rtk pnpm run worktree:ensure` **exits non-zero**, return `{ status: 'failed', worktree_path, log }` to the orchestrator. Do not edit application source; do not skip to Developer until this passes (or a human unblocks with a different worktree path).

## Sandbox policy (Cursor / Claude)

- **Allow:** `Read` / `Grep` / `Glob` to read the script, `Bash` only: `cd <absolute worktree>`, `rtk pnpm run worktree:ensure`, and `rtk pnpm run worktree:ensure` variants (or `rtk node ./scripts/ensure-worktree-pnpm.mjs` from the worktree root with `cwd` set). No other `pnpm` subcommands in normal operation.
- **Deny:** `git *` (all), GitLab MCP, `Write`/`Edit` of tracked source, `rtk pnpm test*`, `rtk pnpm knip`, `rtk pnpm lint*`, `rtk pnpm typecheck` — this is not a substitute for the Developer’s quality gates.

## Handoff artifact

Return to the orchestrator (then Developer):

```json
{
  "status": "ok" | "failed",
  "worktree_path": "<absolute>",
  "issue_iid": <n>,
  "note": "worktree:ensure passed" | "error tail"
}
```

## Relationship to Ops

- `ops_bot` still does `git worktree add`, copies `apps/backend/.env` and `*.pem` from the primary clone, runs `pnpm install` in the new worktree, and should create a **`CONTEXT.local.md` stub** in the worktree root per `.cursor/skills/ops-git-worktrees/SKILL.md`.
- `ops_bot` still does `rtk git worktree add`, copies `apps/backend/.env` and `*.pem` from the primary clone, runs `rtk pnpm install` in the new worktree, and should create a **`CONTEXT.local.md` stub** in the worktree root per `.cursor/skills/ops-git-worktrees/SKILL.md`.
- `worktree_bot` is an explicit **verify/repair** pass so a mistaken symlink or bad copy does not reach Developer. It does not remove `CONTEXT.local.md`. Idempotent: safe to re-run if someone breaks `node_modules` mid-sprint; have the orchestrator re-invoke with the same worktree before another Developer pass.
