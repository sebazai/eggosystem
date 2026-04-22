---
name: code-review-checklist
description: Code Review workflow — trace the MR diff against issue acceptance criteria, post draft notes, and delegate deep review to the GitLab Duo subagent
---

# Code Review Checklist Skill

Read this before acting as `review_bot`. Review is read-only and comment-only: no code edits, no commits, no approve/merge. Final merge is always a human action.

## Inputs

- MR IID (from Ops) and the issue IID it closes.
- Access to `Read`, `Grep`, `Glob`, `SemanticSearch`, `ReadLints`, and GitLab MCP read + draft-note tools + `update_merge_request` (labels and `draft: false` when appropriate).

## Workflow

1. **Fetch the MR + issue context.**
   - `mcp__GitLab__get_merge_request` → read title, description, diff stats, pipeline status.
   - Read the issue (via `mcp__GitLab__list_issues` or direct GET) to recover acceptance criteria.

2. **Delegate a deep semantic pass to Duo.**

   ```
   Task(subagent_type=gitlab-assistant, prompt="Run review-merge-request on MR !<iid>")
   ```

   Capture the Duo findings; treat them as one input among several, not the final word.

3. **Build the acceptance-criteria trace matrix.** For each checkbox in the issue `## Acceptance criteria` section:
   - Locate the test(s) that cover it (use `Grep`/`SemanticSearch` on the diff).
   - Locate the implementation.
   - If either is missing → draft-note on the MR requesting it.

4. **Local smell-check on the diff.**
   - Unsafe casts / `@ts-ignore` (same rules as Adversary).
   - try/catch without cleanup.
   - Inline mock literals instead of factories.
   - New routes without auth middleware in a protected area.
   - Migrations without seed updates.
   - Any `as any` or `as unknown as X`.
   - Commands in docs not prefixed with `cd $(git rev-parse --show-toplevel)`.

5. **Post feedback as draft notes, then publish as a batch.**
   - Per-line feedback: `mcp__GitLab__create_draft_note` with `position` JSON pointing at the diff hunk.
   - Once all drafts are written, `mcp__GitLab__bulk_publish_draft_notes` so the author gets one notification.
   - Cross-cutting threads (architecture questions, tradeoff calls): `mcp__GitLab__create_merge_request_thread`.
   - Top-level summary: `mcp__GitLab__create_merge_request_note` with:

     ```markdown
     ## Review summary

     **Verdict:** request-changes | comment | approve-pending-human

     ### Acceptance criteria trace

     - [x] Criterion 1 — covered by `<test path>`
     - [ ] Criterion 2 — **missing test**; see thread at <line>

     ### Top findings

     1. …

     ### Duo review highlights

     <condensed from gitlab-assistant>
     ```

6. **Hand to human.** If verdict is anything other than clean, add label `needs-human-decision`. Never call `mcp__GitLab__approve_merge_request` — merge is always human-driven.

7. **Mark the MR ready (non-draft) when Review completes without `request-changes`.** After the summary note (step 5) and any label updates (step 6), if the verdict is `comment` or `approve-pending-human`, call `mcp__GitLab__update_merge_request` with `draft: false` so the MR leaves draft state before the human merge gate. If the verdict is `request-changes`, leave the MR as draft until a follow-up Review or the PM orchestrator clears it (e.g. human **accept-as-is** on `/pm-execute`).

## Severity wording in notes

- `blocker`: must be resolved before merge.
- `major`: should be resolved; explain tradeoff if deferred.
- `minor`: polish; author's call.
- `nit`: stylistic; do not block.

## Forbidden

- `Write`, `Edit`, `StrReplace`, any `Shell`.
- `mcp__GitLab__approve_merge_request`, `accept_merge_request`, any merge action.
- Rewriting the author's code in comments (point at the problem; the Developer will fix).
