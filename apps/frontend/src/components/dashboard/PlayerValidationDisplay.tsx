"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import { SeasonPlatform, type PlayerValidationResult } from "@eggosystem/types";
import { FaceITLevelIcon } from "@/components/profile/FaceITLevelIcon";
import { CS2PremierRankBadge } from "@/components/profile/CS2PremierRankBadge";

interface PlayerValidationDisplayProps {
  validationResult: PlayerValidationResult;
  platform?: SeasonPlatform | null;
  variant?: "compact" | "detailed";
}

export function PlayerValidationDisplay({
  validationResult,
  platform,
  variant = "detailed"
}: PlayerValidationDisplayProps) {
  const getStatusIcon = (success: boolean, size: "sm" | "md" = "sm") => {
    const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
    return success ? (
      <CheckCircle className={`${iconSize} text-green-500`} />
    ) : (
      <XCircle className={`${iconSize} text-red-500`} />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge variant="default" className="bg-green-500">
        Valid
      </Badge>
    ) : (
      <Badge variant="destructive">Invalid</Badge>
    );
  };

  const compactView = variant === "compact";

  return (
    <Card>
      <CardHeader>
        <CardTitle
          className="flex items-center gap-2"
          data-testid={
            validationResult.overall_success
              ? "validation-success"
              : "validation-failure"
          }
        >
          {validationResult.overall_success ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              Player Validated
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-red-500" />
              Validation Failed
            </>
          )}
        </CardTitle>
        <CardDescription>
          {compactView
            ? "Player validation results for season requirements"
            : `Steam ID: ${validationResult.steam_id} | Season: ${validationResult.season_id} | Platform: ${platform || "Unknown"}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {compactView ? (
          // Compact view for add player page
          <>
            {/* Profile Validation */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                {getStatusIcon(validationResult.profile.success)}
                Profile
              </h3>
              {validationResult.profile.success &&
              validationResult.profile.data ? (
                <div className="text-sm space-y-1">
                  <div>Name: {validationResult.profile.data.nickname}</div>
                  <div>
                    Discord:{" "}
                    {validationResult.profile.data.discord || "Not set"}
                  </div>
                  <div>
                    Email Verified:{" "}
                    {validationResult.profile.data.work_email_verified
                      ? "Yes"
                      : "No"}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-red-600">
                  {validationResult.profile.error || "Profile not found"}
                </div>
              )}
            </div>

            {/* Hours Validation */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                {getStatusIcon(validationResult.hours.success)}
                Hours Requirement
              </h3>
              <div className="text-sm">
                {validationResult.hours.success ? (
                  <div>Hours: {validationResult.hours.value}</div>
                ) : (
                  <div className="text-red-600">
                    {validationResult.hours.error ||
                      "Hours requirement not met"}
                  </div>
                )}
              </div>
            </div>

            {/* Rank Validation */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                {getStatusIcon(validationResult.rank.success)}
                CS2 Rank
              </h3>
              <div className="text-sm">
                {validationResult.rank.success ? (
                  <div>Rank: {validationResult.rank.value}</div>
                ) : (
                  <div className="text-red-600">
                    {validationResult.rank.error || "Rank requirement not met"}
                  </div>
                )}
              </div>
            </div>

            {/* Platform Rank Validation */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                {getStatusIcon(validationResult.platform_rank.success)}
                Platform Rank
              </h3>
              <div className="text-sm">
                {validationResult.platform_rank.success ? (
                  <div>Level: {validationResult.platform_rank.value}</div>
                ) : (
                  <div className="text-red-600">
                    {validationResult.platform_rank.error ||
                      "Platform rank requirement not met"}
                  </div>
                )}
              </div>
            </div>

            <Alert
              variant={
                validationResult.overall_success ? "default" : "destructive"
              }
              data-testid="validation-message"
            >
              <AlertDescription>
                {validationResult.overall_success
                  ? "Player meets all season requirements and can proceed to eligibility check."
                  : "Player does not meet all season requirements. Please resolve validation issues before proceeding."}
              </AlertDescription>
            </Alert>

            {/* Link to detailed validation when there are issues */}
            {!validationResult.overall_success && (
              <div className="mt-4 p-4 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100">
                      Need detailed validation analysis?
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      View comprehensive validation details and troubleshooting
                      information on the validation page.
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/players/validate?steamId=${encodeURIComponent(validationResult.steam_id)}&seasonId=${validationResult.season_id}`}
                    className="ml-4 inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-800 dark:text-blue-100 dark:border-blue-600 dark:hover:bg-blue-700"
                  >
                    View Details
                    <svg
                      className="ml-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            )}
          </>
        ) : (
          // Detailed view for validate page
          <>
            {/* Hours Validation */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(validationResult.hours.success, "md")}
                <div>
                  <h4 className="font-medium">Steam Hours</h4>
                  <p className="text-sm text-muted-foreground">
                    {validationResult.hours.success
                      ? `${validationResult.hours.value} hours`
                      : "Could not determine hours"}
                  </p>
                </div>
              </div>
              {getStatusBadge(validationResult.hours.success)}
            </div>

            {/* Rank Validation */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(validationResult.rank.success, "md")}
                <div>
                  <h4 className="font-medium">CS2 Rank</h4>
                  <p className="text-sm text-muted-foreground">
                    {validationResult.rank.success
                      ? `Rank: ${validationResult.rank.value}`
                      : "Could not determine rank"}
                  </p>
                </div>
                {validationResult.rank.success && (
                  <CS2PremierRankBadge
                    rankScore={validationResult.rank.value}
                  />
                )}
              </div>
              {getStatusBadge(validationResult.rank.success)}
            </div>

            {/* Platform Rank Validation */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(validationResult.platform_rank.success, "md")}
                <div>
                  <h4 className="font-medium">{platform} Rank</h4>
                  <p className="text-sm text-muted-foreground">
                    {validationResult.platform_rank.success
                      ? `Level: ${validationResult.platform_rank.value}`
                      : "Could not determine platform rank"}
                  </p>
                </div>
                {validationResult.platform_rank.success &&
                  platform === SeasonPlatform.FACEIT && (
                    <FaceITLevelIcon
                      level={validationResult.platform_rank.value}
                    />
                  )}
              </div>
              {getStatusBadge(validationResult.platform_rank.success)}
            </div>

            {/* Profile Validation */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(
                  Boolean(
                    validationResult.profile.success &&
                      validationResult.profile.data?.work_email_verified &&
                      validationResult.profile.data?.is_valid_full_name &&
                      validationResult.profile.data?.is_valid_work_email
                  ),
                  "md"
                )}
                <div>
                  <h4 className="font-medium">Kanahub Profile</h4>
                  {validationResult.profile.data ? (
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>
                        Nickname:{" "}
                        {validationResult.profile.data.nickname || "Not set"}
                      </p>
                      <p>
                        Discord (captains only):{" "}
                        {validationResult.profile.data.discord || "Not set"}
                      </p>
                      <p>
                        Email Verified:{" "}
                        {validationResult.profile.data.work_email_verified
                          ? "Yes"
                          : "No"}
                      </p>
                      <p>
                        Valid Name:{" "}
                        {validationResult.profile.data.is_valid_full_name
                          ? "Yes"
                          : "No"}
                      </p>
                      <p>
                        Valid Work Email:{" "}
                        {validationResult.profile.data.is_valid_work_email
                          ? "Yes"
                          : "No"}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {validationResult.profile.error || "Profile not found"}
                    </p>
                  )}
                </div>
              </div>
              {getStatusBadge(
                Boolean(
                  validationResult.profile.success &&
                    validationResult.profile.data?.work_email_verified &&
                    validationResult.profile.data?.is_valid_full_name &&
                    validationResult.profile.data?.is_valid_work_email
                )
              )}
            </div>

            {/* Overall Result */}
            <div
              className={`p-4 border rounded-lg ${
                validationResult.overall_success
                  ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                  : "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
              }`}
            >
              <div className="flex items-center space-x-3">
                {validationResult.overall_success ? (
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                )}
                <div>
                  <h4 className="font-medium">
                    {validationResult.overall_success
                      ? "Player is ready to be added to team"
                      : "Player has validation issues"}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {validationResult.overall_success
                      ? "All required data is available and valid"
                      : "Some required data is missing or invalid. Please resolve issues before adding to team."}
                  </p>
                </div>
              </div>
            </div>

            {/* Validation Summary */}
            <div className="pt-4">
              {validationResult.overall_success ? (
                <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/20 dark:border-green-800">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="text-green-800 dark:text-green-200 font-medium">
                    Player validation successful! This player can be added to
                    teams.
                  </p>
                </div>
              ) : (
                <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950/20 dark:border-red-800">
                  <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
                  <p className="text-red-800 dark:text-red-200 font-medium">
                    Player has validation issues that need to be resolved.
                  </p>
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    Please address the issues above before adding to teams.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
