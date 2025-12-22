# Enhancement Overview

This folder contains comprehensive implementation plans for UI/UX enhancements to the Kanaliiga ecosystem. These plans are derived from the analysis in `docs/enhanche.md` and `docs/roundinfo-enhanche.md`.

## Guiding Principles

### Progressive Disclosure
- **Level 1 (Instant)**: Answer "How did I / we do?" immediately
- **Level 2 (One click)**: Enable comparison "Why did we lose / who underperformed?"
- **Level 3 (Optional/Deep)**: Provide improvement insights "What should I fix?"

### UI Philosophy
- **Cards** = summary views
- **Tabs / toggles** = dimensions
- **Overlays / drawers** = analysis

## Implementation Priority

Based on maximum impact with minimal development cost:

### Phase 1 - High Impact, Low Effort
1. **Player Card Category Tabs** (`01-player-category-tabs.md`)
   - Horizontal stat categories (Combat, Trading, Utility, Positioning, Openings)
   - 5-7 metrics per tab with tooltips
   - Reduces information overload

2. **Map Details Modal** (`02-map-details-modal.md`)
   - "View Details" button for expanded map stats
   - Progressive disclosure for map data
   - Desktop: slide-out panel, Mobile: full-screen

3. **Tooltips & Deltas** (`03-tooltips-and-deltas.md`)
   - "vs team average" comparisons
   - Visual micro-bars for quick assessment
   - Consistent color coding

### Phase 2 - Medium Impact, Medium Effort
4. **Round Flow Matrix** (`04-round-flow-matrix.md`)
   - Visual momentum timeline
   - Round-by-round outcome visualization
   - Answer "Where did we lose control?"

5. **Win Condition Matrix** (`05-win-condition-matrix.md`)
   - Situation-based win percentages (5v5, 5v4, Post-plant, Retakes)
   - Side-by-side team comparison
   - Very useful for teams

### Phase 3 - Round History Intelligence
6. **Round Intelligence Bar** (`06-round-intelligence-bar.md`)
   - Enhanced hover tooltips (already partially implemented)
   - Click → round detail panel
   - Icon overlays for key events (clutch, opening, retake)

### Phase 4 - Navigation & UX
7. **Stateful Filters & URL State** (`07-navigation-improvements.md`)
   - Filter chips instead of separate tabs
   - URL reflects filter state for sharing
   - Consistent filter UX across pages

## Current State Analysis

### Already Implemented ✅
- Round history strip with team separation and outcome icons
- Side switch markers
- Opening kill indicators (dots on round icons)
- Hover tooltips with end reason and opening kill info
- Player tabs: Main, Skills, Map Statistics, Historical Data
- Map stats cards with win/loss, plant info, pistol rounds
- Team stats with CT/T filtering

### Partially Implemented 🔄
- Player map stats cards (could benefit from category organization)
- Team comparison features (need refinement)

### Not Yet Implemented ❌
- Player stat category tabs (Combat, Trading, Utility, etc.)
- Map details modal/panel
- "vs team average" deltas
- Round flow matrix (momentum visualization)
- Win condition matrix
- Round click → detail panel
- Economy hints on rounds
- URL state management for filters
- Map comparison mode

## File Structure

```
docs/ench/
├── 00-overview.md                    # This file
├── 01-player-category-tabs.md        # Player card reorganization
├── 02-map-details-modal.md           # Map details progressive disclosure
├── 03-tooltips-and-deltas.md         # Tooltips and comparison deltas
├── 04-round-flow-matrix.md           # Visual momentum timeline
├── 05-win-condition-matrix.md        # Situation win percentages
├── 06-round-intelligence-bar.md      # Enhanced round history
└── 07-navigation-improvements.md     # Filters and URL state
```

## Technology Considerations

- **Frontend**: Next.js with React, using existing UI components from `@/components/ui`
- **Styling**: Tailwind CSS with Kanaliiga theme colors
- **State Management**: React Context (FilterContext) + URL search params
- **Data Fetching**: SWR hooks (existing pattern)
- **Backend**: Express with Knex for any new API endpoints needed
