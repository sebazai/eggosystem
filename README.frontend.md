# Frontend Development Guidelines

This document provides comprehensive guidelines for frontend development in the Kanaliiga project, including component patterns, responsive design requirements, and data fetching strategies.

## 🏗️ Architecture & Technology Stack

- **Framework**: Next.js 15 with React 19 and App Router
- **UI Library**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **TypeScript**: Strict type safety with `satisfies` operator
- **Icons**: Lucide React
- **Data Fetching**: SWR for client-side state management
- **Testing**: Jest for unit tests, Playwright for E2E tests

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

  if (isLoading) return <LoadingSpinner />;
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
- [Testing Strategy](README.testing.md)
