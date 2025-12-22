# Round Flow Matrix Implementation Plan

## Overview

Add a visual momentum timeline to match pages that shows the flow of the game, answering the critical question: "Where did we lose control?"

## Problem

Current match statistics show:
- Final scores
- Player K/D/A
- Round history strip (win icons per round)

What's missing:
- **Momentum shifts** - When did the game turn?
- **Control indicators** - Which team was dominating when?
- **Crisis points** - Where did comebacks start/fail?

## Solution

### Round Flow Matrix Design

A visual timeline showing round outcomes with color-coded intensity:

```
         T SIDE (1-12)              │  CT SIDE (13-24)
Round:  1  2  3  4  5  6  7  8  9 10│11 12 13 14 15 16 17 18 19 20 21 22 23 24
        ─────────────────────────────┼─────────────────────────────────────────
Team A  ██ ██ ── ██ ██ ██ ── ██ ── ██│── ██ ██ ── ██ ── ── ██ ██ ──
Team B  ── ── ██ ── ── ── ██ ── ██ ──│██ ── ── ██ ── ██ ██ ── ── ██

Score:  1  2  2  3  4  5  5  6  6  7 │ 7  8  9  9 10 10 10 11 12 12
        0  0  1  1  1  1  2  2  3  3 │ 4  4  4  5  5  6  7  7  7  8

Legend: ██ = Win   ── = Loss   Color intensity = win quality
```

### Color Coding by Win Quality

| Outcome | Color | Description |
|---------|-------|-------------|
| Clean win (5v4 or better) | Bright Green | Dominant round |
| Close win (won after 4v4+) | Yellow-Green | Contested victory |
| Clutch win (1vX, 2vX) | Gold | High-impact win |
| Post-plant loss | Light Red | Lost with advantage |
| Elimination | Red | Killed without plant |
| Time loss | Dark Red | Failed to plant in time |

### Momentum Line

Add a running momentum indicator below the matrix:

```
Momentum: ────────────╱╲────────────────────╱──────────────
                      │                     │
                Team A peaked          Team B momentum shift
```

## Implementation

### Step 1: Data Types

**File**: `packages/types/src/games/RoundFlowData.interface.ts`

```ts
export interface RoundFlowData {
  roundNumber: number;
  winningTeamId: number;
  endReason: RoundEndReasonInfo;
  
  // Win quality metrics
  survivorsWinning: number;
  survivorsLosing: number;
  isClutch: boolean;
  clutchType?: string; // "1v2", "1v3", etc.
  
  // Situation at round end
  bombPlanted: boolean;
  plantSite?: "A" | "B";
  
  // First kill info
  firstKillTeamId?: number;
  
  // Calculated
  winQuality: "dominant" | "close" | "clutch" | "lucky";
}

export interface MatchFlowSummary {
  matchId: number;
  gameId: number;
  rounds: RoundFlowData[];
  
  // Momentum analysis
  momentumShifts: number[]; // Round numbers where momentum changed
  longestStreak: {
    teamId: number;
    start: number;
    length: number;
  };
}
```

### Step 2: Backend Endpoint

**File**: `apps/backend/src/controllers/games.controllers.ts`

Add endpoint to calculate round flow data:

```ts
export async function getGameRoundFlow(gameId: number): Promise<MatchFlowSummary> {
  const roundStats = await getGameRoundStats(gameId);
  
  const rounds = roundStats.map(round => ({
    roundNumber: round.round_number,
    winningTeamId: determineWinner(round),
    endReason: round.round_end_reason_info,
    // ... calculate additional fields
  }));
  
  return {
    gameId,
    matchId: roundStats[0].match_id,
    rounds,
    momentumShifts: calculateMomentumShifts(rounds),
    longestStreak: findLongestStreak(rounds),
  };
}
```

### Step 3: Frontend Hook

**File**: `apps/frontend/src/hooks/data/useGameRoundFlow.tsx`

```tsx
import useSWR from "swr";
import type { MatchFlowSummary } from "@eggosystem/types";

export function useGameRoundFlow(gameId?: number) {
  const { data, error, isLoading } = useSWR<MatchFlowSummary>(
    gameId ? `/api/games/${gameId}/round-flow` : null
  );

  return {
    flowData: data,
    isLoading,
    error,
  };
}
```

### Step 4: Round Flow Matrix Component

**File**: `apps/frontend/src/components/matches/match/stats/RoundFlowMatrix.tsx`

```tsx
import { cn } from "@/lib/utils";
import { useGameRoundFlow } from "@/hooks/data/useGameRoundFlow";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface RoundFlowMatrixProps {
  gameId: number;
  teamOne: { id: number; name: string };
  teamTwo: { id: number; name: string };
}

export function RoundFlowMatrix({ gameId, teamOne, teamTwo }: RoundFlowMatrixProps) {
  const { flowData, isLoading } = useGameRoundFlow(gameId);
  
  if (isLoading || !flowData) return <div>Loading...</div>;
  
  const halfwayPoint = flowData.rounds.length > 24 
    ? Math.floor(flowData.rounds.length / 2) 
    : 12;
  
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground">
        ROUND FLOW
      </h3>
      
      {/* Matrix Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Round numbers header */}
          <div className="flex">
            <div className="w-24 flex-shrink-0" /> {/* Team name column */}
            {flowData.rounds.map(round => (
              <div 
                key={round.roundNumber}
                className={cn(
                  "w-6 text-center text-xs text-muted-foreground",
                  round.roundNumber === halfwayPoint && "border-r-2 border-kanaliiga-orange pr-1"
                )}
              >
                {round.roundNumber}
              </div>
            ))}
          </div>
          
          {/* Team One Row */}
          <RoundFlowRow 
            teamName={teamOne.name}
            teamId={teamOne.id}
            rounds={flowData.rounds}
            halfwayPoint={halfwayPoint}
          />
          
          {/* Team Two Row */}
          <RoundFlowRow 
            teamName={teamTwo.name}
            teamId={teamTwo.id}
            rounds={flowData.rounds}
            halfwayPoint={halfwayPoint}
          />
        </div>
      </div>
      
      {/* Momentum Insights */}
      {flowData.longestStreak && (
        <div className="text-sm text-muted-foreground">
          Longest streak: {flowData.longestStreak.length} rounds 
          by {flowData.longestStreak.teamId === teamOne.id ? teamOne.name : teamTwo.name}
        </div>
      )}
    </div>
  );
}

function RoundFlowRow({ 
  teamName, 
  teamId, 
  rounds, 
  halfwayPoint 
}: { 
  teamName: string; 
  teamId: number; 
  rounds: RoundFlowData[]; 
  halfwayPoint: number;
}) {
  return (
    <div className="flex items-center">
      <div className="w-24 flex-shrink-0 text-sm font-medium truncate pr-2">
        {teamName}
      </div>
      
      {rounds.map(round => {
        const won = round.winningTeamId === teamId;
        
        return (
          <Tooltip key={round.roundNumber}>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  "w-6 h-6 flex items-center justify-center cursor-help",
                  round.roundNumber === halfwayPoint && "border-r-2 border-kanaliiga-orange"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-sm",
                    won 
                      ? getWinColor(round.winQuality)
                      : "bg-gray-800"
                  )}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <RoundTooltip round={round} teamWon={won} />
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

function getWinColor(quality: string) {
  switch (quality) {
    case "dominant": return "bg-green-500";
    case "close": return "bg-yellow-500";
    case "clutch": return "bg-amber-500";
    case "lucky": return "bg-orange-500";
    default: return "bg-green-400";
  }
}
```

### Step 5: Add to Match Page

Integrate the component into the match statistics page:

**File**: `apps/frontend/src/components/matches/match/stats/MatchStats.tsx`

```tsx
// Add to the free space at bottom of match page
<div className="mt-6">
  <RoundFlowMatrix 
    gameId={gameId}
    teamOne={teamOne}
    teamTwo={teamTwo}
  />
</div>
```

## Visual Design Mockup

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ROUND FLOW                                                             │
├─────────────────────────────────────────────────────────────────────────┤
│         │ T SIDE                            │ CT SIDE                   │
│         │ 1  2  3  4  5  6  7  8  9 10 11 12│13 14 15 16 17 18 19 20... │
│─────────┼───────────────────────────────────┼───────────────────────────│
│ Fidelix │ ■  ■  □  ■  ■  ■  □  ■  □  ■  □  ■│ □  ■  ■  □  ■  □  □  ■    │
│ Produal │ □  □  ■  □  □  □  ■  □  ■  □  ■  □│ ■  □  □  ■  □  ■  ■  □    │
│─────────┴───────────────────────────────────┴───────────────────────────│
│ Legend: ■ Win (green=dominant, yellow=close, gold=clutch)  □ Loss       │
│                                                                         │
│ Key moments:                                                            │
│ • R7: Produal clutch (1v3) shifted momentum                            │
│ • R13-15: Fidelix pistol+2 after switch                                │
│ • R17-19: Produal 3-round streak to close out                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Alternative: Simplified Bar Chart View

For a simpler initial implementation:

```tsx
function SimplifiedRoundFlow({ rounds, teamOne, teamTwo }) {
  return (
    <div className="flex h-12">
      {rounds.map((round, i) => (
        <div 
          key={i}
          className={cn(
            "flex-1 border-r border-background",
            round.winningTeamId === teamOne.id 
              ? "bg-blue-500" 
              : "bg-yellow-500"
          )}
          style={{ 
            opacity: getOpacityByQuality(round.winQuality) 
          }}
        />
      ))}
    </div>
  );
}
```

## Files to Create/Modify

| File | Type | Description |
|------|------|-------------|
| `RoundFlowData.interface.ts` | New | Type definitions |
| `useGameRoundFlow.tsx` | New | Data fetching hook |
| `RoundFlowMatrix.tsx` | New | Main component |
| `games.controllers.ts` | Modify | Add endpoint |
| `games.routes.ts` | Modify | Add route |
| Match page | Modify | Integrate component |

## Data Requirements

The round flow data requires:
- Round outcomes (already have via `MapRoundInfo`)
- Player count at round end (may need to calculate from round events)
- First kill team (already have `first_kill` field)
- Plant status (already have `plant_site` field)

## Performance Considerations

- Lazy load the round flow component
- Cache calculated flow data
- Consider SSR for initial render
- Limit to showing one game's flow at a time

## Testing Checklist

- [ ] Matrix renders correctly for regulation games
- [ ] Matrix handles overtime rounds
- [ ] Color coding is correct for win quality
- [ ] Tooltips show detailed round info
- [ ] Side switch marker displays correctly
- [ ] Mobile scrolling works
- [ ] Streak detection is accurate
- [ ] Momentum shifts are highlighted
