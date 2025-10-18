import { useMemo } from "react";
import WeaponIcon from "./WeaponIcon";
import "./Killfeed.css";

interface Kill {
  tick: number;
  killerName: string;
  killerTeam: number;
  victimName: string;
  victimTeam: number;
  weapon: string;
  headshot: boolean;
  wallbang: boolean;
  blind: boolean;
  throughSmoke: boolean;
  assisted: boolean;
  assisterName?: string;
  noscope: boolean;
  airborne: boolean;
}

interface KillfeedProps {
  events: Array<{ tick: number; eventType: string; data: any }>;
  currentTick: number;
  tickRate: number;
}

function Killfeed({ events, currentTick, tickRate }: KillfeedProps) {
  // Get recent kills (last 5 seconds)
  const recentKills = useMemo(() => {
    if (!events || events.length === 0) {
      return [];
    }

    const killWindow = tickRate * 5; // 5 seconds

    // Try to find death events
    const deathEvents = events.filter(
      (e) =>
        e.eventType === "player_death" &&
        e.tick >= currentTick - killWindow &&
        e.tick <= currentTick
    );

    // If no death events, killfeed is not available
    if (deathEvents.length === 0) {
      return [];
    }

    // Map to Kill objects
    const kills: Kill[] = deathEvents.map((event) => ({
      tick: event.tick,
      killerName: event.data.attackerName || "World",
      killerTeam: event.data.attackerTeam || 0,
      victimName: event.data.victimName || "Unknown",
      victimTeam: event.data.victimTeam || 0,
      weapon: event.data.weapon || "unknown",
      headshot: event.data.headshot || false,
      wallbang: event.data.penetrated || false,
      blind: event.data.attackerBlind || false,
      throughSmoke: event.data.throughSmoke || false,
      assisted:
        event.data.assisterName !== undefined &&
        event.data.assisterName !== null,
      assisterName: event.data.assisterName,
      noscope: event.data.noscope || false,
      airborne: event.data.attackerAirborne || false
    }));

    // Keep only the 5 most recent kills, sorted by tick (most recent last)
    return kills.slice(-5);
  }, [events, currentTick, tickRate]);

  if (recentKills.length === 0) {
    return null;
  }

  return (
    <div className="killfeed">
      {recentKills.map((kill, index) => {
        const killerColor =
          kill.killerTeam === 3 ? "ct" : kill.killerTeam === 2 ? "t" : "world";
        const victimColor =
          kill.victimTeam === 3 ? "ct" : kill.victimTeam === 2 ? "t" : "world";
        const ticksOld = currentTick - kill.tick;
        const opacity = Math.max(0.4, 1 - ticksOld / (tickRate * 5));

        return (
          <div
            key={`${kill.tick}-${index}`}
            className="kill-entry"
            style={{ opacity }}
          >
            {/* Killer name */}
            <span className={`kill-killer kill-${killerColor}`}>
              {kill.killerName}
            </span>

            {/* Assister (if applicable) */}
            {kill.assisted && kill.assisterName && (
              <>
                <span className="assist-plus">+</span>
                {/* Flash assist icon - only show if BOTH assisted AND blind */}
                {kill.blind && (
                  <img
                    src="/kill-modifiers/flash-assist.svg"
                    alt="Flash assist"
                    className="kill-modifier-icon flash-assist-icon"
                    title="Flash assist"
                  />
                )}
                <span className={`kill-assister kill-${killerColor}`}>
                  {kill.assisterName}
                </span>
              </>
            )}

            {/* Kill modifiers */}
            <span className="kill-icons">
              {/* Only show blind icon if killer was blind but NO flash assist */}
              {kill.blind && !kill.assisted && (
                <img
                  src="/kill-modifiers/blind.svg"
                  alt="Blind"
                  className="kill-modifier-icon"
                  title="Blind kill"
                />
              )}
              {kill.wallbang && (
                <img
                  src="/kill-modifiers/wallbang.svg"
                  alt="Wallbang"
                  className="kill-modifier-icon"
                  title="Wallbang"
                />
              )}
              {kill.throughSmoke && (
                <img
                  src="/kill-modifiers/smoke.svg"
                  alt="Through smoke"
                  className="kill-modifier-icon"
                  title="Through smoke"
                />
              )}
              {kill.airborne && (
                <img
                  src="/kill-modifiers/jumpshot.svg"
                  alt="Jumpshot"
                  className="kill-modifier-icon"
                  title="Jumpshot"
                />
              )}
              {kill.noscope && (
                <img
                  src="/kill-modifiers/noscope.svg"
                  alt="Noscope"
                  className="kill-modifier-icon"
                  title="Noscope"
                />
              )}

              {/* Weapon icon */}
              <WeaponIcon
                weaponName={kill.weapon}
                className="kill-weapon-icon"
              />

              {/* Headshot icon (after weapon) */}
              {kill.headshot && (
                <img
                  src="/kill-modifiers/headshot.svg"
                  alt="Headshot"
                  className="kill-modifier-icon headshot-icon"
                  title="Headshot"
                />
              )}
            </span>

            {/* Victim name */}
            <span className={`kill-victim kill-${victimColor}`}>
              {kill.victimName}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default Killfeed;
