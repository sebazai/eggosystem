"use client";

import { useEffect, useState } from "react";
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
import { ContentContainer } from "../layout/content-container";
import { SteamLoginButton } from "@/components/profile/steam-login";
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
import { EmailVerifiedIcon } from "./email-verified-tooltip";
import { toast } from "sonner";
import { RequiredFormLabel } from "../ui/required-form-label";
import { TooltipIcon } from "../icons";
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
      await auth.checkAuth();
      mutate(
        "/api/v1/accounts/profile",
        {
          details: {
            fullName: data.full_name,
            discord: data.discord,
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
      {successMessage && (
        <div
          className="text-green-300 mb-4 font-semibold"
          data-testid="profile-success-message"
        >
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="text-red-500 mb-4 font-semibold">{errorMessage}</div>
      )}

      <ProfileFormInputs
        nickname={user.nickname}
        fullName={account.details.fullName}
        workEmail={account.details.workEmail}
        acceptedPrivacyPolicy={user.acceptedPrivacyPolicy}
        acceptedMarketing={user.acceptedMarketing}
        isPersonalEmail={user.isPersonalEmail}
        discord={account.details.discord}
        onSubmit={onSubmit}
        emailsVerified={emailsVerified}
        requestNewEmailVerificationLinks={() =>
          requestNewVerificationLinks(user.account_id)
        }
      />
    </>
  );
}

const ProfileFormInputs = ({
  acceptedPrivacyPolicy,
  fullName,
  nickname,
  workEmail,
  acceptedMarketing,
  discord,
  isPersonalEmail,
  onSubmit,
  emailsVerified,
  requestNewEmailVerificationLinks
}: Partial<UserFullPayload> &
  UserProfilePayload & {
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
      discord: discord ?? "",
      acceptPrivacyPolicy: Boolean(acceptedPrivacyPolicy),
      acceptMarketing: Boolean(acceptedMarketing)
    }
  });

  const workEmailDirty = !!form.formState.dirtyFields.work_email;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-w-md mx-2"
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
                    field.value
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

        <FormField
          control={form.control}
          name="discord"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Discord (required for captains & co-captains)
              </FormLabel>
              <FormControl>
                <Input placeholder="Discord username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <div className="flex gap-4">
          <Button type="submit">Save Changes</Button>
          {emailsVerified?.work_email_token_expires_at ? (
            <Button
              onClick={() => requestNewEmailVerificationLinks()}
              type="button"
              variant={"secondary"}
            >
              Re-send validation email
            </Button>
          ) : null}
        </div>
      </form>
    </Form>
  );
};
