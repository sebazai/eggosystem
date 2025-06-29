"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/context/AuthContext";
import { useOrganizations } from "@/hooks/data/useOrganizations";
import { clientApiFetch } from "@/lib/apiClient";
import { NewOrganizationForm } from "@/components/organizations/NewOrganizationForm";
import { toast } from "sonner";
import { useKanahautomoOrganizationStatus } from "@/hooks/data/useKanahautomoOrganizationStatus";
import {
  type KanahautomoRegistration,
  type KanahautomoFormData,
  kanahautomoSchema
} from "@eggosystem/types";
import { RequiredFormLabel } from "../ui/RequiredFormLabel";
import { ChevronsUpDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { envConfig } from "@/configs/env";

export default function KanahautomoPage() {
  const { user, loading: authLoading } = useAuth();
  const {
    organizations,
    isLoading: orgsLoading,
    isError: orgsError
  } = useOrganizations();
  const {
    orgStatus,
    orgStatusLoading,
    orgStatusError,
    mutate: mutateOrgStatus
  } = useKanahautomoOrganizationStatus();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();

  const form = useForm<KanahautomoFormData>({
    resolver: zodResolver(kanahautomoSchema),
    defaultValues: {
      organizationId: undefined,
      newOrganization: undefined,
      acceptedTerms: false,
      gameTypes: {
        cs: false,
        csWingman: false,
        rocketLeague: false,
        pubgDuo: false,
        pubgSquad: false,
        dota: false
      }
    },
    mode: "onChange"
  });

  const watchOrganizationId = form.watch("organizationId");

  // Get selected organization name for display
  const selectedOrg = organizations?.find(
    (org) => org.id === watchOrganizationId
  );

  // Handle Discord OAuth callback parameters
  useEffect(() => {
    const discordLinked = searchParams.get("discordLinked");
    const discordError = searchParams.get("discordError");
    const discordUserId = searchParams.get("discordUserId");

    if (discordLinked === "1" && discordUserId) {
      toast.success(
        `Discord account linked successfully! User ID: ${discordUserId}`
      );
      // Clear URL parameters
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("discordLinked");
      newUrl.searchParams.delete("discordUserId");
      router.replace(newUrl.pathname);
    }

    if (discordError) {
      let errorMessage = "Failed to link Discord account";
      switch (discordError) {
        case "no_code":
          errorMessage = "No authorization code received from Discord";
          break;
        case "no_account":
          errorMessage = "No account found for Discord linking";
          break;
        case "callback_failed":
          errorMessage = "Discord authorization failed";
          break;
      }
      toast.error(errorMessage);
      // Clear URL parameters
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("discordError");
      router.replace(newUrl.pathname);
    }
  }, [searchParams, router]);

  if (authLoading || orgsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold pb-7">Join Kanahautomo</h1>
            <p className="text-kanaliiga-light-brown">
              Please log in with Steam to join Kanahautomo
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (orgsError || !organizations) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-2xl font-bold pb-7">Join Kanahautomo</h1>
            <p className="text-kanaliiga-light-brown">
              Failed to load organizations. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const onSubmit = async (data: KanahautomoFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      let requestBody: KanahautomoRegistration & {
        gameTypes: KanahautomoFormData["gameTypes"];
        acceptedTerms: boolean;
      };

      // If creating new organization
      if (data.organizationId === -1 && data.newOrganization) {
        requestBody = {
          newOrganization: {
            name: data.newOrganization.name,
            organization_code: data.newOrganization.organization_code,
            website: data.newOrganization.website
          },
          gameTypes: data.gameTypes,
          acceptedTerms: data.acceptedTerms
        };
      } else {
        requestBody = {
          organizationId: data.organizationId,
          gameTypes: data.gameTypes,
          acceptedTerms: data.acceptedTerms
        };
      }

      // Register for Kanahautomo with organization handling
      const _response = await clientApiFetch<{
        message: string;
        registration_id: number;
        organization_id: number;
      }>("/api/v1/kanahautomo/register-with-organization", {
        method: "POST",
        body: JSON.stringify(requestBody)
      });

      toast.success("Successfully registered for Kanahautomo!");
      form.reset();
      if (mutateOrgStatus) await mutateOrgStatus();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <div
            className="grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6"
            data-slot="card-header"
          >
            <h1 className="text-2xl font-bold mb-4" data-slot="card-title">
              Join Kanahautomo
            </h1>
            <p>
              Register for Kanahautomo to find teammates from your organization.
              When you have registered, an invite link for Kanahautomo Discord
              will be sent to your registered email address. Please ensure you
              have a valid email in your profile and it is verified. Remember to
              check your junk e-mail folder.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="organizationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select your organization</FormLabel>
                    <FormControl>
                      <div className="relative w-full">
                        <Popover open={open} onOpenChange={setOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={open}
                              className="w-full justify-between"
                            >
                              {field.value === -1
                                ? "Add new organization..."
                                : selectedOrg?.name ||
                                  "Choose an organization..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search organization..." />
                              <CommandList>
                                <CommandEmpty>
                                  No organization found.
                                </CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    value="-1"
                                    onSelect={() => {
                                      field.onChange(-1);
                                      form.setValue(
                                        "newOrganization",
                                        undefined
                                      );
                                      setOpen(false);
                                    }}
                                  >
                                    Add new organization...
                                  </CommandItem>
                                  {organizations?.map((org) => (
                                    <CommandItem
                                      key={org.id}
                                      value={org.name}
                                      onSelect={() => {
                                        field.onChange(org.id);
                                        form.setValue(
                                          "newOrganization",
                                          undefined
                                        );
                                        setOpen(false);
                                      }}
                                    >
                                      {org.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchOrganizationId === -1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Create New Organization
                  </h3>
                  <NewOrganizationForm
                    control={form.control}
                    nameKey="newOrganization.name"
                    orgCodeKey="newOrganization.organization_code"
                    websiteKey="newOrganization.website"
                  />
                </div>
              )}

              {/* Game Types Section */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Select Game Types</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* CS2 Games */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-kanaliiga-light-brown">
                      Counter-Strike 2
                    </h4>
                    <FormField
                      control={form.control}
                      name="gameTypes.cs"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm">CS2 Comp</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gameTypes.csWingman"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm">CS2 Wingman</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* PUBG Games */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-kanaliiga-light-brown">
                      PUBG
                    </h4>
                    <FormField
                      control={form.control}
                      name="gameTypes.pubgSquad"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm">PUBG Squad</FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gameTypes.pubgDuo"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm">PUBG Duo</FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Rocket League - Full Width */}
                <div className="pt-1 space-y-2">
                  <h4 className="text-sm font-medium text-kanaliiga-light-brown mb-2">
                    Other Games
                  </h4>
                  <FormField
                    control={form.control}
                    name="gameTypes.rocketLeague"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm">
                          Rocket League Standard
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gameTypes.dota"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm">
                          Dota 2 Team Clash
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Game Types Error Message */}
                <FormField
                  control={form.control}
                  name="gameTypes"
                  render={() => (
                    <FormItem>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="acceptedTerms"
                render={({ field }) => (
                  <FormItem className="flex items-start space-x-3 pt-4 border-t border-gray-200">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="mt-1"
                      />
                    </FormControl>
                    <RequiredFormLabel className="text-sm leading-relaxed">
                      I consent to my Steam ID, nickname, and organization being
                      visible to other Kanahautomo players in Discord. Your
                      organization will be displayed as a role in the Discord
                      server, making it visible to all members.
                    </RequiredFormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div className="text-kanaliiga-orange text-sm">{error}</div>
              )}

              {/* Discord Link Section */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      Link Discord Account
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Link your Discord account to automatically receive the
                      correct role when you join the server.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {!user?.discordLinked && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        router.push(
                          `${envConfig.CLIENT_API_URL}/api/v1/auth/discord/login`
                        )
                      }
                      className="flex items-center space-x-2"
                    >
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                      </svg>
                      <span>Link Discord Account</span>
                    </Button>
                  )}

                  <div className="text-sm">
                    {user?.discordLinked ? (
                      <span className="text-green-600">✓ Discord linked</span>
                    ) : (
                      <span>Not linked</span>
                    )}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid="kanahautomo-submit"
              >
                {isSubmitting ? "Registering..." : "Join Kanahautomo"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      {/* Organization status cards */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-6">
          Organization Registration Status
        </h2>
        {orgStatusLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : orgStatusError ? (
          <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-kanaliiga-orange">
              {orgStatusError.message || "Failed to load organization status"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orgStatus.map((org) => (
              <div
                key={org.organization_id}
                className={
                  "relative overflow-hidden rounded-xl border transition-all duration-300 hover:scale-105 shadow-md border-kanaliight-light-brown"
                }
              >
                <div className="p-6">
                  {/* Organization name */}
                  <h3 className="font-bold text-lg mb-2 text-kanaliiga-light-brown truncate">
                    {org.organization_name}
                  </h3>

                  {/* Total registrations */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex -space-x-1">
                        {[...Array(Math.min(org.total_registrations, 5))].map(
                          (_, i) => (
                            <div
                              key={i}
                              className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold`}
                            >
                              {i === 4 && org.total_registrations > 5
                                ? "+"
                                : "👤"}
                            </div>
                          )
                        )}
                      </div>
                      <span className="text-sm font-medium text-kanaliiga-light-brown">
                        Total: {org.total_registrations}
                      </span>
                    </div>
                  </div>

                  {/* Game type breakdown */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium text-kanaliiga-light-brown mb-2">
                      Game Type Registrations:
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      {org.game_type_counts.cs > 0 && (
                        <div className="flex justify-between">
                          <span>CS2 Comp:</span>
                          <span className="font-medium">
                            {org.game_type_counts.cs}
                          </span>
                        </div>
                      )}
                      {org.game_type_counts.csWingman > 0 && (
                        <div className="flex justify-between">
                          <span>CS2 Wingman:</span>
                          <span className="font-medium">
                            {org.game_type_counts.csWingman}
                          </span>
                        </div>
                      )}
                      {org.game_type_counts.pubgDuo > 0 && (
                        <div className="flex justify-between">
                          <span>PUBG Duo:</span>
                          <span className="font-medium">
                            {org.game_type_counts.pubgDuo}
                          </span>
                        </div>
                      )}
                      {org.game_type_counts.pubgSquad > 0 && (
                        <div className="flex justify-between">
                          <span>PUBG Squad:</span>
                          <span className="font-medium">
                            {org.game_type_counts.pubgSquad}
                          </span>
                        </div>
                      )}
                      {org.game_type_counts.rocketLeague > 0 && (
                        <div className="flex justify-between">
                          <span>Rocket League:</span>
                          <span className="font-medium">
                            {org.game_type_counts.rocketLeague}
                          </span>
                        </div>
                      )}
                      {org.game_type_counts.dota > 0 && (
                        <div className="flex justify-between">
                          <span>Dota 2:</span>
                          <span className="font-medium">
                            {org.game_type_counts.dota}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
