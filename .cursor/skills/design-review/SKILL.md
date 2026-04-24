---
name: design-review
description: Design standards checklist for frontend diffs (shadcn/Radix/Tailwind). Used by designer_bot and developer_bot when reviewing UI changes.
---

# Design Review Skill (Frontend)

Use this skill when reviewing changes under `apps/frontend/`, especially:

- `apps/frontend/src/components/**`
- `apps/frontend/src/app/**`
- `apps/frontend/src/styles/**`
- Tailwind config/theme tokens and global CSS

## Goals

- Keep UI changes aligned with the repo’s **design system** (shadcn/Radix/Tailwind + semantic tokens).
- Prevent design drift during refactors and “quick fixes”.
- Catch UX and accessibility regressions early.

## Checklist (prioritized)

### 1) Design system primitives & reuse

- Prefer existing components under `@/components/` and shadcn primitives under `@/components/ui/`.
- Avoid introducing new bespoke primitives (custom buttons/inputs/cards) when equivalents exist.
- Prefer composition (wrapping + props) over duplicating patterns.

### 2) Tokens, colors, and theming

- Use semantic Tailwind tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-muted`, etc.).
- Avoid hardcoded hex/rgb colors and one-off utility color choices unless there is an established pattern in the repo.
- Ensure dark mode/theming still works (no “looks fine on light only” changes).

### 3) Spacing, typography, and density

- Stay consistent with spacing scale (`gap-2/3/4`, `p-3/4`, etc.) used nearby.
- Prefer responsive utilities with mobile-first defaults (`sm:` etc.) as used in `pages-and-layouts.mdc`.
- Avoid “magic numbers” (`text-[11px]`, `mt-[7px]`) unless unavoidable and consistent with existing patterns.
- Prefer `font-heading` only where headings are used elsewhere; otherwise standard `font-semibold` / `font-medium`.

### 4) Responsiveness & layout

- Check overflow and wrapping on narrow screens.
- Ensure interactive controls are touch-friendly (height, spacing, hit targets).
- Avoid layouts that break when translations/long names occur (use `min-w-0`, `truncate`, `break-words` appropriately).

### 5) Accessibility (must not regress)

- Inputs have labels (visible or `sr-only`) and correct `aria-*` when needed.
- Dialogs/sheets/popovers: focus management relies on Radix/shadcn components (don’t bypass).
- Buttons/links: correct element semantics (`Button asChild` + `Link` is ok when used consistently).
- Ensure focus ring styles aren’t removed.

### 6) Content & microcopy

- Keep copy consistent with existing pages (title case vs sentence case).
- Avoid overly verbose helper text; prefer short, direct copy.

## Output format (for designer_bot)

- **verdict**: `pass` | `needs_changes`
- **findings**: grouped bullets with file hints where possible.
