# @eggosystem/viewer

A React component for viewing CS2 demo data in a 2D radar format.

## Features

- Interactive 2D map viewer with pan and zoom
- Real-time player position tracking
- Weapon fire trails and grenade trajectories
- Killfeed overlay with kill modifiers
- Team scoreboards with player stats
- Round-based navigation
- Playback controls with speed adjustment

## Installation

```bash
pnpm add @eggosystem/viewer
```

## Usage

```tsx
import { Viewer, DemoData } from "@eggosystem/viewer";

function MyComponent() {
  const demoData: DemoData = {
    map: "de_dust2",
    mapData: {
      offset: { x: -2476, y: 3239 },
      resolution: 0.25,
      width: 1024,
      height: 1024
    },
    tickRate: 64,
    ticks: [
      // ... tick data
    ],
    rounds: [
      // ... round data
    ],
    events: [
      // ... event data
    ]
  };

  return <Viewer demoData={demoData} />;
}
```

## Props

### ViewerProps

| Prop       | Type       | Description              |
| ---------- | ---------- | ------------------------ |
| `demoData` | `DemoData` | The demo data to display |

### DemoData

| Field      | Type      | Description                                    |
| ---------- | --------- | ---------------------------------------------- |
| `map`      | `string`  | Map name (e.g., 'de_dust2')                    |
| `mapData`  | `MapData` | Map metadata for coordinate conversion         |
| `tickRate` | `number`  | Demo tick rate (usually 64 or 128)             |
| `ticks`    | `Tick[]`  | Array of tick data with player positions       |
| `rounds`   | `Round[]` | Optional round data                            |
| `events`   | `Event[]` | Optional event data (kills, weapon fire, etc.) |

## Assets

The component expects the following assets to be available in the public directory:

- `/maps/{mapName}/radar.png` - Map radar images
- `/weapons/{weaponName}-icon.svg` - Weapon icons
- `/kill-modifiers/{modifier}.svg` - Kill modifier icons
- `/flashbang-detonate.png` - Flashbang detonation image
- `/smoke-detonate.png` - Smoke detonation image
- `/molotov-detonate.png` - Molotov detonation image

## Styling

The component includes its own CSS styles. Import them if needed:

```tsx
import "@eggosystem/viewer/styles";
```

## Development

```bash
# Build the package
pnpm build

# Watch for changes
pnpm dev

# Type check
pnpm typecheck

# Lint
pnpm lint
```
