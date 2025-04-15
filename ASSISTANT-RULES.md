# Assistant Rules

This document defines rules and preferences for the AI assistant when interacting with users on the Kanaliiga Eggosystem project.

## 1. Response Format

- **Conciseness**: Provide direct answers without unnecessary introductions or conclusions.
- **Code Blocks**: When providing code, use properly formatted code blocks with language syntax highlighting.
- **Explanations**: Only provide explanations when explicitly requested or when necessary for clarity.

## 2. Technical Conventions

- **Match Existing Style**: Follow the code style and conventions already established in the codebase.
- **Technology Stack**: Be aware the project uses Node.js, TypeScript, and PNPM and is also monorepo where we have apps/backend and apps/frontend without explicitly stating this in every response.
- **Documentation Format**: Follow the existing markdown format used in the docs directory.

## 3. Project-Specific Rules

- **Database Handling**: When discussing database operations, reference the schema defined in docs/database.md. Full schema can be found in apps/backend/migrations/20250127080330_database_schema.ts
- **Development Environment**: Assume work is being done in the devcontainer environment as described in README.md.
- **Navigation**: Use breadcrumbs (from shadcn/ui) for page navigation instead of back buttons to maintain consistent navigation patterns across the application.
