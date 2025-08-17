"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  Target,
  Zap,
  Crosshair,
  Clock,
  TrendingUp,
  Trophy
} from "lucide-react";
import { useFilters } from "@/context/FilterContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine
} from "recharts";
import {
  usePlayerHistoricalData,
  usePlayerHistoricalAverageByRank,
  usePlayerHistoricalAverageByLevel,
  usePlayerHistoricalAverage,
  parsePeriodToParams
} from "@/hooks/data/usePlayerHistoricalData";

interface PlayerHistoricalTabProps {
  steamId: string;
}

// Period options
const periodOptions = [
  { value: "last_5", label: "Last 5 games" },
  { value: "last_10", label: "Last 10 games" },
  { value: "last_15", label: "Last 15 games" },
  { value: "last_20", label: "Last 20 games" },
  { value: "last_30", label: "Last 30 games" },
  { value: "last_50", label: "Last 50 games" },
  { value: "this_season", label: "This season" },
  { value: "last_season", label: "Last season" },
  { value: "all_seasons", label: "All seasons" }
];

// Comparison option groups (similar to PlayerSkillRadar)
interface CompareOptionGroup {
  label: string;
  options: { value: string; label: string }[];
}

const generateCS2RankOptions = () => {
  return Array.from({ length: 31 }, (_, i) => {
    const rankValue = i * 1000;
    return {
      value: `cs2rank_${rankValue}`,
      label: `${rankValue}`
    };
  });
};

const getCompareOptionGroups = (): CompareOptionGroup[] => {
  const generalOptions = [
    { value: "none", label: "No comparison" },
    { value: "aggregate", label: "All players" }
  ];

  return [
    {
      label: "General",
      options: generalOptions
    },
    {
      label: "Faceit Levels",
      options: Array.from({ length: 10 }, (_, i) => ({
        value: `faceit_${i + 1}`,
        label: `Faceit Level ${i + 1}`
      }))
    },
    {
      label: "CS2 Ranks",
      options: generateCS2RankOptions()
    }
  ];
};

// Chart configurations with better colors
const kanratingChartConfig = {
  value: {
    label: "Kanarating",
    color: "#22c55e" // green-500
  },
  avg: {
    label: "Kanaliiga Average",
    color: "#64748b" // slate-500
  }
} satisfies ChartConfig;

const kdChartConfig = {
  value: {
    label: "K/D Ratio",
    color: "#3b82f6" // blue-500
  },
  avg: {
    label: "Kanaliiga Average",
    color: "#64748b"
  }
} satisfies ChartConfig;

const adrChartConfig = {
  value: {
    label: "ADR",
    color: "#8b5cf6" // violet-500
  },
  avg: {
    label: "Kanaliiga Average",
    color: "#64748b"
  }
} satisfies ChartConfig;

const timeToDamageChartConfig = {
  value: {
    label: "Time to Damage (ms)",
    color: "#f59e0b" // amber-500
  },
  avg: {
    label: "Kanaliiga Average",
    color: "#64748b"
  }
} satisfies ChartConfig;

const crosshairChartConfig = {
  value: {
    label: "Crosshair Placement",
    color: "#06b6d4" // cyan-500
  },
  avg: {
    label: "Kanaliiga Average",
    color: "#64748b"
  }
} satisfies ChartConfig;

const counterStrafingChartConfig = {
  value: {
    label: "Counter-strafing (%)",
    color: "#ec4899" // pink-500
  },
  avg: {
    label: "Kanaliiga Average",
    color: "#64748b"
  }
} satisfies ChartConfig;

const headshotChartConfig = {
  value: {
    label: "Headshot %",
    color: "#ef4444" // red-500
  },
  avg: {
    label: "Kanaliiga Average",
    color: "#64748b"
  }
} satisfies ChartConfig;

// Get icon for each metric
const getMetricIcon = (metric: string) => {
  switch (metric) {
    case "Kanarating":
      return <Trophy className="w-6 h-6 text-kanaliiga-orange" />;
    case "K/D Ratio":
      return <Target className="w-6 h-6 text-blue-500" />;
    case "ADR":
      return <Zap className="w-6 h-6 text-violet-500" />;
    case "Time to Damage":
      return <Clock className="w-6 h-6 text-amber-500" />;
    case "Crosshair Placement":
      return <Crosshair className="w-6 h-6 text-cyan-500" />;
    case "Counter-strafing":
      return <TrendingUp className="w-6 h-6 text-pink-500" />;
    case "Headshot %":
      return <Target className="w-6 h-6 text-red-500" />;
    default:
      return <Target className="w-6 h-6 text-gray-500" />;
  }
};

// Enhanced comparison panel component
const ComparisonPanel = ({
  title,
  playerValue,
  compareValue,
  avgValue,
  unit = "",
  compareLabel
}: {
  title: string;
  playerValue: number;
  compareValue: number;
  avgValue: number;
  unit?: string;
  compareLabel: string;
}) => {
  const playerVsCompare =
    playerValue > compareValue
      ? "better"
      : playerValue < compareValue
        ? "worse"
        : "equal";
  const playerVsAvg =
    playerValue > avgValue
      ? "better"
      : playerValue < avgValue
        ? "worse"
        : "equal";

  const getPerformanceIndicator = (comparison: string) => {
    if (comparison === "better") return "↗️";
    if (comparison === "worse") return "↘️";
    return "➡️";
  };

  const getGradientClass = (comparison: string) => {
    if (comparison === "better")
      return "from-green-500/20 to-green-600/10 border-green-500/30";
    if (comparison === "worse")
      return "from-red-500/20 to-red-600/10 border-red-500/30";
    return "from-gray-500/20 to-gray-600/10 border-gray-500/30";
  };

  // Get metric explanation based on title
  const getMetricExplanation = (metricTitle: string) => {
    switch (metricTitle.toLowerCase()) {
      case "kanarating":
        return {
          name: "Kanarating",
          description:
            "Overall performance rating based on kills, deaths, assists, and impact frags",
          calculation: "Weighted average of KDA, ADR, and clutch performance"
        };
      case "k/d ratio":
        return {
          name: "K/D Ratio",
          description: "Kills divided by deaths - measures fragging efficiency",
          calculation: "Total kills ÷ Total deaths"
        };
      case "adr":
        return {
          name: "ADR",
          description:
            "Average Damage per Round - damage dealt to enemies per round",
          calculation: "Total damage dealt ÷ Total rounds played"
        };
      case "crosshair placement":
        return {
          name: "Crosshair Placement",
          description:
            "Angle between cursor position when enemy is in sight and when the shot is taken & hit. Lower is better.",
          calculation: "Percentage of pre-aimed shots that connect"
        };
      case "counter-strafing":
        return {
          name: "Counter-strafing",
          description:
            "Technique to stop movement instantly for accurate shooting",
          calculation:
            "Percentage of shots taken with proper counter-strafe timing"
        };
      case "headshot %":
        return {
          name: "Headshot Percentage",
          description: "Percentage of kills achieved through headshots",
          calculation: "Headshot kills ÷ Total kills × 100"
        };
      default:
        return {
          name: metricTitle,
          description:
            "Time taken from when enemy is in sight to when the shot is taken. Lower is better.",
          calculation: "Statistical analysis"
        };
    }
  };

  const metricInfo = getMetricExplanation(title);

  return (
    <div
      className={`bg-gradient-to-br ${getGradientClass(playerVsCompare)} rounded-xl p-4 border backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 h-[400px] flex flex-col`}
    >
      <div className="flex items-center gap-2 mb-3">
        {getMetricIcon(title)}
        <div>
          <h4 className="font-bold text-sm text-kanaliiga-orange">{title}</h4>
          <p className="text-xs text-muted-foreground">Analysis</p>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        {/* Player Performance */}
        <div className="bg-black/20 rounded-lg p-2 border border-kanaliiga-orange/20">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-kanaliiga-orange">
              🎯 You
            </span>
            <span className="text-lg font-bold text-white">
              {playerValue}
              {unit}
            </span>
          </div>
        </div>

        {/* Comparison */}
        <div
          className={`bg-black/20 rounded-lg p-2 border ${playerVsCompare === "better" ? "border-green-500/30" : playerVsCompare === "worse" ? "border-red-500/30" : "border-gray-500/30"}`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              {getPerformanceIndicator(playerVsCompare)}
              <span className="truncate">{compareLabel}</span>
            </span>
            <span
              className={`text-lg font-bold ${playerVsCompare === "better" ? "text-green-400" : playerVsCompare === "worse" ? "text-red-400" : "text-gray-400"}`}
            >
              {compareValue}
              {unit}
            </span>
          </div>
        </div>

        {/* Average */}
        <div
          className={`bg-black/20 rounded-lg p-2 border ${playerVsAvg === "better" ? "border-green-500/30" : playerVsAvg === "worse" ? "border-red-500/30" : "border-gray-500/30"}`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              {getPerformanceIndicator(playerVsAvg)} Kanaliiga Average
            </span>
            <span
              className={`text-lg font-bold ${playerVsAvg === "better" ? "text-green-400" : playerVsAvg === "worse" ? "text-red-400" : "text-gray-400"}`}
            >
              {avgValue}
              {unit}
            </span>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="pt-1 border-t border-white/10">
          <div className="text-center">
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full ${
                playerVsCompare === "better" && playerVsAvg === "better"
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : playerVsCompare === "worse" || playerVsAvg === "worse"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
              }`}
            >
              {playerVsCompare === "better" && playerVsAvg === "better"
                ? "🔥 Elite"
                : playerVsCompare === "worse" && playerVsAvg === "worse"
                  ? "📈 Growth"
                  : "⚡ Solid"}
            </span>
          </div>
        </div>
      </div>

      {/* Metric Description */}
      <div className="mt-1 pt-1 border-t border-white/10 flex-shrink-0">
        <p className="text-xs text-muted-foreground leading-tight">
          {metricInfo.description}
        </p>
      </div>
    </div>
  );
};

export const PlayerHistoricalTab = ({ steamId }: PlayerHistoricalTabProps) => {
  const { filterParams: _filterParams } = useFilters();
  const [period, setPeriod] = useState<string>("last_15");
  const [compareOption, setCompareOption] = useState<string>("faceit_5");
  const router = useRouter();

  const compareOptionGroups = getCompareOptionGroups();

  // Parse period to API parameters
  const params = useMemo(() => parsePeriodToParams(period), [period]);

  // Fetch player historical data
  const {
    data: historicalData,
    error: historicalError,
    isLoading: isLoadingHistorical
  } = usePlayerHistoricalData(steamId, params);

  // Parse comparison option to determine which average API to call
  const { comparisonType, comparisonValue } = useMemo(() => {
    if (compareOption === "none" || compareOption === "aggregate") {
      return { comparisonType: "aggregate", comparisonValue: null };
    } else if (compareOption.startsWith("faceit_")) {
      const level = parseInt(compareOption.split("_")[1] || "1");
      return { comparisonType: "faceit", comparisonValue: level };
    } else if (compareOption.startsWith("cs2rank_")) {
      const rank = parseInt(compareOption.split("_")[1] || "0");
      return { comparisonType: "cs2rank", comparisonValue: rank };
    }
    return { comparisonType: "aggregate", comparisonValue: null };
  }, [compareOption]);

  // Always fetch overall league averages for reference lines
  const {
    data: leagueAverages,
    error: leagueError,
    isLoading: isLoadingLeague
  } = usePlayerHistoricalAverage(params);

  // Fetch comparison averages based on selected option (only if not "none" or "aggregate")
  const {
    data: faceitAverages,
    error: faceitError,
    isLoading: isLoadingFaceit
  } = usePlayerHistoricalAverageByLevel(
    comparisonType === "faceit" ? comparisonValue : null,
    comparisonType === "faceit" ? params : undefined
  );

  const {
    data: cs2rankAverages,
    error: cs2rankError,
    isLoading: isLoadingCs2rank
  } = usePlayerHistoricalAverageByRank(
    comparisonType === "cs2rank" ? comparisonValue : null,
    comparisonType === "cs2rank" ? params : undefined
  );

  // Get current comparison averages (for comparison panels)
  const comparisonAverages = useMemo(() => {
    switch (comparisonType) {
      case "faceit":
        return faceitAverages;
      case "cs2rank":
        return cs2rankAverages;
      case "aggregate":
        return leagueAverages;
      default:
        return null;
    }
  }, [comparisonType, faceitAverages, cs2rankAverages, leagueAverages]);

  // Check for loading and error states
  const isLoading =
    isLoadingHistorical ||
    isLoadingLeague ||
    isLoadingFaceit ||
    isLoadingCs2rank;
  const error = historicalError || leagueError || faceitError || cs2rankError;

  // Transform historical data for charts
  const chartData = useMemo(() => {
    if (!historicalData || historicalData.length === 0) {
      return {
        kanratingData: [],
        kdData: [],
        adrData: [],
        timeToDamageData: [],
        crosshairPlacementData: [],
        counterStrafingData: [],
        headshotData: []
      };
    }

    const sortedData = [...historicalData].sort(
      (a, b) =>
        new Date(a.match_date).getTime() - new Date(b.match_date).getTime()
    );

    return {
      kanratingData: sortedData.map((item, index) => ({
        match: index + 1,
        value: item.kana_rating,
        avg: leagueAverages?.avg_kana_rating || 0,
        matchId: item.match_id,
        gameId: item.game_id,
        date: item.match_date
      })),
      kdData: sortedData.map((item, index) => ({
        match: index + 1,
        value: item.kd_ratio,
        avg: leagueAverages?.avg_kd_ratio || 0,
        matchId: item.match_id,
        gameId: item.game_id,
        date: item.match_date
      })),
      adrData: sortedData.map((item, index) => ({
        match: index + 1,
        value: item.adr,
        avg: leagueAverages?.avg_adr || 0,
        matchId: item.match_id,
        gameId: item.game_id,
        date: item.match_date
      })),
      timeToDamageData: sortedData.map((item, index) => ({
        match: index + 1,
        value: item.ttd || 0,
        avg: leagueAverages?.avg_ttd || 0,
        matchId: item.match_id,
        gameId: item.game_id,
        date: item.match_date
      })),
      crosshairPlacementData: sortedData.map((item, index) => ({
        match: index + 1,
        value: item.crosshair_placement || 0,
        avg: leagueAverages?.avg_crosshair_placement || 0,
        matchId: item.match_id,
        gameId: item.game_id,
        date: item.match_date
      })),
      counterStrafingData: sortedData.map((item, index) => ({
        match: index + 1,
        value: item.counter_strafing_percent || 0,
        avg: leagueAverages?.avg_counter_strafing_percent || 0,
        matchId: item.match_id,
        gameId: item.game_id,
        date: item.match_date
      })),
      headshotData: sortedData.map((item, index) => ({
        match: index + 1,
        value: item.hs_percent,
        avg: leagueAverages?.avg_hs_percent || 0,
        matchId: item.match_id,
        gameId: item.game_id,
        date: item.match_date
      }))
    };
  }, [historicalData, leagueAverages]);

  // Get current option labels for display
  const currentPeriodLabel =
    periodOptions.find((opt) => opt.value === period)?.label || period;
  const allCompareOptions = compareOptionGroups.flatMap(
    (group) => group.options
  );
  const currentCompareLabel =
    allCompareOptions.find((opt) => opt.value === compareOption)?.label ||
    compareOption;

  // Calculate current player stats (using latest values from real data)
  const currentPlayerStats = useMemo(() => {
    if (!historicalData || historicalData.length === 0) {
      return {
        kanarating: 0,
        kd: 0,
        adr: 0,
        timeToDamage: 0,
        crosshairPlacement: 0,
        counterStrafing: 0,
        headshotPercentage: 0
      };
    }

    const latest = historicalData[0]; // Data should be ordered by latest date first
    if (!latest) {
      return {
        kanarating: 0,
        kd: 0,
        adr: 0,
        timeToDamage: 0,
        crosshairPlacement: 0,
        counterStrafing: 0,
        headshotPercentage: 0
      };
    }

    return {
      kanarating: latest.kana_rating,
      kd: latest.kd_ratio,
      adr: latest.adr,
      timeToDamage: latest.ttd || 0,
      crosshairPlacement: latest.crosshair_placement || 0,
      counterStrafing: latest.counter_strafing_percent || 0,
      headshotPercentage: latest.hs_percent
    };
  }, [historicalData]);

  // Create comparison stats object for the comparison panels
  const comparisonStats = useMemo(() => {
    if (compareOption === "none" || !comparisonAverages) return null;

    const getLabel = () => {
      if (comparisonType === "aggregate") return "All Players";
      if (comparisonType === "faceit") return `Faceit Level ${comparisonValue}`;
      if (comparisonType === "cs2rank") return `CS2 Premier ${comparisonValue}`;
      return "Comparison Group";
    };

    return {
      kanarating: comparisonAverages.avg_kana_rating || 0,
      kd: comparisonAverages.avg_kd_ratio || 0,
      adr: comparisonAverages.avg_adr || 0,
      timeToDamage: comparisonAverages.avg_ttd || 0,
      crosshairPlacement: comparisonAverages.avg_crosshair_placement || 0,
      counterStrafing: comparisonAverages.avg_counter_strafing_percent || 0,
      headshotPercentage: comparisonAverages.avg_hs_percent || 0,
      label: getLabel()
    };
  }, [compareOption, comparisonAverages, comparisonType, comparisonValue]);

  const showComparison = compareOption !== "none" && comparisonStats;

  // Handle chart click to navigate to match
  const handleChartClick = (data: {
    activePayload?: { payload: { matchId?: number; gameId?: number } }[];
  }) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const payload = data.activePayload[0].payload;
      if (payload.matchId && payload.gameId) {
        // Navigate to match page with game ID
        router.push(`/matches/${payload.matchId}/games/${payload.gameId}`);
      }
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load historical data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold mb-4">Historical Data</h2>
        <div className="text-center py-8">Loading historical data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold">Historical Data</h2>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Period Dropdown */}
          <div className="w-full sm:w-48">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Select period">
                  {currentPeriodLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Comparison Dropdown */}
          <div className="w-full sm:w-64">
            <Select value={compareOption} onValueChange={setCompareOption}>
              <SelectTrigger>
                <SelectValue placeholder="Compare with...">
                  {currentCompareLabel}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {compareOptionGroups.map((group) => (
                  <div key={group.label}>
                    <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                      {group.label}
                    </div>
                    {group.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                    <div className="h-px bg-muted my-1" />
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Kanarating Over Time */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <div className="lg:col-span-5 bg-card rounded-lg p-6 border border-kanaliiga-light-brown/20">
          <h3 className="text-lg font-semibold mb-4 text-kanaliiga-orange">
            Kanarating Over Time
          </h3>
          <ChartContainer config={kanratingChartConfig} className="h-80 w-full">
            <LineChart
              data={chartData.kanratingData}
              onClick={handleChartClick}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="match"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `#${value}`}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => `Match: #${value}`}
                    formatter={(value, name, props) => [
                      `${value}`,
                      name === "value" ? "Kanarating" : "Average",
                      props.payload?.date ? ` (${props.payload.date})` : ""
                    ]}
                  />
                }
              />
              {leagueAverages && (
                <ReferenceLine
                  y={leagueAverages.avg_kana_rating}
                  stroke="var(--color-avg)"
                  strokeDasharray="5 5"
                  label={`Kanaliiga Avg (${leagueAverages.avg_kana_rating?.toFixed(2) || 0})`}
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={3}
                dot={{ r: 4, cursor: "pointer" }}
              />
            </LineChart>
          </ChartContainer>
        </div>

        <div className="lg:col-span-2">
          {showComparison && comparisonStats && (
            <ComparisonPanel
              title="Kanarating"
              playerValue={currentPlayerStats.kanarating}
              compareValue={comparisonStats.kanarating}
              avgValue={leagueAverages?.avg_kana_rating || 0}
              compareLabel={comparisonStats.label}
            />
          )}
        </div>
      </div>

      {/* K/D Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <div className="lg:col-span-5 bg-card rounded-lg p-6 border border-kanaliiga-light-brown/20">
          <h3 className="text-lg font-semibold mb-4 text-kanaliiga-orange">
            K/D Ratio Over Time
          </h3>
          <ChartContainer config={kdChartConfig} className="h-80 w-full">
            <LineChart data={chartData.kdData} onClick={handleChartClick}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="match"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `#${value}`}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => `Match: #${value}`}
                    formatter={(value, name, props) => [
                      `${value}`,
                      name === "value" ? "K/D Ratio" : "Average",
                      props.payload?.date ? ` (${props.payload.date})` : ""
                    ]}
                  />
                }
              />
              {leagueAverages && (
                <ReferenceLine
                  y={leagueAverages.avg_kd_ratio}
                  stroke="var(--color-avg)"
                  strokeDasharray="5 5"
                  label={`Kanaliiga Avg (${leagueAverages.avg_kd_ratio?.toFixed(2) || 0})`}
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={3}
                dot={{ r: 4, cursor: "pointer" }}
              />
            </LineChart>
          </ChartContainer>
        </div>

        <div className="lg:col-span-2">
          {showComparison && comparisonStats && (
            <ComparisonPanel
              title="K/D Ratio"
              playerValue={currentPlayerStats.kd}
              compareValue={comparisonStats.kd}
              avgValue={leagueAverages?.avg_kd_ratio || 0}
              unit=""
              compareLabel={comparisonStats.label}
            />
          )}
        </div>
      </div>

      {/* ADR */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <div className="lg:col-span-5 bg-card rounded-lg p-6 border border-kanaliiga-light-brown/20">
          <h3 className="text-lg font-semibold mb-4 text-kanaliiga-orange">
            ADR Over Time
          </h3>
          <ChartContainer config={adrChartConfig} className="h-80 w-full">
            <LineChart data={chartData.adrData} onClick={handleChartClick}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="match"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `#${value}`}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => `Match: #${value}`}
                    formatter={(value, name, props) => [
                      `${value}`,
                      name === "value" ? "ADR" : "Average",
                      props.payload?.date ? ` (${props.payload.date})` : ""
                    ]}
                  />
                }
              />
              {leagueAverages && (
                <ReferenceLine
                  y={leagueAverages.avg_adr}
                  stroke="var(--color-avg)"
                  strokeDasharray="5 5"
                  label={`Kanaliiga Avg (${leagueAverages.avg_adr?.toFixed(1) || 0})`}
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={3}
                dot={{ r: 4, cursor: "pointer" }}
              />
            </LineChart>
          </ChartContainer>
        </div>

        <div className="lg:col-span-2">
          {showComparison && comparisonStats && (
            <ComparisonPanel
              title="ADR"
              playerValue={currentPlayerStats.adr}
              compareValue={comparisonStats.adr}
              avgValue={leagueAverages?.avg_adr || 0}
              unit=""
              compareLabel={comparisonStats.label}
            />
          )}
        </div>
      </div>

      {/* Time to Damage */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <div className="lg:col-span-5 bg-card rounded-lg p-6 border border-kanaliiga-light-brown/20">
          <h3 className="text-lg font-semibold mb-4 text-kanaliiga-orange">
            Time to Damage
          </h3>
          <ChartContainer
            config={timeToDamageChartConfig}
            className="h-80 w-full"
          >
            <LineChart
              data={chartData.timeToDamageData}
              onClick={handleChartClick}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="match"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `#${value}`}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => `Match: #${value}`}
                    formatter={(value, name, props) => [
                      `${value}ms`,
                      name === "value" ? "Time to Damage" : "Average",
                      props.payload?.date ? ` (${props.payload.date})` : ""
                    ]}
                  />
                }
              />
              {leagueAverages && leagueAverages.avg_ttd && (
                <ReferenceLine
                  y={leagueAverages.avg_ttd}
                  stroke="var(--color-avg)"
                  strokeDasharray="5 5"
                  label={`Kanaliiga Avg (${leagueAverages.avg_ttd.toFixed(1)}ms)`}
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={3}
                dot={{ r: 4, cursor: "pointer" }}
              />
            </LineChart>
          </ChartContainer>
        </div>

        <div className="lg:col-span-2">
          {showComparison && comparisonStats && (
            <ComparisonPanel
              title="Time to Damage"
              playerValue={currentPlayerStats.timeToDamage}
              compareValue={comparisonStats.timeToDamage}
              avgValue={leagueAverages?.avg_ttd || 0}
              unit="ms"
              compareLabel={comparisonStats.label}
            />
          )}
        </div>
      </div>

      {/* Crosshair Placement */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <div className="lg:col-span-5 bg-card rounded-lg p-6 border border-kanaliiga-light-brown/20">
          <h3 className="text-lg font-semibold mb-4 text-kanaliiga-orange">
            Crosshair Placement
          </h3>
          <ChartContainer config={crosshairChartConfig} className="h-80 w-full">
            <LineChart
              data={chartData.crosshairPlacementData}
              onClick={handleChartClick}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="match"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `#${value}`}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => `Match: #${value}`}
                    formatter={(value, name, props) => [
                      `${value}`,
                      name === "value" ? "Crosshair Placement" : "Average",
                      props.payload?.date ? ` (${props.payload.date})` : ""
                    ]}
                  />
                }
              />
              {leagueAverages && leagueAverages.avg_crosshair_placement && (
                <ReferenceLine
                  y={leagueAverages.avg_crosshair_placement}
                  stroke="var(--color-avg)"
                  strokeDasharray="5 5"
                  label={`Kanaliiga Avg (${leagueAverages.avg_crosshair_placement.toFixed(1)})`}
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={3}
                dot={{ r: 4, cursor: "pointer" }}
              />
            </LineChart>
          </ChartContainer>
        </div>

        <div className="lg:col-span-2">
          {showComparison && comparisonStats && (
            <ComparisonPanel
              title="Crosshair Placement"
              playerValue={currentPlayerStats.crosshairPlacement}
              compareValue={comparisonStats.crosshairPlacement}
              avgValue={leagueAverages?.avg_crosshair_placement || 0}
              unit=""
              compareLabel={comparisonStats.label}
            />
          )}
        </div>
      </div>

      {/* Counter-strafing */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <div className="lg:col-span-5 bg-card rounded-lg p-6 border border-kanaliiga-light-brown/20">
          <h3 className="text-lg font-semibold mb-4 text-kanaliiga-orange">
            Counter-strafing Over Time
          </h3>
          <ChartContainer
            config={counterStrafingChartConfig}
            className="h-80 w-full"
          >
            <LineChart
              data={chartData.counterStrafingData}
              onClick={handleChartClick}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="match"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `#${value}`}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => `Match: #${value}`}
                    formatter={(value, name, props) => [
                      `${value}%`,
                      name === "value" ? "Counter-strafing" : "Average",
                      props.payload?.date ? ` (${props.payload.date})` : ""
                    ]}
                  />
                }
              />
              {leagueAverages &&
                leagueAverages.avg_counter_strafing_percent && (
                  <ReferenceLine
                    y={leagueAverages.avg_counter_strafing_percent}
                    stroke="var(--color-avg)"
                    strokeDasharray="5 5"
                    label={`Kanaliiga Avg (${leagueAverages.avg_counter_strafing_percent.toFixed(1)}%)`}
                  />
                )}
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={3}
                dot={{ r: 4, cursor: "pointer" }}
              />
            </LineChart>
          </ChartContainer>
        </div>

        <div className="lg:col-span-2">
          {showComparison && comparisonStats && (
            <ComparisonPanel
              title="Counter-strafing"
              playerValue={currentPlayerStats.counterStrafing}
              compareValue={comparisonStats.counterStrafing}
              avgValue={leagueAverages?.avg_counter_strafing_percent || 0}
              unit="%"
              compareLabel={comparisonStats.label}
            />
          )}
        </div>
      </div>

      {/* Headshot Percentage */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        <div className="lg:col-span-5 bg-card rounded-lg p-6 border border-kanaliiga-light-brown/20">
          <h3 className="text-lg font-semibold mb-4 text-kanaliiga-orange">
            Headshot Percentage Over Time
          </h3>
          <ChartContainer config={headshotChartConfig} className="h-80 w-full">
            <LineChart data={chartData.headshotData} onClick={handleChartClick}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="match"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `#${value}`}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => `Match: #${value}`}
                    formatter={(value, name, props) => [
                      `${value}%`,
                      name === "value" ? "Headshot %" : "Average",
                      props.payload?.date ? ` (${props.payload.date})` : ""
                    ]}
                  />
                }
              />
              {leagueAverages && (
                <ReferenceLine
                  y={leagueAverages.avg_hs_percent}
                  stroke="var(--color-avg)"
                  strokeDasharray="5 5"
                  label={`Kanaliiga Avg (${leagueAverages.avg_hs_percent?.toFixed(1) || 0}%)`}
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={3}
                dot={{ r: 4, cursor: "pointer" }}
              />
            </LineChart>
          </ChartContainer>
        </div>

        <div className="lg:col-span-2">
          {showComparison && comparisonStats && (
            <ComparisonPanel
              title="Headshot %"
              playerValue={currentPlayerStats.headshotPercentage}
              compareValue={comparisonStats.headshotPercentage}
              avgValue={leagueAverages?.avg_hs_percent || 0}
              unit="%"
              compareLabel={comparisonStats.label}
            />
          )}
        </div>
      </div>
    </div>
  );
};
