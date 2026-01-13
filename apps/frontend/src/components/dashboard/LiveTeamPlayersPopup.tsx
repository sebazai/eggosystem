"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import type { LivePlayerValues } from "@/hooks/data/dashboard/useTeamPlayersLive";
import Image from "next/image";
import { createNextUrl } from "@/lib/utils";
import { TanStackTableWrapper } from "@/components/tables/TanStackTableWrapper";
import type { ColumnDef } from "@tanstack/react-table";

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

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  const calculatePosition = () => {
    if (typeof window === "undefined")
      return { top: position.y, left: position.x };

    const windowWidth = 750;
    const maxWindowHeight = window.innerHeight * 0.8;
    const minTopPadding = 20;
    const minBottomPadding = 20;

    let left = position.x;
    let top = position.y;

    if (left + windowWidth > window.innerWidth) {
      left = window.innerWidth - windowWidth - 20;
    }

    if (top + maxWindowHeight > window.innerHeight - minBottomPadding) {
      top = Math.max(
        minTopPadding,
        window.innerHeight - maxWindowHeight - minBottomPadding
      );
    }

    if (top < minTopPadding) {
      top = minTopPadding;
    }

    return { top, left };
  };

  const { top, left } = calculatePosition();

  const primaryPlayers = players.filter((p) => p.role === "primary");
  const substitutePlayers = players.filter((p) => p.role === "substitute");

  const columns = useMemo<ColumnDef<LivePlayerValues>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Player",
        cell: ({ row }) => {
          const player = row.original;
          if (player.role === "substitute") {
            return (
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
            );
          }
          return player.name;
        }
      },
      {
        accessorKey: "cs2_rank",
        header: "CS2"
      },
      {
        accessorKey: "hours",
        header: "Hours"
      },
      {
        accessorKey: "faceit_level",
        header: "Faceit",
        cell: ({ row }) =>
          `${row.original.faceit_level} (${row.original.faceit_elo})`
      },
      {
        accessorKey: "fkd",
        header: "FKD",
        cell: ({ row }) =>
          row.original.fkd ? row.original.fkd.toFixed(2) : "0.00"
      },
      {
        accessorKey: "kanarating",
        header: "Rating",
        cell: ({ row }) =>
          row.original.kanarating ? row.original.kanarating.toFixed(2) : "0.00"
      },
      {
        accessorKey: "kana_elo",
        header: "Kana ELO",
        cell: ({ row }) => (
          <span
            className={
              row.original.role === "primary"
                ? "font-bold text-kanaliiga-orange"
                : "font-bold"
            }
          >
            {row.original.kana_elo}
          </span>
        )
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
          const player = row.original;
          if (player.role === "substitute") {
            return (
              <span className="px-2 py-1 text-xs rounded-full bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200">
                Sub
              </span>
            );
          }
          return (
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
          );
        }
      }
    ],
    []
  );

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

      {isLoading ? (
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kanaliiga-orange mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Loading player data...
          </p>
        </div>
      ) : (
        <div className="overflow-auto max-h-[70vh] pb-4">
          {primaryPlayers.length > 0 && (
            <div className="mb-4">
              <div className="bg-kanaliiga-light-brown/20 px-4 py-2">
                <h4 className="text-sm font-bold text-kanaliiga-orange uppercase">
                  Primary Roster ({primaryPlayers.length})
                </h4>
              </div>
              <TanStackTableWrapper
                data={primaryPlayers}
                columns={columns}
                showPagination={false}
              />
            </div>
          )}

          {substitutePlayers.length > 0 && (
            <div>
              <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase">
                  Substitutes ({substitutePlayers.length})
                </h4>
              </div>
              <TanStackTableWrapper
                data={substitutePlayers}
                columns={columns}
                showPagination={false}
              />
            </div>
          )}

          {primaryPlayers.length === 0 && substitutePlayers.length === 0 && (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No players found for this team
            </div>
          )}

          <div className="h-4"></div>
        </div>
      )}
    </div>
  );
}
