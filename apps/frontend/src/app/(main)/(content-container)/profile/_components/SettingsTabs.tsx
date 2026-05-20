"use client";

import { useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link2, Tv, User } from "lucide-react";
import { IdentityPanel } from "./IdentityPanel";
import { AccountsPanel } from "./AccountsPanel";
import { StreamsPanel } from "./StreamsPanel";
import type { UserFullPayload } from "@eggosystem/types";
import { hasCasterAccess } from "@/lib/roleUtils";

const TABS = [
  { id: "identity", label: "Identity", icon: User },
  { id: "accounts", label: "Accounts", icon: Link2 },
  { id: "streams", label: "Streams", icon: Tv }
] as const;

type TabId = (typeof TABS)[number]["id"];

const VALID_TABS = new Set(TABS.map((t) => t.id));

function isValidTab(value: string | null): value is TabId {
  return VALID_TABS.has(value as TabId);
}

interface SettingsTabsProps {
  user: UserFullPayload;
  checkAuth: () => Promise<void>;
}

export function SettingsTabs({ user, checkAuth }: SettingsTabsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const rawTab = searchParams.get("tab");
  const activeTab: TabId = isValidTab(rawTab) ? rawTab : "identity";

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", value);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  return (
    <Tabs
      orientation="vertical"
      value={activeTab}
      onValueChange={handleTabChange}
      className="flex-col md:flex-row md:gap-8"
    >
      {/* Sidebar / top strip */}
      <TabsList
        variant="line"
        className="h-auto w-full shrink-0 items-start overflow-x-auto rounded-none bg-transparent p-0 md:w-56 md:flex-col"
      >
        {TABS.map(({ id, label, icon: Icon }) => (
          <TabsTrigger
            key={id}
            value={id}
            className="h-auto shrink-0 justify-start gap-2 rounded-[var(--radius)] border-b-2 border-b-transparent px-3 py-2.5 text-left data-[state=active]:border-b-kanaliiga-orange data-[state=active]:bg-kanaliiga-orange/10 data-[state=active]:text-foreground data-[state=active]:shadow-none md:w-full md:border-b-0 md:border-l-2 md:border-l-transparent md:data-[state=active]:border-b-0 md:data-[state=active]:border-l-kanaliiga-orange"
          >
            <Icon className="size-4 shrink-0" />
            <span>{label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Panels */}
      <div className="min-w-0 flex-1">
        <TabsContent value="identity" className="mt-0">
          <IdentityPanel user={user} checkAuth={checkAuth} />
        </TabsContent>

        <TabsContent value="accounts" className="mt-0">
          <AccountsPanel user={user} checkAuth={checkAuth} />
        </TabsContent>

        <TabsContent value="streams" className="mt-0">
          <StreamsPanel canManageUrls={hasCasterAccess(user)} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
