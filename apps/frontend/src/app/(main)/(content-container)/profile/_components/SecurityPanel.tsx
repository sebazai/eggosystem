"use client";

// TODO: Wire 2FA to POST /api/v1/accounts/2fa/enroll once implemented.
// TODO: Wire sessions to GET /api/v1/accounts/sessions and DELETE /api/v1/accounts/sessions/:id.
// TODO: Wire "Leave Kanaliiga" to DELETE /api/v1/accounts/leave.
// TODO: Wire "Delete account" to DELETE /api/v1/accounts once implemented.

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import {
  AlertTriangle,
  Laptop,
  Shield,
  ShieldOff,
  Smartphone
} from "lucide-react";
import { toast } from "sonner";

export function SecurityPanel() {
  const [showLeave, setShowLeave] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const handleLeave = () => {
    // TODO: call DELETE /api/v1/accounts/leave
    toast.error("Leave league is not yet implemented.");
    setShowLeave(false);
  };

  const handleDelete = () => {
    // TODO: call DELETE /api/v1/accounts
    toast.error("Account deletion is not yet implemented.");
    setShowDelete(false);
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-4 text-kanaliiga-orange" />
            Two-factor authentication
          </CardTitle>
          <CardDescription>
            Required for team captains and casters from S6 onward. Use an
            authenticator app (Google Authenticator, 1Password, Authy).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <ShieldOff className="size-5 text-muted-foreground" />
              <div>
                <Badge variant="secondary">Not configured</Badge>
                <p className="mt-1 text-xs text-muted-foreground">
                  Recommended — required for captains and casters from S6.
                </p>
              </div>
            </div>
            <Button
              variant="default"
              size="sm"
              disabled
              title="2FA setup not yet available"
            >
              Set up authenticator →
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active sessions</CardTitle>
          <CardDescription>
            Devices where you are currently signed in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4 rounded-[var(--radius)] border bg-muted/30 p-3">
              <div className="flex items-center gap-3">
                <Laptop className="size-5 shrink-0 text-kanaliiga-light-brown" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">This device</span>
                    <Badge variant="default">Active now</Badge>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">
                    Current session
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {/* TODO: fetch additional sessions from GET /api/v1/accounts/sessions */}
              Full session management will be available in a future update.
            </p>
            <Button variant="outline" size="sm" className="gap-2" disabled>
              <Smartphone className="size-4" />
              Sign out other devices
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/25">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-4" />
            Danger zone
          </CardTitle>
          <CardDescription>
            These actions cannot be undone. Contact league admins if you are
            unsure.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-4 rounded-[var(--radius)] border border-destructive/25 bg-destructive/5 p-4">
            <div>
              <p className="text-sm font-semibold">Leave Kanaliiga</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Remove yourself from current teams. Your match history stays
                public.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowLeave(true)}
            >
              Leave league
            </Button>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-[var(--radius)] border border-destructive/25 bg-destructive/5 p-4">
            <div>
              <p className="text-sm font-semibold">Delete account</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Anonymizes your profile, scrubs your email, and breaks team
                links. Match stats are retained per league rules.
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDelete(true)}
            >
              Delete account
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmationModal
        open={showLeave}
        onOpenChange={setShowLeave}
        onConfirm={handleLeave}
        title="Leave Kanaliiga"
        description="This will remove you from all current teams. You can rejoin next season but will need a new invite. Are you sure?"
        confirmText="Leave league"
        cancelText="Cancel"
        confirmVariant="destructive"
      />

      <ConfirmationModal
        open={showDelete}
        onOpenChange={setShowDelete}
        onConfirm={handleDelete}
        title="Delete your account"
        description="This permanently anonymizes your profile and removes your email. Match statistics are retained per league rules. This cannot be undone."
        confirmText="Delete account"
        cancelText="Cancel"
        confirmVariant="destructive"
      />
    </div>
  );
}
