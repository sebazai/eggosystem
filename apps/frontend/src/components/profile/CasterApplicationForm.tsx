"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormLabel
} from "@/components/ui/form";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  casterApplicationFormSchema,
  type CasterApplicationFormValues
} from "@/components/profile/caster-application-form-schema";
import {
  useOrganizersWithCasterApplications,
  useMyCasterApplications,
  useSubmitCasterApplication
} from "@/hooks/data/useCasterApplication";
import { useEmailsVerified } from "@/hooks/data/useEmailsVerified";
import type { UserFullPayload } from "@eggosystem/types";
import type { CasterApplication } from "@eggosystem/types";
import type { OrganizerWithCasterApplications } from "@eggosystem/types";
import { Tv, AlertCircle } from "lucide-react";

const CASTER_RULES = [
  {
    heading: "Who can stream",
    body: "Suitable for everyone. Whether you're a veteran or just interested in the topic. However, we try to avoid streaming the same match by different people so that streamers don't have to compete for viewers. However, matches can be streamed in multiple languages simultaneously. If necessary, Kanaliiga will choose the streamer."
  },
  {
    heading: "Where to stream",
    body: "You can freely choose your platform and channel."
  },
  {
    heading: "Appropriate content",
    body: "The content of the stream must comply with Finnish laws and be appropriate. Even though the audience is probably older, keep in mind that younger family members may also follow their parents playing in Kanaliiga!"
  },
  {
    heading: "Language usage",
    body: "Remember that you always represent your employer when playing in Kanaliiga and making broadcasts. Consider this in all your behavior, including during games. POV streams are also watched afterwards by several players playing in the same series, so all the emotional boiling that happened in the heat of the game is visible to more players playing in Kanaliiga and may not give the best picture of the company, team or at worst the entire Kanaliiga you represent. Of course, humor in good taste is allowed and desirable, but don't test the limits!"
  },
  {
    heading: "Logos",
    body: "The broadcast must have the Kanaliiga logo visible and possibly other logos defined by Kanaliiga. Information about these will be updated to the Kanaliiga CS-Casters channel."
  }
];

function applicationStatus(
  app: CasterApplication
): "pending" | "approved" | "rejected" {
  if (app.approved_at) return "approved";
  if (app.rejected_at) return "rejected";
  return "pending";
}

function OrganizerApplicationBlock({
  organizer,
  application,
  user: _user,
  emailsVerified: _emailsVerified,
  discordLinked: _discordLinked,
  onMutate
}: {
  organizer: OrganizerWithCasterApplications;
  application: CasterApplication | undefined;
  user: UserFullPayload;
  emailsVerified: { work_email_verified?: boolean } | undefined;
  discordLinked: boolean;
  onMutate: () => void;
}) {
  const status = application ? applicationStatus(application) : null;
  const { submit, isSubmitting } = useSubmitCasterApplication(organizer.id);

  const form = useForm<CasterApplicationFormValues>({
    resolver: zodResolver(casterApplicationFormSchema),
    defaultValues: {
      caster_url: application?.caster_url ?? "",
      approved_terms_and_conditions: false
    }
  });

  const handleSubmit = async (values: CasterApplicationFormValues) => {
    await submit(values);
    onMutate();
  };

  const canApply = status === null || status === "rejected";
  const isPending = status === "pending";
  const isApproved = status === "approved";
  const isRejected = status === "rejected";

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">{organizer.name}</h3>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPending && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your application is under review. Please open a ticket in
              Kanaliiga Discord #open_servicerequest if requested.
            </AlertDescription>
          </Alert>
        )}
        {isApproved && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You are approved as a caster. You can now set your default stream
              URL in the Caster Settings section above (once your role is
              active).
            </AlertDescription>
          </Alert>
        )}
        {isRejected && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <span className="font-medium">
                Your application was not approved.
              </span>
              {application?.rejection_reason && (
                <p className="mt-1">Reason: {application.rejection_reason}</p>
              )}
              <p className="mt-1">You may re-apply below if you wish.</p>
            </AlertDescription>
          </Alert>
        )}

        {canApply && (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="caster_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stream URL</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://twitch.tv/your-channel"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="approved_terms_and_conditions"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="font-normal">
                        I have read the above information and promise to follow
                        them.
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                disabled={!form.formState.isValid || isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit application"}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}

export function CasterApplicationForm({
  user,
  discordLinked
}: {
  user: UserFullPayload;
  discordLinked: boolean;
}) {
  const {
    organizers,
    isLoading: isLoadingOrgs,
    mutate: mutateOrgs
  } = useOrganizersWithCasterApplications();
  const {
    applications,
    isLoading: isLoadingApps,
    mutate: mutateApps
  } = useMyCasterApplications();
  const { emailsVerified, isLoading: isLoadingEmails } = useEmailsVerified(
    user?.account_id
  );

  const hasSteam = Boolean(user?.provider_id);
  const emailVerified = emailsVerified?.work_email_verified === true;

  const mutateAll = () => {
    void mutateOrgs();
    void mutateApps();
  };

  if (isLoadingOrgs || isLoadingApps || isLoadingEmails) {
    return (
      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Tv className="h-5 w-5" />
          Caster application
        </h2>
        <p className="text-sm text-muted-foreground animate-pulse">
          Loading...
        </p>
      </div>
    );
  }

  if (!emailVerified) {
    return (
      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Tv className="h-5 w-5" />
          Caster application
        </h2>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Verify your work email to apply as a caster. Use the email
            verification section above.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!discordLinked) {
    return (
      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Tv className="h-5 w-5" />
          Caster application
        </h2>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Link your Discord account above to apply as a caster.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!hasSteam) {
    return (
      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Tv className="h-5 w-5" />
          Caster application
        </h2>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You must be logged in with Steam to apply as a caster.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!organizers?.length) {
    return (
      <div className="space-y-4 pt-6 border-t">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Tv className="h-5 w-5" />
          Caster application
        </h2>
        <p className="text-sm text-muted-foreground">
          No organizers are currently accepting caster applications.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6 border-t">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Tv className="h-5 w-5" />
          Caster application
        </h2>
        <p className="text-sm text-muted-foreground">
          Apply to become a caster. After approval, open a ticket in Kanaliiga
          Discord if requested.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium">Streaming rules</h3>
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

      <div className="space-y-4">
        {organizers.map((organizer) => {
          const application = applications?.find(
            (a) => a.organizer_id === organizer.id
          );
          return (
            <OrganizerApplicationBlock
              key={organizer.id}
              organizer={organizer}
              application={application}
              user={user}
              emailsVerified={emailsVerified}
              discordLinked={discordLinked}
              onMutate={mutateAll}
            />
          );
        })}
      </div>
    </div>
  );
}
