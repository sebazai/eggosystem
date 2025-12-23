import { relative } from "path";

const buildNextLint = (filenames) => {
  // Make paths relative to apps/frontend
  const rel = filenames
    .filter((f) => f.startsWith("apps/frontend/"))
    .map((f) => relative("apps/frontend", f));
  if (rel.length === 0) return 'echo "skip next lint"';
  return `pnpm --filter=frontend exec next lint --fix --file ${rel.join(" --file ")}`;
};

export default {
  "**/*.{json,md,yml,js,ts,tsx,jsx}": "pnpm format",
  "**/*.{js,ts,tsx,jsx}": ["pnpm --filter=!frontend lint:fix"],
  "apps/frontend/**/*.{js,jsx,ts,tsx}": [buildNextLint],
  "*": () => "pnpm -w typecheck"
};
