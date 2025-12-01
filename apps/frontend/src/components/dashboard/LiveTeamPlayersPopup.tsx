"use client";

import { useRef, useEffect, useState } from "react";
import type { LivePlayerValues } from "@/hooks/data/dashboard/useTeamPlayersLive";
import Image from "next/image";
import { createNextUrl } from "@/lib/utils";

interface LiveTeamPlayersPopupProps {
  players: LivePlayerValues[];
  teamName: string;
  seasonName: string;
  position: { x: number; y: number };
  isLoading: boolean;
  onClose: () => void;
}

export function LiveTeamPlayersPopup({
  players,
  teamName,
  seasonName,
  position,
  isLoading,
  onClose
}: LiveTeamPlayersPopupProps) {
  const windowRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Handle click outside to close the window
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        windowRef.current &&
        !windowRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Apply animation after mount
  useEffect(() => {
    // Use requestAnimationFrame to ensure the element is in the DOM before applying transition
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  // Calculate position to ensure window stays within viewport
  const calculatePosition = () => {
    if (typeof window === "undefined")
      return { top: position.y, left: position.x };

    const windowWidth = 750; // Wider to accommodate role column
    const maxWindowHeight = window.innerHeight * 0.8; // Max 80% of viewport height
    const minTopPadding = 20;
    const minBottomPadding = 20;

    let left = position.x;
    let top = position.y;

    // Adjust if the window would go off the right edge
    if (left + windowWidth > window.innerWidth) {
      left = window.innerWidth - windowWidth - 20;
    }

    // Adjust if the window would go off the bottom edge
    if (top + maxWindowHeight > window.innerHeight - minBottomPadding) {
      top = Math.max(
        minTopPadding,
        window.innerHeight - maxWindowHeight - minBottomPadding
      );
    }

    // Ensure we don't go off the top
    if (top < minTopPadding) {
      top = minTopPadding;
    }

    return { top, left };
  };

  const { top, left } = calculatePosition();

  // Separate players by role
  const primaryPlayers = players.filter((p) => p.role === "primary");
  const substitutePlayers = players.filter((p) => p.role === "substitute");

  return (
    <div
      ref={windowRef}
      className={`fixed z-50 bg-white dark:bg-gray-900 rounded-lg shadow-2xl border-2 border-gray-300 dark:border-gray-700 overflow-hidden transition-all duration-200 ${
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      }`}
      style={{
        top: `${top}px`,
        left: `${left}px`,
        maxHeight: "calc(80vh)",
        width: "750px"
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-kanaliiga-orange to-kanaliiga-light-brown px-4 py-3 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-bold text-white">{teamName}</h3>
          <p className="text-sm text-white/80">Current Season: {seasonName}</p>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-200 text-2xl leading-none"
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kanaliiga-orange mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Loading player data...
          </p>
        </div>
      ) : (
        <div className="overflow-auto max-h-[70vh] pb-4">
          {/* Primary Players Section */}
          {primaryPlayers.length > 0 && (
            <div className="mb-4">
              <div className="bg-kanaliiga-light-brown/20 px-4 py-2">
                <h4 className="text-sm font-bold text-kanaliiga-orange uppercase">
                  Primary Roster ({primaryPlayers.length})
                </h4>
              </div>
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      CS2
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Hours
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Faceit
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      FKD
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Kana ELO
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {primaryPlayers.map((player) => (
                    <tr key={player.steamid}>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        {player.name}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        {player.cs2_rank}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        {player.hours}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        {player.faceit_level} ({player.faceit_elo})
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        {player.fkd ? player.fkd.toFixed(2) : "0.00"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        {player.kanarating
                          ? player.kanarating.toFixed(2)
                          : "0.00"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-bold text-kanaliiga-orange">
                        {player.kana_elo}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        <div className="flex items-center gap-1">
                          {player.is_captain && (
                            <Image
                              src={createNextUrl("/images/captain.png")}
                              alt="Captain"
                              width={20}
                              height={15}
                              title="Captain"
                            />
                          )}
                          {player.is_co_captain && (
                            <Image
                              src={createNextUrl("/images/co-captain.png")}
                              alt="Co-Captain"
                              width={20}
                              height={15}
                              title="Co-Captain"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Substitute Players Section */}
          {substitutePlayers.length > 0 && (
            <div>
              <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">
                  Substitutes ({substitutePlayers.length})
                </h4>
              </div>
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Player
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      CS2
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Hours
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Faceit
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      FKD
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Kana ELO
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {substitutePlayers.map((player) => (
                    <tr
                      key={player.steamid}
                      className="bg-gray-50 dark:bg-gray-900/50"
                    >
                      <td className="px-3 py-2 text-xs">
                        <div>
                          <div className="font-medium">{player.name}</div>
                          {player.match_info && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {player.match_info}
                            </div>
                          )}
                          {!player.match_info && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">
                              General substitute (no specific match)
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        {player.cs2_rank}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        {player.hours}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        {player.faceit_level} ({player.faceit_elo})
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        {player.fkd ? player.fkd.toFixed(2) : "0.00"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        {player.kanarating
                          ? player.kanarating.toFixed(2)
                          : "0.00"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs font-bold">
                        {player.kana_elo}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-xs">
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200">
                          Sub
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {primaryPlayers.length === 0 && substitutePlayers.length === 0 && (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No players found for this team
            </div>
          )}

          {/* Bottom padding for scroll visibility */}
          <div className="h-4"></div>
        </div>
      )}
    </div>
  );
}
