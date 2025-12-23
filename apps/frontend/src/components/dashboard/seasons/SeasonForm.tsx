"use client";

import { useState, useEffect } from "react";
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
  type Season,
  SeasonPlatform
} from "@eggosystem/types";
import { useGames } from "@/hooks/data/useGames";
import { useGameTypes } from "@/hooks/data/useGameTypes";
import { useSeason } from "@/hooks/data/useSeason";
import {
  convertLocalDateTimeToISO,
  formatDateTimeForInput
} from "@/lib/date-utils";

interface SeasonFormProps {
  onSubmit?: (data: SeasonFormRaw) => void | Promise<void>;
  seasonId?: number;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

export function SeasonForm({
  onSubmit,
  seasonId,
  isLoading = false,
  mode = "create"
}: SeasonFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { games, isLoading: gamesLoading } = useGames();
  const { gameTypes, isLoading: gameTypesLoading } = useGameTypes();
  const { season, isLoading: seasonLoading } = useSeason(seasonId ?? null);

  // Convert Season to SeasonFormValues for editing
  const getInitialValues = (season: Season): SeasonFormValues => {
    // Convert ISO date strings to YYYY-MM-DD format for date inputs
    const formatDateForInput = (dateStr: string | null): string | null => {
      if (!dateStr) return null;
      // If already in YYYY-MM-DD format, return as is
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
      // Otherwise, parse ISO format and convert to YYYY-MM-DD
      try {
        const date = new Date(dateStr);
        return date.toISOString().split("T")[0] || null;
      } catch {
        return null;
      }
    };

    return {
      game_id: season.game_id,
      game_type_id: season.game_type_id,
      organizer_id: season.organizer_id,
      name: season.name,
      full_name: season.full_name,
      signup_start_date: formatDateTimeForInput(season.signup_start_date),
      signup_end_date: formatDateTimeForInput(season.signup_end_date),
      start_date: formatDateForInput(season.start_date) || "",
      end_date: formatDateForInput(season.end_date),
      platform: season.platform,
      is_round_robin_bo2_as_2xbo1: season.is_round_robin_bo2_as_2xbo1,
      payment_link: season.payment_link || null,
      registration_price: season.registration_price ?? null,
      has_vat: season.has_vat,
      early_bird_price_discount: season.early_bird_price_discount ?? null,
      early_bird_price_discount_end_date: formatDateTimeForInput(
        season.early_bird_price_discount_end_date
      )
    };
  };

  const form = useForm<SeasonFormValues>({
    resolver: zodResolver(seasonFormSchema),
    defaultValues: {
      game_id: 1,
      game_type_id: 1,
      organizer_id: 1,
      name: "",
      full_name: "",
      signup_start_date: null,
      signup_end_date: null,
      start_date: "",
      end_date: null,
      platform: SeasonPlatform.Kanaliiga,
      is_round_robin_bo2_as_2xbo1: false,
      payment_link: null,
      registration_price: null,
      has_vat: true,
      early_bird_price_discount: null,
      early_bird_price_discount_end_date: null
    },
    mode: "onTouched"
  });

  // Reset form when season data loads
  useEffect(() => {
    if (season) {
      form.reset(getInitialValues(season));
    }
  }, [season, form]);

  const selectedGameId = form.watch("game_id");

  // Filter game types based on selected game
  const filteredGameTypes = gameTypes.filter(
    (gameType) => gameType.game_id === selectedGameId
  );

  const handleSubmit = async (data: SeasonFormValues) => {
    if (!onSubmit) return;

    setIsSubmitting(true);
    try {
      const rawData: SeasonFormRaw = {
        game_id: data.game_id,
        game_type_id: data.game_type_id,
        organizer_id: data.organizer_id || 1,
        name: data.name,
        full_name: data.full_name,
        signup_start_date: convertLocalDateTimeToISO(
          data.signup_start_date ?? null
        ),
        signup_end_date: convertLocalDateTimeToISO(
          data.signup_end_date ?? null
        ),
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
        has_vat: Boolean(data.has_vat),
        early_bird_price_discount:
          data.early_bird_price_discount !== undefined &&
          data.early_bird_price_discount !== null
            ? data.early_bird_price_discount
            : null,
        early_bird_price_discount_end_date: convertLocalDateTimeToISO(
          data.early_bird_price_discount_end_date ?? null
        )
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
    isLoading ||
    isSubmitting ||
    gamesLoading ||
    gameTypesLoading ||
    seasonLoading;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>
          {mode === "edit" ? "Edit Season" : "Create New Season"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {seasonLoading && mode === "edit" ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Loading season data...</span>
          </div>
        ) : (
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
                      disabled={
                        isFormDisabled || filteredGameTypes.length === 0
                      }
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
                            {platform.charAt(0).toUpperCase() +
                              platform.slice(1)}
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
                        value={field.value || ""}
                        onChange={(e) => {
                          field.onChange(e.target.value || null);
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
                        value={field.value || ""}
                        onChange={(e) => {
                          field.onChange(e.target.value || null);
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
                        Treat round robin BO2 matches as two separate BO1
                        matches
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
                          field.onChange(
                            value === "" ? null : parseFloat(value)
                          );
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

              {/* Early Bird Price Discount */}
              <FormField
                control={form.control}
                name="early_bird_price_discount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Early Bird Discount (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        placeholder="e.g., 0.2 for 20% discount"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(
                            value === "" ? null : parseFloat(value)
                          );
                        }}
                        disabled={isFormDisabled}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Discount as decimal (0.2 = 20% off). Must be between 0 and
                      1.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Early Bird Discount End Date */}
              <FormField
                control={form.control}
                name="early_bird_price_discount_end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Early Bird Discount End Date (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          field.onChange(e.target.value || null);
                        }}
                        disabled={isFormDisabled}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">
                      Date and time when the early bird discount expires
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isFormDisabled}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "edit"
                      ? "Saving Season..."
                      : "Creating Season..."}
                  </>
                ) : mode === "edit" ? (
                  "Save Season"
                ) : (
                  "Create Season"
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
