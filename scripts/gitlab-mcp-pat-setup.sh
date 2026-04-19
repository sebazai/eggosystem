#!/usr/bin/env bash
# Interactive helper: create .env.mcp if needed, print PAT instructions, open GitLab token UI.
# Usage: pnpm gitlab:mcp:pat
# Optional env:
#   GITLAB_WEB_HOST   — hostname only, e.g. gitlab.example.com (default: gitlab.com)
#   GITLAB_MCP_PAT_NO_OPEN=1 — skip opening the browser
set -euo pipefail

root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "${root}" ]]; then
  echo "Run this from inside the repository (git root)." >&2
  exit 1
fi

example="${root}/.env.mcp.example"
target="${root}/.env.mcp"

if [[ ! -f "${example}" ]]; then
  echo "Missing ${example}" >&2
  exit 1
fi

if [[ ! -f "${target}" ]]; then
  cp "${example}" "${target}"
  echo "Created ${target} from .env.mcp.example"
else
  echo "Using existing ${target} (not overwritten)."
fi

host="${GITLAB_WEB_HOST:-gitlab.com}"
pat_url="https://${host}/-/user_settings/personal_access_tokens"
docs_url="https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html"

echo ""
echo "GitLab Personal Access Token — Cursor MCP (@zereight/mcp-gitlab)"
echo "----------------------------------------------------------------"
echo "1. Open (or use the URL printed below):"
echo "   ${pat_url}"
echo "   Reference: ${docs_url}"
echo ""
echo "2. Create a token with scopes that match how you use MCP:"
echo "   - read_api — read-only tools (recommended: also set GITLAB_READ_ONLY_MODE=true in .env.mcp)"
echo "   - api      — read/write for issues, MRs, pipelines, etc."
echo ""
echo "3. Paste the token (glpat-...) into GITLAB_PERSONAL_ACCESS_TOKEN in:"
echo "   ${target}"
echo ""
echo "4. If you are not on GitLab.com, set GITLAB_API_URL in that file (see the example)."
echo ""
echo "5. Reload MCP servers or restart Cursor."
echo ""

open_pat_url() {
  local url=$1
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "${url}" >/dev/null 2>&1 && return 0
  fi
  if command -v open >/dev/null 2>&1; then
    open "${url}" >/dev/null 2>&1 && return 0
  fi
  return 1
}

if [[ "${GITLAB_MCP_PAT_NO_OPEN:-}" != "1" ]]; then
  if open_pat_url "${pat_url}"; then
    echo "Opened ${pat_url} in your default browser."
  else
    echo "Could not detect a browser launcher; open the URL manually."
  fi
else
  echo "GITLAB_MCP_PAT_NO_OPEN=1 — skipped opening a browser."
fi
