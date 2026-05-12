#!/usr/bin/env sh
# Cursor subagentStart: stderr audit only; never deny (non-blocking policy).
set -eu

input="$(cat)"

type="$(printf '%s' "$input" | jq -r '.subagent_type // "unknown"')"
parallel="$(printf '%s' "$input" | jq -r '.is_parallel_worker // false')"
preview="$(printf '%s' "$input" | jq -r '.task // ""' | tr '\n' ' ' | cut -c1-240)"

printf 'subagent-start: type=%s parallel=%s task_preview=%s\n' "$type" "$parallel" "$preview" >&2

case "$type" in
intake_bot | product_bot | decomposer_bot | architect_bot | implementer_bot | ui_bot | code_review_bot | adversary_bot | final_review_bot | devops_bot | observer_bot)
	;;
explore | shell | generalPurpose | cursor-guide | best-of-n-runner | gitlab-assistant)
	;;
*)
	printf 'subagent-start: notice — subagent_type=%s is outside DAG/cursor-helper set (still allowed).\n' "$type" >&2
	;;
esac

printf '%s\n' '{"permission":"allow"}'
