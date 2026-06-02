/**
 * Prefer the devcontainer image Node (/usr/local/bin) over Cursor's bundled Node on PATH.
 * pnpm 11+ requires Node >= 22.13 (uses node:sqlite).
 */
/** Keep in sync with .devcontainer/* and scripts that export PATH for non-interactive shells. */
export const PATH_PREFIX =
  "/usr/local/bin:/usr/local/share/npm-global/bin:/home/node/.local/bin";

const CONTAINER_NODE = "/usr/local/bin/node";

const MIN_MAJOR = 22;
const MIN_MINOR = 13;

/**
 * @param {NodeJS.ProcessEnv} [base]
 * @returns {NodeJS.ProcessEnv}
 */
export function containerNodePathEnv(base = process.env) {
  return {
    ...base,
    PATH: `${PATH_PREFIX}:${base.PATH ?? ""}`
  };
}

/**
 * @returns {string}
 */
export function containerNodeExecutable() {
  return CONTAINER_NODE;
}

/**
 * @param {string} versionOutput e.g. "v24.15.0"
 */
export function parseNodeVersion(versionOutput) {
  const match = /^v?(\d+)\.(\d+)/.exec(versionOutput.trim());
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]) };
}

/**
 * @param {{ major: number; minor: number }} parsed
 */
export function isNodeVersionSufficient(parsed) {
  if (parsed.major > MIN_MAJOR) return true;
  if (parsed.major < MIN_MAJOR) return false;
  return parsed.minor >= MIN_MINOR;
}

/**
 * @param {import("node:child_process").ExecFileSync} execFileSync
 * @param {string} [nodePath]
 */
export function assertContainerNodeVersion(execFileSync, nodePath = CONTAINER_NODE) {
  let versionOutput;
  try {
    versionOutput = execFileSync(nodePath, ["-p", "process.version"], {
      encoding: "utf8"
    });
  } catch {
    throw new Error(
      `[container-node-path] ${nodePath} is missing or not executable — rebuild the devcontainer image`
    );
  }

  const parsed = parseNodeVersion(versionOutput);
  if (!parsed || !isNodeVersionSufficient(parsed)) {
    throw new Error(
      `[container-node-path] ${nodePath} reports ${versionOutput.trim()} but pnpm 11 needs Node >= ${MIN_MAJOR}.${MIN_MINOR}`
    );
  }
}
