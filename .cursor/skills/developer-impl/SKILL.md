---
name: developer-impl
description: Developer workflow — implement code in a worktree, run quality gates, delegate to domain bots, and gate on the Adversary before handing off to Ops
---

# Developer Implementation Skill

Read this before acting as `developer_bot`. Developer writes code and runs tests; Developer never touches git and never calls GitLab MCP.

## Inputs

- A worktree path + branch name from Ops.
- A GitLab issue IID with acceptance criteria and the Explorer's `## Technical Brief`.

## Workflow

1. **Enter the worktree.** All shell commands must start with `cd $(git rev-parse --show-toplevel)` (or the worktree root) per `.cursor/rules/core/directory-execution.mdc`.
2. **Re-read the brief.** Open the issue description + technical brief before coding.
3. **TDD loop** where appropriate (see `.cursor/skills/tdd-workflow/SKILL.md`):
   - Add or update a failing test first using factories from `@eggosystem/types`.
   - Implement until green.
4. **Delegate domain depth** to the existing specialists via `Task` when the change is concentrated in one area:
   - Backend (Express/Knex/Zod/RFC 7807) → `backend_bot`
   - Frontend (Next.js RSC / shadcn / forms) → `frontend_bot`
   - Tests (Jest / Playwright / MSW) → `tester_bot`
   - Shared types & factories → `types_bot`
   - Safe renames / dedupe → `refactor_bot`
   - Docs changes explicitly requested → `docs_bot`
   - Rule-compliance verification at the end → `verifier_bot`
5. **Self quality gates** (all must pass before invoking Adversary):

   ```bash
   cd $(git rev-parse --show-toplevel)
   pnpm knip
   pnpm typecheck
   pnpm format:check
   pnpm lint
   pnpm test                # affected workspace(s)
   ```

   For E2E when relevant: `pnpm test:e2e` from repo root (see `.cursor/skills/e2e-playwright/SKILL.md`).

6. **Invoke Adversary** once locally green. You do **not** run `git` (forbidden) — the adversary establishes **`git merge-base .. HEAD` and the file list in that worktree** and anchors review on the diff. Pass everything it needs in the `Task` prompt:

   ```
   Task(subagent_type=adversary_bot,
        prompt="Read .cursor/skills/adversarial-review/SKILL.md.

   Issue #<iid> — <title or short ref>
   Worktree: <absolute worktree path> (cd here first; that is the repo for read-only git).
   Acceptance criteria (must trace tests and behavior to these):
   <bullet list>

   Instructions:
   1) Establish diff_anchoring: merge_base vs HEAD, files_changed, in this worktree only.
   2) Primary surface = that diff. Apply scope/severity from the skill (diff vs context vs preexisting vs workspace-gate).
   3) Return the JSON with diff_anchoring and scope on every finding.
   4) Sub-adversaries must get the same worktree + range + files_changed in their prompt.
   ")
   ```

7. **Address findings** (prefer **`scope: diff` / `context` / `acceptance` / scoped `workspace-gate`** first; challenge `touched-file-preexisting` / broad knip only if the skill allows full severity). Re-run gates, re-invoke Adversary. Repeat until verdict is `pass` (empty findings or nits only).
8. **Hand off to Ops.** Post a short note to the issue listing changed files and the final commit range hint. Do NOT commit yourself.

## Coding rules (hard-enforced repo-wide)

- No unsafe casts `as`. Use `satisfies`, type guards, or properly typed mocks (see `.cursor/skills/type-safety/SKILL.md`).
- No try/catch unless it owns cleanup (e.g. DB transactions). Let errors bubble to the Express RFC 7807 handler (see `.cursor/skills/error-handling/SKILL.md`).
- Prefer exports + imports over duplication.
- Backend uses Knex for app queries; MariaDB MCP is read-only exploration only.
- Frontend: RSC-first; minimize `use client` / `useEffect` / client-side fetching.
- Test data comes from `@eggosystem/types` factories — never inline large mock objects.

## Loop-break safety

If Adversary ↔ Developer have not converged on the same **diff-anchored** scope 3+ rounds, stop and surface the disagreement to PM with a short summary. Let the human resolve the tradeoff.

## Forbidden

- `git *` of any kind.
- `mcp__GitLab__*` of any kind.
- `WebFetch` / `WebSearch` (Explorer's domain).
- Editing `.claude/`, `.cursor/agents/`, or `AGENTS.md` (harness files — require human review).
