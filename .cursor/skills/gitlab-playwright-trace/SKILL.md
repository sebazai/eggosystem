---
name: gitlab-playwright-trace
description: >-
  Downloads a failed GitLab CI job’s Playwright artifacts from a job page URL,
  extracts trace.zip, installs Chromium if needed, and starts playwright show-trace
  for local review. Use when the user pastes a GitLab job URL, wants to inspect
  a Playwright trace from CI, or says they need trace.zip or show-trace from a
  pipeline job.
---

# Playwright trace from a GitLab job URL

**Only user input required:** a single **GitLab job page URL**  
Example: `https://gitlab.com/mygroup/myproj/-/jobs/12345678`

## Parse the URL (no other link needed)

- **`job_id`:** digits after the last `/jobs/`
- **`project_id`:** the path between the hostname and `/-/` — use the literal path with slashes (e.g. `mygroup/myproj` or `group/subgroup/proj`). The GitLab MCP also accepts a URL-encoded path; raw path usually works.

Ignore pipeline id, MR id, and job name — artifact APIs are **project + job id**.

## 1) Activate GitLab pipeline tools (if not already)

Call **`discover_tools`** with `category: pipelines` so `download_job_artifacts` and related tools are available.

## 2) Download the job artifact archive

Call **`download_job_artifacts`** with:

- `project_id` — from the URL (see above)
- `job_id` — from the URL
- `local_path` — a **temp directory** (e.g. under `/tmp/gitlab-trace/<job_id>/`)

GitLab returns one **top-level zip** of every uploaded artifact path (e.g. `apps/frontend/test-results/...`).

`list_job_artifacts` is optional; it has been unreliable in some MCP builds — **do not block** the workflow on it.

## 3) Unzip the outer archive

Unzip the downloaded file into a fresh directory (e.g. `/tmp/gitlab-trace/<job_id>/out/`). This is the **job artifact** zip, not the Playwright trace file yet.

## 4) Find `trace.zip`

Run:

```bash
find <unzip_dir> -name 'trace.zip' -type f
```

Playwright’s trace is usually at  
`.../test-results/<something>/trace.zip` (often a `-retry1` path when the first run failed).  
**Do not** unzip `trace.zip` — `show-trace` opens it directly.

## 5) Ensure Playwright can launch the viewer (Chromium)

From the **monorepo frontend** package (this repo: Playwright is wired under `apps/frontend`):

```bash
cd $(git rev-parse --show-toplevel)/apps/frontend && pnpm exec playwright install chromium
```

Skip if the environment already has Playwright’s Chromium in cache.

## 6) Start the trace viewer (HTTP server)

Use the same frontend package, pointing at the **file path** from step 4:

```bash
cd $(git rev-parse --show-toplevel)/apps/frontend && pnpm exec playwright show-trace <ABS_PATH_TO_TRACE_ZIP> -h 127.0.0.1 -p <port>
```

Pick a free **`<port>`** (e.g. 19725). Run this **in the background**; it should log `Listening on http://127.0.0.1:<port>`.

**Tell the user** to open that URL in a normal browser. In a **dev container / remote**, they may need **port forwarding** for that port. The in-browser trace UI is the intended review surface.

**Playwright MCP** (`browser_navigate`, etc.): **do not rely** on it for the trace viewer in minimal Linux images — the MCP’s browser often needs extra OS libraries (`playwright install-deps` / apt). The standalone `playwright` CLI + user browser is the supported path from this skill.

## 7) Optional: job log for the same command

`get_pipeline_job_output` (GitLab MCP, pipelines category) with the same `project_id` and `job_id` often includes Playwright’s printed line:

`pnpm exec playwright show-trace test-results/.../trace.zip`

That path is **CI-relative** (often from `apps/frontend`). The path from `find` after unzipping (step 4) is authoritative locally.

## Cleanup

When finished, stop the server (kill the background process) and remove temp dirs under `/tmp` if appropriate.

## Checklist

- [ ] Parsed **job_id** and **project path** from the single URL
- [ ] `discover_tools` → pipelines, then `download_job_artifacts`
- [ ] Unzipped the **outer** job archive; located inner **`trace.zip`** with `find`
- [ ] `playwright install chromium` (if needed) from `apps/frontend`
- [ ] `playwright show-trace <trace.zip> -h 127.0.0.1 -p <port>` (background) → user opens URL
