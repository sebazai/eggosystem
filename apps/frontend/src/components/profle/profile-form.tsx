"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage
} from "@/components/ui/form";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { TheContainer } from "../layout/the-container";
import { SteamLoginButton } from "../steam-login";
import { profileSchema, type ProfileUpdateValues } from "@eggosystem/types";
import { apiFetch } from "@/lib/apiClient";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function ProfileForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname(); // Get current pathname
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nickname: "",
      full_name: "",
      work_email: "",
      discord: "",
      acceptPrivacyPolicy: false,
      acceptMarketing: false
    }
  });
  const auth = useAuth();

  useEffect(() => {
    if (auth.user) {
      form.setValue("nickname", auth.user.displayName);
      form.setValue("full_name", auth.user.fullName || "");
      form.setValue("work_email", auth.user.workEmail || "");
      form.setValue("discord", auth.user.discord || "");
      form.setValue(
        "acceptPrivacyPolicy",
        Boolean(auth.user.acceptedPrivacyPolicy)
      );
      form.setValue("acceptMarketing", Boolean(auth.user.acceptedMarketing));
    }
  }, [auth.user, form]);

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

  if (auth.loading) {
    return <TheContainer>Loading...</TheContainer>;
  }
  if (!auth.user) {
    return (
      <TheContainer classNames="flex-col space-y-4">
        <div>Please log in to view your profile.</div> <SteamLoginButton />
      </TheContainer>
    );
  }

  async function onSubmit(data: ProfileUpdateValues) {
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await apiFetch({
        url: `/profiles/update`,
        method: "POST",
        body: data
      });

      const returnTo = searchParams.get("returnTo");
      const message = returnTo
        ? `Your profile has been successfully updated! Redirecting you to ${returnTo}...`
        : "Your profile has been successfully updated!";

      setSuccessMessage(message);

      await auth.checkAuth();
      if (returnTo) {
        setTimeout(() => {
          router.push(returnTo);
        }, 2000);
      }
    } catch (_error) {
      setErrorMessage("There was an error updating your profile.");
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-w-md"
      >
        {successMessage && (
          <div
            className="text-green-500 font-semibold"
            data-testid="profile-success-message"
          >
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="text-red-500 font-semibold">{errorMessage}</div>
        )}
        <FormField
          control={form.control}
          name="nickname"
          render={({ field }) => (
            <FormItem>
              <Label>Nickname</Label>
              <FormControl>
                <Input placeholder="Your Nickname" {...field} />
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
              <Label>Full Name</Label>
              <FormControl>
                <Input placeholder="Your Full Name" {...field} />
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
              <Label>Work Email</Label>
              <FormControl>
                <Input type="email" placeholder="your@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="discord"
          render={({ field }) => (
            <FormItem>
              <Label>Discord (Optional)</Label>
              <FormControl>
                <Input placeholder="Discord Username" {...field} />
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
              <Label className="flex flex-wrap items-center gap-2">
                I have read and accept the
                <Link
                  href="/privacy-policy"
                  className="underline whitespace-nowrap"
                >
                  Privacy Policy
                </Link>
              </Label>
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
              <Label>Receive marketing emails (optional)</Label>
            </FormItem>
          )}
        />

        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  );
}
