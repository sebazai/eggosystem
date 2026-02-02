"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tv } from "lucide-react";
import { clientApiFetch } from "@/lib/apiClient";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { hasCasterAccess } from "@/lib/roleUtils";
import { useIsMatch2xBO1StreamReservation } from "@/hooks/data/useIsMatch2xBO1StreamReservation";
import { useAccountMatchReservation } from "@/hooks/data/user/useAccountMatchReservation";
import { Spinner } from "../ui/spinner";

interface StreamReservationProps {
  matchId: string;
  onReservationChange: () => Promise<void>;
}

interface CasterDefaultUrl {
  stream_url: string | null;
}

interface CasterUrlItem {
  id: number;
  stream_url: string;
  is_default: boolean;
}

interface CasterUrlsResponse {
  urls: CasterUrlItem[];
}

export function StreamReservation({
  matchId,
  onReservationChange
}: StreamReservationProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [streamUrl, setStreamUrl] = useState("");
  const [casterUrls, setCasterUrls] = useState<CasterUrlItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDefault, setIsLoadingDefault] = useState(false);
  const [reserveBothGames, setReserveBothGames] = useState(true);
  const { is2xBO1, isLoading: _isLoadingIs2xBO1 } =
    useIsMatch2xBO1StreamReservation(matchId);

  const canReserve = hasCasterAccess(user);
  const {
    data: reservation,
    isLoading: isLoadingReservation,
    mutate: mutateReservation
  } = useAccountMatchReservation(matchId);

  useEffect(() => {
    if (reservation) {
      setStreamUrl(reservation.stream_url ?? "");
    }
  }, [reservation]);

  if (!canReserve) {
    return null; // Don't show button if user doesn't have caster role
  }

  const loadCasterUrlsAndDefault = async () => {
    setIsLoadingDefault(true);
    try {
      const listResponse = await clientApiFetch<CasterUrlsResponse>(
        "/api/v1/accounts/caster/urls"
      );
      const urls = listResponse.urls ?? [];
      setCasterUrls(urls);

      if (urls.length >= 1 && !reservation && streamUrl === "") {
        const defaultOrFirst = urls.find((u) => u.is_default) ?? urls[0];
        if (defaultOrFirst) {
          setStreamUrl(defaultOrFirst.stream_url);
        }
      } else if (urls.length === 0) {
        const defaultResponse = await clientApiFetch<CasterDefaultUrl>(
          "/api/v1/accounts/caster/default-url"
        );
        if (defaultResponse.stream_url && !reservation && streamUrl === "") {
          setStreamUrl(defaultResponse.stream_url);
        }
      }
    } catch (_error) {
      setCasterUrls([]);
    } finally {
      setIsLoadingDefault(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    loadCasterUrlsAndDefault();
  };

  const handleReserve = async () => {
    if (!streamUrl?.trim()) {
      toast.error("Please enter a stream URL");
      return;
    }

    setIsLoading(true);
    try {
      await clientApiFetch(`/api/v1/matches/${matchId}/reserve-cast`, {
        method: reservation ? "PUT" : "POST",
        body: JSON.stringify({
          stream_url: streamUrl,
          reserve_both_games: is2xBO1 ? reserveBothGames : undefined
        })
      });
      await onReservationChange();

      toast.success(
        reservation
          ? is2xBO1 && reserveBothGames
            ? "Stream updated successfully for both games!"
            : "Stream updated successfully!"
          : is2xBO1 && reserveBothGames
            ? "Stream reserved successfully for both games!"
            : "Stream reserved successfully!"
      );
      setIsOpen(false);
      setStreamUrl("");
      setReserveBothGames(true); // Reset to default
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to reserve stream"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelReservation = async () => {
    setIsLoading(true);
    try {
      await clientApiFetch(`/api/v1/matches/${matchId}/reserve-cast`, {
        method: "DELETE"
      });
      await mutateReservation();
      await onReservationChange();
      toast.success("Stream reservation cancelled successfully!");
      if (is2xBO1) {
        toast.warning(
          "Remember to cancel the other reservation if you reserved both BO1 games for same day",
          {
            duration: 10000,
            position: "bottom-center"
          }
        );
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to cancel stream reservation"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={handleOpen}
          className="flex items-center gap-2 w-full"
          variant="outline"
        >
          <Tv className="h-4 w-4" />
          {reservation ? "Edit Reservation" : "Reserve for Streaming"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reserve Match for Streaming</DialogTitle>
          <DialogDescription>
            Enter your stream URL to reserve this match for casting
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="streamUrl">Stream URL</Label>
            {casterUrls.length >= 2 ? (
              <Select
                value={streamUrl || undefined}
                onValueChange={setStreamUrl}
              >
                <SelectTrigger
                  id="streamUrl"
                  className="w-full"
                  disabled={isLoading || isLoadingDefault}
                >
                  <SelectValue placeholder="Choose a stream URL" />
                </SelectTrigger>
                <SelectContent>
                  {casterUrls.map((item) => (
                    <SelectItem key={item.id} value={item.stream_url}>
                      {item.stream_url}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="streamUrl"
                type="url"
                placeholder="https://twitch.tv/your-channel"
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                disabled={isLoading || isLoadingDefault}
              />
            )}
            {isLoadingDefault && (
              <p className="text-sm text-muted-foreground">
                Loading your URLs...
              </p>
            )}
          </div>
          {is2xBO1 && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="reserveBothGames"
                checked={reserveBothGames}
                onCheckedChange={(checked) =>
                  setReserveBothGames(checked === true)
                }
                disabled={isLoading}
              />
              <Label
                htmlFor="reserveBothGames"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {reservation
                  ? "Update both BO1 games for same day"
                  : "Reserve both BO1 games for same day"}
              </Label>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              onClick={handleReserve}
              disabled={isLoading || !streamUrl?.trim()}
              className="flex-1"
            >
              {isLoading
                ? "Saving..."
                : reservation
                  ? "Update"
                  : "Reserve Stream"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
          {isLoadingReservation && <Spinner />}
          {reservation && (
            <Button variant="outline" onClick={handleCancelReservation}>
              Cancel Reservation
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
