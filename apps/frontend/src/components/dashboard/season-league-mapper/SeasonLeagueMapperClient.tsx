"use client";

import { useState, useMemo } from "react";
import {
  useSeasonLeaguesWithMappings,
  useDeleteSeasonLeagueExternalId
} from "@/hooks/data/dashboard/useSeasonLeagueMapper";
import useSWR from "swr";
import { clientApiFetch } from "@/lib/apiClient";
import type { Season, SeasonLeagueExternalId } from "@eggosystem/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { SeasonSelector } from "@/components/sortter/SeasonSelector";
import { LeagueNameEditor } from "./LeagueNameEditor";
import { MappingFormDialog } from "./MappingFormDialog";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  AlertTriangle
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";

export function SeasonLeagueMapperClient() {
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [expandedLeagues, setExpandedLeagues] = useState<Set<number>>(
    new Set()
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogLeagueId, setDialogLeagueId] = useState<number | null>(null);
  const [dialogLeagueName, setDialogLeagueName] = useState<string>("");
  const [editingMapping, setEditingMapping] = useState<
    SeasonLeagueExternalId | undefined
  >(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mappingToDelete, setMappingToDelete] = useState<number | null>(null);

  // Fetch seasons
  const { data: seasons, isLoading: isLoadingSeasons } = useSWR<Season[]>(
    "/api/v1/seasons",
    clientApiFetch,
    { revalidateOnFocus: false }
  );

  // Sort seasons in descending order (newest first)
  const sortedSeasons = useMemo(() => {
    if (!seasons) return [];
    return [...seasons].sort((a, b) => b.id - a.id);
  }, [seasons]);

  // Fetch season leagues with mappings
  const { data: seasonLeagues, isLoading: isLoadingLeagues } =
    useSeasonLeaguesWithMappings(selectedSeason);

  const deleteMutation = useDeleteSeasonLeagueExternalId();

  // Detect duplicate league names
  const duplicateLeagueNames = useMemo(() => {
    if (!seasonLeagues) return new Set<string>();
    const nameCount = new Map<string, number>();
    seasonLeagues.forEach((sl) => {
      nameCount.set(sl.league_name, (nameCount.get(sl.league_name) || 0) + 1);
    });
    return new Set(
      Array.from(nameCount.entries())
        .filter(([_, count]) => count > 1)
        .map(([name]) => name)
    );
  }, [seasonLeagues]);

  const toggleLeague = (leagueId: number) => {
    setExpandedLeagues((prev) => {
      const next = new Set(prev);
      if (next.has(leagueId)) {
        next.delete(leagueId);
      } else {
        next.add(leagueId);
      }
      return next;
    });
  };

  const handleAddMapping = (leagueId: number, leagueName: string) => {
    setDialogLeagueId(leagueId);
    setDialogLeagueName(leagueName);
    setEditingMapping(undefined);
    setDialogOpen(true);
  };

  const handleEditMapping = (
    mapping: SeasonLeagueExternalId,
    leagueName: string
  ) => {
    setDialogLeagueId(mapping.league_id);
    setDialogLeagueName(leagueName);
    setEditingMapping(mapping);
    setDialogOpen(true);
  };

  const handleDeleteClick = (mappingId: number) => {
    setMappingToDelete(mappingId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (mappingToDelete) {
      await deleteMutation.mutateAsync(mappingToDelete);
      setDeleteDialogOpen(false);
      setMappingToDelete(null);
    }
  };

  const hasDuplicates = duplicateLeagueNames.size > 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Season League Mapper
          </h1>
          <p className="text-muted-foreground">
            Manage external championship ID mappings and league names
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Season:</span>
          <SeasonSelector
            seasons={sortedSeasons || []}
            selectedSeason={selectedSeason}
            onChange={setSelectedSeason}
            isLoading={isLoadingSeasons}
          />
        </div>

        {hasDuplicates && (
          <div className="flex items-start gap-2 p-3 border border-orange-400 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div>
              <h5 className="text-sm font-medium text-orange-800 dark:text-orange-300">
                Duplicate League Names Detected
              </h5>
              <p className="text-sm text-orange-700 dark:text-orange-400">
                Some leagues have duplicate names. This may be due to
                FaceIT&apos;s copy functionality. Click the pencil icon to
                rename them.
              </p>
            </div>
          </div>
        )}
      </div>

      {!selectedSeason ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please select a season to view its leagues and mappings.
            </p>
          </CardContent>
        </Card>
      ) : isLoadingLeagues ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center p-12">
              <Spinner size="lg" />
              <span className="ml-4 text-muted-foreground">
                Loading season leagues...
              </span>
            </div>
          </CardContent>
        </Card>
      ) : !seasonLeagues || seasonLeagues.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No leagues found for this season.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Season Leagues</CardTitle>
            <CardDescription>
              Click on a league to view its external championship mappings.
              {hasDuplicates && " Duplicate names are highlighted in orange."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {seasonLeagues.map((league) => {
                const isExpanded = expandedLeagues.has(league.league_id);
                const isDuplicate = duplicateLeagueNames.has(
                  league.league_name
                );
                const mappings = league.mappings || [];

                return (
                  <div
                    key={league.league_id}
                    className="border rounded-lg overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-4 bg-muted/50 hover:bg-muted/70 transition-colors">
                      <div className="flex items-center gap-3 flex-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleLeague(league.league_id)}
                          className="h-8 w-8 p-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <div>
                          <LeagueNameEditor
                            leagueId={league.league_id}
                            initialName={league.league_name}
                            isDuplicate={isDuplicate}
                          />
                          <p className="text-xs text-muted-foreground">
                            Tier {league.tier} • {mappings.length} mapping
                            {mappings.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleAddMapping(league.league_id, league.league_name)
                        }
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Mapping
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="p-4 border-t bg-background">
                        {mappings.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No mappings yet. Click &quot;Add Mapping&quot; to
                            create one.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {mappings.map((mapping) => (
                              <div
                                key={mapping.id}
                                className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm font-medium">
                                      {mapping.external_id}
                                    </span>
                                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                                      {mapping.stage_id === 1
                                        ? "Regular"
                                        : "Playoff"}
                                    </span>
                                    <span className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded">
                                      {mapping.type === "roundRobin"
                                        ? "Round Robin"
                                        : mapping.type === "doubleElimination"
                                          ? "Double Elimination"
                                          : "Single Elimination"}
                                    </span>
                                    {mapping.manual_group && (
                                      <span className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 rounded">
                                        Group {mapping.manual_group}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {mapping.external_league_name}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      handleEditMapping(
                                        mapping,
                                        league.league_name
                                      )
                                    }
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      handleDeleteClick(mapping.id)
                                    }
                                    className="text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mapping Form Dialog */}
      {dialogLeagueId && selectedSeason && (
        <MappingFormDialog
          isOpen={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setEditingMapping(undefined);
          }}
          seasonId={selectedSeason}
          leagueId={dialogLeagueId}
          leagueName={dialogLeagueName}
          editingMapping={editingMapping}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the mapping. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
