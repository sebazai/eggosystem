"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { RequiredFormLabel } from "@/components/ui/RequiredFormLabel";
import { Loader2 } from "lucide-react";
import {
  seasonFormSchema,
  type SeasonFormValues,
  type SeasonFormRaw,
  SeasonPlatform
} from "@eggosystem/types";
import { useGames } from "@/hooks/data/useGames";
import { useGameTypes } from "@/hooks/data/useGameTypes";

interface SeasonFormProps {
  onSubmit?: (data: SeasonFormRaw) => void | Promise<void>;
  initialValues?: Partial<SeasonFormValues>;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

export function SeasonForm({
  onSubmit,
  initialValues,
  isLoading = false,
  mode = "create"
}: SeasonFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { games, isLoading: gamesLoading } = useGames();
  const { gameTypes, isLoading: gameTypesLoading } = useGameTypes();

  const form = useForm<SeasonFormValues>({
    resolver: zodResolver(seasonFormSchema),
    defaultValues: {
      game_id: initialValues?.game_id || 1,
      game_type_id: initialValues?.game_type_id || 1,
      organizer_id: initialValues?.organizer_id || 1,
      name: initialValues?.name || "",
      full_name: initialValues?.full_name || "",
      signup_start_date: initialValues?.signup_start_date || null,
      signup_end_date: initialValues?.signup_end_date || null,
      start_date: initialValues?.start_date || "",
      end_date: initialValues?.end_date || null,
      platform: initialValues?.platform || SeasonPlatform.Kanaliiga,
      is_round_robin_bo2_as_2xbo1:
        initialValues?.is_round_robin_bo2_as_2xbo1 || false,
      payment_link: initialValues?.payment_link || null,
      registration_price:
        initialValues?.registration_price !== undefined
          ? initialValues.registration_price
          : null,
      has_vat:
        initialValues?.has_vat !== undefined
          ? Boolean(initialValues.has_vat)
          : true
    },
    mode: "onTouched"
  });

  const selectedGameId = form.watch("game_id");

  // Filter game types based on selected game
  const filteredGameTypes = gameTypes.filter(
    (gameType) => gameType.game_id === selectedGameId
  );

  const handleSubmit = async (data: SeasonFormValues) => {
    if (!onSubmit) return;

    setIsSubmitting(true);
    try {
      // Convert form data to raw format for API
      const rawData: SeasonFormRaw = {
        game_id: data.game_id,
        game_type_id: data.game_type_id,
        organizer_id: data.organizer_id || 1,
        name: data.name,
        full_name: data.full_name,
        signup_start_date: data.signup_start_date || null,
        signup_end_date: data.signup_end_date || null,
        start_date: data.start_date,
        end_date: data.end_date || null,
        platform: data.platform,
        is_round_robin_bo2_as_2xbo1: data.is_round_robin_bo2_as_2xbo1,
        payment_link: data.payment_link || null,
        registration_price:
          data.registration_price !== undefined &&
          data.registration_price !== null
            ? data.registration_price
            : null,
        has_vat: Boolean(data.has_vat)
      };

      await onSubmit(rawData);
      form.reset();
    } catch (error) {
      console.error("Error submitting season form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled =
    isLoading || isSubmitting || gamesLoading || gameTypesLoading;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>
          {mode === "edit" ? "Edit Season" : "Create New Season"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            {/* Game Selection */}
            <FormField
              control={form.control}
              name="game_id"
              render={({ field }) => (
                <FormItem>
                  <RequiredFormLabel required>Game</RequiredFormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(parseInt(value, 10));
                      // Reset game type when game changes
                      form.setValue("game_type_id", 1);
                    }}
                    value={field.value?.toString()}
                    disabled={isFormDisabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a game" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {games.map((game) => (
                        <SelectItem key={game.id} value={game.id.toString()}>
                          {game.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Game Type Selection */}
            <FormField
              control={form.control}
              name="game_type_id"
              render={({ field }) => (
                <FormItem>
                  <RequiredFormLabel required>Game Type</RequiredFormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(parseInt(value, 10))
                    }
                    value={field.value?.toString()}
                    disabled={isFormDisabled || filteredGameTypes.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a game type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredGameTypes.map((gameType) => (
                        <SelectItem
                          key={gameType.id}
                          value={gameType.id.toString()}
                        >
                          {gameType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Season Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <RequiredFormLabel required>Season Name</RequiredFormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Season 2024"
                      {...field}
                      disabled={isFormDisabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Full Season Name */}
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <RequiredFormLabel required>
                    Full Season Name
                  </RequiredFormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Kanaliiga Season 2024"
                      {...field}
                      disabled={isFormDisabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Platform Selection */}
            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <RequiredFormLabel required>Platform</RequiredFormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value as SeasonPlatform)
                    }
                    value={field.value}
                    disabled={isFormDisabled}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a platform" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(SeasonPlatform).map((platform) => (
                        <SelectItem key={platform} value={platform}>
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start Date */}
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <RequiredFormLabel required>Start Date</RequiredFormLabel>
                  <FormControl>
                    <Input type="date" {...field} disabled={isFormDisabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* End Date */}
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value || ""}
                      disabled={isFormDisabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Signup Start Date */}
            <FormField
              control={form.control}
              name="signup_start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Signup Start Date (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={field.value ? field.value.slice(0, 16) : ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value ? `${value}:00` : null);
                      }}
                      disabled={isFormDisabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Signup End Date */}
            <FormField
              control={form.control}
              name="signup_end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Signup End Date (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      value={field.value ? field.value.slice(0, 16) : ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value ? `${value}:00` : null);
                      }}
                      disabled={isFormDisabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Round Robin BO2 as 2xBO1 Checkbox */}
            <FormField
              control={form.control}
              name="is_round_robin_bo2_as_2xbo1"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isFormDisabled}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Round Robin BO2 as 2xBO1</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Treat round robin BO2 matches as two separate BO1 matches
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {/* Payment Link */}
            <FormField
              control={form.control}
              name="payment_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Link (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/payment"
                      {...field}
                      value={field.value || ""}
                      disabled={isFormDisabled}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    Link to payment page for participation fee
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Registration Price */}
            <FormField
              control={form.control}
              name="registration_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Price (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="e.g., 150"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? null : parseFloat(value));
                      }}
                      disabled={isFormDisabled}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    Participation fee in euros (€)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Has VAT Checkbox */}
            <FormField
              control={form.control}
              name="has_vat"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={Boolean(field.value)}
                      onCheckedChange={field.onChange}
                      disabled={isFormDisabled}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Price includes VAT</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      If checked, displays &quot;(includes VAT)&quot;. If
                      unchecked, displays &quot;(+VAT)&quot;.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button type="submit" disabled={isFormDisabled} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Season...
                </>
              ) : (
                "Create Season"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
