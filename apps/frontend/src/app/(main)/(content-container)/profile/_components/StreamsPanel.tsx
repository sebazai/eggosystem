"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { clientApiFetch } from "@/lib/apiClient";
import { toast } from "sonner";
import { Link2, Star, Trash2, Tv } from "lucide-react";

const streamUrlSchema = z.object({
  stream_url: z
    .string()
    .url("Enter a valid URL")
    .min(1, "Stream URL is required")
});

type StreamUrlForm = z.infer<typeof streamUrlSchema>;

interface StreamUrlItem {
  id: number;
  stream_url: string;
  is_default: boolean;
}

interface StreamUrlsResponse {
  urls: StreamUrlItem[];
}

interface StreamsPanelProps {
  canManageUrls: boolean;
}

export function StreamsPanel({ canManageUrls }: StreamsPanelProps) {
  const [urls, setUrls] = useState<StreamUrlItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);

  const form = useForm<StreamUrlForm>({
    resolver: zodResolver(streamUrlSchema),
    defaultValues: { stream_url: "" }
  });

  const loadUrls = useCallback(async () => {
    try {
      const response = await clientApiFetch<StreamUrlsResponse>(
        "/api/v1/accounts/caster/urls"
      );
      setUrls(response.urls ?? []);
    } catch {
      setUrls([]);
    }
  }, []);

  useEffect(() => {
    if (canManageUrls) loadUrls();
  }, [canManageUrls, loadUrls]);

  const onSubmit = async (data: StreamUrlForm) => {
    setIsLoading(true);
    try {
      await clientApiFetch("/api/v1/accounts/caster/urls", {
        method: "POST",
        body: JSON.stringify(data)
      });
      toast.success("Stream URL added successfully.");
      form.reset({ stream_url: "" });
      await loadUrls();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add stream URL"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await clientApiFetch(`/api/v1/accounts/caster/urls/${id}`, {
        method: "DELETE"
      });
      toast.success("Stream URL removed.");
      await loadUrls();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete stream URL"
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: number) => {
    setSettingDefaultId(id);
    try {
      await clientApiFetch(`/api/v1/accounts/caster/urls/${id}/default`, {
        method: "PATCH"
      });
      setUrls((prev) => prev.map((u) => ({ ...u, is_default: u.id === id })));
      toast.success("Default stream URL updated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to set default URL"
      );
      await loadUrls();
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleClearDefault = async () => {
    try {
      await clientApiFetch("/api/v1/accounts/caster/default-url", {
        method: "DELETE"
      });
      setUrls((prev) => prev.map((u) => ({ ...u, is_default: false })));
      toast.success("Default cleared.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to clear default"
      );
      await loadUrls();
    }
  };

  const defaultUrl = urls.find((u) => u.is_default);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tv className="size-4 text-kanaliiga-orange" />
          Stream URLs
        </CardTitle>
        <CardDescription>
          When you reserve a match for casting, your default URL is auto-filled
          into the broadcast slot. Add multiple if you stream on different
          channels for different games.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canManageUrls && (
          <p className="text-sm text-muted-foreground">
            Stream URL management is available to users with the caster role.
          </p>
        )}

        {canManageUrls && (
          <>
            {urls.length > 0 && (
              <ul className="space-y-2">
                {urls.map((item) => (
                  <li
                    key={item.id}
                    className={`flex flex-wrap items-center gap-2 rounded-[var(--radius)] border p-3 ${
                      item.is_default
                        ? "border-kanaliiga-orange/40"
                        : "border-border"
                    }`}
                  >
                    <Link2 className="size-4 shrink-0 text-kanaliiga-light-brown" />
                    <a
                      href={item.stream_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1 truncate font-mono text-sm hover:underline"
                    >
                      {item.stream_url}
                    </a>
                    {item.is_default && (
                      <Badge variant="default" className="shrink-0">
                        <Star className="size-3" />
                        Default
                      </Badge>
                    )}
                    <div className="flex items-center gap-1">
                      {item.is_default ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleClearDefault}
                          className="text-muted-foreground"
                        >
                          Clear default
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(item.id)}
                          disabled={settingDefaultId === item.id}
                          aria-label={`Set ${item.stream_url} as default`}
                        >
                          <Star className="size-4" />
                          Set default
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        aria-label={`Delete ${item.stream_url}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-3"
              >
                <FormField
                  control={form.control}
                  name="stream_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Add Stream URL</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://twitch.tv/your-channel"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <Button
                          type="submit"
                          variant="outline"
                          disabled={isLoading || !form.formState.isDirty}
                        >
                          {isLoading ? "Adding…" : "Add URL →"}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>

            {defaultUrl && (
              <p className="font-mono text-xs text-muted-foreground">
                Default URL{" "}
                <span className="text-kanaliiga-light-brown">
                  {defaultUrl.stream_url}
                </span>{" "}
                auto-fills when you reserve matches.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
