"use client";

import {
  expressFetcher,
  generateFiltersParamQuery,
  type FilterParamsQuery
} from "@/lib/utils";
import type {
  LeaderboardCategory,
  LeaderboardResponse
} from "@eggosystem/types";
import useSWR from "swr";

export const useLeaderboards = (params: FilterParamsQuery) => {
  const sortedQuery = generateFiltersParamQuery(params);

  const { data, error, isValidating } = useSWR<LeaderboardResponse>(
    `/api/v1/filters/leaderboards/multiple?${sortedQuery}`,
    expressFetcher,
    {
      revalidateOnFocus: false
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

  // Check if the data is empty
  const isEmpty = Object.values(data).every(
    (statArray) => !statArray || statArray.length === 0
  );

  if (isEmpty) {
    return {
      leaderboards: [],
      isLoading: false,
      isValidating,
      isError: null
    };
  }

  const transformedData: LeaderboardCategory[] = [
    // AVG stats with formatting
    {
      title: "Kana Rating",
      unit: "",
      players: (data.kana_rating || []).map((player, index) => ({
        steam_id: player.steam_id,
        nickname: player.nickname,
        team_name: player.team_name,
        team_logo: player.team_logo,
        value: player.kana_rating,
        matches_played: player.matches_played,
        rank: index + 1
      }))
    },
    {
      title: "KAST",
      unit: "%",
      players: (data.kast || []).map((player, index) => ({
        steam_id: player.steam_id,
        nickname: player.nickname,
        team_name: player.team_name,
        team_logo: player.team_logo,
        value: player.kast,
        matches_played: player.matches_played,
        rank: index + 1
      }))
    },
    {
      title: "Headshot %",
      unit: "%",
      players: (data.hs_percent || []).map((player, index) => ({
        steam_id: player.steam_id,
        nickname: player.nickname,
        team_name: player.team_name,
        team_logo: player.team_logo,
        value: player.hs_percent,
        matches_played: player.matches_played,
        rank: index + 1
      }))
    },
    {
      title: "ADR",
      unit: "",
      players: (data.adr || []).map((player, index) => ({
        steam_id: player.steam_id,
        nickname: player.nickname,
        team_name: player.team_name,
        team_logo: player.team_logo,
        value: player.adr,
        matches_played: player.matches_played,
        rank: index + 1
      }))
    },

    // SUM stats
    {
      title: "Kills",
      unit: "",
      players: (data.kills || []).map((player, index) => ({
        steam_id: player.steam_id,
        nickname: player.nickname,
        team_name: player.team_name,
        team_logo: player.team_logo,
        value: player.kills,
        matches_played: player.matches_played,
        rank: index + 1
      }))
    },
    {
      title: "Deaths",
      unit: "",
      players: (data.deaths || []).map((player, index) => ({
        steam_id: player.steam_id,
        nickname: player.nickname,
        team_name: player.team_name,
        team_logo: player.team_logo,
        value: player.deaths,
        matches_played: player.matches_played,
        rank: index + 1
      }))
    },
    {
      title: "Assists",
      unit: "",
      players: (data.assists || []).map((player, index) => ({
        steam_id: player.steam_id,
        nickname: player.nickname,
        team_name: player.team_name,
        team_logo: player.team_logo,
        value: player.assists,
        matches_played: player.matches_played,
        rank: index + 1
      }))
    },
    {
      title: "K/D Ratio",
      unit: "",
      players: (data.kd || []).map((player, index) => ({
        steam_id: player.steam_id,
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
        steam_id: player.steam_id,
        nickname: player.nickname,
        team_name: player.team_name,
        team_logo: player.team_logo,
        value: player.flash_assists,
        matches_played: player.matches_played,
        rank: index + 1
      }))
    },
    {
      title: "Utility Damage",
      unit: "",
      players: (data.utility_damage || []).map((player, index) => ({
        steam_id: player.steam_id,
        nickname: player.nickname,
        team_name: player.team_name,
        team_logo: player.team_logo,
        value: player.utility_damage,
        matches_played: player.matches_played,
        rank: index + 1
      }))
    },
    {
      title: "Total Damage",
      unit: "",
      players: (data.total_damage || []).map((player, index) => ({
        steam_id: player.steam_id,
        nickname: player.nickname,
        team_name: player.team_name,
        team_logo: player.team_logo,
        value: player.total_damage,
        matches_played: player.matches_played,
        rank: index + 1
      }))
    },
    {
      title: "AWP Kills",
      unit: "",
      players: (data.awp_kills || []).map((player, index) => ({
        steam_id: player.steam_id,
        nickname: player.nickname,
        team_name: player.team_name,
        team_logo: player.team_logo,
        value: player.awp_kills,
        matches_played: player.matches_played,
        rank: index + 1
      }))
    },
    {
      title: "Headshots",
      unit: "",
      players: (data.headshots || []).map((player, index) => ({
        steam_id: player.steam_id,
        nickname: player.nickname,
        team_name: player.team_name,
        team_logo: player.team_logo,
        value: player.headshots,
        matches_played: player.matches_played,
        rank: index + 1
      }))
    },
    {
      title: "Enemies Flashed",
      unit: "",
      players: (data.enemies_flashed || []).map((player, index) => ({
        steam_id: player.steam_id,
        nickname: player.nickname,
        team_name: player.team_name,
        team_logo: player.team_logo,
        value: player.enemies_flashed,
        matches_played: player.matches_played,
        rank: index + 1
      }))
    },
    {
      title: "Teammates Flashed",
      unit: "",
      players: (data.mates_flashed || []).map((player, index) => ({
        steam_id: player.steam_id,
        nickname: player.nickname,
        team_name: player.team_name,
        team_logo: player.team_logo,
        value: player.mates_flashed,
        matches_played: player.matches_played,
        rank: index + 1
      }))
    },
    {
      title: "Self Flashes",
      unit: "",
      players: (data.self_flashes || []).map((player, index) => ({
        steam_id: player.steam_id,
        nickname: player.nickname,
        team_name: player.team_name,
        team_logo: player.team_logo,
        value: player.self_flashes,
        matches_played: player.matches_played,
        rank: index + 1
      }))
    },
    {
      title: "Clutches Won",
      unit: "",
      players: (data.clutches_won || []).map((player, index) => ({
        steam_id: player.steam_id,
        nickname: player.nickname,
        team_name: player.team_name,
        team_logo: player.team_logo,
        value: player.clutches_won,
        matches_played: player.matches_played,
        rank: index + 1
      }))
    },
    {
      title: "1v1 Duels Won",
      unit: "",
      players: (data.one_v_one_won || []).map((player, index) => ({
        steam_id: player.steam_id,
        nickname: player.nickname,
        team_name: player.team_name,
        team_logo: player.team_logo,
        value: player.one_v_one_won,
        matches_played: player.matches_played,
        rank: index + 1
      }))
    },
    {
      title: "First Deaths",
      unit: "",
      players: (data.first_deaths || []).map((player, index) => ({
        steam_id: player.steam_id,
        nickname: player.nickname,
        team_name: player.team_name,
        team_logo: player.team_logo,
        value: player.first_deaths,
        matches_played: player.matches_played,
        rank: index + 1
      }))
    },
    {
      title: "First Kills",
      unit: "",
      players: (data.first_kills || []).map((player, index) => ({
        steam_id: player.steam_id,
        nickname: player.nickname,
        team_name: player.team_name,
        team_logo: player.team_logo,
        value: player.first_kills,
        matches_played: player.matches_played,
        rank: index + 1
      }))
    },
    {
      title: "Flashes Thrown",
      unit: "",
      players: (data.flashes_thrown || []).map((player, index) => ({
        steam_id: player.steam_id,
        nickname: player.nickname,
        team_name: player.team_name,
        team_logo: player.team_logo,
        value: player.flashes_thrown,
        matches_played: player.matches_played,
        rank: index + 1
      }))
    },
    {
      title: "Enemy Flash Duration",
      unit: "s",
      players: (data.total_ef_duration || []).map((player, index) => ({
        steam_id: player.steam_id,
        nickname: player.nickname,
        team_name: player.team_name,
        team_logo: player.team_logo,
        value: player.total_ef_duration,
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
