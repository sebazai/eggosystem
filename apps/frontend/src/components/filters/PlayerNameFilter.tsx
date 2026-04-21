"use client";

import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSearchParams } from "next/navigation";

interface PlayerNameFilterProps {
  initialPlayerName?: string;
}

export const PlayerNameFilter: React.FC<PlayerNameFilterProps> = ({
  initialPlayerName = ""
}) => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  // String snapshot: useSearchParams() often returns a new object each render even
  // when the query string is unchanged; depending on that object in effects can
  // cause replaceState → re-render loops.
  const searchParamsSnapshot = searchParams.toString();
  const [playerName, setPlayerName] = useState(initialPlayerName);
  const [debouncedPlayerName, setDebouncedPlayerName] =
    useState(initialPlayerName);

  // Update search params when player name changes (with debounce)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedPlayerName(playerName);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [playerName]);

  // Update URL when debounced player name changes
  useEffect(() => {
    const params = new URLSearchParams(searchParamsSnapshot);

    if (debouncedPlayerName) {
      params.set("playerName", debouncedPlayerName);
    } else {
      params.delete("playerName");
    }

    const newQuery = params.toString();
    if (newQuery === searchParamsSnapshot) {
      return;
    }

    const newUrl = newQuery ? `${pathname}?${newQuery}` : pathname;
    window.history.replaceState(null, "", newUrl);
  }, [debouncedPlayerName, pathname, searchParamsSnapshot]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPlayerName(e.target.value);
    },
    []
  );

  return (
    <div className="w-full">
      <div className="bg-card rounded-md p-3 border border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-kanaliiga-orange">
            Player Name
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search player name..."
            value={playerName}
            onChange={handleInputChange}
            className="pl-10 bg-background h-10 border-none"
          />
        </div>
      </div>
    </div>
  );
};
