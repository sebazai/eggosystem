#!/usr/bin/env sh
# validate-envelope.sh
# PostToolUse hook for the Task tool (Claude Code + Cursor).
# Lints subagent output for the JSON envelope schema in
# .cursor/skills/json-handoff/SKILL.md (repo root). Stderr warnings only (non-blocking).
#
# Cursor: postToolUse passes tool_output (and base fields). Emits JSON stdout
# ({ } or { additional_context }) only when tool_output is present so Claude
# sessions (tool_response-only) stay stderr-only.
#
# Contract: this hook NEVER blocks.
set -eu

INPUT="$(cat)"

TOOL_NAME="$(printf '%s' "$INPUT" | jq -r '.tool_name // ""' 2>/dev/null || echo "")"
if [ "$TOOL_NAME" != "Task" ]; then
	exit 0
fi

SUBAGENT_TYPE="$(printf '%s' "$INPUT" | jq -r '.tool_input.subagent_type // ""' 2>/dev/null || echo "")"

# Only validate the DAG-pipeline agents.
case "$SUBAGENT_TYPE" in
intake_bot | product_bot | decomposer_bot | architect_bot | implementer_bot | ui_bot | code_review_bot | adversary_bot | final_review_bot | devops_bot | observer_bot) ;;

*)
	exit 0
	;;
esac

# Cursor postToolUse includes tool_output; Claude uses tool_response.
CURSOR_PAYLOAD=0
if printf '%s' "$INPUT" | jq -e '(.tool_output != null)' >/dev/null 2>&1; then
	CURSOR_PAYLOAD=1
fi

ENVELOPE=""
RESPONSE=""
RESPONSE="$(printf '%s' "$INPUT" | jq -r '
  if (.tool_response | type == "string") and ((.tool_response | length) > 0) then .tool_response
  elif (.tool_output | type == "string") and ((.tool_output | length) > 0) then .tool_output
  else empty end
' 2>/dev/null || echo "")"

if [ -n "$RESPONSE" ]; then
	ENVELOPE="$(printf '%s' "$RESPONSE" | jq -c '.' 2>/dev/null || echo "")"
fi

if [ -z "$ENVELOPE" ]; then
	ENVELOPE="$(printf '%s' "$INPUT" | jq -c '.tool_output | select(type == "object" and has("status") and has("agent"))' 2>/dev/null || echo "")"
fi

if [ -z "$ENVELOPE" ]; then
	exit 0
fi

WARNED=0

# Required fields.
for field in status agent payload hitl_required errors; do
	HAS="$(printf '%s' "$ENVELOPE" | jq "has(\"$field\")" 2>/dev/null || echo "false")"
	if [ "$HAS" != "true" ]; then
		printf 'envelope-validator: %s missing required field "%s" (warn-only)\n' "$SUBAGENT_TYPE" "$field" >&2
		WARNED=1
	fi
done

# status enum.
STATUS="$(printf '%s' "$ENVELOPE" | jq -r '.status // ""' 2>/dev/null || echo "")"
case "$STATUS" in
ok | blocked | stuck) ;;
*)
	printf 'envelope-validator: %s status="%s" not in {ok,blocked,stuck} (warn-only)\n' "$SUBAGENT_TYPE" "$STATUS" >&2
	WARNED=1
	;;
esac

# agent must match subagent_type.
AGENT="$(printf '%s' "$ENVELOPE" | jq -r '.agent // ""' 2>/dev/null || echo "")"
if [ "$AGENT" != "$SUBAGENT_TYPE" ]; then
	printf 'envelope-validator: %s claimed agent="%s" (warn-only)\n' "$SUBAGENT_TYPE" "$AGENT" >&2
	WARNED=1
fi

# When non-ok, errors[] must be non-empty.
if [ "$STATUS" != "ok" ]; then
	ERR_LEN="$(printf '%s' "$ENVELOPE" | jq -r '(.errors // []) | length' 2>/dev/null || echo "0")"
	if [ "$ERR_LEN" = "0" ]; then
		printf 'envelope-validator: %s status=%s but errors[] is empty (warn-only)\n' "$SUBAGENT_TYPE" "$STATUS" >&2
		WARNED=1
	fi
fi

# When hitl_required=true, hitl_reason must be set.
HITL="$(printf '%s' "$ENVELOPE" | jq -r '.hitl_required // false' 2>/dev/null || echo "false")"
if [ "$HITL" = "true" ]; then
	REASON="$(printf '%s' "$ENVELOPE" | jq -r '.hitl_reason // ""' 2>/dev/null || echo "")"
	if [ -z "$REASON" ] || [ "$REASON" = "null" ]; then
		printf 'envelope-validator: %s hitl_required=true but hitl_reason is null (warn-only)\n' "$SUBAGENT_TYPE" >&2
		WARNED=1
	fi
fi

ADDITIONAL_CONTEXT=""
if [ "$CURSOR_PAYLOAD" -eq 1 ] && [ "$STATUS" = "ok" ] && [ "$SUBAGENT_TYPE" = "implementer_bot" ]; then
	ADDITIONAL_CONTEXT="DAG hook: implementer_bot envelope ok. Ensure quality gates (format → per-app typecheck → targeted Jest → knip) ran before MR/push per .cursor/agents/dag-orchestration.md and implementer_bot."
	if [ "$WARNED" -eq 1 ]; then
		ADDITIONAL_CONTEXT="$ADDITIONAL_CONTEXT Check Hooks stderr for envelope-validator warnings."
	fi
fi

if [ "$CURSOR_PAYLOAD" -eq 1 ]; then
	if [ -n "$ADDITIONAL_CONTEXT" ]; then
		jq -n --arg ac "$ADDITIONAL_CONTEXT" '{additional_context: $ac}'
	else
		printf '%s\n' '{}'
	fi
fi

exit 0
