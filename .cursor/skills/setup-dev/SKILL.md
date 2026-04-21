---
name: setup-dev
description: Complete setup for new developers
disable-model-invocation: true
---

---

name: setup-dev
description: Complete setup for new developers

---

Run the complete setup process for a new developer joining the project.

This command:

1. Installs all dependencies (`pnpm install`)
2. Installs Playwright browsers (`pnpm install:playwright`)
3. Builds all packages (`pnpm build`)
4. Runs database migrations (`pnpm migrate`)
5. Seeds the database (`pnpm seed`)

Use this when onboarding new team members or setting up a fresh clone of the repository.
