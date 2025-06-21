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
            <p className="text-gray-600">
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
            <p className="text-red-600">
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
      let organizationId = data.organizationId;

      // If creating new organization
      if (data.organizationId === -1 && data.newOrganization) {
        try {
          const newOrg = await clientApiFetch<{ id: number; name: string }>(
            "/api/v1/organizations",
            {
              method: "POST",
              body: JSON.stringify({
                name: data.newOrganization.name,
                organization_code: data.newOrganization.organization_code,
                website: data.newOrganization.website
              })
            }
          );
          organizationId = newOrg.id;
        } catch (_error) {
          throw new Error("Failed to create organization");
        }
      }

      // Register for Kanahautomo
      try {
        await clientApiFetch<{ message: string; registration_id: number }>(
          "/api/v1/kanahautomo/register",
          {
            method: "POST",
            body: JSON.stringify({ organization_id: organizationId })
          }
        );
        toast.success("Successfully registered for Kanahautomo!");
        form.reset();
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Failed to register for Kanahautomo");
      }
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
      <Card>
        <CardHeader>
          <div
            className="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6"
            data-slot="card-header"
          >
            <h1 className="text-2xl font-bold" data-slot="card-title">
              Join Kanahautomo
            </h1>
            <p className="text-gray-600">
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
                          {organizations.map((org) => (
                            <SelectItem key={org.id} value={org.id.toString()}>
                              {org.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="-1">
                            Add new organization...
                          </SelectItem>
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

              {error && <div className="text-red-600 text-sm">{error}</div>}

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Registering..." : "Join Kanahautomo"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
