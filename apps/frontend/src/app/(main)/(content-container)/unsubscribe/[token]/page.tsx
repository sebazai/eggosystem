"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircleIcon, XCircleIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";
import { envConfig } from "@/configs/env";
import Link from "next/link";
import { createNextUrl } from "@/lib/utils";
import { useParams } from "next/navigation";
import { useSWRConfig } from "swr";

export default function UnsubscribePage() {
  const params = useParams();
  const { mutate } = useSWRConfig();
  const token = params?.token as string;
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string>("");

  const handleUnsubscribe = async () => {
    if (!token) {
      setStatus("error");
      setMessage("No unsubscribe token found.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(
        `${envConfig.API_URL}/api/v1/accounts/unsubscribe/${token}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          },
          cache: "no-store"
        }
      );

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus("success");
        setMessage(
          data.message ||
            "You have been successfully unsubscribed from tournament newsletters. You will no longer receive these emails."
        );
        // Invalidate profile cache to refresh newsletter status
        await mutate("/api/v1/accounts/profile", undefined, {
          revalidate: true
        });
      } else {
        const errorData = await res.json().catch(() => ({}));
        setStatus("error");
        setMessage(
          errorData.detail ||
            errorData.message ||
            errorData.error ||
            "Your unsubscribe link is invalid or has expired. If you continue to receive emails, please contact support."
        );
      }
    } catch (error) {
      console.error("Error unsubscribing:", error);
      setStatus("error");
      setMessage("An error occurred while processing your request.");
    }
  };

  if (!token) {
    return (
      <div className="flex justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="flex flex-col items-center gap-4">
            <XCircleIcon
              className="h-16 w-16 text-destructive"
              data-testid="x-circle-icon"
            />
            <h1 className="text-2xl font-bold">Invalid unsubscribe link</h1>
            <p className="text-muted-foreground text-center">No token found.</p>
            <Link
              href={createNextUrl("/")}
              className="text-[hsl(35,93%,49%)] hover:underline"
            >
              Return to homepage
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex justify-center p-4">
        <Card
          className="w-full max-w-lg"
          data-testid="unsubscribe-success-card"
        >
          <CardContent className="flex flex-col items-center gap-4">
            <CheckCircleIcon
              className="h-16 w-16 text-[hsl(35,93%,49%)]"
              data-testid="check-circle-icon"
            />
            <h1 className="text-2xl font-bold">Successfully unsubscribed</h1>
            <p className="text-muted-foreground text-center">{message}</p>
            <Link
              href={createNextUrl("/")}
              className="text-[hsl(35,93%,49%)] hover:underline"
            >
              Return to homepage
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="flex flex-col items-center gap-4">
            <XCircleIcon
              className="h-16 w-16 text-destructive"
              data-testid="x-circle-icon"
            />
            <h1 className="text-2xl font-bold">Unsubscribe failed</h1>
            <p className="text-muted-foreground text-center">{message}</p>
            <Link
              href={createNextUrl("/")}
              className="text-[hsl(35,93%,49%)] hover:underline"
            >
              Return to homepage
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="flex flex-col items-center gap-4">
          <h1 className="text-2xl font-bold">Unsubscribe from newsletters</h1>
          <p className="text-muted-foreground text-center">
            Click the button below to unsubscribe from tournament newsletters.
            You will no longer receive welcome emails and other tournament
            updates.
          </p>
          {status === "loading" ? (
            <>
              <Loader2Icon className="h-12 w-12 animate-spin text-[hsl(35,93%,49%)]" />
              <p className="text-muted-foreground text-center">
                Processing unsubscribe...
              </p>
            </>
          ) : (
            <Button
              onClick={handleUnsubscribe}
              className="bg-[hsl(35,93%,49%)] hover:bg-[hsl(35,93%,45%)] text-white"
            >
              Unsubscribe
            </Button>
          )}
          <Link
            href={createNextUrl("/")}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            Return to homepage
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
