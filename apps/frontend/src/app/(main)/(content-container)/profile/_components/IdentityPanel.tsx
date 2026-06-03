"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { AvatarSettings } from "./AvatarSettings";
import ProfileForm from "./ProfileForm";
import type { UserFullPayload } from "@eggosystem/types";

interface IdentityPanelProps {
  user: UserFullPayload;
  checkAuth: () => Promise<void>;
}

export function IdentityPanel({ user, checkAuth }: IdentityPanelProps) {
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle>Profile avatar</CardTitle>
          <CardDescription>
            Upload a custom avatar to display on your player profile, team
            pages, and match lineups.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarSettings steamId={user.provider_id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Identity</CardTitle>
          <CardDescription>
            How we display you across Kanahub. Kana nickname is public; full
            name and email are visible only to admins.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm user={user} checkAuth={checkAuth} />
        </CardContent>
      </Card>
    </div>
  );
}
