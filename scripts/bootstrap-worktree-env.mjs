#!/usr/bin/env node
/* eslint-env node */
/**
 * One-off bootstrap for DAG worktrees under `<repo>/.worktrees/<name>/`:
 * copies local-only files from the primary checkout (`<repo>/`) into this worktree.
 *
 * Source root (defaults to parent repo when path matches /.worktrees/<segment>/):
 *   WORKTREE_SECRET_SOURCE=/absolute/path/to/main/checkout
 *
 * Copies when present:
 *   - apps/backend/.env → <worktree>/apps/backend/.env
 *   - .env.mcp          → <worktree>/.env.mcp
 *   - apps/backend/*.pem → same relative paths under the worktree
 *
 * Safe to run from the primary checkout (no-op). Missing sources are skipped with a log line.
 */
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  realpathSync,
  statSync
} from "node:fs";
import { dirname, join } from "node:path";

function gitRoot() {
  return execFileSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8"
  }).trim();
}

function resolvedSame(a, b) {
  try {
    return realpathSync(a) === realpathSync(b);
  } catch {
    return false;
  }
}

function resolveSourceRoot(destRoot, envSource) {
  const trimmed = typeof envSource === "string" ? envSource.trim() : "";
  if (trimmed) return trimmed;

  const m = destRoot.match(/^(.+)\/\.worktrees\/[^/]+$/);
  return m?.[1] ?? destRoot;
}

function safeCopy(relPath, destRoot, sourceRoot, label = relPath) {
  const src = join(sourceRoot, relPath);
  const dst = join(destRoot, relPath);
  if (!existsSync(src) || !statSync(src).isFile()) {
    console.log(`[bootstrap-worktree-env] skip ${label}: absent or not a file`);
    return;
  }
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
  console.log(`[bootstrap-worktree-env] copied ${label}`);
}

function main() {
  const destRoot = gitRoot();
  const sourceRoot = resolveSourceRoot(
    destRoot,
    process.env.WORKTREE_SECRET_SOURCE
  );

  if (!existsSync(sourceRoot)) {
    console.error(
      `[bootstrap-worktree-env] source root missing: ${sourceRoot} — set WORKTREE_SECRET_SOURCE or fix layout`
    );
    process.exit(1);
  }

  if (!statSync(sourceRoot).isDirectory()) {
    console.error(
      `[bootstrap-worktree-env] source root not a directory: ${sourceRoot}`
    );
    process.exit(1);
  }

  if (resolvedSame(sourceRoot, destRoot)) {
    console.log(
      "[bootstrap-worktree-env] skip: primary checkout (source === worktree)"
    );
    return;
  }

  safeCopy("apps/backend/.env", destRoot, sourceRoot);

  safeCopy(".env.mcp", destRoot, sourceRoot);

  const backendDir = join(sourceRoot, "apps/backend");
  if (existsSync(backendDir) && statSync(backendDir).isDirectory()) {
    let pemCount = 0;
    for (const name of readdirSync(backendDir)) {
      if (!name.endsWith(".pem")) continue;
      safeCopy(join("apps/backend", name), destRoot, sourceRoot);
      pemCount += 1;
    }
    if (pemCount === 0)
      console.log(
        "[bootstrap-worktree-env] skip apps/backend/*.pem: none found in source"
      );
  } else {
    console.log(
      "[bootstrap-worktree-env] skip *.pem: no apps/backend in source"
    );
  }
}

main();
