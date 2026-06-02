#!/usr/bin/env bash
# Worktree bootstrap: secrets copy + clean node_modules + pnpm install + build.
# Uses devcontainer Node (pnpm 11 requires >= 22.13); Cursor may shadow node on PATH.
set -euo pipefail

export PATH="/usr/local/bin:/usr/local/share/npm-global/bin:/home/node/.local/bin:${PATH}"

if ! command -v node >/dev/null; then
  echo "[bootstrap-worktree-deps] node not found on PATH" >&2
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.').map(Number)[0]")"
NODE_MINOR="$(node -p "process.versions.node.split('.').map(Number)[1]")"
if [ "$NODE_MAJOR" -lt 22 ] || { [ "$NODE_MAJOR" -eq 22 ] && [ "$NODE_MINOR" -lt 13 ]; }; then
  echo "[bootstrap-worktree-deps] node $(node -v) is too old for pnpm 11 (need >= 22.13)" >&2
  echo "[bootstrap-worktree-deps] which node: $(command -v node)" >&2
  echo "[bootstrap-worktree-deps] expected /usr/local/bin/node first on PATH — rebuild devcontainer or export PATH as in scripts/bootstrap-worktree-deps.sh" >&2
  exit 1
fi

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

node scripts/bootstrap-worktree-env.mjs
rm -rf node_modules
pnpm install --frozen-lockfile
pnpm build

echo "[bootstrap-worktree-deps] ok — $ROOT"
