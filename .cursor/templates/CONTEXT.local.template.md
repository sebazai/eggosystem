# Worktree context (`CONTEXT.local.md`)

**Copy to the worktree root** as `CONTEXT.local.md` after `ops_bot` creates the worktree. The worktree path lives under `.worktrees/`, which is not committed, so this file is never pushed.

`ops_bot` may create a **stub** (acceptance + brief = `[pending]`, optional sections omitted). This **full** template is the target shape once the issue is wired in. `developer_bot` (or the orchestrator on first spawn) must replace `[pending]` using the same text as the GitLab issue and Technical Brief (see `developer-impl` skill).

---

## [Issue title - optional]

| Field                | Value |
| -------------------- | ----- |
| Issue                | #     |
| Worktree (absolute)  | ` `   |
| Branch               | ` `   |
| GitLab project (opt) | ` `   |

## Acceptance criteria

> Replace with the issue checkbox list and any sub-issue criteria.

- [ ] …

## Technical brief (Explorer)

> Paste the `## Technical Brief` body from the issue (or write “N/A”).

## Sub-issues / links

- …

## Non-goals (optional)

- …

## Review-fix queue (optional, orchestrator)

After `review_bot`, a compact checklist of unresolved feedback (file → ask). Prefer a **summary table** over pasting full GitLab JSON.

| Thread / file | Ask / resolution |
| ------------- | ---------------- |
|               |                  |

## Stage log (optional, append-only)

| UTC / event        | Note                     |
| ------------------ | ------------------------ |
| e.g. Explorer done | Technical Brief on issue |
