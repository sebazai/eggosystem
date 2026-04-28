#!/usr/bin/env sh
# validate-envelope.sh
# PostToolUse hook for the Task tool.
# Lints subagent output for the JSON envelope schema defined in
# /workspace/.claude/skills/json-handoff/SKILL.md and warns (non-blocking)
# when an agent in the DAG pipeline returns malformed output.
#
# Contract: this hook NEVER blocks. It only emits a stderr warning.

set -eu

# Hook input arrives on stdin as JSON: { tool_name, tool_input, tool_response, ... }
INPUT="$(cat)"

TOOL_NAME="$(printf '%s' "$INPUT" | jq -r '.tool_name // ""' 2>/dev/null || echo "")"
if [ "$TOOL_NAME" != "Task" ]; then
  exit 0
fi

SUBAGENT_TYPE="$(printf '%s' "$INPUT" | jq -r '.tool_input.subagent_type // ""' 2>/dev/null || echo "")"

# Only validate the DAG-pipeline agents. Other agents (existing pm_bot etc.)
# do not yet adhere to the envelope contract.
case "$SUBAGENT_TYPE" in
  intake_bot|product_bot|decomposer_bot|architect_bot|implementer_bot|ui_bot|code_review_bot|adversary_bot|final_review_bot|devops_bot|observer_bot)
    ;;
  *)
    exit 0
    ;;
esac

RESPONSE="$(printf '%s' "$INPUT" | jq -r '.tool_response // ""' 2>/dev/null || echo "")"
if [ -z "$RESPONSE" ]; then
  exit 0
fi

# Try to parse as JSON.
ENVELOPE="$(printf '%s' "$RESPONSE" | jq -c '.' 2>/dev/null || echo "")"
if [ -z "$ENVELOPE" ]; then
  printf 'envelope-validator: %s returned non-JSON output (warn-only)\n' "$SUBAGENT_TYPE" >&2
  exit 0
fi

# Required fields.
for field in status agent payload hitl_required errors; do
  HAS="$(printf '%s' "$ENVELOPE" | jq "has(\"$field\")" 2>/dev/null || echo "false")"
  if [ "$HAS" != "true" ]; then
    printf 'envelope-validator: %s missing required field "%s" (warn-only)\n' "$SUBAGENT_TYPE" "$field" >&2
  fi
done

# status enum.
STATUS="$(printf '%s' "$ENVELOPE" | jq -r '.status // ""' 2>/dev/null || echo "")"
case "$STATUS" in
  ok|blocked|stuck) ;;
  *) printf 'envelope-validator: %s status="%s" not in {ok,blocked,stuck} (warn-only)\n' "$SUBAGENT_TYPE" "$STATUS" >&2 ;;
esac

# agent must match subagent_type.
AGENT="$(printf '%s' "$ENVELOPE" | jq -r '.agent // ""' 2>/dev/null || echo "")"
if [ "$AGENT" != "$SUBAGENT_TYPE" ]; then
  printf 'envelope-validator: %s claimed agent="%s" (warn-only)\n' "$SUBAGENT_TYPE" "$AGENT" >&2
fi

# When non-ok, errors[] must be non-empty.
if [ "$STATUS" != "ok" ]; then
  ERR_LEN="$(printf '%s' "$ENVELOPE" | jq -r '(.errors // []) | length' 2>/dev/null || echo "0")"
  if [ "$ERR_LEN" = "0" ]; then
    printf 'envelope-validator: %s status=%s but errors[] is empty (warn-only)\n' "$SUBAGENT_TYPE" "$STATUS" >&2
  fi
fi

# When hitl_required=true, hitl_reason must be set.
HITL="$(printf '%s' "$ENVELOPE" | jq -r '.hitl_required // false' 2>/dev/null || echo "false")"
if [ "$HITL" = "true" ]; then
  REASON="$(printf '%s' "$ENVELOPE" | jq -r '.hitl_reason // ""' 2>/dev/null || echo "")"
  if [ -z "$REASON" ] || [ "$REASON" = "null" ]; then
    printf 'envelope-validator: %s hitl_required=true but hitl_reason is null (warn-only)\n' "$SUBAGENT_TYPE" >&2
  fi
fi

exit 0
