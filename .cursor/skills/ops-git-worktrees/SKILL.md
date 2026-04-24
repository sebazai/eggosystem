---
name: ops-git-worktrees
description: Ops workflow for worktrees, branches, chunked commits, and GitLab MRs — the only agent allowed to run git
---

# Ops Git & Worktrees Skill

Read this before acting as `ops_bot`. Ops owns everything git, worktrees, and transactional GitLab operations. Ops never edits **tracked** source files; shell-only bootstrap of gitignored backend `.env` / `*.pem` copies and `pnpm install` in the worktree is allowed (see below).

## Worktree layout

All work for an issue happens in a dedicated worktree so multiple agents/issues can run in parallel without branch collisions.

```
<repo>/
  .worktrees/
    <type>-<iid>-<slug>/   # working tree for issue #<iid> (matches branch)
```

`.worktrees/` is gitignored.

## Branch naming

- `feat-<iid>-<slug>` — features
- `fix-<iid>-<slug>` — bug fixes
- `chore-<iid>-<slug>` — refactors / infra
- `docs-<iid>-<slug>` — docs-only

`<slug>` is kebab-case, ≤40 chars, derived from the issue title.

## Create a worktree (handed back to Developer)

```bash
cd $(git rev-parse --show-toplevel)
rtk git fetch origin
rtk git worktree add .worktrees/<type>-<iid>-<slug> -b <type>-<iid>-<slug> origin/development
```

Post the worktree path + branch name back to PM/Developer as the handoff artifact.

## Worktree bootstrap (before Developer starts)

So the worktree can run `pnpm dev` without manual setup:

1. From the **primary** repo clone, copy gitignored backend locals into the worktree (same relative paths). Never commit these files.
   - `apps/backend/.env`
   - `apps/backend/private_access_token.pem`, `apps/backend/public_access_token.pem`, `apps/backend/private_refresh_token.pem`, `apps/backend/public_refresh_token.pem`

   Example (set `ROOT` to `$(git rev-parse --show-toplevel)` and `WT` to `.worktrees/<type>-<iid>-<slug>`):

   ```bash
   rtk cp "$ROOT/apps/backend/.env" "$WT/apps/backend/.env"
   rtk cp "$ROOT/apps/backend/"*.pem "$WT/apps/backend/"
   ```

2. `cd` to the **worktree root** and run `pnpm install` so dependencies are present before Developer tasks. **Never** replace `node_modules` with a symlink to the primary clone; pnpm workspace links would point at the wrong `packages/`. The orchestration pipeline runs `worktree_bot` (`pnpm run worktree:ensure` in that worktree) after you—idempotent and repairs mistaken symlinks. See [`.cursor/skills/worktree-readiness/SKILL.md`](../worktree-readiness/SKILL.md).

3. **Create `CONTEXT.local.md` in the worktree root** (shell only; this path is under `.worktrees/`, not committed). Use a heredoc with at least: `issue_iid`, absolute worktree path, `branch_name`, `created_utc` ([ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) UTC), and placeholder lines for **Acceptance criteria** / **Technical brief** set to `[pending]`. The orchestrator or `developer_bot` will fill those from the GitLab issue. Template reference: [`.cursor/templates/CONTEXT.local.template.md`](../templates/CONTEXT.local.template.md).

   **Path rule:** do **not** `cat` to a relative `CONTEXT.local.md`. After `git worktree add`, resolve a **canonical** absolute worktree path and use the same value in the file body and in your `{ worktree_path, … }` return, e.g. `ROOT=$(git rev-parse --show-toplevel)` then `ABS_WT=$(cd "$ROOT/.worktrees/<type>-<iid>-<slug>" && pwd -P)`.

   ```bash
   # Set ROOT, ISSUE_IID, BRANCH, then resolve ABS_WT (must match worktree_path in handoff)
   ABS_WT="$(cd "$ROOT/.worktrees/<type>-<iid>-<slug>" && pwd -P)"
   cat > "$ABS_WT/CONTEXT.local.md" <<EOF
   # Worktree context (local only)

   | Field | Value |
   |---|---|
   | Issue | #${ISSUE_IID} |
   | Worktree (absolute) | ${ABS_WT} |
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

Ops still does not edit **tracked** source files; `CONTEXT.local.md` lives only under the gitignored worktree and is created with **Bash** like `.env` bootstrap.

## Commit chunking rules

One logical concern per commit. A "concern" is e.g. "add migration", "add service", "wire controller", "add tests", "update types". Do not lump unrelated changes.

Commit message format (conventional, lower-case scope):

```
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

1. **Stop.** Do not “fix” the worktree with extra `pnpm` commands, copied `node_modules`, untracked config shims, or **any** hook bypass. Treat these the same as `--no-verify` (forbidden in `CLAUDE.md`): do not set `HUSKY=0` (or similar) to skip hooks.
2. Return the **full error output** to the PM/orchestrator.
3. Instruct **Developer** to work in the **same worktree** and re-run the **full** self quality gates from `.cursor/skills/developer-impl/SKILL.md` (at minimum `pnpm knip`, `pnpm typecheck`, `pnpm format:check`, `pnpm lint`, `pnpm reseed`, `pnpm test` for affected workspaces; add `pnpm test:e2e` when relevant), until everything passes, then re-run **Adversary** if the diff changed materially, and have the orchestrator call **Ops** again to commit.
4. Do **not** run those `pnpm` commands yourself (see **Forbidden**).

## Never

- `--no-verify`, `--no-gpg-sign` (blocked by repo policy in `CLAUDE.md`). Same intent: no env-based hook skip (`HUSKY=0`, etc.).
- `git push --force` to `main`/`master`.
- `git commit --amend` unless the previous commit was created in this session AND not yet pushed.
- Edit files. On commit or hook failure, follow **Hand back to Developer (pre-commit, lint-staged, or `git commit` failed)** — do not attempt fixes yourself.

## Push + open MR

```bash
cd .worktrees/<type>-<iid>-<slug>
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
rtk git worktree remove .worktrees/<type>-<iid>-<slug>
rtk git branch -D <type>-<iid>-<slug>   # local
rtk git push origin --delete <type>-<iid>-<slug>   # remote if not already auto-pruned
```

## Forbidden

- Mutating **tracked** source with editor tools, or any change outside the documented gitignored bootstrap (`cp` + `pnpm install` in the worktree).
- Running tests, typecheck, lint, or migrations (Developer's job).
- Approving MRs unless explicitly instructed by a human (never by another agent).
