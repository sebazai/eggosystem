"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  seasonPlayerRankFormSchema,
  type SeasonPlayerRankFormValues
} from "@eggosystem/types";
import { toast } from "sonner";
import { clientApiFetch } from "@/lib/apiClient";

export function SeasonPlayerRankForm() {
  const form = useForm<SeasonPlayerRankFormValues>({
    resolver: zodResolver(seasonPlayerRankFormSchema),
    defaultValues: {
      steam_id: "",
      external_elo: undefined,
      cs2_rank: undefined,
      cs_hours: undefined
    }
  });

  const [loading, setLoading] = useState(false);

  const onSubmit = async (values: SeasonPlayerRankFormValues) => {
    setLoading(true);
    try {
      const res = await clientApiFetch<{ ok: boolean }>(
        "/api/v1/dashboard/registration/rank",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values)
        }
      );

      if (!res.ok) throw new Error("Failed to submit");

      toast.success("Player rank submitted successfully");
      form.reset();
    } catch (err) {
      console.error(err);
      toast.error("Submission failed");
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
                <Input placeholder="7656119..." {...field} />
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

        <Button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </Button>
      </form>
    </Form>
  );
}
