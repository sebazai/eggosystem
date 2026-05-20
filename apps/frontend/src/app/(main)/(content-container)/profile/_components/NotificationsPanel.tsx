"use client";

// TODO: Wire to GET/PATCH /api/v1/accounts/notifications once the endpoint is implemented.
// Currently stubbed — switches are rendered but mutations are no-ops.

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell } from "lucide-react";

interface NotifRow {
  id: string;
  title: string;
  description: string;
  defaultOn: boolean;
}

const ROWS: NotifRow[] = [
  {
    id: "matchReminders",
    title: "Match reminders",
    description: "30 minutes before a match you're rostered in.",
    defaultOn: true
  },
  {
    id: "teamInvites",
    title: "Team invitations",
    description: "When a captain invites you to their roster.",
    defaultOn: true
  },
  {
    id: "casterAssignments",
    title: "Caster assignments",
    description: "When you're slotted to cast a match.",
    defaultOn: true
  },
  {
    id: "weeklyDigest",
    title: "Weekly digest",
    description: "Monday morning: your team's results and league standings.",
    defaultOn: false
  },
  {
    id: "productNews",
    title: "Product news",
    description: "New features in Kanahub, Kanahautomo, and Titta.",
    defaultOn: false
  }
];

export function NotificationsPanel() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries(ROWS.map((r) => [r.id, r.defaultOn]))
  );

  const handleToggle = (id: string, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [id]: value }));
    // TODO: PATCH /api/v1/accounts/notifications with { [id]: value } (optimistic)
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="size-4 text-kanaliiga-orange" />
          Email preferences
        </CardTitle>
        <CardDescription>
          We never share your email with sponsors. Tournament newsletter is
          managed under Privacy &amp; consent on the Identity tab.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-border">
          {ROWS.map((row, i) => (
            <div key={row.id}>
              <div className="flex items-center justify-between gap-4 py-4">
                <div>
                  <p className="text-sm font-semibold">{row.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {row.description}
                  </p>
                </div>
                <Switch
                  checked={prefs[row.id]}
                  onCheckedChange={(v) => handleToggle(row.id, v)}
                  aria-label={row.title}
                />
              </div>
              {i < ROWS.length - 1 && <Separator className="hidden" />}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
