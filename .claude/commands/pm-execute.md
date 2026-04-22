---
description: Execute a PM-scoped GitLab issue through the full specialist pipeline — Explorer → Ops → Developer (with Adversary loop) → Ops → Review. Stops at the merge HITL gate.
argument-hint: <issue-iid> [additional context]
---

# /pm-execute — Run the specialist pipeline

Run the **execution** half of the 6-specialist pipeline on an existing GitLab issue (normally produced by `/pm-plan`).

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
     prompt="Read .cursor/skills/ops-git-worktrees/SKILL.md. For issue #<iid> titled '<title>' (type <feat|fix|chore|docs>), create a worktree at .worktrees/<iid>-<slug> off origin/development with branch <type>/<iid>-<slug>. Do NOT edit files. Return {worktree_path, branch_name, issue_iid}.")
```

Capture `{worktree_path, branch_name, issue_iid}`.

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
- Before handoff, all must pass: pnpm knip && pnpm typecheck && pnpm format:check && pnpm lint && pnpm test (affected workspaces).
- Then invoke Task(subagent_type=adversary_bot, ...) with commit range X..Y and acceptance criteria. Loop until verdict is 'pass'.
- If Adversary rejects the same file range 3+ rounds, STOP and return {status:'stuck', summary, disagreement}.
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

After commits, push -u origin <branch_name> and open a DRAFT merge request via mcp__GitLab__create_merge_request:
- source_branch: <branch_name>
- target_branch: development (or 'main' if the repo uses that — check existing MRs)
- title: '<type>(<scope>): <short summary>'
- description: short summary + 'Closes #<iid>'
- labels: copy from the issue
- draft: true

Return {mr_iid, mr_url, commit_shas[], pipeline_id?}.")
```

Capture `{mr_iid, mr_url, commit_shas, pipeline_id?}`.

If Ops reports CI failure immediately, loop back to Phase 3 with the failure note.

---

## Phase 5: Review

Spawn Review:

```
Task(subagent_type=review_bot,
     prompt="Read .cursor/skills/code-review-checklist/SKILL.md. Audit MR !<mr_iid> in project <group/project> against issue #<iid> acceptance criteria. Delegate a semantic pass to Task(subagent_type=gitlab-assistant, prompt='Run review-merge-request on MR !<mr_iid>'). Post per-line feedback via create_draft_note and publish in one batch via bulk_publish_draft_notes. Post a summary MR note with the criteria-trace matrix and a verdict: request-changes | comment | approve-pending-human. If anything is 'blocker' or 'major', set label 'needs-human-decision' via update_merge_request. If verdict is comment or approve-pending-human, call update_merge_request with draft: false so the MR is no longer a draft. NEVER call approve_merge_request or accept_merge_request.

Return {verdict, findings_count, needs_human_decision}.")
```

Capture `{verdict, findings_count, needs_human_decision}`.

If `verdict = request-changes`:

- Present findings to human. Ask via `AskQuestion`: **fix-and-retry** (loop to Phase 3) | **accept-as-is** | **abort**.
- If the human chooses **accept-as-is**, call `mcp__GitLab__update_merge_request` for MR !<mr_iid> with `draft: false` (MR stays open for human merge; this only clears draft state).

---

## Phase 6: Hand off to human (HITL merge gate)

By this point the MR must be **non-draft** unless you are stopping before Phase 6: `review_bot` clears draft when the verdict is `comment` or `approve-pending-human`; after **accept-as-is** you must have called `mcp__GitLab__update_merge_request` with `draft: false`.

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
5. Review verdict is anything other than `comment` — hand to human.
6. Any agent attempts a tool outside its allowlist (shouldn't happen under Claude Code, but report it if Cursor self-police misfires).

---

## Forbidden in this command

- Do NOT skip the Adversary loop. Developer is not "done" until Adversary returns `pass`.
- Do NOT approve or merge the MR programmatically — even if the user asks. Point them at the GitLab UI.
- Do NOT edit files yourself (you are the orchestrator, not Developer). All edits go through `developer_bot`.
- Do NOT call `mcp__GitLab__approve_merge_request` or `accept_merge_request` from any agent.
