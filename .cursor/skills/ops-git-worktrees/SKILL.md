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
    <iid>-<slug>/      # working tree for issue #<iid>
```

`.worktrees/` is gitignored.

## Branch naming

- `feat/<iid>-<slug>` — features
- `fix/<iid>-<slug>` — bug fixes
- `chore/<iid>-<slug>` — refactors / infra
- `docs/<iid>-<slug>` — docs-only

`<slug>` is kebab-case, ≤40 chars, derived from the issue title.

## Create a worktree (handed back to Developer)

```bash
cd $(git rev-parse --show-toplevel)
git fetch origin
git worktree add .worktrees/<iid>-<slug> -b feat/<iid>-<slug> origin/main
```

Post the worktree path + branch name back to PM/Developer as the handoff artifact.

## Worktree bootstrap (before Developer starts)

So the worktree can run `pnpm dev` without manual setup:

1. From the **primary** repo clone, copy gitignored backend locals into the worktree (same relative paths). Never commit these files.
   - `apps/backend/.env`
   - `apps/backend/private_access_token.pem`, `apps/backend/public_access_token.pem`, `apps/backend/private_refresh_token.pem`, `apps/backend/public_refresh_token.pem`

   Example (set `ROOT` to `$(git rev-parse --show-toplevel)` and `WT` to `.worktrees/<iid>-<slug>`):

   ```bash
   cp "$ROOT/apps/backend/.env" "$WT/apps/backend/.env"
   cp "$ROOT/apps/backend/"*.pem "$WT/apps/backend/"
   ```

2. `cd` to the **worktree root** and run `pnpm install` so dependencies are present before Developer tasks.

Ops still does not edit tracked source files; this is shell-only bootstrap of local secrets and node_modules.

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
git commit -m "$(cat <<'EOF'
feat(backend): add caster-application submit endpoint

Refs: #123
EOF
)"
```

## Never

- `--no-verify`, `--no-gpg-sign` (blocked by repo policy in `CLAUDE.md`).
- `git push --force` to `main`/`master`.
- `git commit --amend` unless the previous commit was created in this session AND not yet pushed.
- Edit files. If a commit fails because of formatting or lint hooks, hand back to Developer with the failure output.

## Push + open MR

```bash
cd .worktrees/<iid>-<slug>
git push -u origin HEAD
```

Then open the MR via MCP:

- `mcp__GitLab__create_merge_request` with `source_branch`, `target_branch=main`, `title` = `<type>(<area>): <summary>`, `description` linking the issue (`Closes #<iid>`), `draft=true` until Review signs off.

Post the MR IID back to PM + Review.

## CI handling

- Poll `mcp__GitLab__get_pipeline` for the latest pipeline on the MR.
- On failure: post a concise summary as an MR note (`create_merge_request_note`) and hand control back to Developer — do not attempt to fix code.
- On success: post a green check note and notify Review.

## Cleanup (after merge)

```bash
cd $(git rev-parse --show-toplevel)
git worktree remove .worktrees/<iid>-<slug>
git branch -D feat/<iid>-<slug>   # local
git push origin --delete feat/<iid>-<slug>   # remote if not already auto-pruned
```

## Forbidden

- Mutating **tracked** source with editor tools, or any change outside the documented gitignored bootstrap (`cp` + `pnpm install` in the worktree).
- Running tests, typecheck, lint, or migrations (Developer's job).
- Approving MRs unless explicitly instructed by a human (never by another agent).
