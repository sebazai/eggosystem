"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import type { Season } from "@eggosystem/types";

interface PlayerValidationFormProps {
  steamId: string;
  setSteamId: (value: string) => void;
  seasonId: string;
  setSeasonId: (value: string) => void;
  seasons: Season[] | undefined;
  isLoadingSeasons: boolean;
  isValidating: boolean;
  error: string | null;
  success?: string | null;
  onValidate: () => void | Promise<void>;
  activeSeason?: { season_id: number } | null;
  buttonText?: string;
  disabled?: boolean;
  "data-testid"?: string;
}

export function PlayerValidationForm({
  steamId,
  setSteamId,
  seasonId,
  setSeasonId,
  seasons,
  isLoadingSeasons,
  isValidating,
  error,
  success,
  onValidate,
  activeSeason,
  buttonText = "Validate Player",
  disabled = false,
  "data-testid": testId = "validate-player-button"
}: PlayerValidationFormProps) {
  const isFormDisabled = isValidating || !steamId || !seasonId || disabled;

  return (
    <div className="space-y-4">
      {/* Steam ID Input */}
      <div className="space-y-2">
        <Label htmlFor="steamId">Steam ID</Label>
        <Input
          id="steamId"
          type="text"
          placeholder="Enter Steam ID"
          value={steamId}
          onChange={(e) => setSteamId(e.target.value)}
          disabled={isValidating}
          data-testid="steam-id-input"
        />
      </div>

      {/* Season Selector */}
      <div className="space-y-2">
        <Label htmlFor="season">Season</Label>
        <Select
          value={seasonId}
          onValueChange={setSeasonId}
          disabled={isValidating}
          data-testid="season-select"
        >
          <SelectTrigger data-testid="season-selector">
            <SelectValue placeholder="Select a season" />
          </SelectTrigger>
          <SelectContent data-testid="season-dropdown">
            {isLoadingSeasons ? (
              <SelectItem
                value="loading"
                disabled
                data-testid="loading-season-option"
              >
                Loading seasons...
              </SelectItem>
            ) : seasons && seasons.length > 0 ? (
              seasons
                .sort((a, b) => b.id - a.id) // Sort by ID descending (newest first)
                .map((season) => (
                  <SelectItem
                    key={season.id}
                    value={season.id.toString()}
                    data-value={season.id.toString()}
                    data-testid={`season-option-${season.id}`}
                  >
                    {season.full_name}
                    {activeSeason?.season_id === season.id && " (Active)"}
                  </SelectItem>
                ))
            ) : (
              <SelectItem
                value="no-seasons"
                disabled
                data-testid="no-seasons-option"
              >
                No seasons available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Validate Button */}
      <Button
        onClick={onValidate}
        disabled={isFormDisabled}
        className="w-full"
        data-testid={testId}
      >
        {isValidating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Validating...
          </>
        ) : (
          buttonText
        )}
      </Button>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive" data-testid="error-message">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {success && (
        <Alert
          variant="default"
          className="border-green-500 bg-green-50 dark:bg-green-900/20"
          data-testid="success-message"
        >
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700 dark:text-green-300">
            {success}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
