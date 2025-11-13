"use client";

import { useEffect, useState, useRef } from "react";
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
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { ContentContainer } from "../layout/ContentContainer";
import { SteamLoginButton } from "@/components/profile/SteamLoginButton";
import {
  accountSchema,
  type Account,
  type AccountUpdateValues,
  type UserFullPayload,
  type UserProfilePayload
} from "@eggosystem/types";
import { clientApiFetch } from "@/lib/apiClient";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEmailsVerified } from "@/hooks/data/useEmailsVerified";
import { EmailVerifiedIcon } from "./EmailVerifiedIcon";
import { toast } from "sonner";
import { RequiredFormLabel } from "../ui/RequiredFormLabel";
import { TooltipIcon } from "../ui/icons";
import { useAccountDetails } from "@/hooks/data/user/useAccountDetails";
import { useSWRConfig } from "swr";

const requestNewEmailVerificationLinks = async (accountId?: number) => {
  if (accountId) {
    return clientApiFetch<{ message: string }>(
      `/api/v1/accounts/${accountId}/emails/send-verifications`,
      { method: "POST" }
    );
  }
};

export default function ProfileForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname(); // Get current pathname
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const auth = useAuth();
  const { account, isLoading: isLoadingProfile } = useAccountDetails();
  const user = auth.user;
  const { emailsVerified } = useEmailsVerified(auth.user?.account_id);
  const { mutate } = useSWRConfig();
  const discordCallbackProcessed = useRef(false);

  useEffect(() => {
    const requiresPolicyAcceptance = searchParams.get(
      "acceptPrivacyPolicyRequired"
    );
    if (requiresPolicyAcceptance) {
      const returnTo = searchParams.get("returnTo");

      setErrorMessage(
        "You need to fill in the form and accept the privacy policy"
      );
      const replacedUrl = returnTo
        ? `${pathname}?returnTo=${encodeURIComponent(returnTo)}`
        : pathname;
      router.replace(replacedUrl, {
        scroll: false
      });
    }
  }, [searchParams, pathname, router]);

  useEffect(() => {
    const discordLinked = searchParams.get("discordLinked");
    const discordError = searchParams.get("discordError");
    const discordUserId = searchParams.get("discordUserId");

    if (!discordLinked && !discordError) {
      discordCallbackProcessed.current = false;
      return;
    }

    if (discordCallbackProcessed.current) {
      return;
    }

    if (discordLinked === "1" && discordUserId) {
      discordCallbackProcessed.current = true;
      toast.success("Discord account linked successfully!");

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("discordLinked");
      newUrl.searchParams.delete("discordUserId");
      router.replace(newUrl.pathname, { scroll: false });

      auth.checkAuth();
    }

    if (discordError) {
      discordCallbackProcessed.current = true;
      let errorMessage = "Failed to link Discord account";
      switch (discordError) {
        case "no_code":
          errorMessage = "No authorization code received from Discord";
          break;
        case "no_state":
          errorMessage = "No state parameter provided";
          break;
        case "invalid_state":
          errorMessage = "Invalid or expired authorization";
          break;
        case "callback_failed":
          errorMessage = "Discord authorization failed";
          break;
      }
      toast.error(errorMessage);

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("discordError");
      router.replace(newUrl.pathname, { scroll: false });
    }
  }, [searchParams, router, auth]);

  if (auth.loading || isLoadingProfile) {
    return <ContentContainer>Loading...</ContentContainer>;
  }

  if (!user || !account) {
    return (
      <ContentContainer classNames="flex-col space-y-4">
        <div>Please log in to view your profile.</div> <SteamLoginButton />
      </ContentContainer>
    );
  }

  const requestNewVerificationLinks = async (accountId: number) => {
    try {
      const value = await requestNewEmailVerificationLinks(accountId);
      if (value) {
        toast.success(value.message);
      }
    } catch (_err) {
      toast.error("Failed to send new links.");
    }
  };

  async function onSubmit(data: AccountUpdateValues) {
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const returnValue = await clientApiFetch<{ message: string }>(
        `/api/v1/accounts/update`,
        {
          method: "POST",
          body: JSON.stringify(data)
        }
      );
      setSuccessMessage(`${returnValue.message}`);
      toast.success("Profile updated!");
      await auth.checkAuth();
      mutate(
        "/api/v1/accounts/profile",
        {
          details: {
            fullName: data.full_name,
            workEmail: data.work_email
          }
        },
        { revalidate: false }
      );
    } catch (_error) {
      setErrorMessage("There was an error updating your profile.");
    }
  }

  return (
    <>
      <ProfileFormInputs
        nickname={user.nickname}
        fullName={account.details.fullName}
        workEmail={account.details.workEmail}
        acceptedPrivacyPolicy={user.acceptedPrivacyPolicy}
        acceptedMarketing={user.acceptedMarketing}
        acceptedNewsletter={user.acceptedNewsletter}
        isPersonalEmail={user.isPersonalEmail}
        onSubmit={onSubmit}
        emailsVerified={emailsVerified}
        requestNewEmailVerificationLinks={() =>
          requestNewVerificationLinks(user.account_id)
        }
      />
      {successMessage && (
        <div
          className="text-green-300 mt-4 font-semibold"
          data-testid="profile-success-message"
        >
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="text-red-500 mt-4 font-semibold">{errorMessage}</div>
      )}
    </>
  );
}

const ProfileFormInputs = ({
  acceptedPrivacyPolicy,
  fullName,
  nickname,
  workEmail,
  acceptedMarketing,
  acceptedNewsletter,
  isPersonalEmail,
  onSubmit,
  emailsVerified,
  requestNewEmailVerificationLinks
}: Partial<UserFullPayload> & {
  fullName: UserProfilePayload["fullName"];
  workEmail: UserProfilePayload["workEmail"];
  onSubmit: (data: AccountUpdateValues) => void;
  emailsVerified?: Pick<
    Account,
    "work_email_verified" | "work_email_token_expires_at"
  >;
  requestNewEmailVerificationLinks: () => void;
}) => {
  const form = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      nickname,
      full_name: fullName ?? "",
      work_email: workEmail ?? "",
      isPersonalEmail: Boolean(isPersonalEmail),
      acceptPrivacyPolicy: Boolean(acceptedPrivacyPolicy),
      acceptMarketing: Boolean(acceptedMarketing),
      acceptTournamentNewsletter: acceptedNewsletter ?? true
    }
  });
  const [resendEmailButtonDisabled, setResendEmailButtonDisabled] =
    useState(false);

  const workEmailDirty = !!form.formState.dirtyFields.work_email;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-w-md"
      >
        <FormField
          control={form.control}
          name="nickname"
          render={({ field }) => (
            <FormItem>
              <RequiredFormLabel required>Kana nickname</RequiredFormLabel>
              <FormControl>
                <Input placeholder="Your Kana nickname..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <RequiredFormLabel required>Full name</RequiredFormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="work_email"
          render={({ field }) => (
            <FormItem>
              <RequiredFormLabel required>
                Work email{" "}
                {emailsVerified?.work_email_verified && !workEmailDirty ? (
                  <EmailVerifiedIcon />
                ) : null}
              </RequiredFormLabel>
              <FormControl>
                <Input
                  autoComplete="work-email"
                  type="email"
                  placeholder="john.doe@kanaliiga.fi"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPersonalEmail"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  disabled={
                    emailsVerified?.work_email_verified &&
                    !workEmailDirty &&
                    field.value &&
                    isPersonalEmail
                  }
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel>I have no work email, this is my personal</FormLabel>{" "}
              <TooltipIcon
                text={
                  "We use personal work emails for the identification that the player is working for the registered company."
                }
              />
            </FormItem>
          )}
        />

        {form.watch("isPersonalEmail") && (
          <div className="bg-orange-500/20 border border-orange-500 rounded-md p-4 text-sm">
            <div className="text-orange-400 font-semibold">Important:</div>
            <div className="text-orange-300">
              Personal non-work emails require organizer approval for each
              season. Please open a support ticket in{" "}
              <strong>Kanaliiga Discord</strong> with proof of employment to get
              per-season approval for team registration.
            </div>
          </div>
        )}

        <hr className="my-4 border-t" />

        <FormField
          control={form.control}
          name="acceptPrivacyPolicy"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  data-testid="privacy-policy-checkbox"
                />
              </FormControl>
              <RequiredFormLabel
                required
                className="flex flex-wrap items-center gap-2"
              >
                I have read and accept the
                <Link
                  href="/privacy-policy"
                  className="underline whitespace-nowrap"
                >
                  Privacy Policy
                </Link>
              </RequiredFormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="acceptMarketing"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel>Receive marketing emails (optional)</FormLabel>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="acceptTournamentNewsletter"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel>
                Receive tournament participation emails (you can opt out
                anytime)
              </FormLabel>
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button type="submit">Save Changes</Button>
          {emailsVerified?.work_email_token_expires_at ? (
            <Button
              onClick={() => {
                setResendEmailButtonDisabled(true);
                requestNewEmailVerificationLinks();
                setTimeout(() => {
                  setResendEmailButtonDisabled(false);
                }, 1000);
              }}
              type="button"
              variant={"secondary"}
              disabled={resendEmailButtonDisabled}
            >
              Re-send validation email
            </Button>
          ) : null}
        </div>
      </form>
    </Form>
  );
};
