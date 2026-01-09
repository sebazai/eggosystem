import { relative } from "path";

const buildNextLint = (filenames) => {
  // Make paths relative to apps/frontend
  const rel = filenames
    .filter((f) => f.startsWith("apps/frontend/"))
    .map((f) => relative("apps/frontend", f));
  if (rel.length === 0) return 'echo "skip next lint"';
  return `pnpm --filter=frontend exec next lint --fix --file ${rel.join(" --file ")}`;
};

const buildTypecheck = (filenames) => {
  // Filter to TypeScript/JavaScript files
  const tsFiles = filenames.filter((f) => /\.(ts|tsx|js|jsx)$/.test(f));

  if (tsFiles.length === 0) return 'echo "skip typecheck"';

  // Determine which workspaces have staged files
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

export default {
  "**/*.{json,md,yml,js,ts,tsx,jsx}": "pnpm format",
  "**/*.{js,ts,tsx,jsx}": [
    "pnpm --filter=!frontend lint:fix",
    buildTypecheck,
    () => "pnpm knip"
  ],
  "apps/frontend/**/*.{js,jsx,ts,tsx}": [buildNextLint]
};
