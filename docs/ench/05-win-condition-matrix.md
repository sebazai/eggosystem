# Win Condition Matrix Implementation Plan

## Overview

Add a situation-based win percentage comparison table to match pages, showing how teams perform in specific scenarios like 5v5, 5v4, post-plant, and retakes.

## Problem

Current match statistics show aggregate numbers but don't reveal:
- Which team wins when they get the first pick?
- Who is better in post-plant situations?
- Which team converts advantages more reliably?

This information is crucial for teams analyzing their performance.

## Solution

### Win Condition Matrix Design

A compact grid showing win percentages by situation:

```
┌────────────────────────────────────────────────────────┐
│  WIN CONDITION MATRIX                                  │
├──────────────────┬─────────────┬─────────────┬────────┤
│ Situation        │ Fidelix     │ Produal     │ Delta  │
├──────────────────┼─────────────┼─────────────┼────────┤
│ Even rounds (5v5)│ 52%         │ 48%         │ +4%    │
│ First pick (5v4) │ 68%         │ 61%         │ +7%    │
│ Down player (4v5)│ 24%         │ 31%         │ -7%    │
│ Post-plant       │ 41%         │ 63%         │ -22%   │
│ Retakes          │ 22%         │ 38%         │ -16%   │
│ Opening kill     │ 55%         │ 45%         │ +10%   │
└──────────────────┴─────────────┴─────────────┴────────┘

Key insight: Produal converts post-plant situations 22% better
```

## Situation Definitions

| Situation | Definition | Significance |
|-----------|------------|--------------|
| **Even rounds (5v5)** | Rounds where both teams had 5 players at first engagement | Base competitiveness |
| **First pick (5v4)** | Rounds where team got the opening kill | Conversion of advantages |
| **Down player (4v5)** | Rounds where team lost the opening duel | Comeback ability |
| **Post-plant** | As T: win rate after planting; As CT: prevent rate | Closing ability |
| **Retakes** | CT wins after bomb was planted | Coordination/utility |
| **Opening kill** | Win rate in rounds where team got first blood | Entry effectiveness |

## Implementation

### Step 1: Data Types

**File**: `packages/types/src/games/WinConditionStats.interface.ts`

```ts
export interface TeamWinConditions {
  teamId: number;
  teamName: string;
  
  // Raw counts
  totalRounds: number;
  
  // 5v5 situations
  evenRounds: { played: number; won: number };
  
  // Advantage situations
  firstPickRounds: { played: number; won: number; }; // 5v4
  downPlayerRounds: { played: number; won: number }; // 4v5
  
  // Post-plant (as T)
  postPlantRounds: { played: number; won: number };
  
  // Retakes (as CT)
  retakeRounds: { attempted: number; succeeded: number };
  
  // Opening kills
  openingKillRounds: { occurrences: number; wins: number };
  openingDeathRounds: { occurrences: number; wins: number };
}

export interface MatchWinConditions {
  matchId: number;
  gameId: number;
  teams: [TeamWinConditions, TeamWinConditions];
}
```

### Step 2: Backend Calculation

**File**: `apps/backend/src/services/winConditions.service.ts`

```ts
export async function calculateWinConditions(
  gameId: number,
  roundStats: MapRoundStat[]
): Promise<MatchWinConditions> {
  const teamStats = new Map<number, Partial<TeamWinConditions>>();
  
  for (const round of roundStats) {
    const winnerId = determineWinner(round);
    const loserId = winnerId === round.t_team_id 
      ? round.ct_team_id 
      : round.t_team_id;
    
    // Initialize team stats if needed
    if (!teamStats.has(round.t_team_id)) {
      teamStats.set(round.t_team_id, initializeTeamStats(round.t_team_id));
    }
    if (!teamStats.has(round.ct_team_id)) {
      teamStats.set(round.ct_team_id, initializeTeamStats(round.ct_team_id));
    }
    
    // Count opening kill situations
    if (round.first_kill === 'T') {
      updateOpeningStats(teamStats.get(round.t_team_id), winnerId === round.t_team_id);
    } else if (round.first_kill === 'CT') {
      updateOpeningStats(teamStats.get(round.ct_team_id), winnerId === round.ct_team_id);
    }
    
    // Count post-plant situations
    if (round.plant_site) {
      updatePostPlantStats(
        teamStats.get(round.t_team_id), 
        round.round_end_reason_info
      );
      updateRetakeStats(
        teamStats.get(round.ct_team_id),
        round.round_end_reason_info
      );
    }
  }
  
  return {
    matchId: roundStats[0].match_id,
    gameId,
    teams: [
      teamStats.get(roundStats[0].t_team_id),
      teamStats.get(roundStats[0].ct_team_id)
    ],
  };
}
```

### Step 3: API Endpoint

**File**: `apps/backend/src/routes/games.routes.ts`

```ts
router.get('/games/:gameId/win-conditions', async (req, res) => {
  const { gameId } = req.params;
  
  const roundStats = await getGameRoundStats(parseInt(gameId));
  const winConditions = await calculateWinConditions(
    parseInt(gameId),
    roundStats
  );
  
  res.json(winConditions);
});
```

### Step 4: Frontend Hook

**File**: `apps/frontend/src/hooks/data/useGameWinConditions.tsx`

```tsx
import useSWR from "swr";
import type { MatchWinConditions } from "@eggosystem/types";

export function useGameWinConditions(gameId?: number) {
  const { data, error, isLoading } = useSWR<MatchWinConditions>(
    gameId ? `/api/games/${gameId}/win-conditions` : null
  );

  return {
    winConditions: data,
    isLoading,
    error,
  };
}
```

### Step 5: Win Condition Matrix Component

**File**: `apps/frontend/src/components/matches/match/stats/WinConditionMatrix.tsx`

```tsx
import { cn } from "@/lib/utils";
import { useGameWinConditions } from "@/hooks/data/useGameWinConditions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface WinConditionMatrixProps {
  gameId: number;
  teamOne: { id: number; name: string };
  teamTwo: { id: number; name: string };
}

const SITUATIONS = [
  {
    key: "evenRounds",
    label: "Even rounds (5v5)",
    description: "Rounds where both teams started with all 5 players",
  },
  {
    key: "firstPickRounds",
    label: "First pick (5v4)",
    description: "Win rate after getting the opening kill",
  },
  {
    key: "downPlayerRounds",
    label: "Down player (4v5)",
    description: "Win rate after losing the opening duel",
  },
  {
    key: "postPlantRounds",
    label: "Post-plant",
    description: "T-side: wins after planting. CT-side: stopped plants",
  },
  {
    key: "retakeRounds",
    label: "Retakes",
    description: "CT-side retake success rate after bomb was planted",
  },
  {
    key: "openingKillRounds",
    label: "Opening kill converts",
    description: "Win rate in rounds where team got first blood",
  },
];

export function WinConditionMatrix({ 
  gameId, 
  teamOne, 
  teamTwo 
}: WinConditionMatrixProps) {
  const { winConditions, isLoading } = useGameWinConditions(gameId);
  
  if (isLoading || !winConditions) {
    return <div className="animate-pulse h-48 bg-muted rounded" />;
  }
  
  const getPercentage = (stat: { played: number; won: number } | undefined) => {
    if (!stat || stat.played === 0) return null;
    return (stat.won / stat.played * 100).toFixed(0);
  };
  
  const getTeamStat = (teamId: number, key: string) => {
    const team = winConditions.teams.find(t => t.teamId === teamId);
    return team?.[key];
  };
  
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        WIN CONDITION MATRIX
        <Tooltip>
          <TooltipTrigger>
            <HelpCircle className="w-4 h-4" />
          </TooltipTrigger>
          <TooltipContent>
            Shows team win rates in different situations
          </TooltipContent>
        </Tooltip>
      </h3>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Situation</TableHead>
            <TableHead className="text-center">{teamOne.name}</TableHead>
            <TableHead className="text-center">{teamTwo.name}</TableHead>
            <TableHead className="text-center w-[80px]">Delta</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {SITUATIONS.map(situation => {
            const stat1 = getPercentage(getTeamStat(teamOne.id, situation.key));
            const stat2 = getPercentage(getTeamStat(teamTwo.id, situation.key));
            const delta = stat1 && stat2 
              ? parseInt(stat1) - parseInt(stat2) 
              : null;
            
            return (
              <TableRow key={situation.key}>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {situation.label}
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[200px]">
                        {situation.description}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
                <TableCell className="text-center font-medium">
                  {stat1 ? `${stat1}%` : '-'}
                </TableCell>
                <TableCell className="text-center font-medium">
                  {stat2 ? `${stat2}%` : '-'}
                </TableCell>
                <TableCell className={cn(
                  "text-center font-medium",
                  delta && delta > 0 && "text-green-500",
                  delta && delta < 0 && "text-red-500"
                )}>
                  {delta !== null 
                    ? `${delta > 0 ? '+' : ''}${delta}%` 
                    : '-'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {/* Key Insight */}
      <KeyInsight teamOne={teamOne} teamTwo={teamTwo} conditions={winConditions} />
    </div>
  );
}

function KeyInsight({ teamOne, teamTwo, conditions }) {
  // Find the largest delta to highlight
  const largestDelta = findLargestDelta(conditions);
  
  if (!largestDelta) return null;
  
  return (
    <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded">
      <span className="font-medium">Key insight:</span>{' '}
      {largestDelta.betterTeam.name} converts{' '}
      {largestDelta.situation} situations{' '}
      <span className={cn(
        "font-bold",
        largestDelta.delta > 20 ? "text-green-500" : ""
      )}>
        {largestDelta.delta}% better
      </span>
    </div>
  );
}
```

### Step 6: Integration with Match Page

Add to the match page in the free space:

```tsx
// In MatchStats.tsx or GameStats.tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
  <RoundFlowMatrix gameId={gameId} teamOne={teamOne} teamTwo={teamTwo} />
  <WinConditionMatrix gameId={gameId} teamOne={teamOne} teamTwo={teamTwo} />
</div>
```

## Visual Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        WIN CONDITION MATRIX                    ❓        │
├─────────────────────────┬─────────────┬─────────────┬──────────────────┤
│ Situation               │  Fidelix    │   Produal   │      Delta       │
├─────────────────────────┼─────────────┼─────────────┼──────────────────┤
│ Even rounds (5v5)    ❓ │     52%     │     48%     │      +4%         │
│ First pick (5v4)     ❓ │     68%     │     61%     │ ████ +7%         │
│ Down player (4v5)    ❓ │     24%     │     31%     │ ████ -7%         │
│ Post-plant           ❓ │     41%     │     63%     │ ████████ -22%    │
│ Retakes              ❓ │     22%     │     38%     │ ██████ -16%      │
│ Opening kill         ❓ │     55%     │     45%     │ ████ +10%        │
├─────────────────────────┴─────────────┴─────────────┴──────────────────┤
│ Key insight: Produal converts post-plant situations 22% better         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Files to Create/Modify

| File | Type | Description |
|------|------|-------------|
| `WinConditionStats.interface.ts` | New | Type definitions |
| `winConditions.service.ts` | New | Backend calculation |
| `useGameWinConditions.tsx` | New | Data fetching hook |
| `WinConditionMatrix.tsx` | New | Main component |
| `games.routes.ts` | Modify | Add endpoint |
| Match page | Modify | Integrate component |

## Data Requirements

All data should be derivable from existing `MapRoundStats`:
- `first_kill` field for opening kills/deaths
- `plant_site` field for post-plant situations
- `round_end_reason_info` for retake success

## Advanced Features (Future)

### 1. Historical Comparison
Show how current performance compares to team's historical average:

```
Post-plant: 41% (vs 52% season avg)
```

### 2. Per-Map Breakdown
Show win conditions per map in a BO3:

```
         Ancient    Inferno    Mirage
5v4        68%        72%       61%
```

### 3. Player-Level Drill Down
Click on a situation to see player-specific stats:

```
Post-plant wins breakdown:
• spirrde: 5 clutches (3 won)
• player2: 2 clutches (0 won)
```

## Testing Checklist

- [ ] Matrix renders correctly with data
- [ ] Percentages calculate correctly
- [ ] Delta colors are correct (green positive, red negative)
- [ ] Tooltips explain each situation
- [ ] Key insight generates correctly
- [ ] Handles edge cases (no data, 0 attempts)
- [ ] Mobile layout is readable
- [ ] Loading state displays correctly
