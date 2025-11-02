"use client";

import { useState } from "react";
import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePreparePlayerForSignup } from "@/hooks/data/dashboard/usePreparePlayerForSignup";
import { extractErrorMessage } from "@/lib/apiClient";

export default function PreparePlayerForSignupPage() {
  const [steamId, setSteamId] = useState<string>("");
  const [success, setSuccess] = useState<string | null>(null);
  const [changesMade, setChangesMade] = useState<boolean>(false);
  const [resultData, setResultData] = useState<{
    account_id: number;
    steam_id: string;
  } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const { isPreparing, error, preparePlayer, clearError } =
    usePreparePlayerForSignup();

  const handlePrepare = async () => {
    if (!steamId.trim()) {
      setApiError("Please enter a Steam ID");
      return;
    }

    setSuccess(null);
    setApiError(null);
    setChangesMade(false);
    setResultData(null);
    clearError();

    try {
      const result = await preparePlayer(steamId);
      setChangesMade(result.changes_made);
      if (result.changes_made) {
        setSuccess(
          `Player prepared successfully! Account ID: ${result.account_id}, Steam ID: ${result.steam_id}`
        );
        setResultData(null); // Don't need detailed info when changes were made
      } else {
        setSuccess(
          `Profile validation complete - all required fields are already set correctly. No changes were made.`
        );
        setResultData({
          account_id: result.account_id,
          steam_id: result.steam_id
        });
      }
    } catch (err) {
      console.error("Failed to prepare player:", err);
      setSuccess(null);
      setChangesMade(false);
      setResultData(null);

      // Handle API errors with RFC 7807 format
      setApiError(
        extractErrorMessage(
          err,
          "An unexpected error occurred while preparing the player"
        )
      );
    }
  };

  const handleSteamIdChange = (value: string) => {
    setSteamId(value);
    // Clear errors when user types
    if (apiError || error) {
      setApiError(null);
      clearError();
    }
    if (success) {
      setSuccess(null);
      setChangesMade(false);
      setResultData(null);
    }
  };

  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <div className="flex flex-1 flex-col gap-6 p-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Prepare Player for Signup
          </h1>
          <p className="text-muted-foreground">
            Create or update a player&apos;s account and SteamPlayers profile
            with fake data to make them ready for signup. This is useful when
            accepting teams from signup drafts where players don&apos;t have
            complete account data. Ranks still need to be added manually.
          </p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Prepare Player</CardTitle>
            <CardDescription>
              Enter a Steam ID to create or update the player&apos;s account and
              profile with fake data required for signup validation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="steam-id">Steam ID</Label>
              <Input
                id="steam-id"
                placeholder="Enter Steam ID (SteamID64, SteamID, SteamID3, or Steam URL)"
                value={steamId}
                onChange={(e) => handleSteamIdChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && steamId.trim() && !isPreparing) {
                    handlePrepare();
                  }
                }}
                data-testid="steam-id-input"
              />
            </div>

            {/* Error Display */}
            {(apiError || error) && (
              <Alert variant="destructive" data-testid="error-message">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{apiError || error}</AlertDescription>
              </Alert>
            )}

            {/* Success/Info Message */}
            {success && (
              <Alert
                variant="default"
                className={
                  changesMade
                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                    : "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                }
                data-testid={changesMade ? "success-message" : "info-message"}
              >
                <CheckCircle
                  className={`h-4 w-4 ${
                    changesMade ? "text-green-500" : "text-blue-500"
                  }`}
                />
                <AlertDescription
                  className={
                    changesMade
                      ? "text-green-700 dark:text-green-300"
                      : "text-blue-700 dark:text-blue-300"
                  }
                >
                  {changesMade ? (
                    success
                  ) : (
                    <div className="space-y-2">
                      <p className="font-semibold">{success}</p>
                      {resultData && (
                        <div className="mt-2 space-y-1 text-sm">
                          <p>
                            <strong>Account ID:</strong> {resultData.account_id}
                          </p>
                          <p>
                            <strong>Steam ID:</strong> {resultData.steam_id}
                          </p>
                          <div className="mt-3 border-t border-blue-200 dark:border-blue-800 pt-2">
                            <p className="font-medium mb-1">
                              Validated fields:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-xs">
                              <li>Nickname is set</li>
                              <li>Full name is valid (contains space)</li>
                              <li>Work email is valid and verified</li>
                              <li>Work email is not marked as personal</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Prepare Button */}
            <Button
              onClick={handlePrepare}
              disabled={!steamId.trim() || isPreparing}
              className="w-full"
              data-testid="prepare-button"
            >
              {isPreparing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Preparing Player...
                </>
              ) : (
                "Prepare Player for Signup"
              )}
            </Button>

            {/* Info Alert */}
            <Alert
              variant="default"
              className="border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            >
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                <strong>Note:</strong> This will create/update the player&apos;s
                account with fake data (nickname, email, full name) and set
                work_email_verified to true. UserPolicyAcceptance will NOT be
                set. After preparing, you still need to add ranks manually if
                they don&apos;t exist.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </WithRoleProtection>
  );
}
