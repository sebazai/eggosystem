"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import { XAxis, YAxis, Area, AreaChart } from "recharts";

// Enhanced line chart component using shadcn Chart
const MiniChart = ({ data }: { data: number[] }) => {
  // Transform data for recharts and sort from max to min
  const chartData = data
    .map((value, index) => ({
      season: index + 1,
      kanaelo: value
    }))
    .sort((a, b) => b.kanaelo - a.kanaelo);

  const chartConfig = {
    kanaelo: {
      label: "Kanaelo",
      color: "hsl(var(--primary))"
    }
  } satisfies ChartConfig;

  return (
    <div className="w-86 h-24 p-1">
      <ChartContainer config={chartConfig}>
        <AreaChart
          data={chartData}
          margin={{ top: 5, right: 8, left: 8, bottom: 5 }}
        >
          <defs>
            <linearGradient id="fillKanaelo" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="var(--color-kanaelo)"
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor="var(--color-kanaelo)"
                stopOpacity={0.05}
              />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="season"
            axisLine={true}
            tickLine={true}
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(value) => value.toString()}
            tickMargin={2}
          />
          <YAxis
            axisLine={true}
            tickLine={true}
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(value) => value.toString()}
            domain={["dataMin - 5", "dataMax + 5"]}
            tickMargin={2}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(label) => `Season ${label}`}
                formatter={(value, _name) => [value, "Kanaelo"]}
              />
            }
          />
          <Area
            dataKey="kanaelo"
            type="monotone"
            fill="url(#fillKanaelo)"
            stroke="var(--color-kanaelo)"
            strokeWidth={2}
            dot={{
              fill: "var(--color-kanaelo)",
              strokeWidth: 1.5,
              r: 3,
              stroke: "hsl(var(--background))"
            }}
            activeDot={{
              r: 5,
              stroke: "var(--color-kanaelo)",
              strokeWidth: 2,
              fill: "var(--color-kanaelo)"
            }}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
};

// Color scheme that changes every 12 teams with vibrant middle shades
const getRowColorClass = (index: number) => {
  const colorGroups = [
    // Teams 1-12: Red (vibrant middle shade)
    "bg-red-200 border-red-300 dark:bg-red-800/40 dark:border-red-700/40",
    // Teams 13-24: Purple (vibrant middle shade)
    "bg-purple-200 border-purple-300 dark:bg-purple-800/40 dark:border-purple-700/40",
    // Teams 25-36: Blue (vibrant middle shade)
    "bg-blue-200 border-blue-300 dark:bg-blue-800/40 dark:border-blue-700/40"
  ];

  const groupIndex = Math.floor(index / 12) % colorGroups.length;
  return colorGroups[groupIndex];
};

// Generate 36 dummy teams for 3 leagues
const generateDummyTeams = () => {
  const teamNames = [
    "JS AUTOMATION",
    "Digia Vengers",
    "Valtori",
    "ALM Partners",
    "TietoEVRY",
    "Reaktor",
    "Futurice",
    "Vincit",
    "Gofore",
    "Solita",
    "Eficode",
    "Adven",
    "Siili Solutions",
    "Cybercom",
    "Knowit",
    "Bouvet",
    "Contribyte",
    "Elisa",
    "Telia",
    "DNA",
    "Supercell",
    "Rovio",
    "Remedy",
    "Next Games",
    "Fingersoft",
    "Varjo",
    "Dispelix",
    "Kuusakoski",
    "Kone",
    "Wärtsilä",
    "Neste",
    "Fortum",
    "UPM",
    "Stora Enso",
    "Metsä Group",
    "Fazer"
  ];

  return teamNames.map((name, index) => ({
    id: index + 1,
    team: name,
    kanapoints: {
      total: Math.floor(1700 - index * 15 + Math.random() * 50),
      avg: Math.floor((350 - index * 3 + Math.random() * 20) * 1000) / 1000
    },
    sarjataso: Math.floor(index / 12) + 1,
    chartData: Array.from({ length: 5 }, (_, i) =>
      Math.floor(350 - index * 3 + Math.random() * 30 + i * 2)
    ),
    comments:
      index < 10
        ? `kausi: 15 taso:${Math.floor(index / 4) + 1} kausi: 14 taso:${Math.floor(index / 4) + 1} kausi: 13 taso:${Math.floor(index / 3) + 1}`
        : ""
  }));
};

const dummyTeams = generateDummyTeams();

export default function SortterPage() {
  const [comments, setComments] = useState<{ [key: number]: string }>({});

  const handleCommentChange = (teamId: number, value: string) => {
    setComments((prev) => ({ ...prev, [teamId]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sortter</h1>
        <p className="text-muted-foreground">
          Team ranking management and analysis tool
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Rankings</CardTitle>
          <CardDescription>
            View and manage team rankings with kanapoints analysis (3 leagues:{" "}
            {dummyTeams.length} teams)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b">
                  <th className="text-left p-2 font-medium text-xs w-16">ID</th>
                  <th className="text-left p-2 font-medium text-xs w-44">
                    Team
                  </th>
                  <th className="text-left p-2 font-medium text-xs w-32">
                    Kanapoints (sum 5 / avg4)
                  </th>
                  <th className="text-left p-2 font-medium text-xs w-20">
                    League
                  </th>
                  <th className="text-center p-2 font-medium text-xs w-96">
                    Graph
                  </th>
                  <th className="text-left p-2 font-medium text-xs w-96">
                    Comments
                  </th>
                </tr>
              </thead>
              <tbody>
                {dummyTeams.map((team, index) => (
                  <tr
                    key={team.id}
                    className={`border-b ${getRowColorClass(index)} transition-colors hover:bg-opacity-80`}
                  >
                    <td className="p-2 font-medium text-xs">{team.id}</td>
                    <td className="p-2 font-medium text-xs">{team.team}</td>
                    <td className="p-2 text-xs">
                      <div className="font-medium">
                        {team.kanapoints.total} / {team.kanapoints.avg}
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge variant="secondary" className="text-xs">
                        {team.sarjataso}
                      </Badge>
                    </td>
                    <td className="p-1">
                      <MiniChart data={team.chartData} />
                    </td>
                    <td className="p-2">
                      <Textarea
                        placeholder="Add comments..."
                        value={comments[team.id] || team.comments}
                        onChange={(e) =>
                          handleCommentChange(team.id, e.target.value)
                        }
                        className="text-xs bg-background/80 w-[360px] h-[192px] resize-none overflow-hidden"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
