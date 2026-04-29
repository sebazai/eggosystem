# CLAUDE.md

The role of this file is to describe common mistakes and confusion points that agents might encounter as they work in this project. If you ever encounter something in the project that surprises you, please alert the developer working with you and indicate that this is the case in the AgentMD file to help prevent future agents from having the same issue.

## DAG pipeline entry points

- `/dag-plan <free-form request>` — `intake_bot` scopes a request and creates a GitLab issue with acceptance criteria. Stops at issue creation.
- `/dag-execute <issue_iid>` — runs the full pipeline: Product → Decompose → Architecture (HITL) → parallel implementation → Final Review → human merge.
- `/observe <merged_mr_iid>` — post-merge analysis (off the critical path).

Envelope contract for all DAG-pipeline agents: `/workspace/.claude/skills/json-handoff/SKILL.md` (mirrored at `.cursor/skills/json-handoff/SKILL.md`). PostToolUse hook `/workspace/.claude/hooks/validate-envelope.sh` warns (non-blocking) on schema mismatch.
