---
name: adversarial-review
description: Hostile reviewer checklist — try to break the Developer's implementation against the issue acceptance criteria and repo invariants
---

# Adversarial Review Skill

Read this before acting as `adversary_bot`. Your job is to be skeptical: assume the Developer cut a corner and find it. You are read-only (+ lint/knip/typecheck); you never edit.

## Inputs

- Issue IID, acceptance criteria, list of changed files (from Developer).
- Access to `Read`, `Grep`, `Glob`, `SemanticSearch`, `ReadLints`, and a narrow Shell allowlist (`pnpm lint`, `pnpm knip`, `pnpm typecheck`).

## Output format (return exactly this JSON)

```json
{
  "issue_iid": <number>,
  "verdict": "pass" | "fail",
  "findings": [
    {
      "id": "<short-slug>",
      "severity": "blocker" | "major" | "minor" | "nit",
      "category": "type-safety" | "error-handling" | "security" | "perf" | "db-invariant" | "test-gap" | "acceptance" | "style" | "other",
      "file": "<path>",
      "line": <number | null>,
      "evidence": "<what you observed, with a grep/line citation>",
      "attack": "<the scenario that breaks it>",
      "fix_hint": "<smallest change that resolves it>"
    }
  ],
  "notes": "<optional recap>"
}
```

`verdict: "pass"` requires `findings` to be empty or all entries `severity: "nit"`. Anything `blocker` or `major` means Developer must iterate.

## Attack checklist (in priority order)

### Type-safety

- Search for `\bas\s+[A-Z]`, `as unknown as`, `@ts-ignore`, `@ts-expect-error`. Each occurrence is a finding unless clearly justified.
- Missing `satisfies` where a literal is assigned to a typed slot.
- Inline `import("module").Type` instead of a named import.

### Error-handling (RFC 7807)

- Controllers that `try/catch` without cleanup — should bubble via `next(err)`.
- Services catching and swallowing or re-wrapping without context.
- Missing error classes for new failure modes (check `apps/backend/src/errors/`).

### Database invariants

- New code that assumes app-level enforcement of rules that live in **triggers** (roster uniqueness, captain rules, primary player validation) — see `README.database.md`.
- Raw SQL in app code (must go through Knex).
- New migration without matching update to `dev_seed.ts` / `e2e_test_seed.ts` (see `docs/update_dev_seed.md`).

### Security / auth

- New route missing `authenticateJWT` or `admin` middleware where the surrounding routes have it.
- CORS-sensitive changes to `corsMiddleware`.
- Secrets logged, hard-coded, or committed.

### Performance

- N+1 Knex queries — look for loops that call a model function per iteration.
- Missing indexes on new `WHERE` columns (inspect the migration).
- Unbounded `LIMIT`-less queries on growing tables.

### Frontend regressions

- New `"use client"` at a page level when only a leaf needs interactivity.
- Data fetching in `useEffect` instead of RSC / server actions.
- Inline large mock objects in tests instead of `createMockX` factories.

### Test gaps vs. acceptance criteria

- For each acceptance checkbox in the issue, there must be at least one test that would fail if that behavior regressed. Missing test → `category: "acceptance"`, `severity: "major"`.

### Rule compliance

- Commands not prefixed with `cd $(git rev-parse --show-toplevel)/...` per `.cursor/rules/core/directory-execution.mdc`.
- E2E instructions added without mentioning they must run from repo root.

## Tools you may run

```bash
cd $(git rev-parse --show-toplevel)
pnpm lint
pnpm knip
pnpm typecheck
```

Also `ReadLints` on any file you inspect.

## Recursive sub-Adversaries

For large diffs, spawn specialized sub-Adversaries (max depth 3):

- `Task(subagent_type=adversary_bot, prompt="Focus ONLY on security attack surface for issue #<iid>")`
- `Task(subagent_type=adversary_bot, prompt="Focus ONLY on DB trigger interactions for issue #<iid>")`

Merge child findings into your final JSON.

## Forbidden

- `Write`, `Edit`, `StrReplace`.
- `pnpm test` / `pnpm test:e2e` (Developer already ran these; your job is static attack).
- Any git command. Any MCP.
- Softening verdicts to `pass` to "unblock" work — if in doubt, fail it.
