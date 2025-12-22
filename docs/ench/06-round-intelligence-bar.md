# Round Intelligence Bar Implementation Plan

## Overview

Enhance the existing round history strip to become an interactive "round intelligence bar" that provides deeper insights without adding clutter. This builds on the already-implemented round icons with tooltips.

## Current State

The existing `RoundRows.tsx` component already has:
- ✅ Round icons with outcome emojis (💀, 💥, 🔧, ⏱️)
- ✅ CT/T side color coding (blue/yellow backgrounds)
- ✅ Hover tooltips with end reason and opening kill
- ✅ Opening kill indicator dots (blue/yellow corner dots)
- ✅ Side switch markers
- ✅ Overtime support

## Enhancements to Add

### Layer 1: Enhanced Hover Tooltips (Quick Win)

Expand the current tooltip to show more round context:

**Current:**
```
Round 14 – CT win
• Opening kill: CT
```

**Enhanced:**
```
Round 14 – CT win
─────────────────
• Opening kill: CT (spirrde)
• Bomb planted: B site
• Ended: 2v1 (CT advantage)
• Round type: Full buy
• Duration: 1:42
```

### Layer 2: Click → Round Detail Panel

When a round is clicked, populate a detail panel in the free space below:

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ROUND 18 OVERVIEW                                           [Close X] │
├─────────────────────────────────────────────────────────────────────────┤
│  Side: T-side  │  Result: Lost  │  Duration: 1:23                      │
├─────────────────────────────────────────────────────────────────────────┤
│  KEY EVENTS                                                             │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ 0:15  Opening duel lost (A main) - spirrde died to enemy1       │  │
│  │ 0:32  Trade secured - teammate2 kills enemy1                    │  │
│  │ 0:48  Bomb planted (A site)                                     │  │
│  │ 1:12  Post-plant lost (3v2) - failed to hold angles             │  │
│  └──────────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────┤
│  PLAYER IMPACT                                                          │
│  spirrde: 0K 1D  •  teammate2: 1K 1D  •  teammate3: 1K 0D              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Layer 3: Icon Overlays for Key Events

Add small corner markers to round icons (in addition to opening kill dot):

```
┌────────┐
│  💥    │  ← Main outcome icon
│     🔑 │  ← Opening kill dot (existing)
│  ⭐    │  ← Clutch indicator (new)
│  💣    │  ← Bomb planted indicator (new)
└────────┘
```

Markers:
- 🔑 Blue/Yellow dot = Opening kill (existing)
- ⭐ Gold dot = Clutch round (won 1vX or 2vX situation)
- 💣 Small bomb icon = Bomb was planted
- 🔁 Circular arrow = Retake occurred

### Layer 4: Economy Hints (Subtle Background)

Add subtle background color variations to indicate round economy:

| Economy Type | Background Style |
|--------------|------------------|
| Full buy | Normal (current) |
| Eco round | Slightly desaturated |
| Force buy | Slightly highlighted |
| Pistol | Distinct indicator |

## Implementation

### Step 1: Enhance Tooltip Content

**File**: `apps/frontend/src/components/matches/match/stats/RoundRows.tsx`

```tsx
const EnhancedTooltipContent = ({ round }: { round: MapRoundInfo }) => {
  const CT_WON = isCTWin(round.round_end_reason_info);
  const endReasonText = getEndReasonText(
    round.round_end_reason_info,
    round.plant_site
  );
  
  return (
    <div className="space-y-2 min-w-[180px]">
      <div className="font-semibold">
        Round {round.round_number} – {CT_WON ? 'CT' : 'T'} win
      </div>
      <Separator className="my-1" />
      <div className="space-y-1 text-sm">
        {round.first_kill && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Opening kill:</span>
            <span className={cn(
              round.first_kill === 'CT' ? 'text-blue-400' : 'text-yellow-400'
            )}>
              {round.first_kill}
            </span>
          </div>
        )}
        {round.plant_site && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Bomb planted:</span>
            <span>{round.plant_site} site</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Outcome:</span>
          <span>{endReasonText}</span>
        </div>
      </div>
    </div>
  );
};
```

### Step 2: Add Additional Icon Overlays

**File**: `apps/frontend/src/components/matches/match/stats/RoundRows.tsx`

```tsx
const RoundIconOverlays = ({ round }: { round: MapRoundInfo }) => {
  const hasClutch = isClutchRound(round);
  const hasPlant = !!round.plant_site;
  const hasOpeningKill = !!round.first_kill;
  
  return (
    <>
      {/* Opening Kill Indicator (existing) */}
      {hasOpeningKill && (
        <span
          className={cn(
            "absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-background",
            round.first_kill === "CT" ? "bg-blue-400" : "bg-yellow-400"
          )}
          title={`${round.first_kill} got opening kill`}
        />
      )}
      
      {/* Clutch Indicator */}
      {hasClutch && (
        <span
          className="absolute -top-1 -right-1 w-2.5 h-2.5 text-[8px] leading-none"
          title="Clutch round"
        >
          ⭐
        </span>
      )}
      
      {/* Bomb Planted Indicator */}
      {hasPlant && (
        <span
          className="absolute -top-1 -left-1 w-2 h-2 text-[8px] leading-none"
          title={`Bomb planted at ${round.plant_site}`}
        >
          💣
        </span>
      )}
    </>
  );
};
```

### Step 3: Create Round Detail Panel

**File**: `apps/frontend/src/components/matches/match/stats/RoundDetailPanel.tsx`

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MapRoundInfo } from "@eggosystem/types";

interface RoundDetailPanelProps {
  round: MapRoundInfo;
  teamOne: { id: number; name: string };
  teamTwo: { id: number; name: string };
  onClose: () => void;
}

export function RoundDetailPanel({
  round,
  teamOne,
  teamTwo,
  onClose,
}: RoundDetailPanelProps) {
  const winningTeam = getWinningTeamId(round) === teamOne.id ? teamOne : teamTwo;
  
  return (
    <Card className="mt-4 border-kanaliiga-orange/50">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          Round {round.round_number} Overview
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Row */}
        <div className="flex gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Winner:</span>{" "}
            <span className="font-medium">{winningTeam.name}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Side:</span>{" "}
            <span className={cn(
              isCTWin(round.round_end_reason_info) ? "text-blue-400" : "text-yellow-400"
            )}>
              {isCTWin(round.round_end_reason_info) ? "CT" : "T"}
            </span>
          </div>
        </div>
        
        {/* Key Events */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            KEY EVENTS
          </h4>
          <div className="space-y-1 text-sm bg-muted/30 p-2 rounded">
            {round.first_kill && (
              <div>Opening kill: {round.first_kill}</div>
            )}
            {round.plant_site && (
              <div>Bomb planted at {round.plant_site} site</div>
            )}
            <div>{getEndReasonText(round.round_end_reason_info, round.plant_site)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Step 4: Add Click Handler to RoundInfo

**File**: `apps/frontend/src/components/matches/match/stats/RoundRows.tsx`

```tsx
export const RoundInfo = ({ matchGameId, ...props }: RoundInfoProps) => {
  const [selectedRound, setSelectedRound] = useState<MapRoundInfo | null>(null);
  const { roundInfo, isLoading, isError } = useGameRoundInfo(matchGameId);
  
  // ... existing code ...
  
  return (
    <TooltipProvider>
      <div className="relative overflow-x-auto">
        {/* ... existing round strip ... */}
        
        <RoundRows
          // ... existing props ...
          onRoundClick={(round) => setSelectedRound(round)}
          selectedRound={selectedRound}
        />
        
        {/* Round Detail Panel */}
        {selectedRound && (
          <RoundDetailPanel
            round={selectedRound}
            teamOne={teamOne}
            teamTwo={teamTwo}
            onClose={() => setSelectedRound(null)}
          />
        )}
      </div>
    </TooltipProvider>
  );
};
```

### Step 5: Add Economy Backgrounds (Optional)

If economy data becomes available:

```tsx
const getEconomyBackground = (round: MapRoundInfo) => {
  const isEco = round.equipment_value < 10000; // Example threshold
  const isPistol = round.round_number === 1 || round.round_number === 13;
  
  if (isPistol) return "ring-2 ring-kanaliiga-orange/50";
  if (isEco) return "opacity-60";
  return "";
};
```

## Mode Toggles (Future Enhancement)

Add toggles above the round strip:

```tsx
const [viewMode, setViewMode] = useState<"results" | "momentum" | "economy">("results");

<div className="flex gap-2 mb-2">
  <Button 
    variant={viewMode === "results" ? "default" : "ghost"}
    size="sm"
    onClick={() => setViewMode("results")}
  >
    Results
  </Button>
  <Button 
    variant={viewMode === "momentum" ? "default" : "ghost"}
    size="sm"
    onClick={() => setViewMode("momentum")}
  >
    Momentum
  </Button>
  <Button 
    variant={viewMode === "economy" ? "default" : "ghost"}
    size="sm"
    onClick={() => setViewMode("economy")}
  >
    Economy
  </Button>
</div>
```

## Filter Chips (Future Enhancement)

Add filter chips to show only specific round types:

```tsx
<div className="flex gap-2 mb-2 text-xs">
  <FilterChip active={filters.pistol} onClick={() => toggle('pistol')}>
    Pistol Rounds
  </FilterChip>
  <FilterChip active={filters.postPlant} onClick={() => toggle('postPlant')}>
    Post-plant
  </FilterChip>
  <FilterChip active={filters.clutches} onClick={() => toggle('clutches')}>
    Clutches
  </FilterChip>
</div>
```

## Files to Modify

| File | Type | Changes |
|------|------|---------|
| `RoundRows.tsx` | Modify | Enhanced tooltips, click handler, overlays |
| New: `RoundDetailPanel.tsx` | New | Detail panel component |
| New: `RoundIconOverlays.tsx` | New | Overlay indicators |
| `useGameRoundInfo.tsx` | Possibly extend | Add more round data if needed |

## Data Requirements

### Currently Available
- Round number, end reason ✅
- Opening kill (CT/T) ✅
- Plant site ✅
- Team IDs ✅

### Need to Add/Calculate
- Clutch detection (from survivors at round end)
- Economy data (if parsing provides it)
- Round duration (if available)
- Player-specific actions (for detail panel)

## Testing Checklist

- [ ] Enhanced tooltips show all available data
- [ ] Clicking round opens detail panel
- [ ] Closing panel works (X button, click outside)
- [ ] Icon overlays display correctly
- [ ] Overlays don't overlap/obscure main icon
- [ ] Mobile tap works for tooltips and panels
- [ ] Selected round is visually highlighted
- [ ] Panel content is accurate
- [ ] No performance issues with many rounds
