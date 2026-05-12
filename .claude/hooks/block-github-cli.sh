#!/bin/sh
# PreToolUse(Bash): block GitHub CLI (gh). This repo uses GitLab; prefer GitLab MCP.
#
# stdin: Cursor { "command", ... } or Claude { "tool_input": { "command" } }
set -eu

if ! command -v jq >/dev/null 2>&1; then
  exit 0
fi

cmd=$(jq -r '(.command // .tool_input.command // "") | if . == null then "" else . end')
[ -z "$cmd" ] && exit 0

# Match enforce-rtk-shell: hide $(git rev-parse ...) so nested tokens do not confuse checks.
scan=$(printf '%s' "$cmd" | sed 's/\$(git[[:space:]]\+rev-parse[^)]*)/__/g')

# gh invoked at segment start, optionally prefixed with rtk, after BOF or chain operators.
gh_seg='[[:space:]]*(rtk[[:space:]]+)?gh([[:space:]]|$)'
if ! printf '%s' "$scan" | grep -Eq "^${gh_seg}|(\|\||\&\&|;|\|)${gh_seg}"; then
  exit 0
fi

msg='This project uses GitLab, not GitHub. Do not run the gh (GitHub CLI) tool. Use the GitLab MCP server instead (this workspace enables it as "GitLab" / project-0-workspace-GitLab): issues, merge requests, pipelines, and project APIs are available there.'

jq -n \
  --arg um "$msg" \
  --arg am "$msg" \
  '{"permission":"deny","user_message":$um,"agent_message":$am,"continue":true}'
exit 0
