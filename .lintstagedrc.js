import { join, relative } from "path";

const PACKAGE_PREFIXES = {
  backend: "apps/backend/",
  "@eggosystem/types": "packages/types/",
  "@eggosystem/viewer": "packages/viewer/",
  "@eggosystem/eslint": "packages/eslint/"
};

/** Paths from lint-staged may be absolute; normalize to repo-relative for package matching. */
const toRepoRelative = (file) => {
  const cwd = process.cwd();
  return file.startsWith(cwd) ? relative(cwd, file) : file;
};

const buildFrontendLint = (filenames) => {
  const normalized = filenames.map(toRepoRelative);
  const rel = normalized
    .filter((f) => f.startsWith("apps/frontend/"))
    .map((f) => relative("apps/frontend", f));
  if (rel.length === 0) return 'echo "skip frontend lint"';
  return `pnpm --filter=frontend exec eslint . --fix -- ${rel.join(" ")}`;
};

const buildLintFix = (filenames) => {
  const normalized = filenames.map(toRepoRelative);
  const tsFiles = normalized.filter((f) => /\.(ts|tsx|js|jsx)$/.test(f));
  if (tsFiles.length === 0) return 'echo "skip lint"';

  const byPackage = {};
  tsFiles.forEach((file) => {
    if (file.startsWith("apps/backend/")) {
      (byPackage.backend = byPackage.backend || []).push(file);
    } else if (file.startsWith("packages/types/")) {
      (byPackage["@eggosystem/types"] =
        byPackage["@eggosystem/types"] || []).push(file);
    } else if (file.startsWith("packages/viewer/")) {
      (byPackage["@eggosystem/viewer"] =
        byPackage["@eggosystem/viewer"] || []).push(file);
    } else if (file.startsWith("packages/eslint/")) {
      (byPackage["@eggosystem/eslint"] =
        byPackage["@eggosystem/eslint"] || []).push(file);
    }
    // frontend: handled by buildFrontendLint
  });

  const commands = Object.entries(byPackage).map(([pkg, files]) => {
    const prefix = PACKAGE_PREFIXES[pkg];
    const base = prefix.startsWith("/") ? prefix : join(process.cwd(), prefix);
    const relPaths = files.map((f) =>
      f.startsWith("/") ? relative(base, f) : relative(prefix, f)
    );
    return `pnpm --filter=${pkg} exec eslint . --fix -- ${relPaths.join(" ")}`;
  });
  if (commands.length === 0) return 'echo "skip lint"';
  return commands;
};

const buildTypecheck = (filenames) => {
  const normalized = filenames.map(toRepoRelative);
  const tsFiles = normalized.filter((f) => /\.(ts|tsx|js|jsx)$/.test(f));

  if (tsFiles.length === 0) return 'echo "skip typecheck"';

  const workspaces = new Set();
  tsFiles.forEach((file) => {
    if (file.startsWith("apps/backend/")) {
      workspaces.add("backend");
    } else if (file.startsWith("apps/frontend/")) {
      workspaces.add("frontend");
    } else if (file.startsWith("packages/types/")) {
      workspaces.add("@eggosystem/types");
    } else if (file.startsWith("packages/viewer/")) {
      workspaces.add("@eggosystem/viewer");
    }
  });

  if (workspaces.size === 0) return 'echo "skip typecheck"';

  // Run typecheck for each affected workspace
  const filters = Array.from(workspaces)
    .map((ws) => `--filter=${ws}`)
    .join(" ");
  return `pnpm ${filters} typecheck`;
};

const buildFormat = (filenames) => {
  const quoted = filenames.map((f) => `"${f.replace(/"/g, '\\"')}"`).join(" ");
  return `prettier --write ${quoted}`;
};

export default {
  "**/*.{json,md,yml,js,ts,tsx,jsx}": [buildFormat],
  "**/*.{js,ts,tsx,jsx}": [buildLintFix, buildTypecheck, () => "pnpm knip"],
  "apps/frontend/**/*.{js,jsx,ts,tsx}": [buildFrontendLint]
};
