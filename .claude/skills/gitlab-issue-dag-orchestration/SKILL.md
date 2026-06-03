---
name: gitlab-issue-dag-orchestration
description: Orchestrates a GitLab issue end-to-end via the multi-agent DAG harness (product → decompose → architecture HITL → parallel MR implementation with CI gates → final review → human merge). Parses strict JSON envelopes; one MR per task. Invoked by skill name; optional client wrappers live under .cursor/commands and .claude/commands.
disable-model-invocation: true
---

# GitLab issue DAG orchestration

**Client wrappers:** Some setups expose a slash or palette command as a one-line pointer to this file under `.cursor/commands/` or `.claude/commands/`. Prefer naming this skill explicitly in agent prompts.

**Canonical copy:** `.cursor/skills/gitlab-issue-dag-orchestration/SKILL.md`; mirror: `.claude/skills/gitlab-issue-dag-orchestration/SKILL.md`.

## How to invoke

- **Via client wrapper (if present):** same `$ARGUMENTS` as below (issue IID first, optional trailing context).
- **Via skill name:** issue IID is the **first token**; remaining tokens are optional context copied into every nested agent prompt.

**Agent specs:** Prefer **`/workspace/.cursor/agents/<agent>.md`** (`.claude/agents/` mirrors the same harness when present).

**GitLab MCP:** Tool/function names vary by wiring (`mcp__GitLab__*` vs `mcp__gitlab_mcp__*`; `project` vs `project_id`). Use the MCP schema exposed in **your** session; examples below use `mcp__gitlab_mcp__*`/`project_id` — substitute equivalent calls when your server uses different identifiers.

---

# Playbook

Orchestrate a GitLab issue end-to-end via 10 specialized agents (`product_bot`, `decomposer_bot`, `architect_bot`, `implementer_bot`, `ui_bot`, `adversary_bot`, `code_review_bot`, `final_review_bot`, `devops_bot`, `observer_bot`). Each agent returns a strict JSON envelope per `/workspace/.cursor/skills/json-handoff/SKILL.md`. You (the orchestrator) parse those envelopes, coordinate worktrees, manage branch dependencies, and gate the human at four HITL points. **Pre-MR** `adversary_bot` is spawned **by** `implementer_bot` (not as a separate top-level orchestrator `Task` in §4b).

**Arguments**: `$ARGUMENTS` — first token = GitLab issue IID; remainder = optional context for every subagent prompt.

You are NOT any single agent. You ONLY parse envelopes and dispatch `Task` calls.

---

## Mandatory reads (before Phase 0)

1. `/workspace/.cursor/skills/json-handoff/SKILL.md` — envelope contract.
2. `/workspace/CLAUDE.md` — repo conventions (RTK prefix, hooks, gates, branching).
3. `/workspace/.cursor/agents/dag-orchestration.md` — branching, worktrees, merge train, quality gates, hooks overview.
4. The system reminder for project remote: `rtk git remote -v` to derive `<group/project>` for GitLab MCP calls.

---

## Phase 0 — Preparation

1. Parse `<iid>` from `$ARGUMENTS`.
2. Parse optional **mode tokens** from the remaining `$ARGUMENTS`:
   - If any token equals `continue` or `resume` (case-insensitive), set `resume_mode=true`.
3. Derive `<group/project>` from `rtk git remote -v`.
4. `mcp__gitlab_mcp__get_issue(project_id=<group/project>, issue_iid=<iid>)`.
5. Refuse to proceed if:
   - Issue not found.
   - Issue has label `needs-human-decision` → print issue summary and stop.
6. Print a status card:

```
Issue #<iid>: <title>
Labels: <labels>
Pipeline: gitlab-issue-dag-orchestration
Phase: 0 → preparation OK
```

---

## Phase 0b — Resume / state reconstruction (ONLY when `resume_mode=true`)

**Goal:** before spawning _any_ agent, reconstruct the pipeline’s last known state from **GitLab Issue notes + GitLab MRs + local git state** so that `... <iid> continue` never restarts from Phase 1 unless the issue has no prior run artifacts.

### 0b.1 Pull canonical state from GitLab Issue notes

1. Fetch issue notes (ascending by creation time).
2. Identify the most recent notes with these headings (prefer the last occurrence of each):
   - `## Stories (product_bot)`
   - `## Task DAG (decomposer_bot)`
   - `## Architecture (architect_bot)`
3. If `## Task DAG (decomposer_bot)` exists, **treat it as canonical tasks[]** for the resume run. Do **not** respawn `decomposer_bot` unless the DAG note is missing or obviously malformed.
4. If `## Stories (product_bot)` exists, reuse it as canonical stories/KPIs. Do **not** respawn `product_bot` unless the note is missing.
5. Determine whether architecture is approved:
   - If issue has label `architecture-approved`, treat Phase 3 as complete.
   - Else if an Architecture note exists but the label is missing, treat as **HITL pending** (do not proceed into Phase 4 automatically).

### 0b.2 Discover existing merge requests for this issue

Use _both_ strategies; union the results:

- **Branch pattern**: list MRs whose `source_branch` matches `feat-<iid>-*`.
- **Issue linkage**: list MRs that mention or close `#<iid>` (when available in your GitLab).

For each MR found, capture:

- `mr_iid`, `web_url`
- `source_branch`
- `target_branch`
- `draft` status
- latest head SHA
- pipeline status (if available)

### 0b.3 Inspect local repo state (detect in-progress work)

Run these from the repo root:

- `rtk git status --porcelain=v1`
- `rtk git diff`
- `rtk git diff --staged`
- `rtk git worktree list`

If any `/workspace/.worktrees/<iid>-<task_id>` worktrees exist, treat them as **active** task workspaces and prefer them over re-creating worktrees in §4a.

### 0b.4 Rehydrate per-task trackers (state / branch / mr_iid)

Given canonical `tasks[]` from the DAG note:

- Compute expected branch name prefix: `feat-<iid>-<t.id>-`
- Match each `t` to an MR by `source_branch` prefix (preferred), else leave unmatched.
- Initialize `t.branch` from MR `source_branch` when present; else from the expected scheme.
- Initialize `t.worktree_path` if a matching worktree exists; else leave empty.

Infer `t.state` conservatively:

- **If MR exists and is Draft**: `review` (unless you have evidence code review already approved and CI running).
- **If MR exists and code review was approved (via your own MR notes)**: `ci` (until devops says ready).
- **If MR exists and pipeline for head SHA is green**: `completed`.
- **If MR does not exist**: `pending` (do not spawn implementer unless `impl_ready`).

### 0b.5 Continue from the correct phase

- If Stories/DAG/Architecture artifacts are missing: continue from the earliest missing phase (1, 2, or 3).
- If architecture is not approved: stop at HITL gate #1.
- If architecture is approved: continue at Phase 4 using the reconstructed per-task tracker table.

### 0b.6 Post a checkpoint note (required)

After reconstruction, post a GitLab issue note titled `## DAG Resume Checkpoint` containing:

- Phase you will continue from
- For each task: `id`, `title`, inferred `state`, `branch`, `mr_iid` (if any), `worktree_path` (if any)
- Whether local repo has unstaged/staged changes (yes/no; never paste secrets)

---

## Phase 1 — Product

Spawn `product_bot`:

```
Task(subagent_type=product_bot,
     prompt="Read /workspace/.cursor/agents/product_bot.md. Convert GitLab issue #<iid> in project <group/project> into structured stories. Return ONLY the JSON envelope.")
```

Parse the envelope. On `status="blocked"` → stop, surface `errors[]` to human.

On `hitl_required=true` → use `AskQuestion` with `hitl_reason` to clarify, then re-spawn with the answers in `clarifications[]`.

Render `payload.stories` and `payload.kpis` to a markdown comment and post via `mcp__gitlab_mcp__create_issue_note`. Title the comment `## Stories (product_bot)`.

---

## Phase 2 — Decompose

Spawn `decomposer_bot`:

```
Task(subagent_type=decomposer_bot,
     prompt="Read /workspace/.cursor/agents/decomposer_bot.md. Decompose **liberally** (layer-first: optional db, then backend/frontend; fold packages/types and small helpers into those tasks — no types-only micro-tasks). Given these stories: <inline product_bot.payload.stories>. Workspace map: apps/backend, apps/frontend, packages/types. Emit optional implements_after_gates per json-handoff (default parent gate completed); for stacked children use mr_opened unless risk requires completed. Return ONLY the JSON envelope.")
```

Parse. Validate the DAG yourself:

- Every `depends_on` ID exists in `tasks[]`.
- No cycles (DFS).
- ≤8 tasks (else surface the `hitl_required=true` from decomposer or escalate).

Post DAG as a markdown comment via `mcp__gitlab_mcp__create_issue_note`, titled `## Task DAG (decomposer_bot)`. Include a Mermaid graph:

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

Parse. Render `payload.api`, `payload.database`, `payload.risks` to a comment titled `## Architecture (architect_bot)` via `mcp__gitlab_mcp__create_issue_note`.

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

### 4.0 Two-track scheduling (implement start vs finalize)

Orchestration is **two speeds**:

1. **Implement / MR track** — downstream tasks may exit `pending` and run **§4a–§4c** once **upstream dependencies** satisfy **`implements_after_gates`** (see `/workspace/.cursor/skills/json-handoff/SKILL.md` `decomposer_bot.payload`). A **child stacked on a parent branch** SHOULD default to **`mr_opened`** from the parent (not **`completed`**) unless architecture or risk dictates otherwise, so the child MR can iterate **while `devops_bot` watches the parent pipeline in the background**.
2. **Finalize track** — a task reaches **`completed`** only after **`devops`** returns **`status=ready`** (CI green for that MR/commit). **`final_review_bot` (Phase 5)** waits until **every** task is **`completed`**. **`devops_bot` must stay non-blocking** for unrelated ready work (**§4d**).

Treat **`implements_after_gates`** as **engineering readiness** (“can base / merge prerequisites?”). Merge order and human merge trains (**Phase 6**) stay unchanged.

Track per-task state: `pending | running | review | ci | completed | stuck`. Initialize all to `pending`.

Maintain retry counters per task: `code_review_rounds`, `gate_rounds` (each capped at 3). **Pre-MR alignment** (up to **3** completed `adversary_bot` **`rejected`** rounds, then HITL gate #2) runs **inside** one orchestrator `Task(implementer_bot)` — the implementer spawns `adversary_bot` via its own `Task` tool. **`code_review_bot`** remains the post-MR quality gate.

Also maintain **`implementer_invocation_index`** per task (integer counter for **this** task’s **`4a`** worktree):

- Initialize to **`0`** once **`4a`** has created `<worktree_path>` (same task dispatch; do not reset between Code Review/CI loops).
- Immediately **before every orchestrator-issued** `Task(implementer_bot)` — first §4b after worktree bootstrap, stuck retries, **`4c`/`4d`/Final Review loops** — do **`implementer_invocation_index += 1`** and pass the new value into the prompt as **`implementer_invocation_index: <n>`**. **Do not** increment for `adversary_bot` calls that the **implementer** spawns internally.
- **`implementer_bot`** runs **`rtk pnpm install --frozen-lockfile`** then **`rtk pnpm build`** only when **`n == 1`** unless dependency manifests changed or bootstrap failed (see `/workspace/.cursor/agents/implementer_bot.md` **Dependency install**). Independently, the implementer should **`rtk pnpm build`** again from the worktree root when **`packages/types`** (or other **`dist/`** consumers) change or when **typecheck / lint / knip** failures look like **stale build output** — not only on **`n == 1`**.

Normalize dependency gates (orchestrator): for each decomposition row `t` in `tasks[]` (plus tracked `state` / `branch` during Phase 4) and parent id **`p`** in **`t.depends_on`**, **`gate(t,p)`** = **`t.implements_after_gates[p]`** when the key exists on the decomposition object, else **`"completed"`** (backward compatible). Define **`parent_satisfies_gate(parent, gate)`** for **`parent`** the upstream tracker row:

- **`completed`** ⇒ `parent.state == "completed"`.
- **`mr_opened`** ⇒ `parent.state in {"review", "ci", "completed"}` (Draft MR opened after §4b).
- **`code_review_ok`** ⇒ `parent.state in {"ci", "completed"}`.
- **`branch_published`** ⇒ `origin/<parent.branch>` is fetchable and known (use only when decomposition marks it explicitly).

Then **`impl_ready(t)`** = for every **`p`** in **`t.depends_on`**, **`parent_satisfies_gate(lookup(p), gate(t,p))`** holds.

```
loop:
  if all(t.state == "completed" for t in tasks):
    break

  ready = [ t for t in tasks if t.state == "pending" and impl_ready(t) ]

  if ready:
    # IMPORTANT: dispatch ALL ready tasks IN PARALLEL via multiple Task calls
    # in a single message. Do NOT serialize.
    for t in ready:
      t.state = "running"
    parallel_dispatch(ready)
    continue

  if any(t.state == "ci" for t in tasks):
    # Tasks waiting on GitLab CI (see §4d–§4e). Do not treat dependents as deadlock.
    reconcile_ci_outcomes()
    continue

  if any(t.state == "pending" for t in tasks) and not any(t.state in {"running", "review", "ci"} for t in tasks):
    # With strict gates (all deps `completed`), this is a deadlock. With relaxed gates, wait for
    # devops reconciliation or parent pushes (do not falsely stop just because dependents are slower).
    if any(impl_ready(t) for t in tasks if t.state == "pending"):
      continue  # transient; next iteration should dispatch ready
    surface "DAG deadlock" to human and stop

  # Rare: in-flight `running` / `review` work across orchestrator turns; retry loop.
  continue
```

### Per-task dispatch sequence

Each task `t` runs through these substeps. The orchestrator runs them sequentially **for one task** but multiple tasks proceed concurrently.

#### 4a. Compute branch + base + worktree

**Goal:** dependents must **reuse prerequisite code**. Two patterns:

1. **Stacked MR (single dependency):** `<base>` **is that task’s branch name** (e.g. `feat-<iid>-T2-slug`). The Draft MR’s **merge target branch = `<base>`**, not `development`, until the parent has merged upstream and you rebase/reparent the child branch onto `development`.
2. **Integration branch (multiple dependencies):** `<base>` = `development`; after `git worktree add … origin/development`, **merge `origin/<each dep branch>`** for every dependency whose gate is satisfied by **`impl_ready`** (topo-safe order). Gates **`branch_published` / `mr_opened`** permit merges **before** the parent reaches **`completed`** intentionally; gate **`completed`** waits for CI-verified tips.

**Branch discovery:** Resolve parent branch names from **`get_merge_request` / bookkeeping** once the parent satisfies **`mr_opened`** or stricter — **Do not wait for parent CI** when the gate is relaxed (stacked parallelism).

```bash
type   = t.type if t.type in {"feat","fix"} else "feat"
slug   = kebab-case(t.title, max 4 words)
branch = "feat-<iid>-<t.id>-<slug>"

if t.depends_on == []
  base = "development"
else if length(t.depends_on) == 1
  # Stacked MR: branch from parent task branch once impl_ready permits (often before parent CI completes)
  base = <parent_dep_branch_name_on_origin>
else
  # Parallel deps merged into feature branch — MR target stays development-oriented
  base = "development"

worktree_path = "/workspace/.worktrees/<iid>-<t.id>"

rtk git fetch origin
rtk git worktree add <worktree_path> -b <branch> origin/<base>
# If multiple deps: cd <worktree_path> && merge sibling dep branches — do NOT omit or gate will fail:
# rtk git merge origin/feat-<iid>-T1-... && rtk git merge origin/feat-<iid>-T2-... ...

# Secrets + node_modules + build (uses devcontainer Node on PATH — see scripts/bootstrap-worktree-deps.sh)
cd <worktree_path>
rtk bash scripts/bootstrap-worktree-deps.sh
```

Pass **`base`** to `implementer_bot` as `Base:` so **`create_merge_request.target_branch`** matches **stacked** vs **development** workflows (see `/workspace/.cursor/agents/implementer_bot.md`).

#### 4b. Implementer with internal pre-MR adversary (single orchestrator `Task`)

**First time** the task has no Draft MR yet (immediately after §4a): increment **`implementer_invocation_index`** and dispatch **one** `implementer_bot`. **Do not** spawn `adversary_bot` yourself — the implementer runs **implement → push → `Task(adversary_bot)`** (max **3** completed `rejected` envelopes, then implementer returns **`stuck`** / HITL) and then opens the Draft MR. Pass **`acceptance_criteria`**, **stories snippet + KPIs**, **architecture excerpt** filtered to `<t.id>`, **`issue_title`**, plus worktree/branch/base/task id.

```
Task(subagent_type=implementer_bot,
     prompt="Read /workspace/.cursor/agents/implementer_bot.md. Implement task <t.id>. Worktree <worktree_path>. Branch <branch>. Base <base>. Architecture (filtered): <…>. Issue IID <iid>. Issue title: <title>. Stories snippet + KPIs: <product_bot excerpt>. acceptance_criteria: <t.acceptance_criteria>. **Omit existing_mr_iid** (no Draft MR yet). code_review_issues: []. implementer_invocation_index: <n>. Return ONLY the JSON envelope.")
```

- `status="ok"`, **`mr_opened=true`**, `mr_iid` set → `state=review`, store `mr_iid`. Pre-MR adversary alignment is already reflected in **`payload.gate_output.adversary_alignment`** / optional **`adversary_rounds_used`**.
- **`hitl_required=true`** with adversary non-convergence, or **`status="stuck"`** with **`errors[].code == "adversary_non_convergence"`** (three `rejected` adversary rounds, no MR) → **HITL gate #2** — do **not** treat as a generic `gate_rounds` retry.
- **`status="stuck"`** for **quality gates / tooling** (per `errors[]`) → re-spawn implementer; increment `gate_rounds`; at 3 → HITL gate #2.
- `status="blocked"` (other reasons) → stop pipeline; `hitl_required` → AskQuestion.

**After Draft MR exists** (§4c rejection, §4d CI failure, Final Review fixes): increment **`implementer_invocation_index`** and dispatch implementer with **`existing_mr_iid: <mr_iid>`**, **`code_review_issues`** and/or CI notes — **no** internal pre-MR adversary; push updates only.

#### 4c. Code Review + post MR note

Re-opens of `implementer_bot` **after** Draft MR creation pass **`existing_mr_iid: !<mr_iid>`** in the prompt — MR already exists; the implementer pushes updates to the existing branch only.

```
Task(subagent_type=code_review_bot,
     prompt="Read /workspace/.cursor/agents/code_review_bot.md. Task: <t.id>. MR: !<mr_iid>. Branch: <branch>. Base: <base>. Worktree: <worktree_path>. Acceptance criteria: <t.acceptance_criteria>. Return ONLY the JSON envelope.")
```

**After every `code_review_bot` response** — regardless of verdict — the orchestrator posts the result as an MR note:

```
mcp__gitlab_mcp__create_merge_request_note(
  project_id=<group/project>,
  merge_request_iid=<mr_iid>,
  body="## Code Review (code_review_bot)\n\n**Verdict**: approved|rejected\n\n<issues formatted as markdown list with file:line, severity, description>"
)
```

- `verdict="approved"` → `state=ci`.
- `verdict="rejected"` and `code_review_rounds < 3` → loop back to §4b with `issues[]` injected; increment counter.
- `verdict="rejected"` and `code_review_rounds == 3` → HITL gate #2.

#### 4d. DevOps — do not block unrelated Phase 4 work

After **code review** approves (`state=ci`), drive CI to completion **without** serializing the whole orchestrator:

1. **Prefer background dispatch** when nested `Task` supports **`run_in_background=true`:**

```
Task(subagent_type=devops_bot,
     run_in_background=true,
     prompt="Read /workspace/.cursor/agents/devops_bot.md. Project (GitLab MCP project_id): <group/project>. MR: !<mr_iid>. Branch: <branch>. Return ONLY the JSON envelope.")
```

- Track tasks in `ci` as **awaiting** a `devops_bot` envelope (notification or handoff). **Do not** synchronously block the main session if other independent tasks can proceed.

2. **Otherwise** (no background tasks): dispatch **`devops_bot` as a foreground nested `Task` in the same parallel batch** as any other independent ready work — send all `Task` calls in **one** message; do not await one before issuing the rest.

- When several MRs need CI at once, issue **one `devops_bot` per MR** in the **same** message (parallel background tasks **or** parallel foreground tasks, per above).
- When CI failure loops back to §4b, include **`existing_mr_iid`** in the `implementer_bot` prompt — MR already exists; push updates only.

Apply each `devops_bot` envelope when it arrives:

- `status="ready"` → `state=completed`.
- `status="failed"` → loop back to §4b with `checks[]` failures; increment `gate_rounds`.
- `status="running"` (timeout) → spawn one follow-up `devops_bot` (background or foreground per platform); if still `running`, escalate / HITL.

**Fallback:** if `devops_bot` cannot reach GitLab MCP, poll CI via **`get_merge_request`** and inspect `deployment_summary[0].pipeline.status` for the MR head SHA.

**Synchronous blocking `devops_bot`** is allowed only when deliberately waiting (single-task issue, human asked to wait, debugging). Default: **non-blocking** paths above.

#### 4e. CI reconciliation and outer loop

Tasks stay in **`ci`** until their `devops_bot` outcome is applied. The Phase 4 loop’s **`reconcile_ci_outcomes()`** step MUST:

1. Collect each outstanding `devops_bot` result (background completion, parallel foreground return, or **short** GitLab MCP poll if an envelope was lost).
2. Parse the JSON envelope and apply §4d transitions (`completed` vs re-enter §4b).

When applying **`completed`**, if the **`devops_bot` envelope referenced an older HEAD** than **`get_merge_request` diff head** for that MR, **re-run `devops_bot`** on the latest SHA (background if supported) before marking **`completed`** (or poll until the MR pipeline for the current head succeeds).

Do **not** enter Phase 5 until every task is **`completed`** (code review done **and** CI green **for the HEAD that will merge** — see rule above).

After a parent **`completed`** flips true, **`impl_ready`** for pending children tightens automatically if those edges used gate **`completed`**; children with **`mr_opened`** gates may already be in flight or **`completed`**.

#### 4f. Mark task completed and continue the outer loop.

---

## Phase 5 — Final Review (HITL gate #3)

Once all tasks have `state="completed"` (Draft MRs open, code_review approved + CI green per task; pre-MR adversary ran **inside** each task’s first `implementer_bot` spawn):

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

1. Mark MR ready (`mcp__gitlab_mcp__update_merge_request(project_id, merge_request_iid, draft=false)`).
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

3. The orchestrator NEVER calls `mcp__gitlab_mcp__merge_merge_request`. The human merges via GitLab UI; replies `merge`/`skip`/`abort`.
4. After human confirms `merge`:
   - Verify with `mcp__gitlab_mcp__get_merge_request` that `state=merged`.
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
Run skill **`analyze-merged-merge-request-health`** for post-merge analysis (optional; client may expose a wrapper in `.cursor/commands/` / `.claude/commands/`).
```

---

## Phase 7 — Post-merge MR health (manual, async)

NOT auto-invoked. The user runs skill **`analyze-merged-merge-request-health`** with `<mr_iid>` later for post-merge analysis (or the matching client wrapper, if configured).

---

## HITL gate summary

| #   | Gate                                                                               | Trigger                       | Action                                             |
| --- | ---------------------------------------------------------------------------------- | ----------------------------- | -------------------------------------------------- |
| 1   | Architecture sign-off                                                              | After `architect_bot` returns | `AskQuestion`: approve / revise / abort            |
| 2   | Implementer stuck, adversary non-convergence, CR non-convergence, or tooling gates | 3 rounds same scope           | `AskQuestion`: retry / abort-task / abort-pipeline |
| 3   | Final Review rejected (cross-cutting or 3 rounds)                                  | After Phase 5                 | Escalate to human with full issue list             |
| 4   | Merge approval                                                                     | Per MR in Phase 6             | `AskQuestion`: merge / skip / abort                |

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
- Approving or merging MRs (`mcp__gitlab_mcp__approve_merge_request`, `mcp__gitlab_mcp__merge_merge_request`). Always human.
- Skipping HITL gates because "it looks fine."
- Running tasks serially that have no dependency on each other (parallel dispatch is REQUIRED — single-message-multi-Task-call).
- Awaiting **`devops_bot` synchronously** when other independent Phase 4 work could proceed — default to **background `devops_bot`** when supported, else **parallel foreground batch** (§4d–§4e).
- Skipping the GitLab MR note after code review — the note is required every round regardless of verdict.
- Ignoring **`implements_after_gates`** — implement start readiness is **`impl_ready`** per `/workspace/.cursor/skills/json-handoff/SKILL.md`; **`completed`** stays CI-gated.
- Mutating CLAUDE.md, AGENTS.md, .cursor/agents/dag-orchestration.md, .claude/, .cursor/ — these are harness files; agents must not edit their own definitions.

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
