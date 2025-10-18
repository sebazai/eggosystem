export interface DemoData {
  map: string;
  mapData: {
    offset: { x: number; y: number };
    resolution: number;
    width: number;
    height: number;
  };
  tickRate: number;
  ticks: Array<{
    tick: number;
    players: Array<{
      steamid: string;
      name: string;
      team: number;
      x: number;
      y: number;
      health: number;
      // Enhanced fields
      yaw?: number;
      pitch?: number;
      z?: number;
      armor?: number;
      hasHelmet?: boolean;
      hasDefuser?: boolean;
      money?: number;
      equipValue?: number;
      flashDuration?: number;
      isDefusing?: boolean;
      isPlanting?: boolean;
      isScoped?: boolean;
      isWalking?: boolean;
      isDucking?: boolean;
      activeWeapon?: string;
      kills?: number;
      assists?: number;
      deaths?: number;
    }>;
  }>;
  rounds?: Array<{
    roundNum: number;
    startTick: number;
    endTick?: number;
    winner?: number | string;
    reason?: string;
  }>;
  events?: Array<{
    tick: number;
    eventType: string;
    data: any;
  }>;
}

export interface ViewerProps {
  demoData: DemoData;
}

export { default as Viewer } from "./components/Viewer";
export { default as Killfeed } from "./components/Killfeed";
export { default as WeaponIcon } from "./components/WeaponIcon";
