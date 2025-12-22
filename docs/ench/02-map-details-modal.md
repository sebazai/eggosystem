# Map Details Modal Implementation Plan

## Overview

Implement progressive disclosure for map statistics by moving detailed data into a slide-out panel (desktop) or full-screen modal (mobile), while keeping the main map cards compact and scannable.

## Problem

Current map stats cards show everything at once:
- Win rate, wins/played
- K/D by side
- Pistol rounds (T/CT split)
- Plant info (A/B/no plant)
- Afterplants, retakes
- Side-based round win %

This creates visual fatigue and makes quick comparisons difficult.

## Solution

### A. Default View (Map Snapshot)

Keep map cards compact with only essential metrics:

```
┌─────────────────────────────────────┐
│  [Map Image]                        │
│  ANCIENT                            │
│─────────────────────────────────────│
│  Win Rate: 52%  (13W / 25P)         │
│  K/D: 1.15 T  |  0.98 CT            │
│  Pistols: 48% ████░░░░░░            │
│  Plants: 62% (Most: B Site)         │
│                                     │
│         [View Map Details →]        │
└─────────────────────────────────────┘
```

### B. Map Details Panel

Opens from right (desktop) or bottom (mobile) with full breakdown:

```
─────────────────────────────────────────────────
                ANCIENT - MAP DETAILS
─────────────────────────────────────────────────

OVERVIEW
  Matches Played: 25
  Win Rate: 52% (13-12)
  
PERFORMANCE BY SIDE
  ┌─────────────────────────────────────────────┐
  │ T-Side                                      │
  │   Win Rate: 58%  |  Avg Rounds: 7.2         │
  │   K/D: 1.15      |  ADR: 82.4               │
  │─────────────────────────────────────────────│
  │ CT-Side                                     │
  │   Win Rate: 46%  |  Avg Rounds: 5.8         │
  │   K/D: 0.98      |  ADR: 71.2               │
  └─────────────────────────────────────────────┘

PISTOL ROUNDS
  ┌───────────┬──────────┬───────────┐
  │           │ T-Side   │ CT-Side   │
  ├───────────┼──────────┼───────────┤
  │ Win Rate  │ 45%      │ 52%       │
  │ Played    │ 22       │ 25        │
  └───────────┴──────────┴───────────┘

BOMB PLANTS
  Site Distribution:
    A: 35%  ████████░░░░░░░░░░░░
    B: 48%  ████████████░░░░░░░░
    No Plant: 17%  ████░░░░░░░░░░░░░░░░

  After Plant Win Rate: 68%
  
RETAKES
  Attempted: 42
  Success Rate: 23%
  
ECONOMY IMPACT
  Full Buy Rounds Win %: 58%
  Eco/Force Win %: 22%

─────────────────────────────────────────────────
                              [Close]
```

### C. Optional: Map Comparison Mode

Advanced feature for IGLs/Captains:

```
Compare: [Ancient ▼] vs [Inferno ▼]

                Ancient     Inferno
Win Rate        52%         61%
T-Side          58%         55%
CT-Side         46%         67%
Pistols         48%         52%
Plants Win %    68%         71%
```

## Implementation Steps

### Step 1: Create Sheet/Drawer Component

Use the existing Sheet component from shadcn/ui:

**File**: `apps/frontend/src/components/players/MapDetailsSheet.tsx`

```tsx
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface MapDetailsSheetProps {
  mapName: string;
  steamId: string;
  children: React.ReactNode;
}

export function MapDetailsSheet({ mapName, steamId, children }: MapDetailsSheetProps) {
  const isMobile = useIsMobile();
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full">
          View Map Details <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side={isMobile ? "bottom" : "right"}
        className={isMobile ? "h-[90vh]" : "w-[500px]"}
      >
        <SheetHeader>
          <SheetTitle>{mapName} - Map Details</SheetTitle>
        </SheetHeader>
        <div className="mt-6 overflow-y-auto">
          <MapDetailsContent steamId={steamId} mapName={mapName} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

### Step 2: Refactor Map Card to Compact View

**File**: `apps/frontend/src/components/players/PlayerMapStatsCards.tsx`

Reduce the default card to show only:
- Map image and name
- Win rate with wins/played
- K/D split (T vs CT as single line)
- Pistol win % as progress bar
- Top plant site indicator
- "View Map Details" button

### Step 3: Create Map Details Content Component

**File**: `apps/frontend/src/components/players/MapDetailsContent.tsx`

```tsx
interface MapDetailsContentProps {
  steamId: string;
  mapName: string;
}

export function MapDetailsContent({ steamId, mapName }: MapDetailsContentProps) {
  // Reuse existing hooks
  const { playerMapStats } = useFilteredPlayerMapStats(steamId);
  const mapData = playerMapStats?.find(m => m.map === mapName);
  
  return (
    <div className="space-y-6">
      {/* Overview Section */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">
          OVERVIEW
        </h3>
        {/* Win rate, matches played */}
      </section>
      
      {/* Side Performance Section */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">
          PERFORMANCE BY SIDE
        </h3>
        {/* T-side and CT-side breakdown */}
      </section>
      
      {/* Pistol Rounds Section */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">
          PISTOL ROUNDS
        </h3>
        {/* Pistol stats table */}
      </section>
      
      {/* Bomb Plants Section */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">
          BOMB PLANTS
        </h3>
        {/* Plant distribution and after-plant stats */}
      </section>
      
      {/* Retakes Section */}
      <section>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">
          RETAKES
        </h3>
        {/* Retake stats */}
      </section>
    </div>
  );
}
```

### Step 4: Update Team Map Stats Similarly

Apply the same pattern to `TeamMapStatsCards.tsx` for consistency.

## Data Flow

```
PlayerMapStatsCards (compact cards)
         │
         ▼
    [View Details] button
         │
         ▼
    MapDetailsSheet (Sheet container)
         │
         ▼
    MapDetailsContent (full stats)
         │
         └── Uses existing hooks:
               - useFilteredPlayerMapStats
               - useFilteredPlayerPistolWins (if separate)
               - etc.
```

## UI Components Needed

| Component | Status | Notes |
|-----------|--------|-------|
| `Sheet` | ✅ Exists | From shadcn/ui |
| `Progress` | ✅ Exists | For progress bars |
| `Table` | ✅ Exists | For structured data |
| `Separator` | ✅ Exists | For section dividers |

## Files to Modify

| File | Change |
|------|--------|
| `PlayerMapStatsCards.tsx` | Simplify to compact view |
| New: `MapDetailsSheet.tsx` | Sheet wrapper component |
| New: `MapDetailsContent.tsx` | Full details content |
| `TeamMapStatsCards.tsx` | Apply same pattern |

## Mobile Considerations

- Sheet opens from bottom on mobile (90vh height)
- Scrollable content within the sheet
- Close button fixed at bottom for easy thumb access
- Consider swipe-down to close gesture

## Animation

Use consistent animations for the panel:
```tsx
// Sheet configuration
<SheetContent 
  className="transition-transform duration-300 ease-out"
>
```

## Testing Checklist

- [ ] Sheet opens correctly on desktop (from right)
- [ ] Sheet opens correctly on mobile (from bottom)
- [ ] All data displays correctly in details view
- [ ] Scrolling works within the sheet
- [ ] Close button works
- [ ] Escape key closes sheet
- [ ] Click outside closes sheet
- [ ] Focus trap works correctly
- [ ] Screen reader announces panel opening
