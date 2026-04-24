---
description: Execute a PM-scoped GitLab issue through the full specialist pipeline — Explorer → Ops → worktree readiness → Developer (with Adversary loop) → Ops (ready MR) → Review loop (Developer+Adversary+Ops on feedback until clean). Stops at the merge HITL gate.
argument-hint: <issue-iid> [additional context]
---

# /pm-execute — Run the specialist pipeline

Run the **execution** half of the pipeline (Explorer → Ops → worktree → Developer + Adversary + …) on an existing GitLab issue (normally produced by `/pm-plan`).

**Arguments**: `$ARGUMENTS`
First token is the GitLab issue IID. Remaining tokens are optional context passed to every subagent.

---

## Phase 0: Preparation

1. Read `AGENTS.md` — you are orchestrating, not acting as any single specialist.
2. Infer the GitLab project from `git remote get-url origin` (SSH or HTTPS → `group/project`).
3. Fetch the issue: `mcp__GitLab__get_issue` with the parsed project path and IID.
4. Extract: title, description, labels, milestone, acceptance-criteria checklist, any existing `## Technical Brief`, linked issues (`list_issue_links`).
5. Refuse to proceed if:
   - The issue does not exist.
   - The issue has no acceptance criteria. → Tell the human to run `/pm-plan` first or add criteria manually.
   - The issue has label `needs-human-decision`. → Print the summary and stop; humans must resolve.

Show a 5-line status card to the human:

```
Issue #<iid>: <title>
Labels: <labels>
Technical Brief: yes | no
Acceptance criteria: <n> items
Ready: yes | blocked (<reason>)
```

---

## Phase 1: Explorer (only if no Technical Brief yet)

If the issue body does not contain a `## Technical Brief` section, spawn Explorer:

```
Task(subagent_type=explorer_bot,
     prompt="Read .cursor/skills/explorer-research/SKILL.md. Produce the Technical Brief for GitLab issue #<iid> in project <group/project>. Append it as an issue note using mcp__GitLab__create_issue_note. If the scope is larger than one branch, split into sub-issues via create_issue + create_issue_link (relates_to). Do NOT edit any file, do NOT run git. Return {issue_iid, brief_note_id, sub_issue_iids[]}.")
```

Wait for Explorer to complete. Present the Technical Brief to the human and ask via `AskQuestion`:

- **Proceed** — continue to Phase 2.
- **Revise** — send revision notes back to Explorer. Loop.
- **Stop** — print `aborted after exploration` and exit.

---

## Phase 2: Ops — worktree + branch

Spawn Ops:

```
Task(subagent_type=ops_bot,
     prompt="Read .cursor/skills/ops-git-worktrees/SKILL.md. For issue #<iid> titled '<title>' (type <feat|fix|chore|docs>), create a worktree at .worktrees/<type>-<iid>-<slug> off origin/development with branch <type>-<iid>-<slug>. Do NOT edit files. Return {worktree_path, branch_name, issue_iid}.")
```

Capture `{worktree_path, branch_name, issue_iid}`.

---

## Phase 2.5: Worktree readiness (`worktree_bot`)

So `node_modules` and pnpm workspace links in the new worktree are not a broken symlink to the primary clone (and Husky / `lint-staged` resolve the same tree as the Developer’s gates), spawn worktree **before** Developer:

```
Task(subagent_type=worktree_bot,
     prompt="Read .cursor/skills/worktree-readiness/SKILL.md. In worktree <worktree_path> (issue #<iid>), run: cd <worktree_path> && pnpm run worktree:ensure. Return {status, worktree_path, issue_iid, note?}.")
```

If `status` is not `ok`, **stop** the pipeline, return the payload (and any `note`) to the human, and do not spawn `developer_bot` until the worktree install is healthy (re-run worktree, fix paths, or recreate the worktree via Ops). If `ok`, keep `{ worktree_path, branch_name, issue_iid }` and proceed to Phase 3.

**Optional recovery:** if a later `git commit` (Phase 4) or Developer gate failure clearly indicates wrong workspace resolution, the orchestrator may re-run this Phase 2.5 in the same worktree before re-invoking Developer.

---

## Phase 3: Developer + Adversary loop

Spawn Developer with the full context:

```
Task(subagent_type=developer_bot,
     prompt="Read .cursor/skills/developer-impl/SKILL.md. Implement issue #<iid> in worktree <worktree_path>.

Title: <title>
Acceptance criteria:
<bullet list>
Technical Brief:
<brief text>
Additional context: <extra args from $ARGUMENTS>

Rules:
- Every shell command prefixed with cd <worktree_path> (or cd $(git rev-parse --show-toplevel) if on main repo root).
- Delegate to backend_bot / frontend_bot / tester_bot / types_bot / refactor_bot / docs_bot as appropriate for domain depth.
- Before handoff, all must pass: pnpm knip && pnpm typecheck && pnpm format:check && pnpm lint && pnpm reseed && pnpm test (affected workspaces).
- Then invoke Task(subagent_type=adversary_bot, ...) with: issue IID + title, **absolute** `<worktree_path>`, and acceptance-criteria list. The adversary anchors on **`git` diff `merge_base..HEAD` inside that worktree** (it runs read-only git) and returns JSON with `diff_anchoring` and per-finding `scope` per `.cursor/skills/adversarial-review/SKILL.md`. Do not pass a placeholder “X..Y” unless you computed it — the adversary may compute the range. Loop until verdict is 'pass'.
- If Adversary rejects the same diff scope 3+ rounds, STOP and return {status:'stuck', summary, disagreement}.
- Do NOT run git. Do NOT call GitLab MCP. Do NOT edit harness files (.cursor/, .claude/, AGENTS.md).

Return {status:'ready'|'stuck', changed_files[], gate_output, adversary_verdict, summary}.")
```

If Developer returns `status:'stuck'`:

- Page the human: present the disagreement summary, changed-files list, Adversary's final findings.
- Ask via `AskQuestion`: **resolve-and-retry** | **override-adversary** (human decides) | **abort**.
- On retry, relay the human's decision back to Developer as additional context.

If Developer returns `status:'ready'`, proceed to Phase 4.

---

## Phase 4: Ops — commit, push, MR

Spawn Ops again:

```
Task(subagent_type=ops_bot,
     prompt="Read .cursor/skills/ops-git-worktrees/SKILL.md. In worktree <worktree_path> on branch <branch_name>, stage and commit the following files in logically chunked commits (one concern per commit), using Conventional Commits format with 'Refs: #<iid>' and closing the issue in the final MR description. Do NOT use --no-verify or --no-gpg-sign.

Changed files:
<changed_files[]>

After commits, push -u origin <branch_name> and open a **non-draft** (ready) merge request via mcp__GitLab__create_merge_request:
- source_branch: <branch_name>
- target_branch: development (or 'main' if the repo uses that — check existing MRs)
- title: '<type>(<scope>): <short summary>'
- description: short summary + 'Closes #<iid>'
- labels: copy from the issue
- draft: false  (so the MR is visible as Ready; Review feedback uses threads, not draft state)

Immediately after create, you may idempotently call mcp__GitLab__update_merge_request with `draft: false` if the API did not set it as expected.

If you cannot complete `git commit` (pre-commit, lint-staged, hooks, GPG, etc.), stop and return {status: 'commit_failed', error_output: <full log>} — do not bypass hooks. The orchestrator will send Developer back to the same worktree to re-run full pnpm quality gates.

Return {status: 'ok', mr_iid, mr_url, commit_shas[], pipeline_id?} on success, or {status: 'commit_failed', error_output} on failure.")
```

**If the Task returns `status: 'commit_failed'`** (or equivalent): re-run **Phase 3** (Developer) with the **full** `error_output`. Instruct Developer explicitly: in the **same worktree**, re-run the full pnpm self quality gates (`knip`, `typecheck`, `format:check`, `lint`, `reseed`, `test`, and `test:e2e` when relevant), fix until hooks would pass, re-run Adversary if the diff changed, then return to **Phase 4** — do not ask Ops to use `HUSKY=0`, copied `node_modules`, or `--no-verify`. Do not proceed to Phase 5 until commits succeed.

On **`status: 'ok'`**, capture `{mr_iid, mr_url, commit_shas, pipeline_id?}` and continue to Phase 5.

**If `ops_bot` later reports CI failure** (MR pipeline): loop back to Phase 3 with the failure note.

---

## Phase 5: Review (repeatable; see Phase 5b for the loop)

After each `review_bot` run completes, set **`review_pass`** to how many Review phases you have finished in this `pm-execute` run (the first completion → `1`, the second → `2`, etc.).

Spawn Review:

```
Task(subagent_type=review_bot,
     prompt="Read .cursor/skills/code-review-checklist/SKILL.md. Audit MR !<mr_iid> in project <group/project> against issue #<iid> acceptance criteria. Delegate a semantic pass to Task(subagent_type=gitlab-assistant, prompt='Run review-merge-request on MR !<mr_iid>'). Post per-line feedback via create_draft_note and publish in one batch via bulk_publish_draft_notes. Post a summary MR note with the criteria-trace matrix and a verdict: request-changes | comment | approve-pending-human. If anything is 'blocker' or 'major', set label 'needs-human-decision' via update_merge_request. The MR is already non-draft from Ops; if needed, idempotently call update_merge_request with draft: false. NEVER call approve_merge_request or accept_merge_request.

Return {verdict, findings_count, needs_human_decision}.")
```

Capture `{verdict, findings_count, needs_human_decision}`. You have just completed **Review #`review_pass`**.

If `verdict` is `comment` or `approve-pending-human`, go to **Phase 6** (skip Phase 5b below).

## Phase 5b: Review-fix loop (Developer → Adversary → Ops) until clean

If the verdict is `request-changes` (or you need a code follow-up for `needs-human-decision`):

- If **`verdict` is `request-changes` and `review_pass` is 3** (this was the **third** Review in this run), do **not** start another 5b — page the human for **accept-as-is** / manual fix / abort.
- Otherwise run the steps below, then **re-invoke Phase 5** (next `review_bot`); when that run completes, set `review_pass` accordingly (2, then 3, … per line 136).

1. **Gather feedback for Developer** (orchestrator — you, not `developer_bot`): `mcp__GitLab__list_merge_request_discussions` on MR !<mr_iid> and include unresolved threads; combine with the `review_bot` return payload so `developer_bot` has concrete threads to address (Developer cannot call GitLab).

2. **Re-run Phase 3** (Developer) with a **post-review** prompt, e.g.:

```
Task(subagent_type=developer_bot,
     prompt="Read .cursor/skills/developer-impl/SKILL.md. This is a **review-fix** pass for issue #<iid> in worktree <worktree_path> (branch already pushed; MR !<mr_iid>).

Address the following GitLab review feedback and discussion threads (author must act in code; you cannot use GitLab MCP):
<orchestrator-pasted discussions + review_bot summary>

After changes: pnpm knip && pnpm typecheck && pnpm format:check && pnpm lint && pnpm reseed && pnpm test, then Adversary until pass (same rules as the initial implementation pass). If stuck 3+ Adversary rounds, return {status:'stuck', ...}.

Return {status:'ready'|'stuck', changed_files[], ...}.")
```

3. **Re-run Phase 4** (Ops) with a **push-only** prompt, e.g.:

```
Task(subagent_type=ops_bot,
     prompt="Read .cursor/skills/ops-git-worktrees/SKILL.md. In worktree <worktree_path> on existing branch <branch_name>, stage and commit new changes in logically chunked Conventional Commits with 'Refs: #<iid>'. There is already MR !<mr_iid> — do NOT call create_merge_request. Push to origin. Call mcp__GitLab__update_merge_request for MR !<mr_iid> with draft: false if the MR is not already ready. If CI fails, return {status:'ci_failed', note} for Developer. Return {commit_shas[], pipeline_id?}.")
```

If CI fails, loop to Phase 3 with the failure summary.

4. **Re-run Phase 5** (spawn `review_bot` again; see line 136 for `review_pass`). After this completion, re-evaluate from the top of Phase 5 / 5b until:
   - `verdict` is `comment` or `approve-pending-human`, and you are ready for the merge HITL gate → **Phase 6**; or
   - you hit the review cap, `needs-human-decision` is unsolvable by agents, or Developer/Adversary is **stuck** (same rules as the initial pass) → page the human.

If `verdict = request-changes` but the human (via `AskQuestion`) chooses **accept-as-is** (optional HITL override any time on `needs-human-decision` or at max attempts):

- Do **not** re-run the bot loop. Ensure MR is non-draft with `mcp__GitLab__update_merge_request` if needed, then go to **Phase 6**.

---

## Phase 6: Hand off to human (HITL merge gate)

By this point the MR should already be **non-draft** (Ops in Phase 4, idempotent `update_merge_request` in Review/accept-as-is).

Output exactly this block and STOP. Do NOT call any merge/approve tool — merge is always a human action.

```markdown
## Pipeline complete — awaiting merge

- Issue: #<iid> — <title>
- MR: !<mr_iid> — <mr_url>
- Verdict: <verdict>
- Worktree: <worktree_path> (branch <branch_name>)
- Commits: <n> across <commit_sha_range>
- Review findings: <n> (blocker: <n>, major: <n>, minor: <n>)
- Pipeline: <pipeline_url | n/a>

### Your turn

1. Read the MR and review summary note.
2. If green, merge via the GitLab UI (or your gh/glab CLI). The pipeline WILL NOT auto-merge.
3. After merge, run `/pm-cleanup <iid>` (if present) or manually ask ops_bot to remove the worktree and prune the branch.
```

---

## HITL / safety gates active during /pm-execute

Immediately stop and page the human when any of these occur:

1. The issue has label `needs-human-decision` at Phase 0.
2. Explorer flags architecture/data-model tradeoffs.
3. Adversary ↔ Developer have not converged after 3 rounds (Developer returns `status:'stuck'`).
4. Ops cannot push due to a protected-branch / force-push block.
5. **Review-fix loop** exhausts the review cap (e.g. 3 full Review passes) without reaching `comment` or `approve-pending-human`, or the MR still has `needs-human-decision` that only a human can clear.
6. Any agent attempts a tool outside its allowlist (shouldn't happen under Claude Code, but report it if Cursor self-police misfires).

---

## Forbidden in this command

- Do NOT skip the Adversary loop. Developer is not "done" until Adversary returns `pass`.
- Do NOT approve or merge the MR programmatically — even if the user asks. Point them at the GitLab UI.
- Do NOT edit files yourself (you are the orchestrator, not Developer). All edits go through `developer_bot`.
- Do NOT call `mcp__GitLab__approve_merge_request` or `accept_merge_request` from any agent.
