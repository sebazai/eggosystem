import { useEffect, useMemo, useRef, useState } from "react";
import type { DemoData, DemoRound, DemoTick } from "../types";
import WeaponIcon from "./WeaponIcon";
import Killfeed from "./Killfeed";
import { getAssetUrl } from "../utils/assetUrl";
import "./Viewer.css";

interface ViewerProps {
  demoData: DemoData;
  mapName: string;
}

interface Player {
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

interface FireParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  opacity: number;
  molotovId: string; // Unique identifier for the molotov this particle belongs to
}

function Viewer({ demoData, mapName }: ViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentTick, setCurrentTick] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // Mobile detection and orientation
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(true);
  const [showLandscapePrompt, setShowLandscapePrompt] = useState(false);

  const [scale, setScale] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // Store active bullet trails (for fade-out effect)
  const [bulletTrails, setBulletTrails] = useState<
    Array<{
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      teamColor: string;
      startTick: number;
      opacity: number;
    }>
  >([]);
  const [flashbangTrails, setFlashbangTrails] = useState<
    Array<{
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      teamColor: string;
      startTick: number;
      detonateTick: number;
      opacity: number;
    }>
  >([]);
  const [smokeTrails, setSmokeTrails] = useState<
    Array<{
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      teamColor: string;
      startTick: number;
      detonateTick: number;
      opacity: number;
    }>
  >([]);
  const [molotovTrails, setMolotovTrails] = useState<
    Array<{
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      teamColor: string;
      startTick: number;
      detonateTick: number;
      opacity: number;
    }>
  >([]);
  const [heTrails, setHeTrails] = useState<
    Array<{
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      teamColor: string;
      startTick: number;
      detonateTick: number;
      opacity: number;
    }>
  >([]);
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);
  const [flashbangImage, setFlashbangImage] = useState<HTMLImageElement | null>(
    null
  );
  const [smokeImage, setSmokeImage] = useState<HTMLImageElement | null>(null);
  const [heImage, setHeImage] = useState<HTMLImageElement | null>(null);
  const [fireParticles, setFireParticles] = useState<FireParticle[]>([]);

  // Track active flashes per player: { steamid: { startTick, startDuration } }
  const [activeFlashes, setActiveFlashes] = useState<
    Map<string, { startTick: number; startDuration: number }>
  >(new Map());

  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);

  const minTick = demoData.ticks[0]?.tick || 0;
  const maxTick = demoData.ticks[demoData.ticks.length - 1]?.tick || 1000;

  // Filter and renumber rounds - minimal filtering
  const validRounds = useMemo(() => {
    if (!demoData.rounds) return [];

    console.log("[Rounds] Total from backend:", demoData.rounds.length);

    // Only filter out truly invalid rounds
    const filtered = demoData.rounds.filter((round, idx) => {
      // Must have an end tick
      if (!round.endTick) {
        console.log(`  Skip round ${idx}: no endTick`);
        return false;
      }

      const duration =
        (round.endTick - round.startTick) / (demoData.tickRate || 64);

      // Only skip EXTREMELY short rounds (< 5 seconds) - likely technical glitches
      if (duration < 5) {
        console.log(`  Skip round ${idx}: ${duration.toFixed(1)}s (too short)`);
        return false;
      }

      console.log(
        `  Keep round ${idx}: start=${round.startTick}, end=${
          round.endTick
        }, duration=${duration.toFixed(1)}s, winner=${round.winner || "none"}`
      );
      return true;
    });

    console.log(`[Rounds] Filtered: ${filtered.length} valid rounds`);

    // Renumber filtered rounds
    return filtered.map((round, index) => ({
      ...round,
      roundNum: index + 1
    }));
  }, [demoData.rounds, demoData.tickRate]);

  // Load map image
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      console.log("Map image loaded successfully");
      setMapImage(img);
    };
    img.onerror = (error) => {
      console.error("Failed to load map image:", error);
    };
    img.src = getAssetUrl(`maps/${mapName}/radar.png`);
  }, [mapName]);

  // Load grenade detonation images
  useEffect(() => {
    const flashImg = new Image();
    flashImg.onload = () => setFlashbangImage(flashImg);
    flashImg.onerror = (error) =>
      console.error("Failed to load flashbang image:", error);
    flashImg.src = getAssetUrl("flashbang-detonate.png");

    const smokeImg = new Image();
    smokeImg.onload = () => setSmokeImage(smokeImg);
    smokeImg.onerror = (error) =>
      console.error("Failed to load smoke image:", error);
    smokeImg.src = getAssetUrl("smoke-detonate.png");

    // Molotov now uses dynamic particle system instead of static image

    const heImg = new Image();
    heImg.onload = () => setHeImage(heImg);
    heImg.onerror = (error) =>
      console.error("Failed to load HE grenade image:", error);
    heImg.src = getAssetUrl("he-detonate.png");
  }, []);

  // Mobile detection and orientation monitoring
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) || window.innerWidth <= 768;
      setIsMobile(isMobileDevice);
      return isMobileDevice;
    };

    const checkOrientation = () => {
      const isLandscapeMode = window.innerWidth > window.innerHeight;
      setIsLandscape(isLandscapeMode);

      // Show prompt if mobile and in portrait
      const mobile = checkMobile();
      if (mobile && !isLandscapeMode) {
        setShowLandscapePrompt(true);
      } else {
        setShowLandscapePrompt(false);
      }
    };

    // Initial check
    checkMobile();
    checkOrientation();

    // Listen for orientation changes
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  // Adjust scale for mobile devices
  useEffect(() => {
    if (isMobile && isLandscape) {
      // Mobile landscape mode: zoom out to show more of the map
      setScale(0.45);
    } else if (isMobile && !isLandscape) {
      // Mobile portrait mode: zoom out to fit
      setScale(0.3);
    }
    // Desktop keeps user-controlled scale
  }, [isMobile, isLandscape]);

  // Update bullet trails based on current tick
  useEffect(() => {
    if (!demoData.events) return;

    // Find weapon_fire events within a small tick window (last ~0.5 seconds)
    const tickWindow = Math.floor(demoData.tickRate * 0.5); // 0.5 seconds

    // Filter out grenades - we only want actual gun fire for bullet trails
    const grenadeNames = [
      "flashbang",
      "smoke",
      "smokegrenade",
      "he",
      "hegrenade",
      "molotov",
      "incgrenade",
      "decoy"
    ];
    const weaponFireEvents = demoData.events.filter((e) => {
      if (e.eventType !== "weapon_fire") return false;
      if (e.tick < currentTick - tickWindow || e.tick > currentTick)
        return false;

      // Check if weapon is a grenade (exclude from bullet trails)
      const weaponName = (e.data.weapon || "").toLowerCase();
      const isGrenade = grenadeNames.some((g) => weaponName.includes(g));
      return !isGrenade;
    });

    // Create bullet trails for each weapon fire event
    const newTrails: Array<{
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      teamColor: string;
      startTick: number;
      opacity: number;
    }> = [];

    for (const event of weaponFireEvents) {
      // Find the player who fired
      const tickData = interpolatePlayerData(event.tick);
      const shooter = tickData.find((p) => p.steamid === event.data.steamid);

      if (!shooter) continue;

      // Convert shooter position to radar coordinates FIRST
      const shooterPos = gameToRadar(shooter.x, shooter.y);

      // Calculate bullet trail endpoint in RADAR SPACE (not game space)
      // This ensures the angle matches the view direction line
      const angle = -degreesToRadians(shooter.yaw || 0);
      const trailLength = 500; // Length in radar pixels (much longer visual trail)
      const endX = shooterPos.x + trailLength * Math.cos(angle);
      const endY = shooterPos.y + trailLength * Math.sin(angle);

      // Calculate opacity based on how old the event is
      const ticksOld = currentTick - event.tick;
      const opacity = Math.max(0, 1 - ticksOld / tickWindow);

      // Determine team color
      const teamColor = shooter.team === 3 ? "#79ADDE" : "#FFA336"; // CT blue, T orange

      newTrails.push({
        fromX: shooterPos.x,
        fromY: shooterPos.y,
        toX: endX,
        toY: endY,
        teamColor,
        startTick: event.tick,
        opacity
      });
    }

    setBulletTrails(newTrails);
  }, [currentTick, demoData.events, demoData.tickRate]);

  // Update flashbang trails based on current tick
  useEffect(() => {
    if (!demoData.events) return;

    // Find flashbang_detonate events
    const flashbangDetonations = demoData.events.filter(
      (e) => e.eventType === "flashbang_detonate"
    );

    // Create flashbang trails for each throw
    const newTrails: Array<{
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      teamColor: string;
      startTick: number;
      detonateTick: number;
      opacity: number;
    }> = [];

    for (const detonationEvent of flashbangDetonations) {
      const detonateTick = detonationEvent.tick;

      // Only show if:
      // 1. It's been thrown (before or at current tick)
      // 2. Show trail during flight + 2 seconds after detonation
      const tickWindow = Math.floor(demoData.tickRate * 2); // 2 seconds after pop
      const throwerSteamid = detonationEvent.data.steamid;

      // Find the weapon_fire event (throw) for this flashbang
      // Look backwards from detonation (grenades fly for ~1-3 seconds)
      const maxFlightTime = demoData.tickRate * 5; // Max 5 seconds flight
      const throwEvent = demoData.events.find(
        (e) =>
          e.eventType === "weapon_fire" &&
          e.data.steamid === throwerSteamid &&
          (e.data.weapon || "").toLowerCase().includes("flashbang") &&
          e.tick <= detonateTick &&
          e.tick >= detonateTick - maxFlightTime
      );

      // Get thrower position at throw time (or detonation time if no throw found)
      const throwTick = throwEvent ? throwEvent.tick : detonateTick;

      // Only show if within time window: from throw to 2 seconds after detonation
      if (currentTick < throwTick || currentTick > detonateTick + tickWindow) {
        continue;
      }

      const tickData = interpolatePlayerData(throwTick);
      const thrower = tickData.find((p) => p.steamid === throwerSteamid);

      if (!thrower) continue;

      // Convert positions to radar coordinates
      const throwerPos = gameToRadar(thrower.x, thrower.y);
      const detonationPos = gameToRadar(
        detonationEvent.data.x,
        detonationEvent.data.y
      );

      // Calculate opacity:
      // - Full opacity during flight
      // - Fade out after detonation
      let opacity = 1.0;
      if (currentTick > detonateTick) {
        const ticksSinceDetonation = currentTick - detonateTick;
        opacity = Math.max(0, 1 - ticksSinceDetonation / tickWindow);
      }

      // Determine team color
      const teamColor = thrower.team === 3 ? "#79ADDE" : "#FFA336"; // CT blue, T orange

      newTrails.push({
        fromX: throwerPos.x,
        fromY: throwerPos.y,
        toX: detonationPos.x,
        toY: detonationPos.y,
        teamColor,
        startTick: throwTick,
        detonateTick: detonateTick,
        opacity
      });
    }

    setFlashbangTrails(newTrails);
  }, [currentTick, demoData.events, demoData.tickRate]);

  // Update smoke trails based on current tick
  useEffect(() => {
    if (!demoData.events) return;

    // Smokes last ~18 seconds in CS2
    const smokeDetonations = demoData.events.filter(
      (e) => e.eventType === "smoke_detonate"
    );

    const newTrails: Array<{
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      teamColor: string;
      startTick: number;
      detonateTick: number;
      opacity: number;
    }> = [];

    for (const detonationEvent of smokeDetonations) {
      const detonateTick = detonationEvent.tick;
      const tickWindow = Math.floor(demoData.tickRate * 20); // 20 seconds after landing
      const throwerSteamid = detonationEvent.data.steamid;

      // Find the throw event
      const maxFlightTime = demoData.tickRate * 5;
      const throwEvent = demoData.events.find(
        (e) =>
          e.eventType === "weapon_fire" &&
          e.data.steamid === throwerSteamid &&
          (e.data.weapon || "").toLowerCase().includes("smoke") &&
          e.tick <= detonateTick &&
          e.tick >= detonateTick - maxFlightTime
      );

      const throwTick = throwEvent ? throwEvent.tick : detonateTick;

      // Only show from throw to 20 seconds after detonation
      if (currentTick < throwTick || currentTick > detonateTick + tickWindow) {
        continue;
      }

      const tickData = interpolatePlayerData(throwTick);
      const thrower = tickData.find((p) => p.steamid === throwerSteamid);

      if (!thrower) continue;

      const throwerPos = gameToRadar(thrower.x, thrower.y);
      const detonationPos = gameToRadar(
        detonationEvent.data.x,
        detonationEvent.data.y
      );

      // Full opacity during flight and for first 15 seconds, then fade
      let opacity = 1.0;
      if (currentTick > detonateTick) {
        const ticksSinceDetonation = currentTick - detonateTick;
        const fadeStartTicks = demoData.tickRate * 15; // Start fading after 15 seconds
        if (ticksSinceDetonation > fadeStartTicks) {
          opacity = Math.max(
            0,
            1 -
              (ticksSinceDetonation - fadeStartTicks) /
                (tickWindow - fadeStartTicks)
          );
        }
      }

      const teamColor = thrower.team === 3 ? "#79ADDE" : "#FFA336";

      newTrails.push({
        fromX: throwerPos.x,
        fromY: throwerPos.y,
        toX: detonationPos.x,
        toY: detonationPos.y,
        teamColor,
        startTick: throwTick,
        detonateTick: detonateTick,
        opacity
      });
    }

    setSmokeTrails(newTrails);
  }, [currentTick, demoData.events, demoData.tickRate]);

  // Update molotov trails based on current tick
  useEffect(() => {
    if (!demoData.events) return;

    // Molotovs burn for ~7 seconds
    const molotovStarts = demoData.events.filter(
      (e) => e.eventType === "molotov_start"
    );

    const newTrails: Array<{
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      teamColor: string;
      startTick: number;
      detonateTick: number;
      opacity: number;
    }> = [];

    for (const startEvent of molotovStarts) {
      const detonateTick = startEvent.tick;
      const tickWindow = Math.floor(demoData.tickRate * 10); // 10 seconds after landing
      const throwerSteamid = startEvent.data.steamid;

      // Find the throw event
      const maxFlightTime = demoData.tickRate * 5;
      const throwEvent = demoData.events.find(
        (e) =>
          e.eventType === "weapon_fire" &&
          e.data.steamid === throwerSteamid &&
          ((e.data.weapon || "").toLowerCase().includes("molotov") ||
            (e.data.weapon || "").toLowerCase().includes("incendiary")) &&
          e.tick <= detonateTick &&
          e.tick >= detonateTick - maxFlightTime
      );

      const throwTick = throwEvent ? throwEvent.tick : detonateTick;

      // Only show from throw to 10 seconds after detonation
      if (currentTick < throwTick || currentTick > detonateTick + tickWindow) {
        continue;
      }

      const tickData = interpolatePlayerData(throwTick);
      const thrower = tickData.find((p) => p.steamid === throwerSteamid);

      if (!thrower) continue;

      const throwerPos = gameToRadar(thrower.x, thrower.y);
      const detonationPos = gameToRadar(startEvent.data.x, startEvent.data.y);

      // Full opacity during flight and burn, fade at the end
      let opacity = 1.0;
      if (currentTick > detonateTick) {
        const ticksSinceLanding = currentTick - detonateTick;
        const fadeStartTicks = demoData.tickRate * 7; // Start fading after 7 seconds
        if (ticksSinceLanding > fadeStartTicks) {
          opacity = Math.max(
            0,
            1 -
              (ticksSinceLanding - fadeStartTicks) /
                (tickWindow - fadeStartTicks)
          );
        }
      }

      const teamColor = thrower.team === 3 ? "#79ADDE" : "#FFA336";

      newTrails.push({
        fromX: throwerPos.x,
        fromY: throwerPos.y,
        toX: detonationPos.x,
        toY: detonationPos.y,
        teamColor,
        startTick: throwTick,
        detonateTick: detonateTick,
        opacity
      });
    }

    setMolotovTrails(newTrails);
  }, [currentTick, demoData.events, demoData.tickRate]);

  // Update HE grenade trails based on current tick
  useEffect(() => {
    if (!demoData.events) return;

    // HE grenades explode instantly (quick explosion effect)
    const heDetonations = demoData.events.filter(
      (e) => e.eventType === "he_detonate"
    );

    const newTrails: Array<{
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      teamColor: string;
      startTick: number;
      detonateTick: number;
      opacity: number;
    }> = [];

    for (const detonationEvent of heDetonations) {
      const detonateTick = detonationEvent.tick;
      const tickWindow = Math.floor(demoData.tickRate * 3); // 3 seconds after explosion
      const throwerSteamid = detonationEvent.data.steamid;

      // Find the throw event
      const maxFlightTime = demoData.tickRate * 5;
      const throwEvent = demoData.events.find(
        (e) =>
          e.eventType === "weapon_fire" &&
          e.data.steamid === throwerSteamid &&
          ((e.data.weapon || "").toLowerCase().includes("he") ||
            (e.data.weapon || "").toLowerCase().includes("hegrenade")) &&
          e.tick <= detonateTick &&
          e.tick >= detonateTick - maxFlightTime
      );

      const throwTick = throwEvent ? throwEvent.tick : detonateTick;

      // Only show from throw to 3 seconds after detonation
      if (currentTick < throwTick || currentTick > detonateTick + tickWindow) {
        continue;
      }

      const tickData = interpolatePlayerData(throwTick);
      const thrower = tickData.find((p) => p.steamid === throwerSteamid);

      if (!thrower) continue;

      const throwerPos = gameToRadar(thrower.x, thrower.y);
      const detonationPos = gameToRadar(
        detonationEvent.data.x,
        detonationEvent.data.y
      );

      // Full opacity during flight and brief explosion, then fade quickly
      let opacity = 1.0;
      if (currentTick > detonateTick) {
        const ticksSinceExplosion = currentTick - detonateTick;
        const fadeStartTicks = demoData.tickRate * 0.5; // Start fading after 0.5 seconds
        if (ticksSinceExplosion > fadeStartTicks) {
          opacity = Math.max(
            0,
            1 -
              (ticksSinceExplosion - fadeStartTicks) /
                (tickWindow - fadeStartTicks)
          );
        }
      }

      const teamColor = thrower.team === 3 ? "#79ADDE" : "#FFA336";

      newTrails.push({
        fromX: throwerPos.x,
        fromY: throwerPos.y,
        toX: detonationPos.x,
        toY: detonationPos.y,
        teamColor,
        startTick: throwTick,
        detonateTick: detonateTick,
        opacity
      });
    }

    setHeTrails(newTrails);
  }, [currentTick, demoData.events, demoData.tickRate]);

  // Update fire particles for molotovs
  useEffect(() => {
    if (!demoData.events) return;

    const PARTICLES_PER_MOLOTOV = 40; // Number of particles per active molotov
    const PARTICLE_SPAWN_RADIUS = 20 / scale; // Tighter spread radius
    const PARTICLE_LIFETIME = demoData.tickRate * 0.5; // Shorter lifetime for faster churn

    // Find active molotovs (currently burning)
    const activeMolotovs = molotovTrails.filter((trail) => {
      const hasDetonated = currentTick >= trail.detonateTick;
      const stillBurning =
        currentTick < trail.detonateTick + demoData.tickRate * 10;
      return hasDetonated && stillBurning && trail.opacity > 0;
    });

    // Generate new particles for active molotovs
    const newParticles: FireParticle[] = [];

    activeMolotovs.forEach((molotov) => {
      const molotovId = `${molotov.toX}-${molotov.toY}-${molotov.detonateTick}`;

      // Generate particles for this molotov
      for (let i = 0; i < PARTICLES_PER_MOLOTOV; i++) {
        // Random position within burn area
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * PARTICLE_SPAWN_RADIUS;
        const x = molotov.toX + Math.cos(angle) * distance;
        const y = molotov.toY + Math.sin(angle) * distance;

        // Random velocity - mostly horizontal spread, minimal upward
        const vx = (Math.random() - 0.5) * 0.5; // More horizontal movement
        const vy = (Math.random() - 0.5) * 0.2 - 0.05; // Very slight upward, mostly horizontal

        // Random lifetime
        const maxLife = PARTICLE_LIFETIME * (0.5 + Math.random() * 0.5);
        const life = Math.random() * maxLife; // Stagger particle ages

        // Random size - varied for flickering effect
        const size = 2 + Math.random() * 3;

        // Random fire color - bright yellow/orange like flames, not lava
        const colorChoice = Math.random();
        let color: string;
        if (colorChoice < 0.35) {
          color = "#FFD700"; // Gold/yellow
        } else if (colorChoice < 0.65) {
          color = "#FFC000"; // Bright yellow-orange
        } else if (colorChoice < 0.85) {
          color = "#FFB300"; // Lighter orange
        } else {
          color = "#FFEB3B"; // Bright yellow
        }

        newParticles.push({
          x,
          y,
          vx,
          vy,
          life,
          maxLife,
          size,
          color,
          opacity: 1.0,
          molotovId
        });
      }
    });

    // Update existing particles using functional state update
    setFireParticles((currentParticles) => {
      const updatedParticles = currentParticles
        .map((particle) => {
          // Decrease life
          const newLife = particle.life - 1;

          // Update position
          const newX = particle.x + particle.vx;
          const newY = particle.y + particle.vy;

          // Update velocity - deceleration with turbulence (flickering)
          const turbulence = (Math.random() - 0.5) * 0.05;
          const newVx = particle.vx * 0.95 + turbulence;
          const newVy = particle.vy * 0.95 + turbulence * 0.5; // Chaotic movement

          // Calculate opacity based on life remaining
          const lifeRatio = newLife / particle.maxLife;
          const newOpacity = Math.max(0, Math.min(1, lifeRatio));

          // Update size (grow slightly then shrink)
          const newSize =
            particle.size * (1 + Math.sin(lifeRatio * Math.PI) * 0.1);

          return {
            ...particle,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            life: newLife,
            opacity: newOpacity,
            size: newSize
          };
        })
        .filter((p) => p.life > 0); // Remove dead particles

      // Combine updated particles with new ones
      return [...updatedParticles, ...newParticles];
    });
  }, [currentTick, molotovTrails, demoData.tickRate, scale]);

  // Track flash durations - STRICT: once set, only counts down, NEVER up
  useEffect(() => {
    const SAMPLE_INTERVAL = 16;

    // Find closest tick in our data
    let closestTick: DemoTick | undefined = undefined;
    let minDiff = Infinity;

    for (const t of demoData.ticks) {
      const diff = Math.abs(t.tick - currentTick);
      if (diff < minDiff) {
        minDiff = diff;
        closestTick = t;
      }
      if (t.tick > currentTick + SAMPLE_INTERVAL) break;
    }

    if (!closestTick) return;

    // Start with existing flashes - preserve them by default
    const newActiveFlashes = new Map();

    // Use functional state update to get current flashes without dependency
    setActiveFlashes((currentFlashes) => {
      currentFlashes.forEach((flash, steamid) => {
        // REWIND DETECTION: If flash started in the future, remove it
        if (flash.startTick > currentTick) {
          return; // Skip this flash - it hasn't happened yet
        }
        newActiveFlashes.set(steamid, flash);
      });

      return currentFlashes; // Return current for now, will update at end
    });

    // Scan for NEW flashes ONLY (not updates to existing ones)
    closestTick.players.forEach((player) => {
      const sampledFlashDuration = player.flashDuration || 0;
      const existingFlash = newActiveFlashes.get(player.steamid);

      if (sampledFlashDuration > 0 && !existingFlash) {
        // Brand new flash
        newActiveFlashes.set(player.steamid, {
          startTick: closestTick?.tick ?? 0,
          startDuration: sampledFlashDuration
        });
      } else if (sampledFlashDuration > 0 && existingFlash) {
        // Has existing flash - check if this is a RE-FLASH
        const elapsedSeconds =
          (currentTick - existingFlash.startTick) / demoData.tickRate;
        const calculatedRemaining = Math.max(
          0,
          existingFlash.startDuration - elapsedSeconds
        );

        // STRICT: Only accept as NEW flash if:
        // 1. We're at a sampled tick (not interpolated)
        // 2. Sampled is MUCH higher than calculated (> 2.0s difference)
        const atSampledTick =
          Math.abs(closestTick?.tick ?? 0 - currentTick) < 2;
        if (atSampledTick && sampledFlashDuration > calculatedRemaining + 2.0) {
          newActiveFlashes.set(player.steamid, {
            startTick: closestTick?.tick ?? 0,
            startDuration: sampledFlashDuration
          });
        }
        // Otherwise: DO NOTHING - keep existing flash unchanged
      }
    });

    // Clean up expired flashes OR flashes that are too far in the past
    const toDelete: string[] = [];
    newActiveFlashes.forEach((flash, steamid) => {
      const elapsedSeconds =
        (currentTick - flash.startTick) / demoData.tickRate;
      const calculatedRemaining = Math.max(
        0,
        flash.startDuration - elapsedSeconds
      );

      // Remove if expired OR if flash ended more than 1 second ago (helps with rewinds)
      if (
        calculatedRemaining <= 0 ||
        elapsedSeconds > flash.startDuration + 1
      ) {
        toDelete.push(steamid);
      }
    });
    toDelete.forEach((steamid) => newActiveFlashes.delete(steamid));

    setActiveFlashes(newActiveFlashes);
  }, [currentTick, demoData.ticks, demoData.tickRate]);

  // Convert degrees to radians
  const degreesToRadians = (degrees: number) => {
    return (degrees * Math.PI) / 180;
  };

  // Convert game coordinates to radar coordinates
  // Formula from cs-demo-manager: getScaledCoordinateX/Y
  // X: (x - posX) / scale
  // Y: (posY - y) / scale  <- Note: posY - y, not y - posY!
  const gameToRadar = (x: number, y: number) => {
    const { offset, resolution, width } = demoData.mapData;

    // Calculate coordinates using cs-demo-manager's formula
    const xForDefaultRadarWidth = (x - offset.x) / resolution;
    const yForDefaultRadarHeight = (offset.y - y) / resolution;

    // Scale to actual radar image size (1024px)
    const scaledX = (xForDefaultRadarWidth * width) / 1024;
    const scaledY = (yForDefaultRadarHeight * width) / 1024;

    return { x: scaledX, y: scaledY };
  };

  // Linear interpolation between two tick data
  const interpolatePlayerData = (tick: number): Player[] => {
    // Find the two ticks to interpolate between
    let prevTickData = demoData.ticks[0]!;
    let nextTickData = demoData.ticks[0]!;

    for (let i = 0; i < demoData.ticks.length - 1; i++) {
      const currentTick = demoData.ticks[i];
      const nextTick = demoData.ticks[i + 1];
      if (
        currentTick &&
        nextTick &&
        currentTick.tick <= tick &&
        nextTick.tick >= tick
      ) {
        prevTickData = currentTick;
        nextTickData = nextTick;
        break;
      }
    }

    // If we're past the last tick, just return the last tick's data
    if (tick >= maxTick) {
      return demoData.ticks[demoData.ticks.length - 1]?.players || [];
    }

    // If we're before the first tick, return the first tick's data
    if (tick <= minTick) {
      return demoData.ticks[0]?.players || [];
    }

    // Interpolation factor (0 to 1)
    const tickDiff = nextTickData.tick - prevTickData.tick;
    const factor = tickDiff === 0 ? 0 : (tick - prevTickData.tick) / tickDiff;

    // Interpolate each player's position
    const interpolatedPlayers: Player[] = [];

    prevTickData.players.forEach((prevPlayer) => {
      const nextPlayer = nextTickData.players.find(
        (p) => p.steamid === prevPlayer.steamid
      );

      if (nextPlayer) {
        interpolatedPlayers.push({
          steamid: prevPlayer.steamid,
          name: prevPlayer.name,
          team: prevPlayer.team,
          x: prevPlayer.x + (nextPlayer.x - prevPlayer.x) * factor,
          y: prevPlayer.y + (nextPlayer.y - prevPlayer.y) * factor,
          health: Math.round(
            prevPlayer.health + (nextPlayer.health - prevPlayer.health) * factor
          ),
          // Pass through enhanced fields (no interpolation for angles/booleans)
          yaw: prevPlayer.yaw,
          pitch: prevPlayer.pitch,
          z: prevPlayer.z,
          armor: prevPlayer.armor,
          hasHelmet: prevPlayer.hasHelmet,
          hasDefuser: prevPlayer.hasDefuser,
          money: prevPlayer.money,
          equipValue: prevPlayer.equipValue,
          flashDuration:
            (prevPlayer.flashDuration || 0) +
            ((nextPlayer.flashDuration || 0) -
              (prevPlayer.flashDuration || 0)) *
              factor,
          isDefusing: prevPlayer.isDefusing,
          isPlanting: prevPlayer.isPlanting,
          isScoped: prevPlayer.isScoped,
          isWalking: prevPlayer.isWalking,
          isDucking: prevPlayer.isDucking,
          activeWeapon: prevPlayer.activeWeapon,
          // K/A/D stats (no interpolation, use previous tick's value)
          kills: prevPlayer.kills,
          assists: prevPlayer.assists,
          deaths: prevPlayer.deaths
        });
      } else {
        interpolatedPlayers.push(prevPlayer);
      }
    });

    return interpolatedPlayers;
  };

  // Draw the canvas
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context state
    ctx.save();

    // Apply transformations (pan and zoom)
    // Center the map in the viewport
    const { width, height } = demoData.mapData;
    ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2, -height / 2); // Center the map at origin

    // Draw map image or fallback to dark rectangle
    if (mapImage) {
      ctx.drawImage(mapImage, 0, 0, width, height);
    } else {
      // Fallback if map image hasn't loaded yet
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, width, height);
    }

    // Draw grid
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1 / scale;
    const gridSize = 256;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Get player data for current tick
    const players = interpolatePlayerData(currentTick);

    // Draw bullet trails first (behind players)
    bulletTrails.forEach((trail) => {
      // Trail coordinates are already in radar space, no conversion needed
      const from = { x: trail.fromX, y: trail.fromY };
      const to = { x: trail.toX, y: trail.toY };

      // Create gradient for trail effect
      const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
      gradient.addColorStop(0, trail.teamColor);
      gradient.addColorStop(0.3, trail.teamColor + "80"); // Semi-transparent
      gradient.addColorStop(1, trail.teamColor + "00"); // Fully transparent

      ctx.save();
      ctx.globalAlpha = trail.opacity;
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2 / scale;
      ctx.lineCap = "round";

      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.restore();
    });

    // Draw flashbang trajectories and flying grenades
    flashbangTrails.forEach((trail) => {
      const from = { x: trail.fromX, y: trail.fromY };
      const to = { x: trail.toX, y: trail.toY };
      const isInFlight =
        currentTick >= trail.startTick && currentTick < trail.detonateTick;
      const hasDetonated = currentTick >= trail.detonateTick;

      // Skip if completely faded out
      if (!isInFlight && trail.opacity <= 0) return;

      // Calculate arc parameters
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const arcHeight = distance * 0.15;
      const perpX = -dy / distance;
      const perpY = dx / distance;
      const controlX = midX + perpX * arcHeight;
      const controlY = midY + perpY * arcHeight;

      // Function to get position along quadratic curve at time t (0 to 1)
      const getPointOnCurve = (t: number) => {
        const x =
          (1 - t) * (1 - t) * from.x +
          2 * (1 - t) * t * controlX +
          t * t * to.x;
        const y =
          (1 - t) * (1 - t) * from.y +
          2 * (1 - t) * t * controlY +
          t * t * to.y;
        return { x, y };
      };

      if (isInFlight) {
        // Show trajectory line up to current position
        const flightProgress = Math.max(
          0,
          Math.min(
            1,
            (currentTick - trail.startTick) /
              (trail.detonateTick - trail.startTick)
          )
        );
        const currentPos = getPointOnCurve(flightProgress);

        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = trail.teamColor;
        ctx.lineWidth = 2 / scale;
        ctx.setLineDash([5 / scale, 5 / scale]);

        // Draw partial trajectory up to current position
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(controlX, controlY, currentPos.x, currentPos.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Draw flying flashbang
        const grenadeSize = 5 / scale;
        ctx.save();
        ctx.fillStyle = trail.teamColor;
        ctx.shadowColor = trail.teamColor;
        ctx.shadowBlur = 8 / scale;
        ctx.beginPath();
        ctx.arc(currentPos.x, currentPos.y, grenadeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (hasDetonated) {
        // Draw full trajectory (faded)
        ctx.save();
        ctx.globalAlpha = trail.opacity * 0.3;
        ctx.strokeStyle = trail.teamColor;
        ctx.lineWidth = 1 / scale;
        ctx.setLineDash([5 / scale, 5 / scale]);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(controlX, controlY, to.x, to.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Draw flashbang pop image at detonation point
        if (flashbangImage) {
          const imgSize = 24 / scale;
          ctx.save();
          ctx.globalAlpha = trail.opacity;
          ctx.drawImage(
            flashbangImage,
            to.x - imgSize / 2,
            to.y - imgSize / 2,
            imgSize,
            imgSize
          );
          ctx.restore();
        }
      }
    });

    // Draw smoke trajectories and clouds
    smokeTrails.forEach((trail) => {
      const from = { x: trail.fromX, y: trail.fromY };
      const to = { x: trail.toX, y: trail.toY };
      const isInFlight =
        currentTick >= trail.startTick && currentTick < trail.detonateTick;
      const hasDetonated = currentTick >= trail.detonateTick;

      // Skip if completely faded out
      if (!isInFlight && trail.opacity <= 0) return;

      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const arcHeight = distance * 0.15;
      const perpX = -dy / distance;
      const perpY = dx / distance;
      const controlX = midX + perpX * arcHeight;
      const controlY = midY + perpY * arcHeight;

      const getPointOnCurve = (t: number) => {
        const x =
          (1 - t) * (1 - t) * from.x +
          2 * (1 - t) * t * controlX +
          t * t * to.x;
        const y =
          (1 - t) * (1 - t) * from.y +
          2 * (1 - t) * t * controlY +
          t * t * to.y;
        return { x, y };
      };

      if (isInFlight) {
        const flightProgress = Math.max(
          0,
          Math.min(
            1,
            (currentTick - trail.startTick) /
              (trail.detonateTick - trail.startTick)
          )
        );
        const currentPos = getPointOnCurve(flightProgress);

        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = trail.teamColor;
        ctx.lineWidth = 2 / scale;
        ctx.setLineDash([5 / scale, 5 / scale]);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(controlX, controlY, currentPos.x, currentPos.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Draw flying smoke grenade
        const grenadeSize = 5 / scale;
        ctx.save();
        ctx.fillStyle = trail.teamColor;
        ctx.shadowColor = trail.teamColor;
        ctx.shadowBlur = 8 / scale;
        ctx.beginPath();
        ctx.arc(currentPos.x, currentPos.y, grenadeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (hasDetonated) {
        // Draw faded trajectory
        ctx.save();
        ctx.globalAlpha = trail.opacity * 0.2;
        ctx.strokeStyle = trail.teamColor;
        ctx.lineWidth = 1 / scale;
        ctx.setLineDash([5 / scale, 5 / scale]);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(controlX, controlY, to.x, to.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Draw smoke cloud
        if (smokeImage) {
          const imgSize = 70 / scale;
          ctx.save();
          ctx.globalAlpha = Math.min(trail.opacity, 0.8);
          ctx.drawImage(
            smokeImage,
            to.x - imgSize / 2,
            to.y - imgSize / 2,
            imgSize,
            imgSize
          );
          ctx.restore();
        }
      }
    });

    // Draw molotov trajectories and fire
    molotovTrails.forEach((trail) => {
      const from = { x: trail.fromX, y: trail.fromY };
      const to = { x: trail.toX, y: trail.toY };
      const isInFlight =
        currentTick >= trail.startTick && currentTick < trail.detonateTick;
      const hasDetonated = currentTick >= trail.detonateTick;

      // Skip if completely faded out
      if (!isInFlight && trail.opacity <= 0) return;

      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const arcHeight = distance * 0.15;
      const perpX = -dy / distance;
      const perpY = dx / distance;
      const controlX = midX + perpX * arcHeight;
      const controlY = midY + perpY * arcHeight;

      const getPointOnCurve = (t: number) => {
        const x =
          (1 - t) * (1 - t) * from.x +
          2 * (1 - t) * t * controlX +
          t * t * to.x;
        const y =
          (1 - t) * (1 - t) * from.y +
          2 * (1 - t) * t * controlY +
          t * t * to.y;
        return { x, y };
      };

      if (isInFlight) {
        const flightProgress = Math.max(
          0,
          Math.min(
            1,
            (currentTick - trail.startTick) /
              (trail.detonateTick - trail.startTick)
          )
        );
        const currentPos = getPointOnCurve(flightProgress);

        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = trail.teamColor;
        ctx.lineWidth = 2 / scale;
        ctx.setLineDash([5 / scale, 5 / scale]);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(controlX, controlY, currentPos.x, currentPos.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Draw flying molotov
        const grenadeSize = 5 / scale;
        ctx.save();
        ctx.fillStyle = trail.teamColor;
        ctx.shadowColor = trail.teamColor;
        ctx.shadowBlur = 8 / scale;
        ctx.beginPath();
        ctx.arc(currentPos.x, currentPos.y, grenadeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (hasDetonated) {
        // Draw faded trajectory
        ctx.save();
        ctx.globalAlpha = trail.opacity * 0.3;
        ctx.strokeStyle = trail.teamColor;
        ctx.lineWidth = 1 / scale;
        ctx.setLineDash([5 / scale, 5 / scale]);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(controlX, controlY, to.x, to.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Fire particles are now rendered separately below
        // No longer using static molotov image
      }
    });

    // Draw fire particles for molotovs
    fireParticles.forEach((particle) => {
      ctx.save();
      ctx.globalAlpha = particle.opacity;

      // Draw particle with glow effect - tighter glow for fire
      const gradient = ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        (particle.size * 1.2) / scale
      );
      gradient.addColorStop(0, particle.color);
      gradient.addColorStop(0.3, particle.color + "CC"); // Less transparent
      gradient.addColorStop(0.7, particle.color + "66"); // Semi-transparent
      gradient.addColorStop(1, particle.color + "00"); // Fully transparent

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(
        particle.x,
        particle.y,
        (particle.size * 1.2) / scale,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Add bright white-yellow core for hot center
      const lifeRatio = particle.life / particle.maxLife;
      if (lifeRatio > 0.3) {
        // Only show core when particle is young
        ctx.globalAlpha = particle.opacity * 0.8;
        ctx.fillStyle = "#FFF9E6"; // Almost white-yellow core (hottest part)
        ctx.beginPath();
        ctx.arc(
          particle.x,
          particle.y,
          (particle.size * 0.35) / scale,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      ctx.restore();
    });

    // Draw HE grenade trajectories and explosions
    heTrails.forEach((trail) => {
      const from = { x: trail.fromX, y: trail.fromY };
      const to = { x: trail.toX, y: trail.toY };
      const isInFlight =
        currentTick >= trail.startTick && currentTick < trail.detonateTick;
      const hasDetonated = currentTick >= trail.detonateTick;

      // Skip if completely faded out
      if (!isInFlight && trail.opacity <= 0) return;

      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const arcHeight = distance * 0.15;
      const perpX = -dy / distance;
      const perpY = dx / distance;
      const controlX = midX + perpX * arcHeight;
      const controlY = midY + perpY * arcHeight;

      const getPointOnCurve = (t: number) => {
        const x =
          (1 - t) * (1 - t) * from.x +
          2 * (1 - t) * t * controlX +
          t * t * to.x;
        const y =
          (1 - t) * (1 - t) * from.y +
          2 * (1 - t) * t * controlY +
          t * t * to.y;
        return { x, y };
      };

      if (isInFlight) {
        const flightProgress = Math.max(
          0,
          Math.min(
            1,
            (currentTick - trail.startTick) /
              (trail.detonateTick - trail.startTick)
          )
        );
        const currentPos = getPointOnCurve(flightProgress);

        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = trail.teamColor;
        ctx.lineWidth = 2 / scale;
        ctx.setLineDash([5 / scale, 5 / scale]);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(controlX, controlY, currentPos.x, currentPos.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Draw flying HE grenade
        const grenadeSize = 5 / scale;
        ctx.save();
        ctx.fillStyle = trail.teamColor;
        ctx.shadowColor = trail.teamColor;
        ctx.shadowBlur = 8 / scale;
        ctx.beginPath();
        ctx.arc(currentPos.x, currentPos.y, grenadeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (hasDetonated) {
        // Draw faded trajectory
        ctx.save();
        ctx.globalAlpha = trail.opacity * 0.3;
        ctx.strokeStyle = trail.teamColor;
        ctx.lineWidth = 1 / scale;
        ctx.setLineDash([5 / scale, 5 / scale]);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.quadraticCurveTo(controlX, controlY, to.x, to.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Draw HE explosion effect
        if (heImage) {
          const imgSize = 40 / scale;
          ctx.save();
          ctx.globalAlpha = trail.opacity;
          ctx.drawImage(
            heImage,
            to.x - imgSize / 2,
            to.y - imgSize / 2,
            imgSize,
            imgSize
          );
          ctx.restore();
        }
      }
    });

    // Draw players
    players.forEach((player) => {
      const pos = gameToRadar(player.x, player.y);
      const isDead = (player.health || 0) <= 0;

      // Determine color based on team
      let xColor = "#888";

      if (player.team === 2) {
        // T - orange/yellow
        xColor = "#FFD150";
      } else if (player.team === 3) {
        // CT - blue
        xColor = "#79ADDE";
      }

      const playerRadius = 8 / scale;

      if (isDead) {
        // Dead players: Just draw a colored X (no circle)
        const xSize = playerRadius * 1.2; // Larger X since no circle
        ctx.strokeStyle = xColor;
        ctx.lineWidth = 3 / scale; // Thicker X

        // Draw X
        ctx.beginPath();
        ctx.moveTo(pos.x - xSize, pos.y - xSize);
        ctx.lineTo(pos.x + xSize, pos.y + xSize);
        ctx.moveTo(pos.x + xSize, pos.y - xSize);
        ctx.lineTo(pos.x - xSize, pos.y + xSize);
        ctx.stroke();
      } else {
        // Alive players: Draw normal circle
        let fillColor = "#888";
        let strokeColor = "#fff";

        if (player.team === 2) {
          fillColor = "#FFA336";
          strokeColor = "#FFD150";
        } else if (player.team === 3) {
          fillColor = "#2F5C92";
          strokeColor = "#79ADDE";
        }

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, playerRadius, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
      }

      // Draw flash indicator (countdown pie chart) for flashed players
      const flashData = activeFlashes.get(player.steamid);
      if (!isDead && flashData) {
        // Calculate remaining flash duration based on elapsed time
        const elapsedTicks = currentTick - flashData.startTick;
        const elapsedSeconds = elapsedTicks / demoData.tickRate;
        const remainingDuration = Math.max(
          0,
          flashData.startDuration - elapsedSeconds
        );

        // Calculate intensity as percentage of THIS flash's duration (not a fixed max)
        // This ensures the indicator properly shows the countdown regardless of flash strength
        const flashIntensity =
          flashData.startDuration > 0
            ? Math.max(
                0,
                Math.min(1, remainingDuration / flashData.startDuration)
              )
            : 0;

        const flashRadius = playerRadius + 5 / scale;

        // Calculate arc angles for countdown effect
        // Start from top (12 o'clock = -π/2) and sweep clockwise based on remaining duration
        const startAngle = -Math.PI / 2; // 12 o'clock position
        const sweepAmount = flashIntensity * 2 * Math.PI; // Full circle at max flash
        const endAngle = startAngle + sweepAmount;

        // Calculate opacity based on flash intensity (fades as flash wears off)
        // More aggressive fade for better visibility of the countdown
        const baseOpacity = 0.5 + flashIntensity * 0.5; // 0.5 to 1.0

        ctx.save();

        // Draw the countdown arc (thicker, solid)
        ctx.globalAlpha = baseOpacity;
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 6 / scale; // Thick arc
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, flashRadius, startAngle, endAngle, false);
        ctx.stroke();

        // Add outer glow effect (same arc, wider and more transparent)
        ctx.globalAlpha = baseOpacity * 0.5;
        ctx.lineWidth = 10 / scale;
        ctx.beginPath();
        ctx.arc(
          pos.x,
          pos.y,
          flashRadius + 2 / scale,
          startAngle,
          endAngle,
          false
        );
        ctx.stroke();

        // Add inner glow (slightly inside, for depth)
        ctx.globalAlpha = baseOpacity * 0.35;
        ctx.lineWidth = 8 / scale;
        ctx.beginPath();
        ctx.arc(
          pos.x,
          pos.y,
          flashRadius - 2 / scale,
          startAngle,
          endAngle,
          false
        );
        ctx.stroke();

        ctx.restore();
      }

      // Draw view direction line (starts OUTSIDE the circle) - only for alive players
      if (!isDead && player.yaw !== undefined) {
        const angle = -degreesToRadians(player.yaw);
        const lineLength = player.isScoped ? 15 : 10; // Line length OUTSIDE circle

        // Start point: at the edge of the circle
        const startX = pos.x + playerRadius * Math.cos(angle);
        const startY = pos.y + playerRadius * Math.sin(angle);

        // End point: lineLength pixels beyond the circle edge
        const endX = pos.x + (playerRadius + lineLength) * Math.cos(angle);
        const endY = pos.y + (playerRadius + lineLength) * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2 / scale;
        ctx.stroke();
      }

      // Draw player name above (only for alive players)
      if (!isDead) {
        ctx.fillStyle = "#fff";
        ctx.font = `${Math.max(12, 14 / scale)}px Arial`;
        ctx.textAlign = "center";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.strokeText(player.name, pos.x, pos.y - 12 / scale);
        ctx.fillText(player.name, pos.x, pos.y - 12 / scale);
      }
    });

    // Restore context state
    ctx.restore();

    // Draw UI info (in screen space)
    ctx.fillStyle = "#fff";
    ctx.font = "14px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`Tick: ${currentTick.toFixed(1)} / ${maxTick}`, 10, 20);
    ctx.fillText(
      `Time: ${(currentTick / demoData.tickRate).toFixed(1)}s`,
      10,
      40
    );
    ctx.fillText(`Zoom: ${(scale * 100).toFixed(0)}%`, 10, 60);
    ctx.fillText(`Speed: ${playbackSpeed}x`, 10, 80);
  };

  // Animation loop
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      if (isPlaying) {
        const tickIncrement =
          (deltaTime / 1000) * demoData.tickRate * playbackSpeed;
        setCurrentTick((prev) => {
          const newTick = prev + tickIncrement;
          if (newTick >= maxTick) {
            setIsPlaying(false);
            return maxTick;
          }
          return newTick;
        });
      }

      draw();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    isPlaying,
    playbackSpeed,
    scale,
    pan,
    mapImage,
    bulletTrails,
    flashbangTrails,
    smokeTrails,
    molotovTrails,
    heTrails,
    fireParticles,
    activeFlashes
  ]);

  // Initialize canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Mouse handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;

    setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setScale((prev) => Math.max(0.1, Math.min(2, prev + delta)));
  };

  // Get current players for scoreboard
  // Don't filter out dead players - we want to show them with gray/opacity
  const currentPlayers = interpolatePlayerData(currentTick);
  const ctPlayers = currentPlayers
    .filter((p) => p.team === 3)
    .sort((a, b) => {
      // Sort alive players first, then by health
      const aAlive = (a.health || 0) > 0 ? 1 : 0;
      const bAlive = (b.health || 0) > 0 ? 1 : 0;
      if (aAlive !== bAlive) return bAlive - aAlive;
      return (b.health || 0) - (a.health || 0);
    });
  const tPlayers = currentPlayers
    .filter((p) => p.team === 2)
    .sort((a, b) => {
      // Sort alive players first, then by health
      const aAlive = (a.health || 0) > 0 ? 1 : 0;
      const bAlive = (b.health || 0) > 0 ? 1 : 0;
      if (aAlive !== bAlive) return bAlive - aAlive;
      return (b.health || 0) - (a.health || 0);
    });

  // Find current round based on tick
  const tickRate = demoData.tickRate || 64;
  let currentRound: DemoRound | undefined = undefined;
  if (validRounds && validRounds.length > 0) {
    for (const round of validRounds) {
      if (currentTick >= round.startTick) {
        // If round has ended and we're past it, skip
        if (round.endTick && currentTick > round.endTick) {
          continue;
        }
        currentRound = round;
      } else {
        // Stop once we hit a round that hasn't started yet
        break;
      }
    }
  }

  // Calculate round time countdown (1:55 → 0:00)
  let roundMinutes = 1;
  let roundSeconds = 55;
  if (currentRound && currentRound.startTick) {
    const ticksIntoRound = currentTick - currentRound.startTick;
    const secondsIntoRound = Math.floor(ticksIntoRound / tickRate);
    const roundTimeLimit = 115; // CS2 round time is 1:55 (115 seconds)
    const timeRemaining = Math.max(0, roundTimeLimit - secondsIntoRound);
    roundMinutes = Math.floor(timeRemaining / 60);
    roundSeconds = timeRemaining % 60;
  }

  // Calculate team scores (count rounds won up to current tick)
  let ctScore = 0;
  let tScore = 0;
  if (validRounds) {
    for (const round of validRounds) {
      // Only count rounds that have ended before current tick
      if (round.endTick && currentTick >= round.endTick) {
        if (round.winner === "CT" || round.winner === 3) {
          ctScore++;
        } else if (round.winner === "T" || round.winner === 2) {
          tScore++;
        }
      }
    }
  }

  return (
    <div className={`viewer-professional ${isMobile ? "mobile-mode" : ""}`}>
      {/* Landscape Prompt for Mobile Portrait Mode */}
      {showLandscapePrompt && (
        <div className="landscape-prompt-overlay">
          <div className="landscape-prompt-content">
            <div className="rotate-icon">📱 ↻</div>
            <h2>Rotate Your Device</h2>
            <p>
              For the best viewing experience, please rotate your device to
              landscape mode.
            </p>
            <button
              className="dismiss-button"
              onClick={() => setShowLandscapePrompt(false)}
            >
              Continue Anyway
            </button>
          </div>
        </div>
      )}

      {/* Top Bar: Round Info */}
      <div className="top-bar">
        <div className="round-info">
          <div className="round-label">ROUND {currentRound?.roundNum || 1}</div>
          <div className="round-timer">
            {roundMinutes}:{roundSeconds.toString().padStart(2, "0")}
          </div>
        </div>

        {/* Round selector strip */}
        <div className="round-selector">
          {validRounds && validRounds.length > 0
            ? validRounds.map((round) => {
                // Determine if this is the active round
                const isActive = currentRound?.roundNum === round.roundNum;

                // Determine round color based on winner
                // Show winner color for ALL completed rounds (rounds that have an endTick in the data)
                const roundHasEnded =
                  round.endTick !== undefined && round.endTick !== null;
                let roundClass = "round-dot";

                // Add winner color class if round has a recorded end (meaning it was played)
                if (roundHasEnded && round.winner) {
                  if (round.winner === "CT" || round.winner === 3) {
                    roundClass += " ct-won";
                  } else if (round.winner === "T" || round.winner === 2) {
                    roundClass += " t-won";
                  }
                }

                // Add active class if this is the current round
                if (isActive) {
                  roundClass += " active";
                }
                // If round hasn't started yet, it stays grey (default)

                return (
                  <div
                    key={round.roundNum}
                    className={roundClass}
                    onClick={() => {
                      setCurrentTick(round.startTick);
                      setIsPlaying(false);
                    }}
                    style={{ cursor: "pointer" }}
                    title={`Round ${round.roundNum}${
                      roundHasEnded && round.winner
                        ? ` - ${round.winner === 3 || round.winner === "CT" ? "CT" : "T"} won`
                        : ""
                    }`}
                  >
                    {round.roundNum}
                  </div>
                );
              })
            : // Fallback to 16 rounds if no round data available
              [...Array(16)].map((_, i) => (
                <div key={i} className={`round-dot ${i === 0 ? "active" : ""}`}>
                  {i + 1}
                </div>
              ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Map Canvas */}
        <div className="map-container">
          <canvas
            ref={canvasRef}
            style={{ width: "100%", height: "100%" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          />

          {/* Killfeed overlay */}
          <Killfeed
            events={demoData.events || []}
            currentTick={currentTick}
            tickRate={tickRate}
          />
        </div>

        {/* Right Side: Team Scoreboards */}
        <div className="scoreboards">
          {/* CT Scoreboard */}
          <div className="team-scoreboard ct-team">
            <div className="team-header">
              <div className="team-name">COUNTER-TERRORISTS</div>
              <div className="team-score">{ctScore}</div>
            </div>
            <div className="players-list">
              {ctPlayers.map((player) => {
                const isDead = (player.health || 0) <= 0;
                return (
                  <div
                    key={player.steamid}
                    className={`player-row ${isDead ? "dead" : ""}`}
                  >
                    <div className="player-health">
                      <svg
                        className="armor-ring"
                        width="38"
                        height="38"
                        viewBox="0 0 38 38"
                      >
                        <circle
                          cx="19"
                          cy="19"
                          r="17"
                          fill="none"
                          stroke="#333"
                          strokeWidth="2"
                        />
                        <circle
                          cx="19"
                          cy="19"
                          r="17"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="2"
                          strokeDasharray={`${(player.armor || 0) * 1.068} 106.8`}
                          strokeDashoffset="0"
                          transform="rotate(-90 19 19)"
                          className="armor-progress"
                        />
                      </svg>
                      <div className="health-circle">
                        {isDead ? "☠" : player.health}
                      </div>
                      {player.hasHelmet && !isDead && (
                        <div className="helmet-icon" title="Helmet">
                          🪖
                        </div>
                      )}
                      {(player.armor || 0) > 0 && !isDead && (
                        <div
                          className="armor-icon"
                          title={`Armor: ${player.armor}`}
                        >
                          🛡️
                        </div>
                      )}
                    </div>
                    <div className="player-info">
                      <div className="player-name">{player.name}</div>
                      <div className="player-stats">
                        <span className="player-money" title="Equipment Value">
                          ${player.equipValue || 0}
                        </span>
                        <span className="player-kda">
                          {player.kills || 0}/{player.assists || 0}/
                          {player.deaths || 0}
                        </span>
                      </div>
                    </div>
                    <div className="player-weapon">
                      {!isDead && player.activeWeapon && (
                        <WeaponIcon weaponName={player.activeWeapon} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* T Scoreboard */}
          <div className="team-scoreboard t-team">
            <div className="team-header">
              <div className="team-name">TERRORISTS</div>
              <div className="team-score">{tScore}</div>
            </div>
            <div className="players-list">
              {tPlayers.map((player) => {
                const isDead = (player.health || 0) <= 0;
                return (
                  <div
                    key={player.steamid}
                    className={`player-row ${isDead ? "dead" : ""}`}
                  >
                    <div className="player-health">
                      <svg
                        className="armor-ring"
                        width="38"
                        height="38"
                        viewBox="0 0 38 38"
                      >
                        <circle
                          cx="19"
                          cy="19"
                          r="17"
                          fill="none"
                          stroke="#333"
                          strokeWidth="2"
                        />
                        <circle
                          cx="19"
                          cy="19"
                          r="17"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="2"
                          strokeDasharray={`${(player.armor || 0) * 1.068} 106.8`}
                          strokeDashoffset="0"
                          transform="rotate(-90 19 19)"
                          className="armor-progress"
                        />
                      </svg>
                      <div className="health-circle">
                        {isDead ? "☠" : player.health}
                      </div>
                      {player.hasHelmet && !isDead && (
                        <div className="helmet-icon" title="Helmet">
                          🪖
                        </div>
                      )}
                      {(player.armor || 0) > 0 && !isDead && (
                        <div
                          className="armor-icon"
                          title={`Armor: ${player.armor}`}
                        >
                          🛡️
                        </div>
                      )}
                    </div>
                    <div className="player-info">
                      <div className="player-name">{player.name}</div>
                      <div className="player-stats">
                        <span className="player-money" title="Equipment Value">
                          ${player.equipValue || 0}
                        </span>
                        <span className="player-kda">
                          {player.kills || 0}/{player.assists || 0}/
                          {player.deaths || 0}
                        </span>
                      </div>
                    </div>
                    <div className="player-weapon">
                      {!isDead && player.activeWeapon && (
                        <WeaponIcon weaponName={player.activeWeapon} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Compact Playback Controls */}
      <div className="bottom-bar">
        <div className="playback-buttons">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="control-btn"
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
          <button
            onClick={() => {
              setPan({ x: 0, y: 0 });
              setScale(0.8);
            }}
            className="control-btn"
          >
            ⏮
          </button>
          <button
            onClick={() => setScale((prev) => Math.min(2, prev + 0.1))}
            className="control-btn"
          >
            +
          </button>
          <button
            onClick={() => setScale((prev) => Math.max(0.1, prev - 0.1))}
            className="control-btn"
          >
            -
          </button>
          <span className="speed-label">{playbackSpeed}x</span>
        </div>

        <div className="timeline">
          <input
            type="range"
            min={minTick}
            max={maxTick}
            step={1}
            value={currentTick}
            onChange={(e) => {
              setCurrentTick(Number(e.target.value));
              setIsPlaying(false);
            }}
            className="timeline-slider"
          />
          <div className="timeline-info">
            Tick: {Math.round(currentTick)} / {maxTick}
          </div>
        </div>

        <div className="speed-control">
          <input
            type="range"
            min="0.25"
            max="4"
            step="0.25"
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="speed-slider"
          />
        </div>
      </div>
    </div>
  );
}

export default Viewer;
