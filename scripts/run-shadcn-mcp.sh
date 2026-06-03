#!/usr/bin/env bash
# shadcn MCP launcher — Cursor prepends its bundled Node 20 on PATH, which breaks pnpm 11.
# Prefer devcontainer image Node (>= 22.13) before cursor-server paths (see CLAUDE.md).

export PATH="/usr/local/bin:/usr/local/share/npm-global/bin:/home/node/.local/bin:${PATH}"

NODE_BIN="${NODE_BIN:-/usr/local/bin/node}"
PNPM_BIN="${PNPM_BIN:-/usr/local/share/npm-global/bin/pnpm}"

if [ ! -x "$NODE_BIN" ]; then
  echo "run-shadcn-mcp: node not found at $NODE_BIN" >&2
  exit 1
fi

if ! "$NODE_BIN" -e 'const [m,n]=process.versions.node.split(".").map(Number); process.exit(m<22||(m===22&&n<13)?1:0)'; then
  echo "run-shadcn-mcp: $("$NODE_BIN" -v) is too old for pnpm 11 (need >= 22.13)" >&2
  exit 1
fi

if [ -x "$PNPM_BIN" ]; then
  exec "$PNPM_BIN" -C /workspace/apps/frontend exec shadcn mcp
fi

if ! command -v pnpm >/dev/null; then
  echo "run-shadcn-mcp: pnpm not found on PATH after NODE_BIN check" >&2
  exit 1
fi

exec pnpm -C /workspace/apps/frontend exec shadcn mcp
