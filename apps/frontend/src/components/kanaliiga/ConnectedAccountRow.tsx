"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface ConnectedAccountRowProps {
  brand: string;
  icon: React.ReactNode;
  connected: boolean;
  statusText: string;
  meta?: React.ReactNode;
  onLink?: () => void;
  onUnlink?: () => void;
  linkLabel?: string;
  unlinkLabel?: string;
  disabled?: boolean;
  comingSoon?: boolean;
}

export function ConnectedAccountRow({
  brand,
  icon,
  connected,
  statusText,
  meta,
  onLink,
  onUnlink,
  linkLabel,
  unlinkLabel,
  disabled,
  comingSoon
}: ConnectedAccountRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[var(--radius)] border bg-muted/30 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius)] bg-muted">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{brand}</span>
            {connected ? (
              <Badge variant="success">
                <CheckCircle2 />
                Linked
              </Badge>
            ) : (
              <Badge variant="secondary">Not linked</Badge>
            )}
          </div>
          <p className="truncate font-mono text-xs text-muted-foreground">
            {statusText}
          </p>
          {meta && (
            <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
          )}
        </div>
      </div>
      {(comingSoon || onLink || onUnlink) && (
        <div className="shrink-0">
          {comingSoon ? (
            <Button variant="outline" size="sm" disabled>
              Coming soon
            </Button>
          ) : connected ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onUnlink}
              disabled={disabled}
            >
              {unlinkLabel ?? `Unlink ${brand}`}
            </Button>
          ) : (
            <Button size="sm" onClick={onLink} disabled={disabled}>
              {linkLabel ?? `Link ${brand} →`}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
