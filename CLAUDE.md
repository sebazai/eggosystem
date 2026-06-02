# CLAUDE.md

The role of this file is to describe common mistakes and confusion points that agents might encounter as they work in this project. If you ever encounter something in the project that surprises you, please alert the developer working with you and indicate that this is the case in the AgentMD file to help prevent future agents from having the same issue.

## RTK is the default for all commands

**Golden rule:** always prefix shell commands with `rtk` (including `git`, `pnpm`, `gh`, etc).

- **Exception**: repo-root typecheck should be `pnpm typecheck` (no RTK); hooks enforce allowed typecheck shapes.
- **Monorepo convention**: use `cd $(git rev-parse --show-toplevel)/apps/backend && ...` or `cd $(git rev-parse --show-toplevel)/apps/frontend && ...` as appropriate.

RTK command catalog (tee logs, wrappers, exceptions): [`docs/rtk-reference.md`](docs/rtk-reference.md).

## Devcontainer Node vs Cursor’s bundled Node

The image ships **Node 24** at `/usr/local/bin/node`. Cursor’s remote server often prepends its own **Node 20** on `PATH`, which breaks **pnpm 11** (`node:sqlite`, requires Node ≥ 22.13).

- **Worktree bootstrap:** from a worktree root, run `rtk bash scripts/bootstrap-worktree-deps.sh` (sets `PATH`, copies secrets, `pnpm install --frozen-lockfile`, `pnpm build`).
- **Interactive shells:** after changing `.devcontainer/`, **rebuild** the container so `remoteEnv` / `.bashrc` apply; or `export PATH="/usr/local/bin:/home/node/.local/bin:$PATH"` before `pnpm`.
- **Devcontainer startup (`Cannot find module '/workspace/sleep'`)**: the Node base image `docker-entrypoint.sh` runs `node sleep …` when `sleep` is missing from `PATH`, or when compose passes `command: sleep infinity` without clearing `entrypoint`. Use `entrypoint: []` + `command: ["sleep", "infinity"]` in `.devcontainer/docker-compose.yml` with `"overrideCommand": false`.
