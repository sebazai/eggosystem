export interface DemoTick {
  tick: number;
  players: Array<DemoPlayer>;
}
export interface DemoPlayer {
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
}

export interface DemoEvent {
  tick: number;
  eventType: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export interface DemoRound {
  roundNum: number;
  startTick: number;
  endTick?: number;
  winner?: number | string;
  reason?: string;
}

export interface DemoData {
  map: string;
  mapData: {
    offset: { x: number; y: number };
    resolution: number;
    width: number;
    height: number;
  };
  tickRate: number;
  ticks: Array<DemoTick>;
  rounds?: Array<DemoRound>;
  events?: Array<DemoEvent>;
}

export interface ViewerProps {
  demoData: DemoData;
}

export { default as Viewer } from "./components/Viewer";
export { default as Killfeed } from "./components/Killfeed";
export { default as WeaponIcon } from "./components/WeaponIcon";
