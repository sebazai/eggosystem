---
name: developer-impl
description: Developer workflow — implement code in a worktree, run quality gates, delegate to domain bots, and gate on the Adversary before handing off to Ops
---

# Developer Implementation Skill

Read this before acting as `developer_bot`. Developer writes code and runs tests; Developer never touches git and never calls GitLab MCP.

## Inputs

- A **canonical** worktree path + branch name from the orchestrator (from `ops_bot`); the path should be absolute and match the **Worktree (absolute)** cell in `CONTEXT.local.md` (ops uses `cd "$ROOT/.worktrees/…" && pwd -P`). The orchestrator should run `worktree_bot` / `pnpm run worktree:ensure` in that worktree first so pnpm and Husky resolve this tree’s `packages/`, not a symlinked `node_modules` from another clone. If you see `MODULE_NOT_FOUND`, knip, or linters flagging the wrong `packages/`, ask the PM to re-run the worktree step—do not symlink or copy `node_modules` from the main repo.
- A GitLab issue IID with acceptance criteria and the Explorer's `## Technical Brief`.
- **Local context file** — `CONTEXT.local.md` in the worktree root (see [`.cursor/templates/CONTEXT.local.template.md`](../../templates/CONTEXT.local.template.md)). `ops_bot` writes a **stub**; you must ensure acceptance criteria, Technical Brief, and sub-issues are present (copy from the orchestrator’s first message if sections are still `[pending]` or empty).
- Explorer context (supplement; must be available via paste and/or a filled `CONTEXT.local.md` since Developer cannot use GitLab MCP):
  - Explorer comments/notes that clarify scope, edge-cases, or constraints
  - Any sub-issues (child/linked issues) and their acceptance criteria / notes

## `Task` prompt checklist (subagents: `backend_bot`, `frontend_bot`, `tester_bot`, `types_bot`, `refactor_bot`, `docs_bot`, `verifier_bot`)

`Task` does not inherit the parent turn. **Every** spawn must include:

1. **Absolute** worktree path and issue **IID** + one-line title.
2. `Read .cursor/agents/<role>.md` and the **Must-read** skills listed there.
3. **Acceptance criteria** (bullets) and any **non-goals** or constraints from `CONTEXT.local.md` or the prompt.
4. **Packages/areas in scope** and what is **out of scope** for this `Task`.
5. The **single intent** the parent is asking for (e.g. “add integration test for X”, not “fix everything”).

### Adversary follow-up passes (round 2+)

If re-invoking `adversary_bot` after a **first full** pass, you may **shorten** the prompt: e.g. “re-establish `diff_anchoring` in the worktree; same acceptance criteria as the previous pass; **re-check** prior finding areas: …”. The adversary must still **recompute** `diff_anchoring` in the worktree. Use the long template in step 7 for the first full review of a work chunk.

## Workflow

1. **Enter the worktree.** All shell commands must start with `cd $(git rev-parse --show-toplevel)` (or the worktree root) per `.cursor/rules/core/directory-execution.mdc`.
2. **Load `CONTEXT.local.md`.** `Read` `<worktree>/CONTEXT.local.md` before coding. If the stub has `[pending]` or empty **Acceptance criteria** / **Technical brief**, `Write` the file using the text the orchestrator pasted in your prompt, then continue. This file is the shared anchor for you and every `Task` you spawn. You may append a line to the optional **Stage log** when you complete a major milestone.
3. **TDD loop** where appropriate (see `.cursor/skills/tdd-workflow/SKILL.md`):
   - Add or update a failing test first using factories from `@eggosystem/types`.
   - Implement until green.
4. **Delegate domain depth** to the existing specialists via `Task` (use the **Task prompt checklist** above) when the change is concentrated in one area:
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
   pnpm reseed
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
   1) Establish diff_anchoring in this worktree only, per the skill:
      - Prefer staged diff (`git diff --cached`) if there are staged changes
      - Otherwise diff committed work vs `development` (`git diff <merge_base>..HEAD`)
   2) Primary surface = that diff. Apply scope/severity from the skill (diff vs context vs preexisting vs workspace-gate).
   3) Return the JSON with diff_anchoring and scope on every finding.
   4) Sub-adversaries must get the same worktree + range + files_changed in their prompt.
   ")
   ```

7. **Address findings** (prefer **`scope: diff` / `context` / `acceptance` / scoped `workspace-gate`** first; challenge `touched-file-preexisting` / broad knip only if the skill allows full severity). Re-run gates, re-invoke Adversary. Repeat until verdict is `pass` (empty findings or nits only).
8. **Hand off to Ops.** Post a short note to the issue listing changed files and the final commit range hint. Do NOT commit yourself.

## When Ops cannot complete commits (hooks / pre-commit / lint-staged)

If the PM/orchestrator reports that `git commit` failed in your worktree, treat it as a failed gate: stay in the **same worktree**, re-run the **full** self quality gates in step 5 until they all pass, re-invoke **Adversary** if the diff changed in a non-trivial way, then have the orchestrator hand back to **Ops** for staging and commit. Do not ask anyone to use `HUSKY=0`, copied `node_modules`, or `--no-verify`.

## Post-`review_bot` pass (`/pm-execute` only)

The **orchestrator** will supply review feedback (ideally a **summary table**: file or thread → ask) rather than raw API dumps (see `/pm-execute` Phase 5b). You still must not call GitLab MCP. **Update** the **Review-fix queue** section in `CONTEXT.local.md` with the current asks, then treat that as the checklist: implement fixes, re-run the same quality gates, pass Adversary, then hand off to Ops for chunked commits and push to the **existing** branch. The orchestrator runs `review_bot` again after Ops pushes.

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
