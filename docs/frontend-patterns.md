# Frontend Patterns

## Data Fetching Patterns

### SWR Data Fetching

```typescript
// Hook pattern
function useData(filters: FilterParams) {
  const { data, error, isLoading } = useSWR(["endpoint", filters], () =>
    expressFetcher("/api/v1/endpoint", filters)
  );

  return {
    data,
    isLoading,
    isError: !!error,
    isValidated: !isLoading && !error
  };
}

// Authenticated hook pattern
function useAuthData(filters: FilterParams) {
  const { data, error, isLoading } = useSWR(["auth-endpoint", filters], () =>
    clientApiFetch("/api/v1/auth-endpoint", filters)
  );

  return {
    data,
    isLoading,
    isError: !!error,
    isValidated: !isLoading && !error
  };
}
```

### Frontend API Proxy Pattern

```typescript
// Frontend API route structure
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const queryString = generateFiltersParamQuery(/* filters */);

  const response = await fetch(`${BACKEND_URL}/api${queryString}`);
  return Response.json(await response.json());
}
```

### Component Filter Integration

```typescript
// Active season default pattern
const effectiveFilters = {
  ...filters,
  seasons: activeSeason && seasons.length === 0 ? [activeSeason] : seasons
};
```

## UI Component Patterns

### Mobile-First Table Design

```tsx
// Essential columns only on mobile
<th className="px-3 py-2 text-xs">Player</th>
<th className="px-3 py-2 text-xs">K</th>
<th className="px-3 py-2 text-xs">D</th>
<th className="px-3 py-2 text-xs">ADR</th>
<th className="px-3 py-2 text-xs">Rating</th>
// Desktop-only columns
<th className="hidden md:table-cell px-3 py-2 text-xs">Assists</th>
```

### shadcn/ui Component Patterns

#### Component Usage Standards

**Import from UI directory**:

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
```

**Button Variants**:

```tsx
// Primary actions
<Button>Save Changes</Button>
<Button variant="default">Default Action</Button>

// Secondary actions
<Button variant="outline">Cancel</Button>
<Button variant="secondary">Secondary</Button>

// Destructive actions
<Button variant="destructive">Delete</Button>

// Subtle actions
<Button variant="ghost">Ghost Button</Button>
<Button variant="link">Link Style</Button>

// Icon buttons
<Button size="icon" variant="outline">
  <Icon className="size-4" />
</Button>
```

**Card Layout Pattern**:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Section Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>{/* Main content */}</CardContent>
</Card>
```

**Form Component Integration**:

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";

const formSchema = z.object({
  username: z.string().min(2).max(50)
});

function MyForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema)
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter username" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

**Select Component Pattern**:

```tsx
<Select onValueChange={(value) => setSelectedValue(value)}>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

**Badge Usage**:

```tsx
// Status indicators
<Badge variant="default">Active</Badge>
<Badge variant="secondary">Pending</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Draft</Badge>
```

#### Accessibility & Data Attributes

All shadcn/ui components include proper `data-slot` attributes for testing and styling:

```tsx
// Components automatically include data-slot attributes
<Button data-slot="button">Click me</Button>
<Card data-slot="card">Content</Card>
```

**Testing Pattern**:

```tsx
// Use data-slot attributes for testing selectors
await page.click('[data-slot="button"]');
await page.fill('[data-slot="input"]', "test value");
```

#### Styling Customization

**CSS Variable Theming**:

```css
/* All components use CSS variables for theming */
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
}
```

**Tailwind Class Merging**:

```tsx
import { cn } from "@/lib/utils";

// Safely merge Tailwind classes
<Button className={cn("custom-class", additionalClasses)}>Button Text</Button>;
```

### Navigation Pattern

```tsx
// Consistent navigation - NO back buttons
import { AutoBreadcrumbs } from "@/components/layout";

function PageComponent() {
  return (
    <>
      <AutoBreadcrumbs />
      {/* Page content */}
    </>
  );
}
```

### Filtering Component Pattern

```tsx
// Standard filtering integration
import { MultiFilters, useFilters } from "@/components/filters";

function PageWithFilters() {
  const {
    seasons,
    leagues,
    stages,
    teams,
    maps
    // ... other filter state
  } = useFilters();

  return (
    <MultiFilters
      seasons={seasons}
      leagues={leagues}
      // Enable only needed filters, pass null for disabled
      stages={null} // Disabled
      teams={teams}
      maps={maps}
    />
  );
}
```

## Error Handling Patterns

### Hook Return Structure

```typescript
// Consistent hook returns
return {
  data,
  isLoading,
  isError: !!error, // NOT 'error'
  isValidated: !isLoading && !error
};
```

### Frontend Error Detection (Testing)

```typescript
// Test setup for error detection
page.on("console", (msg) => {
  if (msg.type() === "error") {
    errors.push(`Console error: ${msg.text()}`);
  }
});

page.on("pageerror", (error) => {
  errors.push(`Page error: ${error.message}`);
});

page.on("requestfailed", (request) => {
  errors.push(`Request failed: ${request.url()}`);
});
```

## Link Handling Pattern

### Internal vs External Links

```tsx
// Internal navigation - ALWAYS use Link
import Link from 'next/link';
import { createNextUrl } from "@/lib/utils";

<Link href={createNextUrl("/internal/path")}>Internal Page</Link>

// External links - use anchor tags
<a
  href="https://external.com"
  target="_blank"
  rel="noopener noreferrer"
>
  External Link
</a>
```

## Frontend Custom Color Class Convention

- Always use `text-kanaliiga-orange` instead of `kanaliiga-orange`
- Always use `text-kanaliiga-light-brown` instead of `kanaliiga-light-brown`
- This follows Tailwind CSS conventions for text color utility classes

## Player Skill Metrics Pattern

### Player Skill Diagram

The Player Skill Diagram feature uses a radar chart visualization to represent player performance across five key skill dimensions:

```tsx
// Parent component structure
<PlayerSkillTab steamId={steamId} filterQueryParams={filterParams} />
  ↓
<usePlayerSkillDiagram> // Data fetching hook
  ↓
<PlayerSkillRadar playerSkillData={data} compareSkillData={compareData} />
```

### Data Model

```typescript
interface PlayerSkillDiagram {
  steam_id: string;
  nickname: string;
  overall_rating: number;
  aim: number; // Mechanical skills (headshot %, accuracy)
  positioning: number; // Tactical awareness (opening duels, survival)
  impact: number; // Round outcome influence (clutches, multi-kills)
  utility: number; // Grenade/flash effectiveness
  consistency: number; // Performance stability across maps/sides
  detailed_metrics: {
    // Additional detailed metrics
    // Various sub-metrics that contribute to main categories
  };
}
```

### API Endpoints

```
GET /api/v1/players/:steam_id/skill-diagram
GET /api/v1/players/skill-diagram/aggregate
```

### Comparison Logic

The comparison feature allows players to compare their skills against different benchmarks:

```typescript
// Dynamic URL generation based on comparison type
let compareUrl: string | null = null;

if (compareOption === "aggregate") {
  // All players aggregate
  compareUrl = `/api/v1/players/skill-diagram/aggregate?${sortedQuery}`;
} else if (compareOption.startsWith("faceit_")) {
  // Faceit level comparison
  const faceitLevel = compareOption.split("_")[1];
  compareUrl = addParamsToUrl(baseUrl, { faceit_level: faceitLevel });
} else if (compareOption.startsWith("cs2rank_")) {
  // CS2 rank comparison
  const rankValue = compareOption.split("_")[1];
  const rankMin = parseInt(rankValue) - 500;
  const rankMax = parseInt(rankValue) + 500;
  compareUrl = addParamsToUrl(baseUrl, {
    cs2_rank_min: rankMin,
    cs2_rank_max: rankMax
  });
} else if (compareOption === "team" && playerTeam?.team_id) {
  // Player's own team
  compareUrl = addParamsToUrl(baseUrl, { team_ids: playerTeam.team_id });
}
```

This pattern demonstrates effective use of:

1. **Component Composition**: Clean separation of data fetching, visualization, and UI controls
2. **Dynamic API Requests**: Building API requests based on user selection
3. **Conditional UI Elements**: Showing comparison options only when relevant data is available
4. **Data Pre-fetching**: Loading necessary data (team details) when component mounts
5. **Filter Parameter Integration**: Using the same filter parameters across the application
