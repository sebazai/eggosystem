"use client";

import { useState } from "react";
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
          new_organization: {
            name: data.newOrganization.name,
            organization_code: data.newOrganization.organization_code,
            website: data.newOrganization.website
          },
          gameTypes: data.gameTypes,
          acceptedTerms: data.acceptedTerms
        };
      } else {
        requestBody = {
          organization_id: data.organizationId,
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
                      I consent to my Steam ID and nickname being shared with
                      other Kanahautomo players.
                    </RequiredFormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && (
                <div className="text-kanaliiga-orange text-sm">{error}</div>
              )}

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

                  {/* Count and status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex -space-x-1">
                        {[...Array(Math.min(org.count, 5))].map((_, i) => (
                          <div
                            key={i}
                            className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold`}
                          >
                            {i === 4 && org.count > 5 ? "+" : "👤"}
                          </div>
                        ))}
                      </div>
                      <span className="text-sm font-medium text-kanaliiga-light-brown">
                        Registered: {org.count}
                      </span>
                    </div>
                  </div>

                  {/* Status message */}
                  <p className="text-xs text-kanaliiga-light-brown">Yalla</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
