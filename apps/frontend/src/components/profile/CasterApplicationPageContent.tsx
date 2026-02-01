"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { SteamLoginButton } from "@/components/profile/SteamLoginButton";
import { AuthLoading } from "@/components/loading";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  OrganizerApplicationBlock,
  CASTER_RULES
} from "@/components/profile/CasterApplicationForm";
import { useMyCasterApplications } from "@/hooks/data/useCasterApplication";
import { useEmailsVerified } from "@/hooks/data/useEmailsVerified";
import { mutate } from "swr";
import { AlertCircle, Tv } from "lucide-react";
import type { OrganizerWithCasterApplications } from "@eggosystem/types";

const CASTER_ME_KEY = "/api/v1/caster-applications/me";
const ORGANIZERS_WITH_CASTER_KEY =
  "/api/v1/organizers/with-caster-applications";

interface CasterApplicationPageContentProps {
  organizer: { id: number; name: string };
}

function organizerToBlockFormat(o: {
  id: number;
  name: string;
}): OrganizerWithCasterApplications {
  return {
    id: o.id,
    name: o.name,
    discord_guild_id: null,
    discord_caster_channel_id: null
  };
}

export function CasterApplicationPageContent({
  organizer
}: CasterApplicationPageContentProps) {
  const { user, loading, checkAuth } = useAuth();
  const { applications, mutate: mutateApps } = useMyCasterApplications(
    user ? organizer.id : null
  );
  const { emailsVerified, isLoading: isLoadingEmails } = useEmailsVerified(
    user?.account_id
  );

  const application = applications?.find(
    (a) => a.organizer_id === organizer.id
  );

  // Refresh token and user when landing on this page so roles (e.g. after approval) are up to date
  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const onMutate = () => {
    void mutateApps();
    void mutate(CASTER_ME_KEY);
    void mutate(ORGANIZERS_WITH_CASTER_KEY);
  };

  if (loading) {
    return <AuthLoading />;
  }

  if (!user) {
    return (
      <ContentContainer>
        <div className="flex flex-col items-center gap-6 py-12 max-w-md mx-auto">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">Authentication Required</h2>
            <p className="text-muted-foreground">
              Please log in with Steam to apply as a caster for {organizer.name}
              .
            </p>
          </div>
          <SteamLoginButton />
        </div>
      </ContentContainer>
    );
  }

  const hasSteam = Boolean(user?.provider_id);
  const emailVerified = emailsVerified?.work_email_verified === true;

  if (!hasSteam) {
    return (
      <ContentContainer>
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Tv className="h-6 w-6" />
            Apply for caster for {organizer.name}
          </h1>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You must be logged in with Steam to apply as a caster.
            </AlertDescription>
          </Alert>
        </div>
      </ContentContainer>
    );
  }

  if (isLoadingEmails) {
    return (
      <ContentContainer>
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Tv className="h-6 w-6" />
            Apply for caster for {organizer.name}
          </h1>
          <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </ContentContainer>
    );
  }

  if (!emailVerified) {
    return (
      <ContentContainer>
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Tv className="h-6 w-6" />
            Apply for caster for {organizer.name}
          </h1>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Verify your work email in your profile to apply as a caster.
            </AlertDescription>
          </Alert>
        </div>
      </ContentContainer>
    );
  }

  if (!user.discordLinked) {
    return (
      <ContentContainer>
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Tv className="h-6 w-6" />
            Apply for caster for {organizer.name}
          </h1>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Link your Discord account in your profile to apply as a caster.
            </AlertDescription>
          </Alert>
        </div>
      </ContentContainer>
    );
  }

  return (
    <ContentContainer>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Tv className="h-6 w-6" />
          Apply for caster for {organizer.name}
        </h1>
        <p className="text-muted-foreground">
          After approval, open a ticket in Kanaliiga Discord if requested.
        </p>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Streaming rules</h2>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            {CASTER_RULES.map((rule) => (
              <li key={rule.heading}>
                <span className="font-medium text-foreground">
                  {rule.heading}:
                </span>{" "}
                {rule.body}
              </li>
            ))}
          </ul>
        </div>
        <OrganizerApplicationBlock
          organizer={organizerToBlockFormat(organizer)}
          application={application}
          user={user}
          emailsVerified={{ work_email_verified: emailVerified }}
          discordLinked={user.discordLinked ?? false}
          onMutate={onMutate}
        />
      </div>
    </ContentContainer>
  );
}
