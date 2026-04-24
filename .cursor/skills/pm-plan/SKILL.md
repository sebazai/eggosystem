---
name: pm-plan
description: Plan a feature or bug with pm_bot. Scopes with the human, writes acceptance criteria, creates the GitLab issue, then stops before any code changes.
disable-model-invocation: true
---

# /pm-plan — Plan with PM

Run only the **planning** half of the PM pipeline: human ↔ `pm_bot` → GitLab issue (stops before Ops / worktree / Developer).

Full playbook lives in [`.claude/commands/pm-plan.md`](../../../.claude/commands/pm-plan.md). Under Cursor, this skill is the user-invokable entry point; the same instructions apply.

## How to invoke

Open a Cursor chat and type:

> Run the pm-plan skill for: `<your goal or bug description>`

Or, equivalently, paste the manual prompt from the Cursor entry section of [`AGENTS.md`](../../../AGENTS.md).

## What the agent will do

1. Read `AGENTS.md`, `.cursor/agents/pm_bot.md`, `.cursor/skills/pm-workflow/SKILL.md`, and `CLAUDE.md`.
2. Assume the `pm_bot` role — denies itself `Write` / `Edit` / `Bash` / `git` / MR tools.
3. Ask you focused clarifying questions until acceptance criteria are concrete.
4. Draft the issue using the template in `pm-workflow/SKILL.md` and ask you to confirm.
5. Create the GitLab issue via `mcp__GitLab__create_issue` (MCP auth prompts you once).
6. Stop. Print a report with the issue IID + URL and tell you to run the `pm-execute` skill next.

## What the agent will refuse

- Writing or editing any file.
- Any shell command other than `git remote get-url origin`.
- Spawning `developer_bot` / `ops_bot` / `review_bot` — those are for `pm-execute`.
- Approving or merging anything.
- Proceeding when an architecture/data-modeling tradeoff is detected — it will stop and ask you to resolve it first (HITL gate).

## Next step

Once the issue exists, run the `pm-execute` skill with the returned IID.
