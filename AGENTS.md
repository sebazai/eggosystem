# Agents and DAG harness (repo root)

This file is a **thin index**. Deep workflow and procedures live in linked docs so always-on context stays small.

## DAG pipeline (`/dag-execute`)

- **Orchestration playbook** (branching, worktrees, quality gates, hooks table): [`.cursor/agents/dag-orchestration.md`](.cursor/agents/dag-orchestration.md)
- **Slash commands / agent roles / HITL summary**: start there; same content as previously lived in this file.
- **JSON envelope** (all DAG agents return envelope only): [`.cursor/skills/json-handoff/SKILL.md`](.cursor/skills/json-handoff/SKILL.md)
- **Per-role prompts**: [`.cursor/agents/`](.cursor/agents/)
- **Orchestrator command**: [`.cursor/commands/dag-execute.md`](.cursor/commands/dag-execute.md)

## RTK (shell output filtering)

- **Full command catalog**: [`docs/rtk-reference.md`](docs/rtk-reference.md)

## Other `AGENTS.md` files

- **Next.js docs index** (generated): [`apps/frontend/AGENTS.md`](apps/frontend/AGENTS.md) — not the DAG harness; do not confuse with this root file.

## Project notes for agents

- [`CLAUDE.md`](CLAUDE.md) — surprises and conventions agents should record or follow.
