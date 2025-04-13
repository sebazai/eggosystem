"use client";

import {
  expressFetcher,
  generateFiltersParamQuery,
  type FilterParamsQuery
} from "@/lib/utils";
import useSWR from "swr";

export type LeaderboardPlayer = {
  nickname: string;
  team_name: string;
  team_logo?: string;
  value: number;
  matches_played: number;
  rank: number;
};

export type LeaderboardCategory = {
  title: string;
  unit: string;
  players: LeaderboardPlayer[];
};

type LeaderboardResponse = {
  kills?: Array<{
    nickname: string;
    team_name: string;
    team_logo?: string;
    kills: number;
    matches_played: number;
  }>;
  assists?: Array<{
    nickname: string;
    team_name: string;
    team_logo?: string;
    assists: number;
    matches_played: number;
  }>;
  deaths?: Array<{
    nickname: string;
    team_name: string;
    team_logo?: string;
    deaths: number;
    matches_played: number;
  }>;
  kast?: Array<{
    nickname: string;
    team_name: string;
    team_logo?: string;
    kast: number;
    matches_played: number;
  }>;
  kd?: Array<{
    nickname: string;
    team_name: string;
    team_logo?: string;
    kd: number;
    matches_played: number;
  }>;
  flash_assists?: Array<{
    nickname: string;
    team_name: string;
    team_logo?: string;
    flash_assists: number;
    matches_played: number;
  }>;
};

export const useLeaderboards = (params: FilterParamsQuery) => {
  const sortedQuery = generateFiltersParamQuery(params);

  const { data, error, isValidating } = useSWR<LeaderboardResponse>(
    `/api/v1/leaderboard/multiple?${sortedQuery}`,
    expressFetcher,
    {
      revalidateOnFocus: false,
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        if (retryCount >= 3) return;

        setTimeout(() => revalidate({ retryCount }), 3000);
      }
    }
  );

  if (!data) {
    return {
      leaderboards: undefined,
      isLoading: !error && !data,
      isValidating,
      isError: error
    };
  }

  const isEmpty =
    (!data.kills || data.kills.length === 0) &&
    (!data.assists || data.assists.length === 0) &&
    (!data.deaths || data.deaths.length === 0) &&
    (!data.kast || data.kast.length === 0) &&
    (!data.kd || data.kd.length === 0) &&
    (!data.flash_assists || data.flash_assists.length === 0);

  if (isEmpty) {
    return {
      leaderboards: [],
      isLoading: false,
      isValidating,
      isError: null
    };
  }

  const transformedData: LeaderboardCategory[] = [
    {
      title: "Kills",
      unit: "",
      players: (data.kills || []).map((player, index) => ({
        nickname: player.nickname,
        team_name: player.team_name,
        team_logo: player.team_logo,
        value: player.kills,
        matches_played: player.matches_played,
        rank: index + 1
      }))
    },
    {
      title: "Assists",
      unit: "",
      players: (data.assists || []).map((player, index) => ({
        nickname: player.nickname,
        team_name: player.team_name,
        team_logo: player.team_logo,
        value: player.assists,
        matches_played: player.matches_played,
        rank: index + 1
      }))
    },
    {
      title: "Deaths",
      unit: "",
      players: (data.deaths || []).map((player, index) => ({
        nickname: player.nickname,
        team_name: player.team_name,
        team_logo: player.team_logo,
        value: player.deaths,
        matches_played: player.matches_played,
        rank: index + 1
      }))
    },
    {
      title: "KAST",
      unit: "%",
      players: (data.kast || []).map((player, index) => ({
        nickname: player.nickname,
        team_name: player.team_name,
        team_logo: player.team_logo,
        value: player.kast,
        matches_played: player.matches_played,
        rank: index + 1
      }))
    },
    {
      title: "K/D Ratio",
      unit: "",
      players: (data.kd || []).map((player, index) => ({
        nickname: player.nickname,
        team_name: player.team_name,
        team_logo: player.team_logo,
        value: player.kd,
        matches_played: player.matches_played,
        rank: index + 1
      }))
    },
    {
      title: "Flash Assists",
      unit: "",
      players: (data.flash_assists || []).map((player, index) => ({
        nickname: player.nickname,
        team_name: player.team_name,
        team_logo: player.team_logo,
        value: player.flash_assists,
        matches_played: player.matches_played,
        rank: index + 1
      }))
    }
  ];

  const filteredData = transformedData.filter(
    (category) => category.players && category.players.length > 0
  );

  return {
    leaderboards: filteredData,
    isLoading: !data && !error,
    isError: error,
    isValidating
  };
};
