# Worktree context (`CONTEXT.local.md`)

**Create at the repository root** as `CONTEXT.local.md` after `ops_bot` creates the issue branch. It is **gitignored** at `/CONTEXT.local.md` so it is not pushed. The **Worktree (absolute)** field is the canonical `pwd -P` of the primary clone (Git names every checkout a “worktree”).

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
