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
      if (data.organizationId === -1) {
        return (
          data.newOrganization &&
          data.newOrganization.name &&
          data.newOrganization.organization_code &&
          data.newOrganization.website
        );
      }
      return data.organizationId && data.organizationId > 0;
    },
    {
      message: "Please select an organization or create a new one",
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
  const { orgStatus, orgStatusLoading, orgStatusError } =
    useKanahautomoOrganizationStatus();
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
            <h1 className="text-2xl font-bold mb-4">Join Kanahautomo</h1>
            <p className="kanaliiga-light-brown">
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
            <h1 className="text-2xl font-bold mb-4">Join Kanahautomo</h1>
            <p className="kanaliiga-light-brown">
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
      {/* Organization status table */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">
          Organization Registration Status
        </h2>
        {orgStatusLoading ? (
          <div>Loading...</div>
        ) : orgStatusError ? (
          <div className="kanaliiga-orange">
            {orgStatusError.message || "Failed to load organization status"}
          </div>
        ) : (
          <table className="min-w-full border text-sm">
            <thead>
              <tr>
                <th className="border px-2 py-1 text-left">Organization</th>
                <th className="border px-2 py-1 text-left">Count</th>
                <th className="border px-2 py-1 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {orgStatus.map((org) => (
                <tr key={org.organization_id}>
                  <td className="border px-2 py-1">{org.organization_name}</td>
                  <td className="border px-2 py-1">{org.count}</td>
                  <td className="border px-2 py-1">
                    {org.status === "ready" ? (
                      <span className="kanaliiga-orange font-semibold">
                        Ready
                      </span>
                    ) : (
                      <span className="kanaliiga-light-brown">Waiting</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Card>
        <CardHeader>
          <div
            className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6"
            data-slot="card-header"
          >
            <h1 className="text-2xl font-bold" data-slot="card-title">
              Join Kanahautomo
            </h1>
            <p className="kanaliiga-light-brown">
              Register for Kanahautomo to find teammates from your organization.
              When 5 or more players from the same organization register, a
              Discord channel will be created automatically.
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

              {error && <div className="kanaliiga-orange text-sm">{error}</div>}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
                data-testid="kanahautomo-submit"
              >
                {isSubmitting ? "Registering..." : "Join Kanahautomo"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
