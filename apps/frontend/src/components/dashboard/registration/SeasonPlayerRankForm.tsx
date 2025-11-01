"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SteamIdInput } from "@/components/ui/steam-id-input";
import { useState } from "react";
import {
  seasonPlayerRankFormSchema,
  type SeasonPlayerRankFormValues
} from "@eggosystem/types";
import { toast } from "sonner";
import { ApiError, clientApiFetch } from "@/lib/apiClient";

export function SeasonPlayerRankForm() {
  const form = useForm<SeasonPlayerRankFormValues>({
    resolver: zodResolver(seasonPlayerRankFormSchema),
    defaultValues: {
      steam_id: "",
      external_elo: undefined,
      external_kd: undefined,
      cs2_rank: undefined,
      cs_hours: undefined
    }
  });

  const [loading, setLoading] = useState(false);

  const onSubmit = async (values: SeasonPlayerRankFormValues) => {
    setLoading(true);

    try {
      await clientApiFetch("/api/v1/dashboard/registration/rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });

      toast.success("Player rank submitted successfully");
      form.reset();
    } catch (error) {
      console.error("Submission failed:", error);
      if (error instanceof ApiError) {
        toast.error(error.detail || "Submission failed");
        return;
      }
      toast.error("Something went wrong... Please contact developers.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-w-md"
      >
        <FormField
          control={form.control}
          name="steam_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Steam ID</FormLabel>
              <FormControl>
                <SteamIdInput
                  {...field}
                  placeholder="Enter Steam ID"
                  convertOnBlur={true}
                  data-testid="steam-id-input"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="external_elo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>External ELO</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === "" ? undefined : Number(val));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="external_kd"
          render={({ field }) => (
            <FormItem>
              <FormLabel>External KD</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === "" ? undefined : Number(val));
                  }}
                />
              </FormControl>
              <FormDescription>
                Check from: https://faceitfinder.com/ (if empty, defaults to
                0.95)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cs2_rank"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CS2 Rank</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === "" ? undefined : Number(val));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cs_hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CS Hours</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === "" ? undefined : Number(val));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ticket_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ticket ID</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </Form>
  );
}
