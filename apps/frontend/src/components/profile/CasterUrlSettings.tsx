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
import { Tv, Trash2 } from "lucide-react";

const casterUrlSchema = z.object({
  stream_url: z.url("Please enter a valid URL").min(1, "Stream URL is required")
});

type CasterUrlForm = z.infer<typeof casterUrlSchema>;

interface CasterDefaultUrl {
  stream_url: string | null;
}

export function CasterUrlSettings({
  canManageUrls
}: {
  canManageUrls: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  const form = useForm<CasterUrlForm>({
    resolver: zodResolver(casterUrlSchema),
    defaultValues: {
      stream_url: ""
    }
  });

  const loadCurrentUrl = useCallback(async () => {
    try {
      const response = await clientApiFetch<CasterDefaultUrl>(
        "/api/v1/accounts/caster/default-url"
      );
      if (response.stream_url) {
        setCurrentUrl(response.stream_url);
        form.setValue("stream_url", response.stream_url);
      }
    } catch (_error) {
      // No default URL found, which is fine
      setCurrentUrl(null);
    }
  }, [form]);

  useEffect(() => {
    if (canManageUrls) {
      loadCurrentUrl();
    }
  }, [canManageUrls, loadCurrentUrl]);

  const onSubmit = async (data: CasterUrlForm) => {
    setIsLoading(true);
    try {
      await clientApiFetch("/api/v1/accounts/caster/default-url", {
        method: "POST",
        body: JSON.stringify(data)
      });

      setCurrentUrl(data.stream_url);
      toast.success("Default stream URL saved successfully!");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save stream URL"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await clientApiFetch("/api/v1/accounts/caster/default-url", {
        method: "DELETE"
      });

      setCurrentUrl(null);
      form.setValue("stream_url", "");
      toast.success("Default stream URL deleted successfully!");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete stream URL"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (!canManageUrls) {
    return null; // Don't show this section if user doesn't have caster role
  }

  return (
    <div className="space-y-4 pt-6 border-t">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Tv className="h-5 w-5" />
          Caster Settings
        </h2>
        <p className="text-sm text-muted-foreground">
          Set your default stream URL for quick match reservations
        </p>
      </div>
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
                <FormLabel>Default Stream URL</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://twitch.tv/your-channel"
                      {...field}
                      disabled={isLoading || isDeleting}
                    />
                  </FormControl>
                  {currentUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleDelete}
                      disabled={isLoading || isDeleting}
                      title="Delete default URL"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <FormMessage />
                {currentUrl && (
                  <p className="text-sm text-muted-foreground">
                    This URL will be auto-filled when you reserve matches for
                    streaming.
                  </p>
                )}
              </FormItem>
            )}
          />
          <Button
            type="submit"
            disabled={isLoading || isDeleting || !form.formState.isDirty}
          >
            {isLoading ? "Saving..." : "Save Default URL"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
