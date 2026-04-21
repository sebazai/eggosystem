# Cursor Chat Commands

The per-command `.md` files were migrated to **Agent Skills** at `.cursor/skills/<command-name>/SKILL.md` (same names as listed below). Invoke them from the Cursor skills menu or by name; they use `disable-model-invocation: true` so they are meant to be triggered explicitly.

This README remains a quick index of what each skill covers.

## Available Commands

### Quality & Code Standards

- **`quality-check`** - Run all quality gates (knip, typecheck, format:check, lint)
- **`typecheck`** - Run TypeScript type checking across the entire project
- **`format-code`** - Format all code with Prettier
- **`lint-fix`** - Run ESLint with auto-fix

### Database Operations

- **`db-status`** - Check database migration status
- **`db-reset`** - Reset and reseed the database
- **`create-migration`** - Create a new database migration
- **`run-migrations`** - Run pending database migrations
- **`rollback-migration`** - Rollback the last database migration

### Build & Development

- **`build`** - Build all packages and apps
- **`clean`** - Clean all build artifacts and caches
- **`fresh-start`** - Complete project reset (cleans caches, reinstall, rebuild, reseed)
- **`setup-dev`** - Complete setup for new developers

### Testing

- **`run-tests`** - Run all tests (unit + E2E)

## Usage

In Cursor's chat interface, you can invoke these commands by mentioning them. For example:

- "Run quality-check"
- "Check db-status"
- "I need to do a fresh-start"
- "Create a migration for adding user preferences"

The AI will recognize these commands and execute the appropriate actions.

## Command Structure

Each command is defined in a `.md` file with:

- **name**: The command identifier
- **description**: Brief description shown in command picker
- **Content**: Detailed explanation of what the command does

## Adding New Commands

To add a new command:

1. Create a new `.md` file in this directory
2. Add YAML frontmatter with `name` and `description`
3. Document what the command does and any warnings

Example:

```markdown
---
name: my-command
description: Brief description
---

Detailed explanation of what this command does...
```
