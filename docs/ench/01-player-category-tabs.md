# Player Category Tabs Implementation Plan

## Overview

Reorganize the player statistics display to use horizontal category tabs instead of showing all stats in a flat, overwhelming layout. This follows how players actually think about their performance.

## Problem

Current player stats are displayed with equal visual weight, making it difficult to:
- Focus on specific skill areas
- Identify improvement opportunities
- Compare related metrics

## Solution

### Tab Structure

```
[ Combat ] [ Trading ] [ Utility ] [ Positioning ] [ Openings ]
```

### A. Player Header (Always Visible)

Above the tabs, always show:
- Rating (Kana Rating)
- K/D
- ADR
- Role icons (if available: Entry / Support / Anchor)
- Map selector (Ancient / Inferno / All maps)

### B. Category Tabs Content

Each tab shows 5-7 metrics max with explanation tooltips per stat.

#### Tab 1: Combat
| Stat | Description |
|------|-------------|
| K/D | Kill/Death ratio |
| ADR | Average damage per round |
| HS% | Headshot percentage |
| Time to Damage | How quickly player deals first damage |
| Multi-kill Rounds | Rounds with 2+ kills |

#### Tab 2: Trading
| Stat | Description |
|------|-------------|
| Trade Attempts | How often player attempts to trade |
| Trade Success % | Successful trades / attempts |
| Time to Trade | Average time to secure trade kills |
| Deaths Untraded | Deaths where team failed to trade |

#### Tab 3: Utility
| Stat | Description |
|------|-------------|
| Damage per Nade | Average grenade damage |
| Flashes Leading to Kills | Flash assists that resulted in kills |
| Utility Damage per Round | Total utility damage / rounds played |
| Smokes Used per Round | Smoke utilization rate |

#### Tab 4: Positioning (requires demo parsing data)
| Stat | Description |
|------|-------------|
| Crosshair Placement | Average crosshair angle from headshot level |
| Counter-strafing % | Percentage of accurate stops before shooting |
| Avg Distance to Teammates | Position awareness indicator |
| Deaths While Isolated | Solo deaths without team support |

#### Tab 5: Openings
| Stat | Description |
|------|-------------|
| First Kills | Number of opening kills |
| First Deaths | Number of opening deaths |
| Opening Duel Win % | First kills / (First kills + First deaths) |
| T vs CT Split | Opening performance by side |

## Implementation Steps

### Step 1: Create Tab Component Structure

**File**: `apps/frontend/src/components/players/PlayerStatsTabs.tsx`

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PlayerStatsTabsProps {
  steamId: string;
  selectedMap?: string;
}

export function PlayerStatsTabs({ steamId, selectedMap }: PlayerStatsTabsProps) {
  return (
    <Tabs defaultValue="combat" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="combat">Combat</TabsTrigger>
        <TabsTrigger value="trading">Trading</TabsTrigger>
        <TabsTrigger value="utility">Utility</TabsTrigger>
        <TabsTrigger value="positioning">Positioning</TabsTrigger>
        <TabsTrigger value="openings">Openings</TabsTrigger>
      </TabsList>
      
      <TabsContent value="combat">
        <CombatStatsCard steamId={steamId} map={selectedMap} />
      </TabsContent>
      {/* ... other tabs */}
    </Tabs>
  );
}
```

### Step 2: Create Individual Tab Content Components

**Files to create**:
- `PlayerCombatStats.tsx`
- `PlayerTradingStats.tsx`
- `PlayerUtilityStats.tsx`
- `PlayerPositioningStats.tsx`
- `PlayerOpeningsStats.tsx`

### Step 3: Add Stat Tooltips

Each stat should have a help icon that explains the metric:

```tsx
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

function StatWithTooltip({ label, value, description }: Props) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1">
        <span>{label}</span>
        <Tooltip>
          <TooltipTrigger>
            <HelpCircle className="w-3 h-3 text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent>{description}</TooltipContent>
        </Tooltip>
      </div>
      <span className="font-bold">{value}</span>
    </div>
  );
}
```

### Step 4: Add Visual Hierarchy with Micro-bars and Deltas

Show comparison against averages:

```tsx
function StatWithDelta({ label, value, teamAvg }) {
  const delta = value - teamAvg;
  const deltaClass = delta >= 0 ? "text-green-500" : "text-red-500";
  
  return (
    <div>
      <div className="flex justify-between">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={value} max={100} />
        <span className={`text-xs ${deltaClass}`}>
          {delta >= 0 ? '+' : ''}{delta.toFixed(1)}% vs avg
        </span>
      </div>
    </div>
  );
}
```

### Step 5: Update Player Main Page

Integrate the new tabs component into the player page structure.

## Data Requirements

### Existing Data (can use now)
- K/D, ADR, HS% ✅
- First Kills, First Deaths ✅
- Utility Damage ✅
- Flash Assists ✅
- KAST ✅

### May Need Backend Work
- Trade success % → Check if `usePlayerSkillDiagram` provides this
- Time to damage → May need demo parsing data
- Deaths untraded → May need calculation from round data

## Files to Modify

| File | Change |
|------|--------|
| `PlayerMapStatsCards.tsx` | Refactor into category tabs |
| `PlayerSkillTab.tsx` | May integrate or keep separate |
| New: `PlayerStatsTabs.tsx` | Main tab container |
| New: `PlayerCombatStats.tsx` | Combat stats content |
| New: `PlayerTradingStats.tsx` | Trading stats content |
| New: `PlayerUtilityStats.tsx` | Utility stats content |
| New: `PlayerPositioningStats.tsx` | Positioning stats content |
| New: `PlayerOpeningsStats.tsx` | Openings stats content |

## Mobile Considerations

- On mobile, tabs should be horizontally scrollable
- Consider using a dropdown selector for smaller screens
- Stats should stack vertically with larger touch targets

## Testing Checklist

- [ ] All tabs render correctly with data
- [ ] Map filter works across all tabs
- [ ] Tooltips show on hover (desktop) and tap (mobile)
- [ ] Deltas calculate correctly
- [ ] No data displays "N/A" or appropriate placeholder
- [ ] Tab state persists when navigating
- [ ] Mobile scrolling works smoothly
