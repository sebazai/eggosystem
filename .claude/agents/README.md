# DAG Pipeline Agents

Specialized subagents for **gitlab-issue-dag-orchestration**. Each agent is invoked by the orchestrator via `Task(subagent_type=<name>)` and returns a strict JSON envelope (see `/workspace/.claude/skills/json-handoff/SKILL.md`).

## Pipeline Overview

```
User request
     │
     ▼
┌────────────────────────────────────────────────────────────┐
│ scope-request-to-gitlab-issue → intake_bot → GitLab issue  │
└────────────────────────────┬───────────────────────────────┘
       │ issue IID
       ▼
┌─────────────────────────────┐
│ gitlab-issue-dag-orchestration │  Orchestrator drives all phases below
└──────────────────┬──────────┘
       │
       ▼
  Phase 1: product_bot
  Converts issue into user stories + KPIs → posts to GitLab issue
       │
       ▼
  Phase 2: decomposer_bot
  Breaks stories into a task DAG (T1, T2, …) → posts Mermaid graph to issue
       │
       ▼
  Phase 3: architect_bot ── HITL #1 (approve / revise / abort)
  Designs API endpoints + DB schema delta → posts to issue
       │
       ▼
  Phase 4: DAG Execution (tasks run in parallel where deps allow)
  ┌─────────────────────────────────────────────────────────────┐
  │                                                             │
  │  For each task T:                                           │
  │                                                             │
  │  4a. Compute branch/base/worktree                           │
  │       └─ git worktree add, pnpm install, pnpm build        │
  │                                                             │
  │  4b. implementer_bot (pre-MR: internal adversary loop)      │
  │       ├─ implementer implements + pushes (no MR yet)       │
  │       ├─ Task(adversary_bot): AC/tests/structure (≤3)       │
  │       └─ on approval: implementer opens Draft MR (one Task)  │
  │           └─ HITL #2 if adversary never converges          │
  │                                                             │
  │  4c. code_review_bot ← line-by-line quality gate           │
  │       ├─ posts verdict as GitLab MR note (every round)     │
  │       ├─ approved → state=ci                               │
  │       └─ rejected → loop back to 4b (max 3 rounds)        │
  │           └─ HITL #2 if 3 rounds exhausted                 │
  │                                                             │
  │  4d. devops_bot (foreground, parallel with other tasks)    │
  │       ├─ polls GitLab CI until success/failed              │
  │       ├─ ready → state=completed                           │
  │       └─ failed → loop back to 4b                         │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘
       │  all tasks completed
       ▼
  Phase 5: final_review_bot ── HITL #3 if issues found
  Cross-task business validation against original issue AC
       │
       ▼
  Phase 6: Merge ── HITL #4 per MR
  Orchestrator un-drafts MRs in topo order; human merges via GitLab UI
       │
       ▼
  Phase 7: analyze-merged-merge-request-health (optional, async)
  observer_bot — post-merge CI + Sentry/Grafana analysis
```

## Agent Roster

| Agent              | Phase                         | Role                                                        |
| ------------------ | ----------------------------- | ----------------------------------------------------------- |
| `intake_bot`       | scope-request-to-gitlab-issue | Scopes request → GitLab issue                               |
| `product_bot`      | 1                             | Issue → structured stories + KPIs                           |
| `decomposer_bot`   | 2                             | Stories → task DAG                                          |
| `architect_bot`    | 3                             | DAG → API/DB design (HITL)                                  |
| `implementer_bot`  | 4b                            | Code + quality gates; spawns adversary internally; opens MR |
| `adversary_bot`    | 4b (sub-Task)                 | Fast pre-MR gate: AC coverage, tests, structural rules      |
| `ui_bot`           | 4b                            | Frontend tasks (spawned by implementer)                     |
| `claude_md_bot`    | any                           | Appends agent-discovery notes to CLAUDE.md (utility)        |
| `code_review_bot`  | 4c                            | Line-by-line quality + GitLab MR note                       |
| `devops_bot`       | 4d                            | GitLab CI validation (parallel-foreground)                  |
| `final_review_bot` | 5                             | Cross-task business validation                              |
| `observer_bot`     | 7                             | Post-merge observability                                    |

## Key Design Decisions

- **Two-stage alignment model** — `adversary_bot` is a fast pre-MR gate (AC coverage, tests present, structural rules); `code_review_bot` is the thorough post-MR gate (line-by-line quality, security, style). Draft MR does not open until adversary approves.
- **devops_bot runs foreground-parallel** — dispatched in the same `Task` batch as other ready work; never blocks the orchestrator loop.
- **Code review posts to GitLab** — orchestrator calls `mcp__gitlab_mcp__create_merge_request_note` after every `code_review_bot` response, regardless of verdict.
- **Stacked MRs** — child tasks targeting a parent branch merge into `development` after parent merges (orchestrator rebases and retargets).
- **All GitLab MCP tools use `mcp__gitlab_mcp__*` names** (not `mcp__GitLab__*`).
