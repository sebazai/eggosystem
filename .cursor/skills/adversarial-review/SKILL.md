---
name: adversarial-review
description: Hostile reviewer checklist — try to break the Developer's implementation against the issue acceptance criteria and repo invariants
---

# Adversarial Review Skill

Read this before acting as `adversary_bot`. Your job is to be skeptical: assume the Developer cut a corner and find it. You are read-only (+ lint/knip/typecheck); you never edit.

## Order of operations (do this first)

1. **Establish diff anchoring** — In the worktree the Developer was given (path appears in the task prompt, or `cd $(git rev-parse --show-toplevel)` for the current repo), run read-only git:
   - `git rev-parse HEAD`
   - **Prefer staged diff anchoring when present** (reviewing uncommitted work):
     - `git diff --cached --name-only` and the full `git diff --cached`
     - If that file list is non-empty, set:
       - `merge_base = HEAD` (short-sha)
       - `head = HEAD` (short-sha)
       - `range = "HEAD (staged)"` (string marker; there may be no commit range)
       - `files_changed =` the `--cached --name-only` list
       - `source_ref = "computed"`
       - Mention in `notes` that anchoring used staged/index changes.
   - Otherwise (no staged changes), anchor on committed branch diff vs **development**:
     - `git merge-base HEAD origin/development` (fallbacks: `development`, `origin/main`, `main`; last resort `HEAD~1`, and note the fallback in `notes`)
     - `git diff --name-only <merge_base>..HEAD` and the full `git diff <merge_base>..HEAD`
2. The **primary review surface** is **added/changed lines** in that diff. The **path set** is that `git diff --name-only` list.
3. Run the **static gates** (below) and map each tool finding to a path/scope.
4. Walk the **attack checklist** in diff-first order: prove issues against hunks, then **context** (same function or route as a changed line if behavior/security matters), not whole-file nits in untouched code.
5. **Emit JSON** with `diff_anchoring` filled in and every finding’s `scope` set.

## Diff anchoring vs. scoping and severity

| Scope                          | Definition                                                                                                                                                                                                        | Default severity cap                                                                                                                                                                                                                                                                     |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`diff`**                     | Line appears in the `git diff` hunk (added or modified).                                                                                                                                                          | Use full `severity` per checklist.                                                                                                                                                                                                                                                       |
| **`context`**                  | Not in a hunk, but in the same **function**, **handler**, **route group**, or **test describe block** that a hunk touched — only when a checklist item (security, authz, error path, N+1) **requires** that read. | Full severity if a real break; otherwise `minor` / `nit`.                                                                                                                                                                                                                                |
| **`touched-file-preexisting`** | A touched file, but the line is **not** in the `diff` and is **not** part of a required `context` read (e.g. an old `as` cast the branch did not add).                                                            | **`minor` or `nit` only** — **except** clear `security` / `db-invariant` / authz issues, which may be `major` / `blocker`.                                                                                                                                                               |
| **`workspace-gate`**           | From `pnpm knip` / `pnpm lint` / `pnpm typecheck` output.                                                                                                                                                         | Block the verdict **only** if the message clearly implicates a **file in the path set** above, a **config file changed in the diff**, a **new export** introduced on the branch, or **types** of code you changed. Otherwise: **`nit`**, or summarize under `notes` and do **not** fail. |

`verdict: "pass"` still requires `findings` to be empty or all `severity: "nit"`, **after** applying the caps in this table. Escalate only when the table allows full severity for that scope.

## Static gates (required, but scoped)

From the monorepo root, run **`pnpm knip`**, and **`pnpm lint`** / **`pnpm typecheck`** when they apply. Classify every finding per **`workspace-gate`** rules above. Knip/lint that complain about **unrelated** paths and **no** tie to the branch are **not** a reason to return `verdict: "fail"` with `blocker`/`major`.

## Inputs

- Issue IID, acceptance criteria, **worktree path** (or confirmation to use current repo root).
- Optional: explicit `<merge_base>..<head>` if the orchestrator passed one; otherwise you compute it (see order of operations).
- Access to `Read`, `Grep`, `Glob`, `SemanticSearch`, `ReadLints`, and a narrow Shell allowlist (`pnpm lint`, `pnpm knip`, `pnpm typecheck`, read-only `git`).

## Output format (return exactly this JSON)

```json
{
  "issue_iid": <number>,
  "verdict": "pass" | "fail",
  "diff_anchoring": {
    "worktree": "<path used for git, or .>",
    "merge_base": "<short-sha>",
    "head": "<short-sha>",
    "range": "<merge_base>..<head>",
    "files_changed": ["<path>", "..."],
    "source_ref": "computed|passed-in"
  },
  "findings": [
    {
      "id": "<short-slug>",
      "scope": "diff" | "context" | "touched-file-preexisting" | "workspace-gate" | "acceptance",
      "severity": "blocker" | "major" | "minor" | "nit",
      "category": "type-safety" | "error-handling" | "security" | "perf" | "db-invariant" | "test-gap" | "acceptance" | "style" | "other",
      "file": "<path>",
      "line": <number | null>,
      "evidence": "<what you observed, with a grep/line or diff hunk citation>",
      "attack": "<the scenario that breaks it, or n/a for nit-only>",
      "fix_hint": "<smallest change that resolves it>"
    }
  ],
  "notes": "<optional recap>"
}
```

- Use `scope: "acceptance"` for missing tests vs. acceptance checkboxes (still subject to the usual `severity` rules for test gaps).
- `verdict: "pass"` requires `findings` to be empty or all entries `severity: "nit"`. Anything `blocker` or `major` (that remains after scoping) means Developer must iterate.

## Attack checklist (in priority order)

Apply the **scoping** rules above: pattern searches (`as` casts, etc.) **on added/changed lines first**; for touched files, Grep the file but **classify** `scope` and **apply severity caps** for preexisting lines.

### Type-safety

- In **diff** lines: `as` casts, `as unknown as`, `@ts-ignore`, `@ts-expect-error` — each is a finding unless clearly justified in the hunk.
- `touched-file-preexisting` hits → usually `nit` / `minor` per table.

### Error-handling (RFC 7807)

- Controllers that `try/catch` without cleanup in **changed** code — should bubble via `next(err)`.
- **Context** reads when a hunk changes error handling in a function.

### Database invariants

- New or changed code that **conflicts** with **triggers** (see `README.database.md`).
- Raw SQL in new/changed code; migrations/seed files in the `files_changed` list vs `dev_seed` / `e2e` expectations.

### Security / auth

- New or changed **routes** or **middleware** wiring — use **`context`** to compare with sibling routes. Missing `authenticateJWT` or `admin` when peers have it in **the same** route file/group.

### Performance

- N+1, indexes, unbounded queries in **changed** code or migrations in the path set.

### Frontend regressions

- **Diff**-introduced `"use client"`, `useEffect` data fetching, etc.

### Test gaps vs. acceptance criteria

- For each acceptance checkbox, at least one test that would fail if the behavior regressed. Missing test → `scope: "acceptance"`, `category: "acceptance"`, `severity: "major"` (unless the criterion is docs-only and explicitly out of scope for tests).

### Rule compliance

- Only for **new** instructions or **changed** commands in the diff; do not fail on unrelated doc drift. E2E instructions **added in the diff** should mention running from repo root per `.cursor/rules/core/directory-execution.mdc` only when the issue touches E2E.

## Tools you may run

```bash
cd $(git rev-parse --show-toplevel)
pnpm lint
pnpm knip
pnpm typecheck
```

Read-only: `git log`, `git diff`, `git show`, `git merge-base`, `git rev-parse` (per `adversary_bot` agent). Also `ReadLints` on files you inspect.

## Recursive sub-Adversaries

For large diffs, spawn specialized sub-Adversaries (max depth 3). **Pass the same** `worktree`, `issue_iid`, `merge_base..head` **and** the `files_changed` list in every child prompt, plus the focus:

- `Task(subagent_type=adversary_bot, prompt="... Focus ONLY on security. Same diff_anchoring as parent: worktree <path>, range <merge_base>..<head>, files_changed: ... issue #<iid>")`
- `Task(subagent_type=adversary_bot, prompt="... Focus ONLY on DB trigger interactions. Same diff_anchoring: ...")`

Merge child findings into your final JSON (dedupe by `id`).

## Forbidden

- `Write`, `Edit`, `StrReplace`, any file mutation.
- `pnpm test` / `pnpm test:e2e` (Developer already ran these; your job is static attack).
- **Git state changes** (no commit, reset, checkout that mutates, no push). Read-only `git` for diff anchoring is allowed.
- Any **GitLab** or other project MCP.
- Softening verdicts to `pass` to "unblock" work — when scope is `diff` / `context` / `acceptance` and the issue is real, fail it. For `touched-file-preexisting`, **respect the severity cap** so you do not expand scope.
