---
name: execute
description: Full issue-to-PR workflow. Fetches a GitLab issue, optionally plans (complex issues only), implements via a dedicated agent, reviews quality and correctness via a dedicated agent, then commits and opens a merge request.
disable-model-invocation: true
---

---

description: Full issue-to-PR workflow. Fetches a GitLab issue, optionally plans (complex issues only), implements via a dedicated agent, reviews quality and correctness via a dedicated agent, then commits and opens a merge request.
argument-hint: <issue-number> [additional context]

---

# Execute GitLab Issue

Run a complete Issue → (Plan) → Execute → Review → PR workflow for a GitLab issue.

**Arguments**: `$ARGUMENTS`  
First token is the issue number. Remaining tokens are optional context to pass to all agents.

---

## Phase 1: Issue Analysis

### 1a. Infer the GitLab project

Run:

```bash
git remote get-url origin
```

Parse the namespace/project path from the URL:

- SSH: `git@gitlab.com:group/project.git` → `group/project`
- HTTPS: `https://gitlab.com/group/project.git` → `group/project`

### 1b. Fetch the issue

Use the `get_issue` GitLab MCP tool with the parsed project path and issue number.

Collect:

- Title, description, labels, milestone, assignees
- Any linked issues (look for "parent of #X", "part of #X", or issue links)
- Use `list_issue_links` to find related issues if the description suggests a hierarchy

### 1c. Classify the issue

Determine:

**Type** — from labels or description:

- `fix` if labels include `bug`, `fix`, `hotfix`, or the title starts with "fix:"
- `feat` for everything else

**Complexity** — choose `simple` or `complex`:

- **simple**: single responsibility, clear requirements, likely touches 1–3 files, no architectural decisions needed
- **complex**: spans multiple systems, requires architectural decisions, touches many files, requirements are ambiguous, or has sub-issues that must be coordinated

Show the user a brief summary:

```
Issue #<number>: <title>
Type: feat | fix
Complexity: simple | complex
Labels: <labels>
<one-sentence description of what needs to be done>
<parent/sub-issue relationships if any>
```

---

## Phase 2: Plan (complex issues only)

Skip this phase entirely for simple issues.

For complex issues, spawn a **Plan agent**:

```
You are a software architect creating an implementation plan.

Issue: #<number> — <title>
Description:
<full issue description>

Labels: <labels>
Additional context: <any parent/sub issues or extra args from $ARGUMENTS>

Working directory: <absolute path from `git rev-parse --show-toplevel`>

Read CLAUDE.md first, then explore the relevant parts of the codebase. Produce:

1. Step-by-step implementation plan (numbered, actionable)
2. Files to create or modify — include file path and a one-line rationale for each
3. Any risks, constraints, or gotchas (DB triggers, shared types, auth middleware, etc.)
4. Suggested commit structure if multiple logical units

Return the complete plan. Be specific about file paths and function names where you can.
```

Wait for the plan to complete. Present it to the user and **ask for confirmation** before proceeding to execution. If the user requests changes, revise and ask again.

---

## Phase 3: Execute

Spawn an **Execute agent** with the full context:

```
Implement the following GitLab issue. Make all necessary code changes. Do NOT commit anything.

Issue: #<number> — <title>
Type: feat | fix
Description:
<full issue description>

Labels: <labels>
Additional context from user: <extra args from $ARGUMENTS, if any>

<If plan exists:>
Implementation plan:
<full plan from Phase 2>
</If plan exists>

<If no plan:>
This is a simple issue — implement it directly. Read relevant files first to understand context.
</If no plan:>

Working directory: <absolute path>

Rules:
- Read CLAUDE.md before writing any code
- Follow all conventions in CLAUDE.md exactly (no unsafe casts, no unnecessary try/catch, no comments explaining what code does)
- Use existing patterns — don't invent new abstractions unless the plan calls for it
- If you modify shared types in packages/types, rebuild them before the app packages can typecheck

When done, output a final section titled "## Modified Files" listing every file you created or changed, one per line as an absolute path.
```

Wait for the execute agent to finish. Extract the modified files list from its output.

---

## Phase 4: Review

Spawn a **Review agent**:

```
Review an implementation for GitLab issue #<number>: <title>

Modified files:
<list from execute agent>

Issue requirements:
<title>
<full description>

Working directory: <absolute path>

Your tasks:

1. Read every modified file listed above
2. Verify the implementation actually solves the issue — does it address everything in the description?
3. Check against CLAUDE.md rules: no `as SomeType` unsafe casts, no unnecessary try/catch, no inline `import("module").Type`, no duplicated logic that should be exported
4. From the repo root (cd to the monorepo root first), run: pnpm quality
   (That script is defined in root package.json and runs knip, then typecheck, then format:check, then lint.)

5. If the quality run fails or you find a violation, fix it. Re-run pnpm quality to confirm it passes.
6. Output a final "## Review Result" section:
- PASS or FAIL
- Whether the issue is fully addressed
- Any fixes you applied (list the files)
- Any concerns that need the developer's attention (things you couldn't auto-fix)
```

Wait for the review to complete.

If the review result is **FAIL** and the reviewer could not auto-fix the issues, report the problems to the user and ask how to proceed before continuing.

---

## Phase 5: Branch, Commit, and Merge Request

### 5a. Create branch

Build the branch name:

- Type: `feat` or `fix` (from Phase 1 classification)
- Slug: issue title → lowercase, spaces to hyphens, strip special characters, max 45 chars
- Format: `<type>/<issue-number>-<slug>`

Example: `feat/123-add-player-registration-endpoint`

```bash
git checkout development
git pull origin development
git checkout -b <branch-name>
```

### 5b. Stage and commit

Stage all modified files (be specific — do not use `git add .` blindly; check `git status` first).

Write **great commit messages** using Conventional Commits format:

```
<type>(<scope>): <imperative summary, max 72 chars>

<Body: explain WHY the change was needed and what the issue was.
Reference any non-obvious constraints (DB triggers, auth flow, etc.)
Wrap at 72 chars.>

Closes #<issue-number>
```

- `type`: `feat`, `fix`, `refactor`, `test`, `chore`, `docs`
- `scope`: affected package/module (e.g., `backend`, `frontend`, `types`, `auth`)
- If multiple logical units of change exist, make **separate commits** per unit, each with its own message

### 5c. Push

```bash
git push -u origin <branch-name>
```

### 5d. Open Merge Request

Use `create_merge_request` GitLab MCP tool:

- `source_branch`: the new branch
- `target_branch`: `development`
- `title`: `<feat|fix>: <issue title>`
- `description`:

  ```
  ## Summary
  <1–3 bullet points summarizing what was changed>

  ## Issue
  Closes #<issue-number>

  ## Changes
  <list of key files changed and why>
  ```

- `labels`: copy from the original issue

### 5e. Report to user

Output:

```
✓ Branch: <branch-name>
✓ Commits: <number> commit(s)
✓ MR: <merge request URL>
```
