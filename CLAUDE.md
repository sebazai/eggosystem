# CLAUDE.md

The role of this file is to describe common mistakes and confusion points that agents might encounter as they work in this project. If you ever encounter something in the project that surprises you, please alert the developer working with you and indicate that this is the case in the AgentMD file to help prevent future agents from having the same issue.

## RTK is the default for all commands

**Golden rule:** always prefix shell commands with `rtk` (including `git`, `pnpm`, `gh`, etc).

- **Exception**: repo-root typecheck should be `pnpm typecheck` (no RTK); hooks enforce allowed typecheck shapes.
- **Monorepo convention**: use `cd $(git rev-parse --show-toplevel)/apps/backend && ...` or `cd $(git rev-parse --show-toplevel)/apps/frontend && ...` as appropriate.

RTK command catalog (tee logs, wrappers, exceptions): [`docs/rtk-reference.md`](docs/rtk-reference.md).
