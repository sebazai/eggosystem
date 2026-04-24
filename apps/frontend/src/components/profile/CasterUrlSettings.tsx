"use client";

import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormLabel
} from "@/components/ui/form";
import { clientApiFetch } from "@/lib/apiClient";
import { toast } from "sonner";
import { Tv, Trash2, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const casterUrlSchema = z.object({
  stream_url: z.url("Enter a valid URL").min(1, "Stream URL is required")
});

type CasterUrlForm = z.infer<typeof casterUrlSchema>;

interface CasterUrlItem {
  id: number;
  stream_url: string;
  is_default: boolean;
}

interface CasterUrlsResponse {
  urls: CasterUrlItem[];
}

export function CasterUrlSettings({
  canManageUrls
}: {
  canManageUrls: boolean;
}) {
  const [urls, setUrls] = useState<CasterUrlItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<number | null>(null);

  const form = useForm<CasterUrlForm>({
    resolver: zodResolver(casterUrlSchema),
    defaultValues: {
      stream_url: ""
    }
  });

  const loadUrls = useCallback(async () => {
    if (!canManageUrls) return;
    try {
      const response = await clientApiFetch<CasterUrlsResponse>(
        "/api/v1/accounts/caster/urls"
      );
      setUrls(response.urls ?? []);
    } catch (_error) {
      setUrls([]);
    }
  }, [canManageUrls]);

  useEffect(() => {
    if (canManageUrls) {
      loadUrls();
    }
  }, [canManageUrls, loadUrls]);

  const onSubmit = async (data: CasterUrlForm) => {
    setIsLoading(true);
    try {
      await clientApiFetch("/api/v1/accounts/caster/urls", {
        method: "POST",
        body: JSON.stringify(data)
      });
      toast.success("Stream URL added successfully!");
      form.reset({ stream_url: "" });
      await loadUrls();
    } catch (error: unknown) {
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
      toast.success("Stream URL deleted successfully!");
      await loadUrls();
    } catch (error: unknown) {
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
      toast.success("Default stream URL updated!");
      await loadUrls();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to set default URL"
      );
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleClearDefault = async () => {
    try {
      await clientApiFetch("/api/v1/accounts/caster/default-url", {
        method: "DELETE"
      });
      toast.success("Default cleared.");
      await loadUrls();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to clear default"
      );
    }
  };

  if (!canManageUrls) {
    return null;
  }

  const defaultUrl = urls.find((u) => u.is_default);

  return (
    <div className="space-y-4 pt-6 border-t">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Tv className="h-5 w-5" />
          Caster Settings
        </h2>
        <p className="text-sm text-muted-foreground">
          Add multiple stream URLs and choose which one is used when you reserve
          matches for streaming.
        </p>
      </div>

      {urls.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Your stream URLs</h3>
          <ul className="space-y-2">
            {urls.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 px-3 py-2"
              >
                <a
                  href={item.stream_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline truncate min-w-0 flex-1"
                >
                  {item.stream_url}
                </a>
                {item.is_default ? (
                  <>
                    <Badge variant="secondary" className="shrink-0">
                      Default
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleClearDefault}
                      className="shrink-0 text-muted-foreground"
                    >
                      Clear default
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSetDefault(item.id)}
                    disabled={settingDefaultId === item.id}
                    className="shrink-0"
                    title="Set as default"
                    aria-label={`Set ${item.stream_url} as default`}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  title="Delete URL"
                  className="shrink-0"
                  aria-label={`Delete ${item.stream_url}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 max-w-md"
        >
          <FormField
            control={form.control}
            name="stream_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Add stream URL</FormLabel>
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
                    disabled={isLoading || !form.formState.isDirty}
                  >
                    {isLoading ? "Adding..." : "Add URL"}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>

      {defaultUrl && (
        <p className="text-sm text-muted-foreground">
          The default URL (
          <span className="font-medium text-foreground">
            {defaultUrl.stream_url}
          </span>
          ) will be auto-filled when you reserve matches for streaming.
        </p>
      )}
    </div>
  );
}
