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
  useState,
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
  const [ready, setReady] = useState(false);

  const { data, error, isValidating, isLoading } = useSWR<
    { season_id: number },
    Error
  >(`/api/v1/organizer/1/app/${appId}/seasons/active`, expressFetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    keepPreviousData: true,
    dedupingInterval: 24 * 60 * 60 * 1000
  });

  useEffect(() => {
    if (
      searchParams.size === 0 &&
      data?.season_id &&
      !ready &&
      (includeExactPaths.includes(path) ||
        includePrefixPaths.some((p) => path === p || path.startsWith(`${p}/`)))
    ) {
      const params = new URLSearchParams();
      params.append("seasons", data.season_id.toString());
      const newUrl = `${path}?${params.toString()}`;
      window.history.replaceState(null, "", newUrl);
    }
    if (
      (searchParams.size !== 0 ||
        excludePrefixPaths.some(
          (p) => path === p || path.startsWith(`${p}`)
        )) &&
      !ready
    ) {
      setReady(true);
    }
  }, [searchParams, data?.season_id, ready, path]);

  const filterParams = useMemo(() => {
    if (!ready) return null;
    return {
      seasons: getParamArray(searchParams, "seasons"),
      leagues: getParamArray(searchParams, "leagues"),
      stages: getParamArray(searchParams, "stages"),
      teams: getParamArray(searchParams, "teams"),
      maps: getParamArray(searchParams, "maps")
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

  const areFiltersEmpty = Object.values(filterParams).every(
    (arr) => !arr || arr.length === 0
  );

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
