"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useOrganizations } from "@/hooks/data/useOrganizations";
import { clientApiFetch } from "@/lib/apiClient";
import { NewOrganizationForm } from "@/components/organizations/NewOrganizationForm";
import { toast } from "sonner";
import { useKanahautomoOrganizationStatus } from "@/hooks/data/useKanahautomoOrganizationStatus";
import type { KanahautomoRegistration } from "@eggosystem/types";

const kanahautomoSchema = z
  .object({
    organizationId: z.number().optional(),
    newOrganization: z
      .object({
        name: z
          .string()
          .min(2, "Organization name must be at least 2 characters"),
        organization_code: z
          .string()
          .min(2, "Business ID must be at least 2 characters"),
        website: z.string().url("Please enter a valid website URL")
      })
      .optional()
  })
  .refine(
    (data) => {
      // Must have exactly one: either organizationId OR newOrganization
      const hasOrgId = data.organizationId && data.organizationId > 0;
      const hasNewOrg =
        data.newOrganization &&
        data.newOrganization.name &&
        data.newOrganization.organization_code &&
        data.newOrganization.website;

      return (hasOrgId && !hasNewOrg) || (!hasOrgId && hasNewOrg);
    },
    {
      message:
        "Please select an existing organization OR create a new one (not both)",
      path: ["organizationId"]
    }
  );

type KanahautomoFormData = z.infer<typeof kanahautomoSchema>;

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

  const form = useForm<KanahautomoFormData>({
    resolver: zodResolver(kanahautomoSchema),
    defaultValues: {
      organizationId: undefined,
      newOrganization: undefined
    },
    mode: "onChange"
  });

  const watchOrganizationId = form.watch("organizationId");

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
      let requestBody: KanahautomoRegistration;

      // If creating new organization
      if (data.organizationId === -1 && data.newOrganization) {
        requestBody = {
          new_organization: {
            name: data.newOrganization.name,
            organization_code: data.newOrganization.organization_code,
            website: data.newOrganization.website
          }
        };
      } else {
        requestBody = {
          organization_id: data.organizationId
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
              When 5 or more players from the same organization register, a
              Discord channel will be created automatically and an email with
              the invite link will be sent to your registered email address.
              Please ensure you have a valid email in your profile and it is
              verified. Remember to check your junk e-mail folder.
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
                      <Select
                        onValueChange={(value) => {
                          const numValue = parseInt(value);
                          field.onChange(numValue);
                          if (numValue !== -1) {
                            form.setValue("newOrganization", undefined);
                          }
                        }}
                        value={field.value?.toString() || ""}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an organization..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="-1">
                            Add new organization...
                          </SelectItem>
                          {organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id.toString()}>
                              {org.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                className={`relative overflow-hidden rounded-xl border transition-all duration-300 hover:scale-105 shadow-md ${
                  org.status === "ready"
                    ? "border-orange-200"
                    : "border-gray-200"
                }`}
              >
                {/* Status indicator */}
                <div
                  className={`absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] ${
                    org.status === "ready"
                      ? "border-t-orange-500"
                      : "border-t-gray-400"
                  }`}
                />

                {/* Progress bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                  <div
                    className={`h-full transition-all duration-500 ${
                      org.status === "ready"
                        ? "bg-gradient-to-r from-orange-400 to-orange-600"
                        : "bg-gradient-to-r from-gray-300 to-gray-400"
                    }`}
                    style={{
                      width: `${Math.min((org.count / 5) * 100, 100)}%`
                    }}
                  />
                </div>

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
                            className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold ${
                              org.status === "ready"
                                ? "bg-orange-500 text-white"
                                : "bg-gray-400 text-white"
                            }`}
                          >
                            {i === 4 && org.count > 5 ? "+" : "👤"}
                          </div>
                        ))}
                      </div>
                      <span className="text-sm font-medium text-kanaliiga-light-brown">
                        {org.count}/5
                      </span>
                    </div>

                    <div
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        org.status === "ready"
                          ? "bg-orange-100 text-orange-700 border border-orange-200"
                          : "bg-gray-100 text-kanaliiga-light-brown border border-gray-200"
                      }`}
                    >
                      {org.status === "ready" ? "Ready" : "Waiting"}
                    </div>
                  </div>

                  {/* Status message */}
                  <p className="text-xs text-kanaliiga-light-brown">
                    {org.status === "ready"
                      ? "Discord channel will be created soon!"
                      : `${5 - org.count} more needed for Discord channel`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
