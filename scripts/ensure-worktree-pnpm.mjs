#!/usr/bin/env node
/**
 * Ensures the current git worktree has a real pnpm install: no node_modules
 * symlink to another clone, and a workspace package resolves under this root.
 * Run from the worktree: pnpm run worktree:ensure
 */
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, lstatSync, readdirSync, realpathSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

/** Resolvable subpath of a root devDependency (see packages/eslint `exports`) */
const WORKSPACE_PROOF = '@eggosystem/eslint/base';

function gitRoot() {
  return execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
}

function cleanShallowNodeModules(root) {
  const rm = (p) => {
    if (existsSync(p)) rmSync(p, { recursive: true, force: true });
  };
  rm(join(root, 'node_modules'));
  for (const top of ['apps', 'packages']) {
    const topPath = join(root, top);
    if (!existsSync(topPath)) continue;
    for (const ent of readdirSync(topPath, { withFileTypes: true })) {
      if (!ent.isDirectory() || ent.name.startsWith('.')) continue;
      rm(join(topPath, ent.name, 'node_modules'));
    }
  }
}

function rootNodeModulesIsForeignSymlink(root) {
  const nm = join(root, 'node_modules');
  if (!existsSync(nm) || !lstatSync(nm).isSymbolicLink()) return false;
  const target = realpathSync(nm);
  const rr = realpathSync(root);
  return target !== rr && !target.startsWith(`${rr}/`);
}

function workspacePackageResolvesUnderRoot(root) {
  const rr = realpathSync(root);
  try {
    const require = createRequire(join(root, 'package.json'));
    const p = require.resolve(WORKSPACE_PROOF);
    const pr = realpathSync(p);
    return pr === rr || pr.startsWith(`${rr}/`);
  } catch {
    return false;
  }
}

function main() {
  const root = gitRoot();
  const nm = join(root, 'node_modules');

  let needInstall = !existsSync(nm);
  if (rootNodeModulesIsForeignSymlink(root)) {
    console.error(
      '[worktree:ensure] node_modules is a symlink pointing outside this worktree — removing and reinstalling.',
    );
    needInstall = true;
  } else if (existsSync(nm) && !workspacePackageResolvesUnderRoot(root)) {
    console.error(
      '[worktree:ensure] workspace packages do not resolve under this worktree — reinstalling node_modules.',
    );
    needInstall = true;
  }

  if (needInstall) {
    cleanShallowNodeModules(root);
    execSync('pnpm install', { cwd: root, stdio: 'inherit' });
  }

  if (!workspacePackageResolvesUnderRoot(root)) {
    console.error(
      '[worktree:ensure] still broken after pnpm install — run from the worktree root: pnpm run worktree:ensure',
    );
    process.exit(1);
  }

  console.log('[worktree:ensure] ok —', realpathSync(root));
}

main();
