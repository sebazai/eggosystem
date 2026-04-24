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
  FormDescription,
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
  SeasonPlatform,
  isSeasonPlatform
} from "@eggosystem/types";
import { useGames } from "@/hooks/data/useGames";
import { useGameTypes } from "@/hooks/data/useGameTypes";
import { useSeason } from "@/hooks/data/useSeason";
import { useMaps } from "@/hooks/data/useMaps";
import {
  formatDateForInput,
  formatDateTimeForInput,
  convertLocalDateTimeToISO
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
  const { maps, isLoading: mapsLoading } = useMaps();

  // Convert Season to SeasonFormValues for editing
  // Backend returns UTC ISO strings (e.g., "2024-01-15T18:30:00.000Z")
  // We convert them to local time for display in datetime-local inputs
  const getInitialValues = (season: Season): SeasonFormValues => {
    return {
      game_id: season.game_id,
      game_type_id: season.game_type_id,
      organizer_id: season.organizer_id,
      name: season.name,
      full_name: season.full_name,
      // formatDateTimeForInput converts UTC ISO → local datetime-local format
      // Example: "2024-01-15T18:30:00.000Z" (UTC) → "2024-01-15T20:30" (Helsinki, UTC+2)
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
      ),
      active_map_pool: season.active_map_pool || [],
      rulebook_url: season.rulebook_url || null,
      discord_link: season.discord_link || null
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
      early_bird_price_discount_end_date: null,
      active_map_pool: [],
      rulebook_url: null,
      discord_link: null
    },
    mode: "onTouched"
  });

  // Reset form when season data loads
  useEffect(() => {
    if (season) {
      form.reset(getInitialValues(season));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [season]);

  // Ensure platform value is always valid (normalize if needed)
  useEffect(() => {
    const currentPlatform = form.getValues("platform");
    if (!isSeasonPlatform(currentPlatform)) {
      const validPlatform =
        mode === "edit" && season?.platform && isSeasonPlatform(season.platform)
          ? season.platform
          : SeasonPlatform.Kanaliiga;
      form.setValue("platform", validPlatform, { shouldValidate: false });
    }
  }, [form, mode, season]);

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
        ),
        active_map_pool: data.active_map_pool,
        rulebook_url: data.rulebook_url || null,
        discord_link: data.discord_link || null
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
    seasonLoading ||
    mapsLoading;

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
                render={({ field }) => {
                  // Ensure value is a valid SeasonPlatform string
                  // Radix UI Select requires value to match a SelectItem exactly
                  const platformValue = isSeasonPlatform(field.value)
                    ? field.value
                    : mode === "edit" &&
                        season?.platform &&
                        isSeasonPlatform(season.platform)
                      ? season.platform
                      : SeasonPlatform.Kanaliiga;

                  return (
                    <FormItem>
                      <RequiredFormLabel required>Platform</RequiredFormLabel>
                      <Select
                        onValueChange={(value) => {
                          // Ensure the value is a valid SeasonPlatform enum value before setting
                          if (isSeasonPlatform(value)) {
                            field.onChange(value);
                          }
                        }}
                        value={platformValue}
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
                  );
                }}
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
                      <FormDescription>
                        Treat round robin BO2 matches as two separate BO1
                        matches
                      </FormDescription>
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
                    <FormDescription>
                      Link to payment page for participation fee
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Rulebook URL */}
              <FormField
                control={form.control}
                name="rulebook_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rulebook URL (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://wiki.kanaliiga.fi/CS2/rulebook"
                        {...field}
                        value={field.value || ""}
                        disabled={isFormDisabled}
                      />
                    </FormControl>
                    <FormDescription>
                      Link to the season rulebook
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Discord Link */}
              <FormField
                control={form.control}
                name="discord_link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discord Link (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://discord.gg/UFetjhv"
                        {...field}
                        value={field.value || ""}
                        disabled={isFormDisabled}
                      />
                    </FormControl>
                    <FormDescription>
                      Discord invite link for the season
                    </FormDescription>
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
                    <FormDescription>
                      Participation fee in euros (€)
                    </FormDescription>
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
                      <FormDescription>
                        If checked, displays &quot;(includes VAT)&quot;. If
                        unchecked, displays &quot;(+VAT)&quot;.
                      </FormDescription>
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
                    <FormDescription>
                      Discount as decimal (0.2 = 20% off). Must be between 0 and
                      1.
                    </FormDescription>
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

              {/* Active Map Pool */}
              <FormField
                control={form.control}
                name="active_map_pool"
                render={({ field }) => (
                  <FormItem>
                    <RequiredFormLabel required>
                      Active Map Pool
                    </RequiredFormLabel>
                    <div className="space-y-3">
                      {mapsLoading ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">
                            Loading maps...
                          </span>
                        </div>
                      ) : maps.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No maps available
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {maps.map((map) => (
                            <FormItem
                              key={map.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={
                                    field.value?.includes(map.id) || false
                                  }
                                  onCheckedChange={(checked) => {
                                    const currentValue = field.value || [];
                                    if (checked) {
                                      field.onChange([...currentValue, map.id]);
                                    } else {
                                      field.onChange(
                                        currentValue.filter(
                                          (id) => id !== map.id
                                        )
                                      );
                                    }
                                  }}
                                  disabled={isFormDisabled}
                                />
                              </FormControl>
                              <FormLabel className="normal-case font-body font-normal cursor-pointer text-foreground">
                                {map.name}
                              </FormLabel>
                            </FormItem>
                          ))}
                        </div>
                      )}
                    </div>
                    <FormDescription>
                      Select at least one map to be active for this season
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isFormDisabled}
                className="w-full md:w-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "edit"
                      ? "Saving Season..."
                      : "Creating Season..."}
                  </>
                ) : mode === "edit" ? (
                  "Save Season →"
                ) : (
                  "Create Season →"
                )}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
