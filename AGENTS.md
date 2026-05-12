# Agents and DAG harness (repo root)

This file is a **thin index**. Deep workflow and procedures live in linked docs so always-on context stays small.

## DAG pipeline (`gitlab-issue-dag-orchestration`)

- **gitlab-issue-dag-orchestration** (phases 0–7, HITL, parallel DAG): [`.cursor/skills/gitlab-issue-dag-orchestration/SKILL.md`](.cursor/skills/gitlab-issue-dag-orchestration/SKILL.md) — mirror: [`.claude/skills/gitlab-issue-dag-orchestration/SKILL.md`](.claude/skills/gitlab-issue-dag-orchestration/SKILL.md)
- **scope-request-to-gitlab-issue**: [`.cursor/skills/scope-request-to-gitlab-issue/SKILL.md`](.cursor/skills/scope-request-to-gitlab-issue/SKILL.md) — mirror: [`.claude/skills/scope-request-to-gitlab-issue/SKILL.md`](.claude/skills/scope-request-to-gitlab-issue/SKILL.md)
- **analyze-merged-merge-request-health**: [`.cursor/skills/analyze-merged-merge-request-health/SKILL.md`](.cursor/skills/analyze-merged-merge-request-health/SKILL.md) — mirror: [`.claude/skills/analyze-merged-merge-request-health/SKILL.md`](.claude/skills/analyze-merged-merge-request-health/SKILL.md)
- **Supporting context** (branching, worktrees, quality gates, hooks): [`.cursor/agents/dag-orchestration.md`](.cursor/agents/dag-orchestration.md)
- **JSON envelope** (all DAG agents return envelope only): [`.cursor/skills/json-handoff/SKILL.md`](.cursor/skills/json-handoff/SKILL.md) — mirror: [`.claude/skills/json-handoff/SKILL.md`](.claude/skills/json-handoff/SKILL.md)
- **Per-role agent prompts**: [`.cursor/agents/`](.cursor/agents/)
- **Client command wrappers** (thin Markdown that point at the skill paths above — exact filenames depend on Cursor/Claude routing): [`.cursor/commands/`](.cursor/commands/), [`.claude/commands/`](.claude/commands/)

## RTK (shell output filtering)

- **Full command catalog**: [`docs/rtk-reference.md`](docs/rtk-reference.md)

## Other `AGENTS.md` files

- **Next.js docs index** (generated): [`apps/frontend/AGENTS.md`](apps/frontend/AGENTS.md) — not the DAG harness; do not confuse with this root file.

## Project notes for agents

- [`CLAUDE.md`](CLAUDE.md) — surprises and conventions agents should record or follow.
