---
name: ops-git-worktrees
description: Ops workflow for branches, chunked commits, and GitLab MRs — the only agent allowed to run git
---

# Ops Git & branches

Read this before acting as `ops_bot`. Ops owns everything git, branches, and transactional GitLab operations. Ops never edits **tracked** source files; shell-only bootstrap of a **`pnpm install --force`**, a smoke `pnpm knip`, and a **`CONTEXT.local.md` heredoc** at the **repository root** is allowed (see below).

**Default:** create an issue branch in the **primary clone** (single working tree). Do **not** use `git worktree add` for new work. Legacy `.worktrees/` directories may still exist; optional cleanup is `worktree list|remove|prune` when appropriate.

## Repository layout (branch workflow)

All work for an issue uses a **dedicated branch** in the same clone the orchestrator (or human) is using—typically the primary checkout:

```text
<repo>/                    # git toplevel (canonical path = handoff worktree_path)
  .git/
  …                        # your branch checked out here
```

Optional parallel work via extra clones is out of scope for this playbook; the handoff is always a **branch name** plus the **absolute path** to that clone’s toplevel.

`.worktrees/` under the repo, if present from older flows, is gitignored; prefer branch-in-primary for new issues.

## Branch naming

- `feat-<iid>-<slug>` — features
- `fix-<iid>-<slug>` — bug fixes
- `chore-<iid>-<slug>` — refactors / infra
- `docs-<iid>-<slug>` — docs-only

`<slug>` is kebab-case, ≤40 chars, derived from the issue title.

## Create a branch (handed to Developer)

```bash
cd $(git rev-parse --show-toplevel)
rtk git fetch origin
rtk git switch -c <type>-<iid>-<slug> origin/development
```

If a local branch with that name already exists, do not overwrite silently—stop and return to the orchestrator with `git status` / `git branch` output.

Post the **canonical** repository root path + branch name back to PM/Developer as the handoff artifact (`worktree_path` in JSON is this absolute path; in Git every checkout is a worktree, so the field name stays stable for downstream prompts).

## Bootstrap (before Developer starts)

You do **not** copy `apps/backend/.env` or `*.pem` from “primary” to “worktree”—there is a single working tree; those files already live at `apps/backend/` if the human created them. Never commit them.

1. `cd` to the **repository root** and run `rtk pnpm install --force` so optional platform packages (e.g. `oxc-parser` native bindings for knip) are linked. **Never** point `node_modules` at a symlink to another clone.

2. From the same directory, run `rtk pnpm knip` and **do not** hand off to `worktree_bot` / `developer_bot` until it exits 0. If knip fails, return the full stderr/stdout to the orchestrator.

3. The orchestration pipeline may run `worktree_bot` (`pnpm run worktree:ensure` in that same path) after you—idempotent and repairs mistaken symlinks. See [`.cursor/skills/worktree-readiness/SKILL.md`](../worktree-readiness/SKILL.md).

4. **Create `CONTEXT.local.md` at the repository root** (shell only; the repo gitignores `/CONTEXT.local.md`—**do not** commit it). Use a heredoc with at least: `issue_iid`, **canonical** absolute repo path, `branch_name`, `created_utc` ([ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) UTC), and placeholder lines for **Acceptance criteria** / **Technical brief** set to `[pending]`. Template: [`.cursor/templates/CONTEXT.local.template.md`](../templates/CONTEXT.local.template.md).

   **Path rule:** resolve a **canonical** absolute path and use the same value in the file and in your `{ worktree_path, … }` return:

   ```bash
   ROOT=$(git rev-parse --show-toplevel)
   ABS_ROOT="$(cd "$ROOT" && pwd -P)"
   cat > "$ABS_ROOT/CONTEXT.local.md" <<EOF
   # Worktree context (local only)

   | Field | Value |
   |---|---|
   | Issue | #${ISSUE_IID} |
   | Worktree (absolute) | ${ABS_ROOT} |
   | Branch | \`${BRANCH}\` |
   | Created (UTC) | $(date -u +%Y-%m-%dT%H:%M:%SZ) |

   ## Acceptance criteria
   [pending — orchestrator or developer_bot completes from GitLab issue]

   ## Technical brief (Explorer)
   [pending]

   ## Sub-issues
   [none or pending]
   EOF
   ```

Ops still does not edit **tracked** source files; `CONTEXT.local.md` is created with **Bash** like a local-only bootstrap file.

## Commit chunking rules

One logical concern per commit. A "concern" is e.g. "add migration", "add service", "wire controller", "add tests", "update types". Do not lump unrelated changes.

Commit message format (conventional, lower-case scope):

```text
<type>(<area>): <imperative summary>

<optional body explaining why, not what>

Refs: #<iid>
```

`<type>` ∈ `feat | fix | chore | docs | test | refactor | perf | build`.
`<area>` ∈ `backend | frontend | types | shared-msw | db | ci | docs`.

Use HEREDOC when committing so multi-line bodies render correctly:

```bash
rtk git commit -m "$(cat <<'EOF'
feat(backend): add caster-application submit endpoint

Refs: #123
EOF
)"
```

## Hand back to Developer (pre-commit, lint-staged, or `git commit` failed)

If `git commit` fails, or Husky / pre-commit / lint-staged / GPG signing errors before the commit completes:

1. **Stop.** Do not “fix” the tree with extra `pnpm` commands, copied `node_modules`, untracked config shims, or **any** hook bypass. Treat these the same as `--no-verify` (forbidden in `CLAUDE.md`): do not set `HUSKY=0` (or similar) to skip hooks.
2. Return the **full error output** to the PM/orchestrator.
3. Instruct **Developer** to work in the **same repository** and re-run the **full** self quality gates from `.cursor/skills/developer-impl/SKILL.md` (at minimum `pnpm knip`, `pnpm typecheck`, `pnpm format:check`, `pnpm lint`, `pnpm reseed`, `pnpm test` for affected workspaces; add `pnpm test:e2e` when relevant), until everything passes, then re-run **Adversary** if the diff changed materially, and have the orchestrator call **Ops** again to commit.
4. Do **not** run those `pnpm` commands yourself (see **Never**).

## Never

- `--no-verify`, `--no-gpg-sign` (blocked by repo policy in `CLAUDE.md`). Same intent: no env-based hook skip (`HUSKY=0`, etc.).
- `git push --force` to `main`/`master`.
- `git commit --amend` unless the previous commit was created in this session AND not yet pushed.
- Edit files. On commit or hook failure, follow **Hand back to Developer (pre-commit, lint-staged, or `git commit` failed)** — do not attempt fixes yourself.

## Push + open MR

From the same repository root (branch checked out):

```bash
rtk git push -u origin HEAD
```

Then open the MR via MCP:

- `mcp__GitLab__create_merge_request` with `source_branch`, `target_branch=development`, `title` = `<type>(<area>): <summary>`, `description` linking the issue (`Closes #<iid>`), **`draft: false`** so the MR is **Ready** (not a draft) as soon as it exists. If the create response does not show non-draft, call `update_merge_request` with `draft: false` once.
- **After `review_bot` feedback** (same issue / same branch / MR already exists): only add commits and `git push` — do **not** call `create_merge_request` again. Idempotently `update_merge_request` with `draft: false` on the same MR if needed.

Post the MR IID back to the orchestrator (PM) + `review_bot`.

## CI handling

- Poll `mcp__GitLab__get_pipeline` for the latest pipeline on the MR.
- On failure: post a concise summary as an MR note (`create_merge_request_note`) and hand control back to Developer — do not attempt to fix code.
- On success: post a green check note and notify Review.

## Cleanup (after merge)

```bash
cd $(git rev-parse --show-toplevel)
rtk git switch development
rtk git pull
rtk git branch -D <type>-<iid>-<slug>   # local
rtk git push origin --delete <type>-<iid>-<slug>   # remote if not already pruned
```

To remove a **legacy** linked worktree directory (older workflow only):

```bash
rtk git worktree remove .worktrees/<type>-<iid>-<slug>
```

## Forbidden

- Mutating **tracked** source with editor tools, or any change outside the documented bootstrap (`pnpm install --force` + `pnpm knip` + `CONTEXT.local.md` heredoc at **repo creation of the branch** only).
- Running tests, typecheck, `pnpm lint` (except via Husky during an allowed `git commit`), or migrations (Developer's job). Outside that bootstrap, do not run ad-hoc `pnpm` to “fix” failures—use **Hand back to Developer** above.
- Approving MRs unless explicitly instructed by a human (never by another agent).
