---
name: explorer-research
description: Read-only research workflow for Explorer agent — map issues to code, DB, and docs, then append a technical brief to the GitLab issue
---

# Explorer Research Skill

Read this before acting as `explorer_bot`. The Explorer is strictly read-only: no file edits, no git, no code execution beyond navigation shells.

## Inputs

- A GitLab issue IID from PM with business need + acceptance criteria.

## Outputs (the deliverable)

A `## Technical Brief` section appended to the issue via `mcp__GitLab__create_issue_note` (or `update_issue` to edit the description). Template:

```markdown
## Technical Brief

### Affected areas

- backend: <file paths + line references>
- frontend: <file paths>
- database: <tables, triggers, functions>
- packages: <types, shared-msw, viewer, etc.>

### Current behavior

<How the relevant code works today. Cite concrete symbols.>

### Proposed change (high level)

<Non-prescriptive: what must change, not how to write it.>

### Risks / gotchas

- DB triggers that enforce invariants (see README.database.md)
- Cross-cutting rebuilds (`@eggosystem/types` → backend/frontend)
- Async subsystems (Discord, BullMQ, RabbitMQ) gated on env

### Suggested sub-issues (if the scope is large)

1. <title> — <1-line scope>
2. …

### Test strategy hints

- Unit: <which layer, which factories>
- E2E: <Playwright spec path or "new spec required">
```

If the issue is too large for one branch, create sub-issues via `mcp__GitLab__create_issue` and link them with `mcp__GitLab__create_issue_link` (type `relates_to` or `blocks`).

## Research workflow

1. **Onboarding read** — skim `README.md`, `README.architecture.md`, `README.database.md`, `README.api.md`, `CLAUDE.md`. Re-read only the sections relevant to the issue.
2. **Code mapping** — use `Grep`, `Glob`, `SemanticSearch` to locate code paths. Prefer `SemanticSearch` for "how does X work?" and `Grep` for exact symbols.
3. **DB inspection** — use `mcp__mariadb__list_tables`, `mcp__mariadb__get_table_schema`, `mcp__mariadb__execute_sql` (readonly). Follow `.cursor/rules/development/database-queries.mdc`. Database `kanaliiga`.
4. **External API / library docs** — `WebSearch`, `WebFetch`. Cite URLs.
5. **Type contracts** — open `packages/types/src/**` to check shared interfaces and test factories before suggesting new types.

## MCP tools you may call

- `mcp__mariadb__*` — readonly DB exploration.
- `mcp__GitLab__create_issue`, `update_issue`, `create_issue_note`, `create_issue_link`, `list_issues`.
- `WebSearch`, `WebFetch`.

## Forbidden

- `Write`, `Edit`, `StrReplace`, any git command, any `pnpm` command that builds/tests/migrates.
- Prescribing implementation details line-by-line — that is Developer's job.
