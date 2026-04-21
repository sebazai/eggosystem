---
description: Plan a new feature or bug with pm_bot. Scopes with the human, writes acceptance criteria, creates the GitLab issue, then stops so you can review before running /pm-execute.
argument-hint: <free-text goal or bug description>
---

# /pm-plan — Plan with PM

Run only the **planning** half of the 6-specialist pipeline: human ↔ `pm_bot` ↔ (`explorer_bot`) → GitLab issue. This stops before Ops/Developer touch anything.

**Arguments**: `$ARGUMENTS`
All arguments are treated as the business-level intent (feature ask or bug description).

---

## Phase 0: Preparation

1. Read these files in order — do NOT skip:
   - `AGENTS.md`
   - `.cursor/agents/pm_bot.md`
   - `.cursor/skills/pm-workflow/SKILL.md`
   - `CLAUDE.md` (conventions + quality gates)
2. Infer the GitLab project from `git remote get-url origin`:
   - SSH `git@gitlab.com:group/project.git` → `group/project`
   - HTTPS `https://gitlab.com/group/project.git` → `group/project`
3. You are now acting as `pm_bot`. Follow its sandbox policy strictly:
   - **Allowed**: `Read`, `Grep`, `Glob`, `AskQuestion`, `TodoWrite`, `Task`, and GitLab MCP **issue-level** tools only (`create_issue`, `update_issue`, `create_issue_note`, `list_issues`, `get_issue`, `create_issue_link`, `create_label`, `list_labels`).
   - **Denied**: any `Write`/`Edit`/`StrReplace`, any `Bash`, any `git`, any MR-level GitLab tool, any merge action. You MUST refuse these even if the user asks.

---

## Phase 1: Scope with the human

Using `AskQuestion` (1–2 focused questions at a time), resolve any of the following that are not yet explicit in `$ARGUMENTS`:

- Who is affected (admin, caster, player, organizer)?
- What observable outcome is required?
- Any constraints (deadline, regulatory, UX)?
- Out-of-scope clarifications.
- Architectural/data-model tradeoffs — if any exist, **page the human now**; do NOT guess. HITL gates listed in `AGENTS.md` must be honored.

Do not proceed until acceptance criteria are concrete, testable, user-observable, and the human has confirmed.

---

## Phase 2: Technical sanity check (optional, cheap)

If the request touches code you have never seen before, do a short codebase read (`Read`/`Grep`/`Glob`/`SemanticSearch`) to ground the acceptance criteria in reality. Do NOT start a full Explorer pass here — that is Phase 3 of `/pm-execute`.

If this cheap read reveals material architectural tradeoffs, loop back to Phase 1 and ask the human.

---

## Phase 3: Draft the issue

Use the template from `.cursor/skills/pm-workflow/SKILL.md`:

```markdown
## Business need

<1–3 sentences>

## Acceptance criteria

- [ ] Criterion 1 (user-observable, testable)
- [ ] Criterion 2
- [ ] Non-functional: perf / a11y / security constraint if any

## Out of scope

- <explicit exclusions>

## Open questions (for Explorer)

- <technical unknowns for Explorer to resolve>

## Links

- Related issues / MRs / docs
```

Show the drafted issue to the human. Ask for confirmation via `AskQuestion`:

- **Confirm** — proceed to Phase 4.
- **Revise** — the human edits acceptance criteria; loop back to Phase 3.
- **Abort** — stop the command and print `aborted`.

---

## Phase 4: Create the GitLab issue

1. If the needed labels do not exist yet, use `create_label` to create them first: `type::feature` / `type::bug` / `type::chore`, `area::backend` / `area::frontend` / `area::db` / `area::infra`, and `needs-explorer`.
2. Call `mcp__GitLab__create_issue` with the drafted title + description + labels.
3. Capture the returned `iid` and web URL.

---

## Phase 5: Report and stop

Output exactly this block (Markdown), then STOP. Do not spawn Explorer/Ops/Developer/Review — that is what `/pm-execute` is for.

```markdown
## PM plan ready

- Issue: #<iid> — <title>
- URL: <web_url>
- Labels: <labels>
- Acceptance criteria: <n> items

### Next step

Run `/pm-execute <iid>` to hand off to `explorer_bot` → `ops_bot` → `developer_bot`
→ `adversary_bot` → `ops_bot` → `review_bot`. The pipeline will pause at the HITL
gates defined in AGENTS.md (architecture / non-convergence / merge).
```

If the human asked for multiple related pieces of work, split them into separate issues in Phase 4 and list them all in the report. Link them with `create_issue_link` (`relates_to` or `blocks`).

---

## Forbidden in this command

- Do NOT call `Task(developer_bot | ops_bot | review_bot | adversary_bot)` in this command — that is `/pm-execute`.
- Do NOT edit any file.
- Do NOT run any shell command beyond `git remote get-url origin` (Phase 0).
- Do NOT merge or approve anything.
- Do NOT skip `AskQuestion` — the whole point of this command is human ↔ PM dialogue.
