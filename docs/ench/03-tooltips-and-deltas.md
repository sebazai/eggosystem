# Tooltips & Deltas Implementation Plan

## Overview

Add contextual tooltips and comparison deltas ("vs team average") throughout the application to help users quickly understand if a stat is good, average, or needs improvement.

## Problem

Currently, stats are displayed as raw numbers without context:
- "Trade success: 47%" - Is this good?
- "ADR: 78.5" - Above or below average?
- "First kills: 12" - Compared to what?

Users can't quickly assess performance without mental calculations or external references.

## Solution

### 1. Stat Explanation Tooltips

Every stat should have an optional info icon that explains the metric:

```
Trade Success %  ❓  47%
                 │
                 └── "Percentage of trade attempts that 
                      resulted in a successful kill. 
                      Higher is better. League avg: ~45%"
```

### 2. Comparison Deltas

Show how the stat compares to a reference point:

```
ADR  78.5  (+3.2 vs team)
           └── Green color, shows this is above team average

HS%  42%   (-8% vs league)
           └── Red color, shows this is below league average
```

### 3. Visual Micro-bars

Add progress bars to give visual indication of performance:

```
Trade Success   47%
[████████████░░░░░░░░░░]  -6% vs avg
     ▲                      ▲
     │                      │
     Progress bar       Delta indicator
```

## Implementation

### Step 1: Create StatDisplay Component

**File**: `apps/frontend/src/components/ui/stat-display.tsx`

```tsx
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface StatDisplayProps {
  label: string;
  value: number | string;
  description?: string;
  comparison?: {
    value: number;
    label: string; // "team avg", "league avg", "opponent"
  };
  showProgressBar?: boolean;
  maxValue?: number;
  format?: "percentage" | "decimal" | "integer";
  colorScale?: "positive" | "negative"; // higher is better vs lower is better
  className?: string;
}

export function StatDisplay({
  label,
  value,
  description,
  comparison,
  showProgressBar = false,
  maxValue = 100,
  format = "decimal",
  colorScale = "positive",
  className,
}: StatDisplayProps) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value);
  const delta = comparison ? numericValue - comparison.value : null;
  
  const getDeltaColor = () => {
    if (!delta) return "";
    const positive = colorScale === "positive" ? delta >= 0 : delta <= 0;
    return positive ? "text-green-500" : "text-red-500";
  };
  
  const formatValue = (val: number) => {
    switch (format) {
      case "percentage":
        return `${val.toFixed(1)}%`;
      case "integer":
        return Math.round(val).toString();
      default:
        return val.toFixed(2);
    }
  };

  return (
    <div className={cn("space-y-1", className)}>
      {/* Label row with tooltip */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">{label}</span>
          {description && (
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[250px] text-sm">
                {description}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <span className="font-bold">{formatValue(numericValue)}</span>
      </div>
      
      {/* Progress bar row */}
      {showProgressBar && (
        <div className="flex items-center gap-2">
          <Progress 
            value={(numericValue / maxValue) * 100} 
            className="flex-1 h-2"
          />
          {delta !== null && (
            <span className={cn("text-xs whitespace-nowrap", getDeltaColor())}>
              {delta >= 0 ? "+" : ""}{formatValue(delta)} vs {comparison.label}
            </span>
          )}
        </div>
      )}
      
      {/* Delta only (no progress bar) */}
      {!showProgressBar && delta !== null && (
        <span className={cn("text-xs", getDeltaColor())}>
          {delta >= 0 ? "+" : ""}{formatValue(delta)} vs {comparison.label}
        </span>
      )}
    </div>
  );
}
```

### Step 2: Create Stat Descriptions Configuration

**File**: `apps/frontend/src/configs/stat-descriptions.ts`

```ts
export const STAT_DESCRIPTIONS = {
  // Combat stats
  kills: "Total kills in the match or time period.",
  deaths: "Total deaths in the match or time period.",
  kd_ratio: "Kill/Death ratio. Higher than 1.0 means more kills than deaths.",
  adr: "Average Damage per Round. Measures consistent damage output. League avg: ~70-80.",
  hs_percent: "Percentage of kills that were headshots. Higher indicates better aim precision.",
  
  // Trading stats
  trade_success: "Percentage of trade attempts that resulted in a kill. Shows team coordination.",
  time_to_trade: "Average time in seconds to trade a teammate's death.",
  deaths_untraded: "Number of deaths where the team failed to trade within 5 seconds.",
  
  // Utility stats
  utility_damage: "Total damage dealt with grenades (molotovs, HE, etc.).",
  flash_assists: "Kills secured by teammates while enemy was flashed by you.",
  damage_per_nade: "Average damage per grenade thrown.",
  
  // Positioning stats
  crosshair_placement: "Average angle deviation from head level. Lower is better (0° = perfect).",
  counterstrafing: "Percentage of shots fired while properly counter-strafed.",
  
  // Opening stats
  first_kills: "Number of opening kills (first kill of the round).",
  first_deaths: "Number of opening deaths (first death of the round).",
  opening_win_rate: "First kills / (First kills + First deaths). Shows entry/anchor effectiveness.",
  
  // Rating
  kana_rating: "Kanaliiga's composite rating based on impact, consistency, and clutch ability.",
  kast: "Percentage of rounds with a Kill, Assist, Survived, or Traded.",
} as const;
```

### Step 3: Create Average Values Hook

**File**: `apps/frontend/src/hooks/data/useStatAverages.tsx`

```tsx
import useSWR from "swr";
import { fetcher } from "@/lib/utils";

interface StatAverages {
  league: {
    adr: number;
    hs_percent: number;
    kd_ratio: number;
    kana_rating: number;
    // ... more stats
  };
  team?: {
    // Team-specific averages
  };
}

export function useStatAverages(seasonId?: number, teamId?: number) {
  const { data, error, isLoading } = useSWR<StatAverages>(
    seasonId ? `/api/stats/averages?seasonId=${seasonId}${teamId ? `&teamId=${teamId}` : ''}` : null,
    fetcher
  );

  return {
    averages: data,
    isLoading,
    error,
  };
}
```

### Step 4: Backend Endpoint for Averages

**File**: `apps/backend/src/routes/stats.routes.ts`

Add endpoint to calculate and return league/season averages:

```ts
router.get('/stats/averages', async (req, res) => {
  const { seasonId, teamId } = req.query;
  
  // Calculate averages from player stats
  const leagueAverages = await getLeagueAverages(seasonId);
  const teamAverages = teamId ? await getTeamAverages(teamId) : null;
  
  res.json({
    league: leagueAverages,
    team: teamAverages,
  });
});
```

### Step 5: Apply StatDisplay Throughout the App

Replace raw stat displays with the new component:

```tsx
// Before
<div>
  <span>ADR</span>
  <span>{player.adr.toFixed(1)}</span>
</div>

// After
<StatDisplay
  label="ADR"
  value={player.adr}
  description={STAT_DESCRIPTIONS.adr}
  comparison={{ value: averages.league.adr, label: "league" }}
  showProgressBar
  maxValue={120}
  format="decimal"
/>
```

## Color Coding System

Use consistent colors for performance indicators:

| Performance | Color | CSS Class |
|-------------|-------|-----------|
| Excellent | Green | `text-green-500` |
| Good | Light Green | `text-green-400` |
| Average | Gray | `text-muted-foreground` |
| Below Average | Orange | `text-orange-400` |
| Poor | Red | `text-red-500` |

### Color Function

```tsx
function getPerformanceColor(value: number, average: number, stdDev: number = 0.1) {
  const zScore = (value - average) / (average * stdDev);
  
  if (zScore >= 2) return "text-green-500";     // Excellent
  if (zScore >= 1) return "text-green-400";     // Good
  if (zScore >= -1) return "text-muted-foreground"; // Average
  if (zScore >= -2) return "text-orange-400";   // Below Average
  return "text-red-500";                        // Poor
}
```

## Files to Modify

| File | Changes |
|------|---------|
| New: `stat-display.tsx` | Core stat display component |
| New: `stat-descriptions.ts` | Stat descriptions config |
| New: `useStatAverages.tsx` | Averages data hook |
| New: `stats.routes.ts` | Backend averages endpoint |
| `PlayerMapStatsCards.tsx` | Use StatDisplay |
| `PlayerStatisticsForTeam.tsx` | Use StatDisplay |
| `TeamStatBox.tsx` | Use StatDisplay |

## Tooltip Placement Strategy

- **Desktop**: Show on hover, positioned above or below based on space
- **Mobile**: Show on tap, dismiss on tap outside
- **Tables**: Use a standardized tooltip trigger icon (❓ or ℹ️)

## Performance Considerations

- Cache league averages (they don't change frequently)
- Use React memo for StatDisplay components in lists
- Lazy load descriptions only when tooltip is opened

## Testing Checklist

- [ ] Tooltips appear on hover (desktop)
- [ ] Tooltips appear on tap (mobile)
- [ ] Delta colors are correct (green for positive, red for negative)
- [ ] Progress bars render correctly
- [ ] Averages load from API
- [ ] Fallback works when averages unavailable
- [ ] Descriptions are helpful and grammatically correct
- [ ] Color coding is accessible (not just color-dependent)
