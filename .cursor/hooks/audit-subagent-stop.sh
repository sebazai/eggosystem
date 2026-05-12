#!/usr/bin/env sh
# Cursor subagentStop: stderr audit only. No followup_message (avoid auto-loops).
set -eu

input="$(cat)"

type="$(printf '%s' "$input" | jq -r '.subagent_type // "unknown"')"
status="$(printf '%s' "$input" | jq -r '.status // "unknown"')"
duration="$(printf '%s' "$input" | jq -r '.duration_ms // 0')"
tools="$(printf '%s' "$input" | jq -r '.tool_call_count // 0')"
files="$(printf '%s' "$input" | jq -r '(.modified_files // []) | length')"

preview="$(printf '%s' "$input" | jq -r '.task // ""' | tr '\n' ' ' | cut -c1-160)"

printf 'subagent-stop: type=%s status=%s duration_ms=%s tool_calls=%s modified_file_count=%s task_preview=%s\n' \
	"$type" "$status" "$duration" "$tools" "$files" "$preview" >&2

printf '%s\n' '{}'
