"use client";

import {
  expressFetcher,
  filterParamsToSearchParams,
  getParamArray,
  type FilterParamsQuery
} from "@/lib/utils";
import { useSearchParams, usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  createContext,
  useContext,
  useCallback
} from "react";
import useSWR from "swr";

type FilterContextType = {
  activeSeason: { season_id: number } | null;
  filterParams: FilterParamsQuery;
  filterQueryString: string;
  getFilteredQueryString: (excludeKeys?: (keyof FilterParamsQuery)[]) => string;
  isLoading: boolean;
  isValidating: boolean;
  error: Error | undefined;
  areFiltersEmpty: boolean;
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);
const includeExactPaths = [
  "/matches",
  "/topteams",
  "/leaderboards",
  "/players",
  "/teams"
];
const includePrefixPaths: string[] = [];
const excludePrefixPaths: string[] = ["/players/", "/teams/"];
export const FilterProvider = ({
  appId,
  children
}: {
  appId: string;
  children: React.ReactNode;
}) => {
  const path = usePathname();
  const searchParams = useSearchParams();

  const { data, error, isValidating, isLoading } = useSWR<
    { season_id: number },
    Error
  >(`/api/v1/organizers/1/app/${appId}/seasons/active`, expressFetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    keepPreviousData: true,
    dedupingInterval: 24 * 60 * 60 * 1000
  });

  // Determine ready state based on conditions
  // Use a ref to track if we've done the initial URL setup
  const hasInitializedUrl = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      searchParams.size !== 0 ||
      excludePrefixPaths.some((p) => path === p || path.startsWith(`${p}`))
    );
  }, [searchParams.size, path]);

  // Derive ready state - it's ready if we have params or are on an excluded path
  // OR if we've initialized the URL with season params
  const ready = useMemo(() => {
    return (
      hasInitializedUrl ||
      (searchParams.size > 0 &&
        data?.season_id &&
        (includeExactPaths.includes(path) ||
          includePrefixPaths.some(
            (p) => path === p || path.startsWith(`${p}/`)
          )))
    );
  }, [hasInitializedUrl, searchParams.size, data?.season_id, path]);

  useEffect(() => {
    if (
      searchParams.size === 0 &&
      data?.season_id &&
      !hasInitializedUrl &&
      (includeExactPaths.includes(path) ||
        includePrefixPaths.some((p) => path === p || path.startsWith(`${p}/`)))
    ) {
      const params = new URLSearchParams();
      params.append("seasons", data.season_id.toString());
      const newUrl = `${path}?${params.toString()}`;
      if (typeof window !== "undefined") {
        window.history.replaceState(null, "", newUrl);
      }
    }
  }, [searchParams.size, data?.season_id, hasInitializedUrl, path]);

  const filterParams = useMemo(() => {
    if (!ready) return null;
    return {
      seasons: getParamArray(searchParams, "seasons"),
      leagues: getParamArray(searchParams, "leagues"),
      stages: getParamArray(searchParams, "stages"),
      teams: getParamArray(searchParams, "teams"),
      maps: getParamArray(searchParams, "maps"),
      player_name: searchParams.get("playerName")
    } satisfies FilterParamsQuery;
  }, [ready, searchParams]);

  const filterQueryString = useMemo(() => {
    if (!filterParams) return "";
    return filterParamsToSearchParams(filterParams).toString();
  }, [filterParams]);

  const getFilteredQueryString = useCallback(
    (excludeKeys: (keyof FilterParamsQuery)[] = []) => {
      return filterParamsToSearchParams(filterParams, excludeKeys).toString();
    },
    [filterParams]
  );

  if (!ready || !filterParams || !data) {
    return (
      <FilterContext.Provider
        value={{
          activeSeason: null,
          filterParams: {
            seasons: null,
            leagues: null,
            stages: null,
            teams: null,
            maps: null
          },
          filterQueryString: "",
          getFilteredQueryString,
          isLoading: true,
          isValidating: false,
          error: undefined,
          areFiltersEmpty: true
        }}
      >
        {children}
      </FilterContext.Provider>
    );
  }

  const areFiltersEmpty = Object.entries(filterParams).every(([key, value]) => {
    if (key === "player_name") {
      return !value || (typeof value === "string" && value.trim() === "");
    }
    return !value || (Array.isArray(value) && value.length === 0);
  });

  return (
    <FilterContext.Provider
      value={{
        activeSeason: data,
        filterParams,
        filterQueryString,
        getFilteredQueryString,
        isLoading,
        error,
        isValidating,
        areFiltersEmpty
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return context;
};
