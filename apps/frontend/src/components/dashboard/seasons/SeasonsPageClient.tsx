"use client";

import { useState, useMemo } from "react";
import { SeasonForm } from "@/components/dashboard/seasons/SeasonForm";
import {
  type SeasonFormRaw,
  type Season,
  type SeasonFormValues
} from "@eggosystem/types";
import { toast } from "sonner";
import { clientApiFetch } from "@/lib/apiClient";
import { useAllSeasons } from "@/hooks/data/useAllSeasons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function SeasonsPageClient() {
  const { seasons, isLoading } = useAllSeasons();
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showAllSeasons, setShowAllSeasons] = useState(false);

  const handleCreateNew = () => {
    setSelectedSeason(null);
    setIsCreating(true);
  };

  const handleEdit = (season: Season) => {
    setSelectedSeason(season);
    setIsCreating(false);
  };

  const handleCancel = () => {
    setSelectedSeason(null);
    setIsCreating(false);
  };

  const handleSubmit = async (data: SeasonFormRaw) => {
    try {
      // Add timezone information to the request
      const requestData = {
        ...data,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      };

      if (selectedSeason) {
        // Update existing season
        await clientApiFetch(`/api/v1/dashboard/seasons/${selectedSeason.id}`, {
          method: "PUT",
          body: JSON.stringify(requestData)
        });
        toast.success(`Season updated successfully!`);
        setSelectedSeason(null);
      } else {
        // Create new season
        const result = await clientApiFetch<{ seasonId: number }>(
          "/api/v1/dashboard/seasons",
          {
            method: "POST",
            body: JSON.stringify(requestData)
          }
        );
        toast.success(`Season created successfully! ID: ${result.seasonId}`);
        setIsCreating(false);
      }
    } catch (error) {
      console.error("Error saving season:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save season"
      );
      throw error; // Re-throw to let the form handle the error state
    }
  };

  // Convert Season to SeasonFormValues for editing
  const getInitialValues = (season: Season): Partial<SeasonFormValues> => {
    return {
      game_id: season.game_id,
      game_type_id: season.game_type_id,
      organizer_id: season.organizer_id,
      name: season.name,
      full_name: season.full_name,
      signup_start_date: season.signup_start_date || null,
      signup_end_date: season.signup_end_date || null,
      start_date: season.start_date,
      end_date: season.end_date || null,
      platform: season.platform,
      is_round_robin_bo2_as_2xbo1: season.is_round_robin_bo2_as_2xbo1,
      payment_link: season.payment_link || null,
      registration_price: season.registration_price ?? null,
      has_vat: season.has_vat,
      early_bird_price_discount: season.early_bird_price_discount ?? null,
      early_bird_price_discount_end_date:
        season.early_bird_price_discount_end_date || null
    };
  };

  // Categorize seasons
  const categorizedSeasons = useMemo(() => {
    if (!seasons) return null;

    const now = new Date();
    const currentSeasons: Season[] = [];
    const upcomingSeasons: Season[] = [];
    const pastSeasons: Season[] = [];

    seasons.forEach((season) => {
      const startDate = new Date(season.start_date);
      const endDate = season.end_date ? new Date(season.end_date) : null;

      if (startDate <= now && (!endDate || endDate >= now)) {
        // Current/Active season
        currentSeasons.push(season);
      } else if (startDate > now) {
        // Upcoming season
        upcomingSeasons.push(season);
      } else {
        // Past season
        pastSeasons.push(season);
      }
    });

    // Sort upcoming seasons by start date (earliest first)
    upcomingSeasons.sort(
      (a, b) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );

    // Sort past seasons by end date (most recent first)
    pastSeasons.sort((a, b) => {
      const aEnd = a.end_date ? new Date(a.end_date).getTime() : 0;
      const bEnd = b.end_date ? new Date(b.end_date).getTime() : 0;
      return bEnd - aEnd;
    });

    const lastSeason = pastSeasons[0] || null;
    const currentSeason = currentSeasons[0] || null;
    const upcomingSeason = upcomingSeasons[0] || null;
    const otherSeasons = pastSeasons.slice(1); // All past seasons except the most recent

    return {
      lastSeason,
      currentSeason,
      currentSeasons,
      upcomingSeason,
      upcomingSeasons: upcomingSeasons.slice(1),
      otherSeasons
    };
  }, [seasons]);

  // Show form if creating or editing
  if (isCreating || selectedSeason) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={handleCancel}>
          ← Back to List
        </Button>
        <SeasonForm
          onSubmit={handleSubmit}
          initialValues={
            selectedSeason ? getInitialValues(selectedSeason) : undefined
          }
          mode={selectedSeason ? "edit" : "create"}
        />
      </div>
    );
  }

  // Render a season card
  const renderSeasonCard = (
    season: Season,
    badgeText?: string,
    badgeVariant?: "default" | "secondary" | "outline" | "destructive"
  ) => (
    <Card key={season.id}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-medium">
            {season.full_name}
          </CardTitle>
          {badgeText && (
            <Badge variant={badgeVariant || "default"}>{badgeText}</Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => handleEdit(season)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-medium">Short Name:</span> {season.name}
          </div>
          <div>
            <span className="font-medium">Platform:</span> {season.platform}
          </div>
          <div>
            <span className="font-medium">Start Date:</span>{" "}
            {new Date(season.start_date).toLocaleDateString()}
          </div>
          <div>
            <span className="font-medium">End Date:</span>{" "}
            {season.end_date
              ? new Date(season.end_date).toLocaleDateString()
              : "Ongoing"}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Show list of seasons
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Existing Seasons</h2>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Season
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center">
            Loading seasons...
          </CardContent>
        </Card>
      ) : categorizedSeasons ? (
        <div className="space-y-6">
          {/* Current Season */}
          {categorizedSeasons.currentSeason && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Current Season
              </h3>
              {renderSeasonCard(
                categorizedSeasons.currentSeason,
                "Active",
                "default"
              )}
            </div>
          )}

          {/* Show additional current seasons if any */}
          {categorizedSeasons.currentSeasons.length > 1 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Other Active Seasons
              </h3>
              <div className="grid gap-4">
                {categorizedSeasons.currentSeasons
                  .slice(1)
                  .map((season) =>
                    renderSeasonCard(season, "Active", "default")
                  )}
              </div>
            </div>
          )}

          {/* Upcoming Season */}
          {categorizedSeasons.upcomingSeason && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Upcoming Season
              </h3>
              {renderSeasonCard(
                categorizedSeasons.upcomingSeason,
                "Upcoming",
                "secondary"
              )}
            </div>
          )}

          {/* Show additional upcoming seasons if any */}
          {categorizedSeasons.upcomingSeasons.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Other Upcoming Seasons
              </h3>
              <div className="grid gap-4">
                {categorizedSeasons.upcomingSeasons.map((season) =>
                  renderSeasonCard(season, "Upcoming", "secondary")
                )}
              </div>
            </div>
          )}

          {/* Last Season */}
          {categorizedSeasons.lastSeason && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Last Season
              </h3>
              {renderSeasonCard(
                categorizedSeasons.lastSeason,
                "Completed",
                "outline"
              )}
            </div>
          )}

          {/* Other Historical Seasons */}
          {categorizedSeasons.otherSeasons.length > 0 && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                onClick={() => setShowAllSeasons(!showAllSeasons)}
                className="w-full flex items-center justify-between"
              >
                <span className="text-lg font-semibold">
                  Historical Seasons ({categorizedSeasons.otherSeasons.length})
                </span>
                {showAllSeasons ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </Button>

              {showAllSeasons && (
                <div className="grid gap-4">
                  {categorizedSeasons.otherSeasons.map((season) =>
                    renderSeasonCard(season, "Completed", "outline")
                  )}
                </div>
              )}
            </div>
          )}

          {/* No seasons at all */}
          {!categorizedSeasons.currentSeason &&
            !categorizedSeasons.upcomingSeason &&
            !categorizedSeasons.lastSeason &&
            categorizedSeasons.otherSeasons.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No seasons found. Create your first season!
                </CardContent>
              </Card>
            )}
        </div>
      ) : null}
    </div>
  );
}
