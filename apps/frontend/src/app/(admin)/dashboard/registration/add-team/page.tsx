"use client";

import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { SignupForm } from "@/components/signup/SignupForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useAllSeasons } from "@/hooks/data/dashboard/useAllSeasons";
import { SeasonPlatform, type Season } from "@eggosystem/types";
import { useState } from "react";

export default function AddTeamSignupPage() {
  const { seasons, isLoading, isError } = useAllSeasons();
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);

  if (isLoading) {
    return (
      <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      </WithRoleProtection>
    );
  }

  if (isError || !seasons) {
    return (
      <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
        <div className="text-destructive">
          Failed to load seasons. Please try again.
        </div>
      </WithRoleProtection>
    );
  }

  const getSignupStatus = (season: Season) => {
    const now = new Date();
    const signupStart = season.signup_start_date
      ? new Date(season.signup_start_date)
      : null;
    const signupEnd = season.signup_end_date
      ? new Date(season.signup_end_date)
      : null;

    if (!signupStart || !signupEnd) {
      return { label: "No signup dates", className: "text-muted-foreground" };
    }

    if (now < signupStart) {
      return { label: "Not started", className: "text-muted-foreground" };
    }

    if (now > signupEnd) {
      return { label: "Closed", className: "text-destructive" };
    }

    return { label: "Open", className: "text-green-600" };
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Add Team Signup</h1>
          <p className="text-muted-foreground mt-2">
            Manually add team signups for any season, bypassing normal signup
            date restrictions. Player validation is still enforced.
          </p>
        </div>

        {!selectedSeason ? (
          <>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Select Season</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose a season to add a team signup. You can add teams even
                  after signup has closed.
                </p>

                <div className="space-y-2">
                  {seasons.map((season) => {
                    const signupStatus = getSignupStatus(season);
                    return (
                      <button
                        key={season.id}
                        onClick={() => setSelectedSeason(season)}
                        className="w-full text-left p-4 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {season.full_name}
                            </h3>
                            <div className="text-sm text-muted-foreground mt-1 space-y-1">
                              <div>
                                Platform:{" "}
                                <span className="font-medium">
                                  {season.platform}
                                </span>
                              </div>
                              <div>
                                Signup: {formatDate(season.signup_start_date)} -{" "}
                                {formatDate(season.signup_end_date)}
                              </div>
                              <div>
                                Season: {formatDate(season.start_date)} -{" "}
                                {formatDate(season.end_date)}
                              </div>
                            </div>
                          </div>
                          <div
                            className={`text-sm font-semibold ${signupStatus.className}`}
                          >
                            {signupStatus.label}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <div className="bg-muted border border-border rounded p-4">
              <h3 className="font-semibold mb-2">Important Notes</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>
                  <strong>Date restrictions are bypassed:</strong> You can add
                  teams to any season regardless of signup dates
                </li>
                <li>
                  <strong>Player validation is enforced:</strong> All players
                  must have verified work emails, valid profiles, and meet
                  approval requirements
                </li>
                <li>
                  <strong>Manual approvals still work:</strong> Players manually
                  approved via the dashboard will be accepted
                </li>
                <li>
                  <strong>Use the same signup form:</strong> The form is
                  identical to what users see, ensuring consistency
                </li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">
                      {selectedSeason.full_name}
                    </h2>
                    <div className="text-sm text-muted-foreground mt-1">
                      Platform: {selectedSeason.platform} | Signup:{" "}
                      {getSignupStatus(selectedSeason).label}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedSeason(null)}
                  >
                    Change Season
                  </Button>
                </div>
                <Separator className="my-4" />
                <p className="text-sm text-muted-foreground">
                  Fill out the signup form below to add a team to this season.
                  All player validation rules apply.
                </p>
              </CardContent>
            </Card>

            <SignupForm
              seasonId={selectedSeason.id.toString()}
              platform={selectedSeason.platform as SeasonPlatform}
              isAdminMode={true}
              selectedSeasonId={selectedSeason.id.toString()}
            />
          </>
        )}
      </div>
    </WithRoleProtection>
  );
}
