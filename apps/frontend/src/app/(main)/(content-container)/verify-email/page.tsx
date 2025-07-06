import { Card, CardContent } from "@/components/ui/card";
import { CheckCircleIcon, XCircleIcon, Loader2Icon } from "lucide-react";

import { Suspense } from "react";
import {
  VerifyEmailErrorButton,
  VerifyEmailSuccessButton
} from "../../../../components/ui/VerifyEmailButton";
import { envConfig } from "@/configs/env";
import Link from "next/link";
import { createNextUrl } from "@/lib/utils";

interface VerifyEmailPageProps {
  searchParams: Promise<{
    token: string;
  }>;
}

async function VerifyEmailContent({ token }: { token: string }) {
  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-4">
          <XCircleIcon
            className="h-16 w-16 text-destructive"
            data-testid="x-circle-icon"
          />
          <h1 className="text-2xl font-bold">Invalid verification</h1>
          <p className="text-muted-foreground text-center">No token found.</p>
          <VerifyEmailErrorButton />
        </CardContent>
      </Card>
    );
  }

  let success = false;

  const res = await fetch(`${envConfig.API_URL}/api/v1/verify-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ token }),
    cache: "no-store" // don't cache
  });

  if (res.ok) {
    success = true;
  }

  if (success) {
    return (
      <Card className="w-full max-w-md" data-testid="verify-email-success-card">
        <CardContent className="flex flex-col items-center gap-4">
          <CheckCircleIcon
            className="h-16 w-16 text-[hsl(35,93%,49%)]"
            data-testid="check-circle-icon"
          />
          <h1 className="text-2xl font-bold">Email verified!</h1>
          <p className="text-muted-foreground text-center">
            Your email address was successfully verified.
          </p>
          <VerifyEmailSuccessButton showSuccessToast={true} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col items-center gap-4">
        <XCircleIcon
          className="h-16 w-16 text-destructive"
          data-testid="x-circle-icon"
        />
        <h1 className="text-2xl font-bold">Verification failed</h1>
        <p className="text-muted-foreground text-center">
          Your verification link is invalid or has expired. Please request a new
          one from <Link href={createNextUrl("/profile")}>your profile</Link>
        </p>
        <VerifyEmailErrorButton />
      </CardContent>
    </Card>
  );
}

export default async function VerifyEmailPage({
  searchParams
}: VerifyEmailPageProps) {
  const { token } = await searchParams;

  return (
    <div className="flex justify-center p-4">
      <Suspense
        fallback={
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center gap-4">
              <Loader2Icon className="h-12 w-12 animate-spin text-[hsl(35,93%,49%)]" />
              <h1 className="text-2xl font-bold">Verifying your email...</h1>
              <p className="text-muted-foreground text-center">
                Please wait a moment.
              </p>
            </CardContent>
          </Card>
        }
      >
        <VerifyEmailContent token={token} />
      </Suspense>
    </div>
  );
}
