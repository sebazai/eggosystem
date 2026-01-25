"use client";

import { LoadingSpinner } from "./";

interface AuthLoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export function AuthLoading({
  message = "Checking authentication...",
  fullScreen = false
}: AuthLoadingProps) {
  return (
    <LoadingSpinner
      size="lg"
      text={message}
      fullScreen={fullScreen}
      className={fullScreen ? "min-h-screen" : undefined}
    />
  );
}
