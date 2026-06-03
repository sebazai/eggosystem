# Frontend Development Guidelines

This document provides comprehensive guidelines for frontend development in the Kanaliiga project, including component patterns, responsive design requirements, and data fetching strategies.

## Architecture & Technology Stack

- **Framework**: Next.js 16 (App Router) with React 19
- **UI Library**: shadcn (see `apps/frontend/components.json`) built on Radix UI primitives
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/postcss`) with custom design tokens in `globals.css`
- **TypeScript**: Strict type safety with `satisfies` operator (no unsafe `as` casts)
- **Icons**: Lucide React
- **Forms**: `react-hook-form` + Zod via `@hookform/resolvers`
- **Data Fetching**: SWR for client-side state management; server components / route handlers where appropriate
- **Testing**: Jest for unit tests, Playwright for E2E tests
- **Dev server**: `next dev` on port `:3000`

### Route Groups (`apps/frontend/src/app/`)

- `(admin)` — dashboard routes (cookie-based JWT auth)
- `(main)` — public-facing routes
- `(embed)` — embedded widgets
- `(health)` — health / status endpoints

### Dashboard Authentication

Dashboard routes rely on a cookie-based JWT `access_token` issued by the backend. E2E tests and the Playwright MCP inject this cookie directly via `generateTestJWTForUser` in `apps/frontend/src/e2e/utils/index.ts`. See `.cursor/skills/playwright-mcp-admin-auth/SKILL.md` for the MCP admin-auth workflow.

### Build Output

The app builds in Next.js **standalone** mode (`output: "standalone"` in `next.config.ts`). The `postbuild` script runs `copy-standalone`, which creates `.next/standalone/apps/frontend/.next/static/` and copies `.next/static/*` plus the `public/` directory into it. `start:standalone` then runs `node .next/standalone/apps/frontend/server.js` on port `3000`.

The `build:e2e` script additionally sets `NEXT_PUBLIC_IMAGE_SERVICE_URL=https://img.kanaliiga.fi` so E2E builds resolve image URLs against the production image service.

### AGENTS.md

`apps/frontend/AGENTS.md` is generated via `@next/codemod@canary agents-md` (see the `agents-md` / `postinstall` scripts in `apps/frontend/package.json`). Do not edit by hand.

## 📱 Responsive Design Requirements

**CRITICAL**: All pages and components must be fully responsive across all screen sizes.

### Mobile-First Approach

- **Mobile** (default): Base styles without prefixes
- **Tablet** (`sm:`, `md:`): Medium screen optimizations
- **Desktop** (`lg:`, `xl:`): Large screen layouts

### Tailwind Responsive Utilities

```tsx
// Example responsive component
<div
  className="
  flex flex-col gap-2
  sm:flex-row sm:gap-4
  lg:gap-6
  xl:gap-8
"
>
  {/* Content */}
</div>
```

### Custom Breakpoints

The project includes custom mobile variants in `globals.css`:

- `mobile-portrait`: Portrait orientation on mobile devices
- `mobile-landscape`: Landscape orientation on mobile devices

## 🧩 Component Patterns

### UI Components (`@/components/ui/`)

Built on Radix UI primitives with consistent patterns:

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground rounded-xl border shadow-sm",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  );
}

// Export compound components
export { Card, CardHeader, CardContent };
```

### Feature Components

Organized by domain with proper TypeScript interfaces:

```tsx
interface ComponentProps {
  // Well-typed props
  title: string;
  onAction?: () => void;
}

export default function Component({ title, onAction }: ComponentProps) {
  return <div className="responsive-styles">{/* Implementation */}</div>;
}
```

### Component Organization

```
src/components/
├── ui/              # shadcn/ui components
├── layout/          # Layout and navigation
├── loading/         # Reusable loading state components
├── players/         # Player-related components
├── matches/         # Match-related components
├── organizations/   # Organization components
└── [domain]/        # Domain-specific components
```

## 🔄 Data Fetching Patterns

### Prefer Data Hooks Over Component Fetching

**✅ DO**: Create custom data hooks

```tsx
// @/hooks/data/usePlayers.ts
import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";

export function usePlayers() {
  const { data, error, isLoading } = useSWR("/api/players", (url) =>
    clientApiFetch(url)
  );

  return { players: data, error, isLoading };
}

// Component usage
export default function PlayersPage() {
  const { players, error, isLoading } = usePlayers();

  if (isLoading) return <TableSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return <PlayersList players={players} />;
}
```

**❌ DON'T**: Fetch directly in components

```tsx
// ❌ Avoid this pattern
export default function PlayersPage() {
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    fetch("/api/players").then(/* ... */);
  }, []);

  // ...
}
```

### Data Fetching Rules

1. **Server Components**: Use `fetch()` (no authentication handling)
2. **Client Components**: Use `clientApiFetch()` for authenticated requests
3. **Custom Hooks**: Create reusable data hooks in `@/hooks/data/`
4. **SWR Integration**: Use SWR for caching and state management

## ⏳ Loading States

**CRITICAL**: Always use skeleton components instead of "Loading..." text. Preserve page structure during loading.

### Available Loading Components

All loading components are located in `@/components/loading/`:

- **`PageSkeleton`** - For full pages that need to preserve structure (title, filters, etc.)
- **`TableSkeleton`** - For table loading states with configurable rows/columns
- **`CardSkeleton`** - Generic card skeleton for any card-based loading
- **`MatchListSkeleton`** - Specialized skeleton for match lists
- **`StatsGridSkeleton`** - For stats grid layouts (leaderboards, top teams)
- **`TeamCardSkeleton`** - For team card grids
- **`AuthLoading`** - Unified authentication loading state (use for `useAuth().loading`)
- **`LoadingSpinner`** - Wrapper around Spinner with optional text (use sparingly)

### Loading State Patterns

**✅ DO**: Preserve page structure during loading

```tsx
export const PlayersPage = () => {
  const { filterParams, isLoading } = useFilters();
  const { players, isLoading: isLoadingPlayers } = usePlayers();

  return (
    <div>
      <h1>Players</h1>
      {filterParams && <MultiFilters {...filterParams} />}
      {!filterParams && <div className="h-10 bg-accent animate-pulse" />}

      <CardContainer>
        {(isLoading || isLoadingPlayers) && <TableSkeleton />}
        {!isLoading && !isLoadingPlayers && players && (
          <PlayerTable players={players} />
        )}
      </CardContainer>
    </div>
  );
};
```

**❌ DON'T**: Use early returns that remove page structure

```tsx
// ❌ Bad - Removes entire page structure
if (isLoading) {
  return <ContentContainer>Loading...</ContentContainer>;
}
```

### Authentication Loading

For authentication loading states, always use `AuthLoading`:

```tsx
const { user, loading } = useAuth();

if (loading) {
  return <AuthLoading />;
}

// For protected routes
if (loading) {
  return <AuthLoading fullScreen={true} message="Ensuring authentication..." />;
}
```

### Loading Component Selection Guide

- **`PageSkeleton`**: Use when loading filters or initial page data - preserves title and layout
- **`TableSkeleton`**: Use for table components - matches table structure
- **`CardSkeleton`**: Use for card-based content - matches card layout
- **`MatchListSkeleton`**: Use specifically for match lists - matches match card layout
- **`StatsGridSkeleton`**: Use for leaderboards and top teams grids
- **`TeamCardSkeleton`**: Use for team card grids
- **`AuthLoading`**: Use for `useAuth().loading` states
- **`LoadingSpinner`**: Use only for small inline loading states or when skeleton doesn't fit

### Best Practices

1. **Preserve structure** - Never use early returns that remove page headers, filters, or navigation
2. **Match skeleton to content** - Skeleton should mirror the actual content structure
3. **Use short-circuit evaluation** - Prefer `&&` over ternary for conditional rendering
4. **Mobile-responsive** - All loading components are mobile-friendly by default
5. **Avoid "Loading..." text** - Use visual skeletons instead of text-based loading states
6. **Use AuthLoading for auth** - Always use `AuthLoading` component for authentication loading states

## 🎨 Design System

### Custom CSS Variables

The project uses custom design tokens defined in `globals.css`:

```css
:root {
  --kanaliiga-orange: hsl(35, 93%, 49%);
  --kanaliiga-light-brown: hsl(29, 56%, 58%);
  --background: hsl(0, 100%, 99%);
  --foreground: hsl(240 10% 3.9%);
  /* ... more variables */
}
```

### Color Scheme

- **Primary Orange**: `#f29209` (Kanaliiga brand color)
- **Dark Gray**: `#161515` (Text and backgrounds)
- **White**: `#ffffff` (Clean backgrounds)
- **Light Brown**: `#d09158` (Accent color)

### Theme Support

**CRITICAL**: All components must support both light and dark themes using semantic color tokens.

**✅ DO**: Use semantic color classes

```tsx
// ✅ Good - Works in both light and dark themes
<div className="bg-background text-foreground border-border">
  <h1 className="text-foreground">Title</h1>
  <p className="text-muted-foreground">Description</p>
</div>
```

**❌ DON'T**: Use hardcoded colors

```tsx
// ❌ Bad - Breaks dark theme
<div className="bg-white text-black">
  <h1 className="text-gray-900">Title</h1>
  <p className="text-gray-600">Description</p>
</div>
```

**Available Semantic Colors:**

- `bg-background` / `text-foreground` - Main background and text
- `bg-card` / `text-card-foreground` - Card backgrounds
- `bg-muted` / `text-muted-foreground` - Muted/secondary content
- `bg-primary` / `text-primary-foreground` - Primary actions
- `bg-secondary` / `text-secondary-foreground` - Secondary actions
- `border-border` - Borders and dividers
- `ring-ring` - Focus rings and highlights

### Typography

- **Headings**: Custom `NEXT_ART_Heavy.otf` font
- **Body**: `VeraMono.ttf` monospace font
- **UI Elements**: Poppins font family

## 🧪 Testing Requirements

### Unit Tests

- Co-locate test files with components (`.test.tsx`)
- Use Jest for unit testing
- Test responsive behavior across breakpoints

```tsx
// Component.test.tsx
import { render, screen } from "@testing-library/react";
import { Component } from "./Component";

describe("Component", () => {
  it("renders correctly on mobile", () => {
    render(<Component />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});
```

### Test Utilities

- Use `renderWithSWR` for components using SWR
- Mock API responses for data fetching tests
- Test error states and loading states

## 📁 File Structure

```
apps/frontend/src/
├── app/                    # Next.js App Router pages
├── components/             # Reusable components
│   ├── ui/                # shadcn/ui components
│   ├── layout/            # Layout components
│   └── [domain]/          # Feature components
├── hooks/                 # Custom React hooks
│   └── data/              # Data fetching hooks
├── lib/                   # Utility functions
├── context/               # React contexts
└── test-utils/            # Testing utilities
```

## 🚀 Development Workflow

### Component Creation Checklist

- [ ] Create responsive component with mobile-first approach
- [ ] Use proper TypeScript interfaces
- [ ] Follow shadcn/ui patterns
- [ ] **Use semantic color tokens for light/dark theme support**
- [ ] **Use appropriate loading skeleton components** (preserve page structure)
- [ ] Create data hooks for any data fetching
- [ ] Add unit tests
- [ ] Test across all breakpoints
- [ ] Test in both light and dark themes
- [ ] Use proper error handling
- [ ] Follow accessibility guidelines

### Quality Gates

- `pnpm typecheck` - TypeScript validation
- `pnpm format` - Code formatting
- `pnpm lint` - ESLint checks
- `pnpm test` - Unit tests
- `pnpm test:e2e` - E2E tests

**Additional checks to run occasionally:**

- `pnpm knip` - Detect unused exports, dependencies, and dead code

## 🔗 Related Documentation

- [Database Schema](README.database.md)
- [Testing](README.md#testing) — Jest unit tests and Playwright E2E (from repo root)
