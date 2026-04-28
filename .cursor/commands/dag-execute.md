---
description: Execute a GitLab issue through the DAG-driven multi-agent pipeline — Product → Decompose → Architecture (HITL) → DAG implementation (parallel) → Final Review → human merge. Strict JSON envelope contract; one MR per task.
argument-hint: <issue-iid> [optional context]
---

# /dag-execute — DAG-driven multi-agent pipeline

Orchestrate a GitLab issue end-to-end via 10 specialized agents (`product_bot`, `decomposer_bot`, `architect_bot`, `implementer_bot`, `ui_bot`, `adversary_bot`, `code_review_bot`, `final_review_bot`, `devops_bot`, `observer_bot`). Each agent returns a strict JSON envelope per `/workspace/.cursor/skills/json-handoff/SKILL.md`. You (the orchestrator) parse those envelopes, coordinate worktrees, manage branch dependencies, and gate the human at four HITL points.

**Arguments**: `$ARGUMENTS`
First token = GitLab issue IID. Remaining tokens = optional context appended to every subagent prompt.

You are NOT any single agent. You ONLY parse envelopes and dispatch `Task` calls.

---

## Mandatory reads (before Phase 0)

1. `/workspace/.cursor/skills/json-handoff/SKILL.md` — envelope contract.
2. `/workspace/CLAUDE.md` — repo conventions (RTK prefix, hooks, gates, branching).
3. The system reminder for project remote: `rtk git remote -v` to derive `<group/project>` for GitLab MCP calls.

---

## Phase 0 — Preparation

1. Parse `<iid>` from `$ARGUMENTS`.
2. Derive `<group/project>` from `rtk git remote -v`.
3. `mcp__GitLab__get_issue(project=<group/project>, issue_iid=<iid>)`.
4. Refuse to proceed if:
   - Issue not found.
   - Issue has label `needs-human-decision` → print issue summary and stop.
5. Print a status card:

```
Issue #<iid>: <title>
Labels: <labels>
Pipeline: /dag-execute
Phase: 0 → preparation OK
```

---

## Phase 1 — Product

Spawn `product_bot`:

```
Task(subagent_type=product_bot,
     prompt="Read /workspace/.cursor/agents/product_bot.md. Convert GitLab issue #<iid> in project <group/project> into structured stories. Return ONLY the JSON envelope.")
```

Parse the envelope. On `status="blocked"` → stop, surface `errors[]` to human.

On `hitl_required=true` → use `AskQuestion` with `hitl_reason` to clarify, then re-spawn with the answers in `clarifications[]`.

Render `payload.stories` and `payload.kpis` to a markdown comment and post via `mcp__GitLab__create_issue_note`. Title the comment `## Stories (product_bot)`.

---

## Phase 2 — Decompose

Spawn `decomposer_bot`:

```
Task(subagent_type=decomposer_bot,
     prompt="Read /workspace/.cursor/agents/decomposer_bot.md. Given these stories: <inline product_bot.payload.stories>. Workspace map: apps/backend, apps/frontend, packages/types. Return ONLY the JSON envelope.")
```

Parse. Validate the DAG yourself:

- Every `depends_on` ID exists in `tasks[]`.
- No cycles (DFS).
- ≤8 tasks (else surface the `hitl_required=true` from decomposer or escalate).

Post DAG as a markdown comment titled `## Task DAG (decomposer_bot)`. Include a Mermaid graph:

```mermaid
graph TD
  T1 --> T2
  T1 --> T3
```

---

## Phase 3 — Architecture (HITL gate #1)

Spawn `architect_bot`:

```
Task(subagent_type=architect_bot,
     prompt="Read /workspace/.cursor/agents/architect_bot.md. Stories: <stories>. Tasks: <tasks>. Existing repo schema available via MariaDB MCP. Return ONLY the JSON envelope.")
```

Parse. Render `payload.api`, `payload.database`, `payload.risks` to a comment titled `## Architecture (architect_bot)`.

**HITL pause**:

```
AskQuestion(
  question="Approve architecture for issue #<iid>?",
  options=[
    { label: "approve", description: "Proceed to DAG execution" },
    { label: "revise", description: "Revise architecture (provide notes)" },
    { label: "abort", description: "Stop pipeline" }
  ]
)
```

- `approve` → label issue `architecture-approved`, continue to Phase 4.
- `revise` → re-spawn `architect_bot` with revision notes; loop.
- `abort` → print `aborted after architecture` and stop.

---

## Phase 4 — DAG Execution

Track per-task state: `pending | running | review | ci | completed | stuck`. Initialize all to `pending`.

Maintain retry counters per task: `adversary_runs` (capped at **3** completed `adversary_bot` invocations per task), `code_review_rounds`, `gate_rounds` (each capped at 3). **Alignment** is enforced by an **implementer ↔ adversary loop** before the Draft MR exists (see 4b).

```
loop:
  ready = [ t for t in tasks if t.state == "pending" and all(d.state == "completed" for d in t.depends_on) ]
  if not ready and any(t.state in {"pending"} for t in tasks):
    # deadlock — should be impossible if DAG is acyclic, but check
    surface "DAG deadlock" to human and stop
  if all(t.state == "completed" for t in tasks):
    break

  # IMPORTANT: dispatch ALL ready tasks IN PARALLEL via multiple Task calls
  # in a single message. Do NOT serialize.
  for t in ready: t.state = "running"
  parallel_dispatch(ready)
```

### Per-task dispatch sequence

Each task `t` runs through these substeps. The orchestrator runs them sequentially **for one task** but multiple tasks proceed concurrently.

#### 4a. Compute branch + base + worktree

**Goal:** dependents must **reuse prerequisite code**. Two patterns:

1. **Stacked MR (single dependency):** `<base>` **is that task’s branch name** (e.g. `feat-<iid>-T2-slug`). The Draft MR’s **merge target branch = `<base>`**, not `development`, until the parent has merged upstream and you rebase/reparent the child branch onto `development`.
2. **Integration branch (multiple dependencies):** `<base>` = `development`; after `git worktree add … origin/development`, **merge `origin/<each completed dep branch>`** into `<branch>` (topo-safe order) so the implementation sees all predecessors without waiting for unrelated MRs to merge.

```bash
type   = t.type if t.type in {"feat","fix"} else "feat"
slug   = kebab-case(t.title, max 4 words)
branch = "feat-<iid>-<t.id>-<slug>"

if t.depends_on == []
  base = "development"
else if length(t.depends_on) == 1
  # Stacked MR: branch from completed parent task branch (must exist on origin)
  base = <completed_dep_branch_name>   # e.g. feat-338-T2-unfinished-matches-model
else
  # Parallel deps merged into feature branch — MR target stays development-oriented
  base = "development"

worktree_path = "/workspace/.worktrees/<iid>-<t.id>"

rtk git fetch origin
rtk git worktree add <worktree_path> -b <branch> origin/<base>
# If multiple deps: then merge sibling dep branches — do NOT omit or gate will fail:
# git merge origin/feat-<iid>-T1-... && git merge origin/feat-<iid>-T2-... ...
```

Pass **`base`** to `implementer_bot` as `Base:` so **`create_merge_request.target_branch`** matches **stacked** vs **development** workflows (see `/workspace/.cursor/agents/implementer_bot.md`).

#### 4b. Implementer ↔ adversary (instant feedback before Draft MR)

Initialize **`adversary_runs = 0`** for each task once per Dispatch sequence. Maintain **`misalignments_acc`** (empty JSON array unless adversary rejects).

Repeat until **`adversary_approved`** is true:

1. **Implement + push**

```
Task(subagent_type=implementer_bot,
     prompt="Read /workspace/.cursor/agents/implementer_bot.md. Implement task <t.id>. Worktree <worktree_path>. Branch <branch>. Base <base>. Architecture (filtered): <…>. Issue IID <iid>. Issue title + stories excerpt: … SkipMergeRequest: true|false. adversary_misalignments: <misalignments_acc or empty>. FIRST iteration or not yet adversary-approved: SkipMergeRequest=true. Return ONLY JSON envelope.")
```

`SkipMergeRequest` is **`true`** until `adversary_bot` returns `payload.verdict=approved`; set **`false`** only for the final push that opens Draft MR **after** approval.

Parse implementer:

- `status="ok"`, gates `pass`/`skipped` as required, **`mr_opened=false`** when `SkipMergeRequest=true` → continue to adversary (**do not** set `state=review` yet).
- `status="ok"`, **`mr_opened=true`**, `mr_iid` set — only valid when `SkipMergeRequest=false` after adversary approved → set `state=review`, store `mr_iid`, break out of 4b loop.
- `status="stuck"` / `gate_rounds` handling unchanged (see below).
- `status="blocked"` → stop pipeline; `hitl_required` → AskQuestion.

2. **Adversary** (only when last implementer returned `mr_opened=false`)

```
Task(subagent_type=adversary_bot,
     prompt="Read /workspace/.cursor/agents/adversary_bot.md. task_id <t.id>. Worktree <worktree_path>. Branch <branch>. Base <base>. acceptance_criteria: <t.acceptance_criteria>. stories_snippet: <product stories + KPIs>. architecture_excerpt: <filtered api+db>. issue_title: … Return ONLY JSON envelope.")
```

Increment **`adversary_runs += 1`** after each completed adversary response.

- `verdict="approved"` → set **`adversary_approved=true`**, **`misalignments_acc=[]`**, then spawn **one more** `implementer_bot` with **`SkipMergeRequest=false`** (may be gates-only + `create_merge_request` if no further edits). After that envelope has `mr_opened=true`, exit 4b loop with `state=review`.
- `verdict="rejected"` → append `payload.misalignments` into orchestrator context; if **`adversary_runs < 3`**, loop to step 1 with **`SkipMergeRequest=true`** and inject misalignments into **`adversary_misalignments`**. If **`adversary_runs == 3`** and still rejected → **HITL gate #2** (adversary non-convergence).

**`status="stuck"` on implementer** (quality gates / tooling): same as before — re-spawn with `errors[]`; increment `gate_rounds`; at 3 → HITL gate #2.

#### 4c. Code Review

Re-opens of `implementer_bot` **after** Draft MR creation (rejected verdict) MUST use **`SkipMergeRequest: false`** — MR already exists; push updates to the existing branch/MR.

```
Task(subagent_type=code_review_bot,
     prompt="Read /workspace/.cursor/agents/code_review_bot.md. Task: <t.id>. MR: !<mr_iid>. Branch: <branch>. Base: <base>. Worktree: <worktree_path>. Acceptance criteria: <t.acceptance_criteria>. Return ONLY the JSON envelope.")
```

- `verdict="approved"` → `state=ci`.
- `verdict="rejected"` and `code_review_rounds < 3` → loop back to 4b with `issues[]` injected; increment counter.
- `verdict="rejected"` and `code_review_rounds == 3` → HITL gate #2.

#### 4d. DevOps

When looping **after CI failure**, **`implementer_bot`** already has open Draft MR — use **`SkipMergeRequest: false`**.

```
Task(subagent_type=devops_bot,
     prompt="Read /workspace/.cursor/agents/devops_bot.md. MR: !<mr_iid>. Branch: <branch>. Return ONLY the JSON envelope.")
```

- `status="ready"` → `state=completed`.
- `status="failed"` → loop back to 4b with `checks[]` failures; increment `gate_rounds`.
- `status="running"` (timeout) → re-spawn devops_bot once more; if still running, escalate.

#### 4e. Mark task completed and continue the outer loop.

---

## Phase 5 — Final Review (HITL gate #3)

Once all tasks have `state="completed"` (Draft MRs are open, **code_review** + CI green per task — **`adversary_bot` approved alignment before Draft MR opened**):

```
Task(subagent_type=final_review_bot,
     prompt="Read /workspace/.cursor/agents/final_review_bot.md. Issue: #<iid>. Stories: <stories>. Tasks: <tasks>. MR IIDs: <mr_iids>. Return ONLY the JSON envelope.")
```

- `verdict="approved"` → continue to Phase 6.
- `verdict="rejected"` with all `issues[].task_ids_affected` populated:
  - For each affected task `t`: re-enter Phase 4b for that task with the issues injected; increment `code_review_rounds`.
  - Re-run Phase 5 after fixes propagate.
  - Cap: 3 full Final Review rounds. After that → HITL gate #3 escalation.
- `verdict="rejected"` with no `task_ids_affected` (cross-cutting) → escalate to human immediately.

---

## Phase 6 — Merge (HITL gate #4)

Compute topological order of completed tasks. For each task `t` in topo order:

1. Mark MR ready (`mcp__GitLab__update_merge_request(draft=false)`).
2. AskQuestion:

```
AskQuestion(
  question="Merge MR !<mr_iid> for task <t.id> (<t.title>)?",
  options=[
    { label: "merge", description: "I will merge in GitLab UI; confirm when done" },
    { label: "skip", description: "Skip; merge later manually" },
    { label: "abort", description: "Stop the merge train" }
  ]
)
```

3. The orchestrator NEVER calls `mcp__GitLab__merge_merge_request`. The human merges via GitLab UI; replies `merge`/`skip`/`abort`.
4. After human confirms `merge`:
   - Verify with `mcp__GitLab__get_merge_request` that `state=merged`.
   - For every dependent task whose `base_branch` was `t.branch`:

     ```bash
     cd /workspace/.worktrees/<iid>-<dep_id>
     rtk git fetch origin
     rtk git rebase --onto development <t.branch> <dep.branch>
     rtk git push --force-with-lease origin <dep.branch>
     ```

     `--force-with-lease` is in the `ask` permission list — confirm with the human before each push.

5. Clean up:

   ```bash
   rtk git worktree remove --force /workspace/.worktrees/<iid>-<t.id>
   rtk git branch -d <t.branch>
   ```

   `git branch -d` is safe (refuses if not merged); `git worktree remove --force` is in `ask` — confirm.

When all MRs in topo order are merged or skipped, print the summary card:

```
Pipeline done.
Issue: #<iid>
Tasks: <count> total, <merged> merged, <skipped> skipped, <stuck> stuck
Worktrees cleaned: yes
Run /observe <mr_iid> to analyze post-merge health (optional).
```

---

## Phase 7 — Observe (manual, async)

NOT auto-invoked. The user runs `/observe <mr_iid>` later if they want post-merge analysis.

---

## HITL gate summary

| #   | Gate                                                                            | Trigger                                      | Action                                             |
| --- | ------------------------------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------- |
| 1   | Architecture sign-off                                                           | After `architect_bot` returns                | `AskQuestion`: approve / revise / abort            |
| 2   | Implementer stuck, adversary non-convergence (3 adversary rounds), CR, or gates | 3 rounds same scope (or implementer `stuck`) | `AskQuestion`: retry / abort-task / abort-pipeline |
| 3   | Final Review rejected (cross-cutting or 3 rounds)                               | After Phase 5                                | Escalate to human with full issue list             |
| 4   | Merge approval                                                                  | Per MR in Phase 6                            | `AskQuestion`: merge / skip / abort                |

---

## Failure handling

If any agent returns `status="blocked"`:

- Print the agent name, reason, and `errors[]`.
- Stop the pipeline.
- DO NOT clean up worktrees automatically — the human may want to inspect them.

If your own JSON parse fails (agent output not envelope-shaped):

- Treat it as `status="stuck"` with `errors=[{ code: "envelope_parse_error", message: <raw_output_excerpt> }]`.
- The `validate-envelope.sh` PostToolUse hook will have already warned.
- Retry the agent ONCE with explicit reminder: "Return ONLY the JSON envelope. No prose."

---

## Forbidden (orchestrator-level)

- Editing source files yourself. Implementers do that.
- Approving or merging MRs (`mcp__GitLab__approve_merge_request`, `mcp__GitLab__merge_merge_request`). Always human.
- Skipping HITL gates because "it looks fine."
- Running tasks serially that have no dependency on each other (parallel dispatch is REQUIRED — single-message-multi-Task-call).
- Mutating CLAUDE.md, AGENTS.md, .claude/, .cursor/ — these are harness files; agents must not edit their own definitions.

---

## Status card (refresh between phases)

After every phase transition, print:

```
Issue: #<iid>
Phase: <0|1|2|3|4|5|6>
Tasks: T1=<state>, T2=<state>, ...
HITL pending: yes|no (<gate_name>)
```

This gives the human a continuous view of what's happening.
