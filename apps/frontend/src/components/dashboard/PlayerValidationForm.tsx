"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { SteamIdInput } from "@/components/ui/steam-id-input";
import { SelectedSeasonBadge } from "@/components/dashboard/SelectedSeasonBadge";

interface PlayerValidationFormProps {
  steamId: string;
  setSteamId: (value: string) => void;
  seasonId: string;
  isValidating: boolean;
  error: string | null;
  success?: string | null;
  onValidate: () => void | Promise<void>;
  buttonText?: string;
  disabled?: boolean;
  "data-testid"?: string;
}

export function PlayerValidationForm({
  steamId,
  setSteamId,
  seasonId,
  isValidating,
  error,
  success,
  onValidate,
  buttonText = "Validate Player",
  disabled = false,
  "data-testid": testId = "validate-player-button"
}: PlayerValidationFormProps) {
  const isFormDisabled = isValidating || !steamId || !seasonId || disabled;

  return (
    <div className="space-y-4">
      {/* Steam ID Input */}
      <SteamIdInput
        id="steamId"
        value={steamId}
        onChange={setSteamId}
        label="Steam ID"
        placeholder="Enter Steam ID"
        disabled={isValidating}
        convertOnBlur={true}
        data-testid="steam-id-input"
      />

      {/* Season Badge - Season is managed by shared selector */}
      {seasonId && (
        <div className="space-y-2">
          <Label htmlFor="season">Season</Label>
          <SelectedSeasonBadge />
        </div>
      )}

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
