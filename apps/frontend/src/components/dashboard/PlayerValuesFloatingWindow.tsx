"use client";

import { useRef, useEffect, useState } from "react";
import type { PlayerSortterValues } from "@eggosystem/types";

interface PlayerValuesFloatingWindowProps {
  playerValues: PlayerSortterValues[];
  teamName: string;
  position: { x: number; y: number };
  isLoading: boolean;
  onClose: () => void;
}

export function PlayerValuesFloatingWindow({
  playerValues,
  teamName,
  position,
  isLoading,
  onClose
}: PlayerValuesFloatingWindowProps) {
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

    const windowWidth = 650; // Approximate width of the window
    const windowHeight = 350; // Approximate height of the window

    let left = position.x;
    let top = position.y;

    // Adjust if the window would go off the right edge
    if (left + windowWidth > window.innerWidth) {
      left = window.innerWidth - windowWidth - 20;
    }

    // Adjust if the window would go off the bottom edge
    if (top + windowHeight > window.innerHeight) {
      top = window.innerHeight - windowHeight - 20;
    }

    return { top, left };
  };

  const { top, left } = calculatePosition();

  return (
    <div
      ref={windowRef}
      className={`fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700 w-[650px] transition-all duration-200 ease-out ${
        isVisible ? "opacity-100 transform-none" : "opacity-0 scale-95"
      }`}
      style={{ top: `${top}px`, left: `${left}px` }}
      onDoubleClick={onClose}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{teamName} Players</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : playerValues.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No player data available
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  CS2 Rank
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
                  RATING
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  KANA_ELO
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  CALCULUS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {playerValues.map((player) => (
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
                    {player.kanarating ? player.kanarating.toFixed(2) : "0.00"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                    {player.kana_elo}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">
                    {player.calculus || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
