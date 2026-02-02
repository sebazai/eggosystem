/**
 * Runs `npx @next/codemod@canary agents-md --output AGENTS.md` only when the
 * Next.js version in package.json has changed since the last run. This keeps
 * AGENTS.md in sync after upgrades (e.g. Renovate or manual).
 *
 * Writes the current Next version to .next-agents-md-version so the next
 * install can skip the codemod unless the version changed.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const appDir = path.resolve(__dirname, "..");
const packagePath = path.join(appDir, "package.json");
const versionPath = path.join(appDir, ".next-agents-md-version");

const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const nextVersion = (pkg.dependencies && pkg.dependencies.next) || null;
if (!nextVersion) {
  process.exit(0);
}

let lastVersion = null;
try {
  lastVersion = fs.readFileSync(versionPath, "utf8").trim();
} catch {
  // File missing: first run or fresh clone
}

if (lastVersion === nextVersion) {
  process.exit(0);
}

execSync("npx @next/codemod@canary agents-md --output AGENTS.md", {
  cwd: appDir,
  stdio: "inherit",
});
fs.writeFileSync(versionPath, nextVersion, "utf8");
