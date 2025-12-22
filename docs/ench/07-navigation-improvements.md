# Navigation Improvements Implementation Plan

## Overview

Improve the navigation and filtering experience across the application by implementing stateful filters, URL state management, and more intuitive filter UI patterns.

## Problems

1. **Tabs can be limiting** - Separate tabs for Map Stats, Player Stats, etc. require full page context switches
2. **URL doesn't reflect state** - Can't share a specific filtered view
3. **Inconsistent filter UX** - Different pages handle filters differently
4. **No deep linking** - Can't link to a specific player+map+side combination

## Solutions

### 1. Filter Chips Instead of Tabs

Replace or supplement tabs with horizontal filter chips:

**Current:**
```
[ Map stats tab ] [ Player stats tab ]
```

**Enhanced:**
```
Filters: [ All maps ▼ ] [ T-side ] [ CT-side ] [ Gun rounds ▼ ]
```

### 2. URL State Management

Make URLs reflect the current filter state:

```
/player/spirrde
/player/spirrde?map=ancient
/player/spirrde?map=ancient&tab=utility&side=T
/player/spirrde?map=ancient&tab=utility&side=T&season=15
```

### 3. Shareable Filter States

Enable:
- Sharing analysis links with teammates
- Bookmarking specific views
- Browser back/forward navigation

## Implementation

### Step 1: URL State Hook

**File**: `apps/frontend/src/hooks/useUrlState.tsx`

```tsx
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

interface UrlStateOptions {
  shallow?: boolean; // Don't trigger full page reload
}

export function useUrlState<T extends Record<string, string | undefined>>(
  defaultValues: T,
  options: UrlStateOptions = {}
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Parse current URL state
  const currentState = useMemo(() => {
    const state = { ...defaultValues };
    for (const key of Object.keys(defaultValues)) {
      const value = searchParams.get(key);
      if (value !== null) {
        state[key] = value;
      }
    }
    return state;
  }, [searchParams, defaultValues]);
  
  // Update URL state
  const setUrlState = useCallback((
    updates: Partial<T>
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined || value === defaultValues[key]) {
        params.delete(key);
      } else {
        params.set(key, value as string);
      }
    }
    
    const newUrl = params.toString() 
      ? `${pathname}?${params.toString()}`
      : pathname;
    
    if (options.shallow) {
      window.history.replaceState({}, '', newUrl);
    } else {
      router.push(newUrl, { scroll: false });
    }
  }, [pathname, searchParams, router, defaultValues, options.shallow]);
  
  // Clear all filters
  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [pathname, router]);
  
  return {
    state: currentState,
    setState: setUrlState,
    clearFilters,
    hasFilters: searchParams.toString().length > 0,
  };
}
```

### Step 2: Filter Chip Component

**File**: `apps/frontend/src/components/filters/FilterChip.tsx`

```tsx
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick: () => void;
  onClear?: () => void;
  variant?: "default" | "toggle";
}

export function FilterChip({
  label,
  active = false,
  onClick,
  onClear,
  variant = "default",
}: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm",
        "transition-colors duration-150",
        "border",
        active
          ? "bg-kanaliiga-orange text-white border-kanaliiga-orange"
          : "bg-transparent text-foreground border-border hover:border-kanaliiga-orange/50"
      )}
    >
      {label}
      {active && onClear && (
        <X
          className="w-3 h-3 ml-1 hover:opacity-70"
          onClick={(e) => {
            e.stopPropagation();
            onClear();
          }}
        />
      )}
    </button>
  );
}
```

### Step 3: Map Filter Dropdown

**File**: `apps/frontend/src/components/filters/MapFilterDropdown.tsx`

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const MAPS = [
  { value: undefined, label: "All Maps" },
  { value: "ancient", label: "Ancient" },
  { value: "anubis", label: "Anubis" },
  { value: "dust2", label: "Dust 2" },
  { value: "inferno", label: "Inferno" },
  { value: "mirage", label: "Mirage" },
  { value: "nuke", label: "Nuke" },
  { value: "vertigo", label: "Vertigo" },
];

interface MapFilterDropdownProps {
  value?: string;
  onChange: (value?: string) => void;
}

export function MapFilterDropdown({ value, onChange }: MapFilterDropdownProps) {
  const selectedLabel = MAPS.find(m => m.value === value)?.label || "All Maps";
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(
        "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm",
        "border transition-colors",
        value 
          ? "bg-kanaliiga-orange text-white border-kanaliiga-orange"
          : "bg-transparent border-border hover:border-kanaliiga-orange/50"
      )}>
        {selectedLabel}
        <ChevronDown className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {MAPS.map(map => (
          <DropdownMenuItem
            key={map.label}
            onClick={() => onChange(map.value)}
            className="flex items-center justify-between"
          >
            {map.label}
            {value === map.value && <Check className="w-4 h-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### Step 4: Side Toggle Chips

**File**: `apps/frontend/src/components/filters/SideToggleChips.tsx`

```tsx
import { FilterChip } from "./FilterChip";

interface SideToggleChipsProps {
  value?: "T" | "CT";
  onChange: (value?: "T" | "CT") => void;
}

export function SideToggleChips({ value, onChange }: SideToggleChipsProps) {
  const handleClick = (side: "T" | "CT") => {
    // Toggle off if clicking the same side
    onChange(value === side ? undefined : side);
  };
  
  return (
    <div className="flex gap-2">
      <FilterChip
        label="T-side"
        active={value === "T"}
        onClick={() => handleClick("T")}
        onClear={() => onChange(undefined)}
      />
      <FilterChip
        label="CT-side"
        active={value === "CT"}
        onClick={() => handleClick("CT")}
        onClear={() => onChange(undefined)}
      />
    </div>
  );
}
```

### Step 5: Unified Filter Bar Component

**File**: `apps/frontend/src/components/filters/UnifiedFilterBar.tsx`

```tsx
import { useUrlState } from "@/hooks/useUrlState";
import { MapFilterDropdown } from "./MapFilterDropdown";
import { SideToggleChips } from "./SideToggleChips";
import { FilterChip } from "./FilterChip";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FilterState {
  map?: string;
  side?: "T" | "CT";
  roundType?: "pistol" | "gun" | "eco";
  season?: string;
  league?: string;
}

export function UnifiedFilterBar() {
  const { state, setState, clearFilters, hasFilters } = useUrlState<FilterState>({
    map: undefined,
    side: undefined,
    roundType: undefined,
  });
  
  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      <span className="text-sm text-muted-foreground">Filters:</span>
      
      <MapFilterDropdown
        value={state.map}
        onChange={(map) => setState({ map })}
      />
      
      <SideToggleChips
        value={state.side}
        onChange={(side) => setState({ side })}
      />
      
      <RoundTypeDropdown
        value={state.roundType}
        onChange={(roundType) => setState({ roundType })}
      />
      
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-muted-foreground"
        >
          <X className="w-4 h-4 mr-1" />
          Clear all
        </Button>
      )}
    </div>
  );
}
```

### Step 6: Update Player Page to Use URL State

**File**: `apps/frontend/src/app/(main)/(content-container)/players/[steamId]/PlayerTabLayoutClient.tsx`

```tsx
"use client";
import { useUrlState } from "@/hooks/useUrlState";
import { UnifiedFilterBar } from "@/components/filters/UnifiedFilterBar";

interface PlayerPageFilters {
  tab?: string;
  map?: string;
  side?: "T" | "CT";
  season?: string;
  league?: string;
}

export default function PlayerTabLayoutClient({
  children,
  steamId
}: {
  children: React.ReactNode;
  steamId: string;
}) {
  const { state, setState } = useUrlState<PlayerPageFilters>({
    tab: "main",
    map: undefined,
    side: undefined,
    season: undefined,
    league: undefined,
  });
  
  return (
    <FilterProvider appId="730">
      <PlayerDetailsHeader steamId={steamId} />
      
      <CardContainer>
        <UnifiedFilterBar />
      </CardContainer>
      
      <div className="sticky top-0 z-10 bg-card">
        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setState({ tab: tab.value })}
              className={cn(
                "py-3 px-5 font-semibold",
                state.tab === tab.value && "border-b-2 border-kanaliiga-orange"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        <div className="mt-6 px-4">{children}</div>
      </div>
    </FilterProvider>
  );
}
```

### Step 7: Share Button

Add a share button that copies the current URL with filters:

**File**: `apps/frontend/src/components/filters/ShareButton.tsx`

```tsx
import { Button } from "@/components/ui/button";
import { Share2, Check } from "lucide-react";
import { useState } from "react";

export function ShareButton() {
  const [copied, setCopied] = useState(false);
  
  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      // Native share on mobile
      await navigator.share({
        title: document.title,
        url,
      });
    } else {
      // Copy to clipboard on desktop
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  return (
    <Button variant="outline" size="sm" onClick={handleShare}>
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-1" />
          Copied!
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4 mr-1" />
          Share
        </>
      )}
    </Button>
  );
}
```

## URL Schema

### Player Page
```
/players/:steamId
/players/:steamId?tab=skills
/players/:steamId?tab=mapstats&map=ancient
/players/:steamId?tab=mapstats&map=ancient&side=T
/players/:steamId?seasons=15,16&leagues=1,2
```

### Match Page
```
/matches/:matchId
/matches/:matchId?view=flow    # Show round flow matrix
/matches/:matchId?round=14     # Highlight round 14
/matches/:matchId/games/:gameId
```

### Team Page
```
/teams/:teamId
/teams/:teamId?map=inferno
/teams/:teamId?seasons=16&view=history
```

## Migration Strategy

1. **Phase 1**: Add URL state hook and use alongside existing filters
2. **Phase 2**: Migrate existing filter context to use URL state
3. **Phase 3**: Add filter chips as additional filter UI
4. **Phase 4**: Deprecate old filter patterns

## Files to Create/Modify

| File | Type | Description |
|------|------|-------------|
| New: `useUrlState.tsx` | New | URL state management hook |
| New: `FilterChip.tsx` | New | Individual filter chip |
| New: `MapFilterDropdown.tsx` | New | Map selection dropdown |
| New: `SideToggleChips.tsx` | New | T/CT toggle chips |
| New: `UnifiedFilterBar.tsx` | New | Combined filter bar |
| New: `ShareButton.tsx` | New | Share current view |
| `PlayerTabLayoutClient.tsx` | Modify | Use URL state |
| `FilterContext.tsx` | Modify | Sync with URL |

## Browser Considerations

- Use `router.push` with `{ scroll: false }` to prevent scroll reset
- Use `window.history.replaceState` for shallow updates (no history entry)
- Handle SSR - URL params must be read on client only
- Support for browser back/forward navigation

## Testing Checklist

- [ ] URL updates when filters change
- [ ] Page loads correctly with URL params
- [ ] Browser back/forward works
- [ ] Share button copies correct URL
- [ ] Filter chips display active state
- [ ] Clear all filters works
- [ ] Mobile filter UI is usable
- [ ] Deep links work (direct navigation to filtered state)
- [ ] No flash of default state on page load
