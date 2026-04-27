"use client";
import * as React from "react";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { createBaseUrl, createDashboardNextUrl } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/ui/spinner";
import { DashboardSeasonSelector } from "@/components/dashboard/DashboardSeasonSelector";
import { usePendingCasterApplicationsCount } from "@/hooks/data/useCasterApplication";
interface SubMenuItem {
  title: string;
  url: string;
  requiredRoles?: string[];
}

interface MenuItem {
  title: string;
  url: string;
  requiredRoles?: string[];
  items: Array<SubMenuItem>;
}

const data: { navMain: Array<MenuItem> } = {
  navMain: [
    {
      title: "Kanahub",
      url: createBaseUrl(),
      items: [
        // {
        //   title: "Organizations",
        //   url: `${createDashboardNextUrl("organizations")}`,
        //   requiredRoles: ["org-owner"]
        // },
        // {
        //   title: "Teams",
        //   url: `${createDashboardNextUrl("teams")}`,
        //   requiredRoles: ["org-owner", "team-owner"]
        // },
        // {
        //   title: "Players",
        //   url: `${createDashboardNextUrl("players")}`,
        //   requiredRoles: []
        // },
        {
          title: "Seasons",
          url: `${createDashboardNextUrl("seasons")}`,
          requiredRoles: ["helpdesk", "admin"]
        }
      ] satisfies Array<SubMenuItem>
    },
    {
      title: "Registration",
      url: "#",
      requiredRoles: ["helpdesk"],
      items: [
        {
          title: "Registered teams",
          url: createDashboardNextUrl("registration/registered")
        },
        {
          title: "Add rank",
          url: createDashboardNextUrl("registration/rank")
        },
        {
          title: "Add manual approval",
          url: createDashboardNextUrl("registration/approval")
        },
        {
          title: "Add team signup",
          url: createDashboardNextUrl("registration/add-team"),
          requiredRoles: ["helpdesk", "admin"]
        }
      ] satisfies Array<SubMenuItem>
    },
    {
      title: "Players",
      url: "#",
      items: [
        {
          title: "Add",
          url: createDashboardNextUrl("players/add"),
          requiredRoles: ["helpdesk", "admin"]
        },
        {
          title: "Validate",
          url: createDashboardNextUrl("players/validate"),
          requiredRoles: ["helpdesk", "admin"]
        },
        {
          title: "Fill profile data",
          url: createDashboardNextUrl("players/prepare-for-signup"),
          requiredRoles: ["helpdesk", "admin"]
        },
        {
          title: "Substitute",
          url: createDashboardNextUrl("players/substitute"),
          requiredRoles: ["helpdesk", "admin"]
        },
        {
          title: "Remove from team",
          url: createDashboardNextUrl("players/discard"),
          requiredRoles: ["helpdesk", "admin"]
        }
      ] satisfies Array<SubMenuItem>
    },
    {
      title: "Role Management",
      url: createDashboardNextUrl("role-management"),
      requiredRoles: ["helpdesk", "admin"],
      items: [] satisfies Array<SubMenuItem>
    },
    {
      title: "Sortter",
      url: createDashboardNextUrl("sortter"),
      requiredRoles: ["admin"],
      items: [
        {
          title: "Team Flags",
          url: createDashboardNextUrl("sortter/team-flags"),
          requiredRoles: ["admin"]
        },
        {
          title: "Playoff seeds",
          url: createDashboardNextUrl("playoff-seeds"),
          requiredRoles: ["admin"]
        }
      ] satisfies Array<SubMenuItem>
    },
    {
      title: "Season League Mapper",
      url: createDashboardNextUrl("season-league-mapper"),
      requiredRoles: ["admin"],
      items: [] satisfies Array<SubMenuItem>
    },
    {
      title: "Demo parser",
      url: "#",
      requiredRoles: ["admin", "helpdesk"],
      items: [
        {
          title: "Parse failed",
          url: createDashboardNextUrl("failed-parse"),
          requiredRoles: ["admin", "helpdesk"]
        },
        {
          title: "Manual demo parse",
          url: createDashboardNextUrl("manual-demo-parse"),
          requiredRoles: ["admin", "helpdesk"]
        },
        {
          title: "Edit map scores",
          url: createDashboardNextUrl("matches/games/team-game-scores"),
          requiredRoles: ["admin", "helpdesk"]
        },
        {
          title: "Flagged matches",
          url: createDashboardNextUrl("matches/flagged")
        }
      ] satisfies Array<SubMenuItem>
    },
    {
      title: "FaceIt",
      url: "#",
      requiredRoles: ["admin", "helpdesk"],
      items: [
        {
          title: "Roster Validation",
          url: createDashboardNextUrl("faceit-roster-validation"),
          requiredRoles: ["admin", "helpdesk"]
        }
      ] satisfies Array<SubMenuItem>
    },
    {
      title: "Redis Management",
      url: createDashboardNextUrl("redis"),
      requiredRoles: ["admin"],
      items: [] satisfies Array<SubMenuItem>
    },
    {
      title: "Sponsors",
      url: createDashboardNextUrl("sponsors"),
      requiredRoles: ["admin"],
      items: [] satisfies Array<SubMenuItem>
    },
    {
      title: "Email Verification",
      url: createDashboardNextUrl("email-verification"),
      requiredRoles: ["admin", "helpdesk"],
      items: [] satisfies Array<SubMenuItem>
    },
    {
      title: "Caster Applications",
      url: createDashboardNextUrl("caster-applications"),
      requiredRoles: ["admin", "helpdesk"],
      items: [] satisfies Array<SubMenuItem>
    }
  ]
};

export function DashboardAppSidebar(
  props: React.ComponentProps<typeof Sidebar>
) {
  const auth = useAuth();
  const searchParams = useSearchParams();
  const canAccessCasterApplications = auth.user?.roles.some(
    (r) => r === "admin" || r === "helpdesk"
  );
  const { pendingCount } = usePendingCasterApplicationsCount(undefined, {
    enabled: canAccessCasterApplications ?? false
  });

  if (!auth.user) {
    return <Spinner />;
  }

  // Helper function to preserve season query param when creating links
  const createLinkWithSeason = (url: string) => {
    const seasonParam = searchParams.get("season");
    if (seasonParam) {
      const separator = url.includes("?") ? "&" : "?";
      return `${url}${separator}season=${seasonParam}`;
    }
    return url;
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <ShieldCheck className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Kanahub</span>
                  <span className="">v1.0.0</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <DashboardSeasonSelector />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item) => {
              if (
                item.requiredRoles &&
                !auth.user?.roles.some(
                  (role) =>
                    item.requiredRoles?.includes(role) || role === "admin"
                )
              ) {
                return;
              }
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link
                      href={createLinkWithSeason(item.url)}
                      className="font-medium flex items-center justify-between gap-2"
                    >
                      <span>{item.title}</span>
                      {item.title === "Caster Applications" &&
                        pendingCount > 0 && (
                          <Badge variant="secondary" className="shrink-0">
                            {pendingCount}
                          </Badge>
                        )}
                    </Link>
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <SidebarMenuSub>
                      {item.items.map((item) => {
                        if (
                          item?.requiredRoles &&
                          !auth.user?.roles.some(
                            (role) =>
                              item.requiredRoles?.includes(role) ||
                              role === "admin"
                          )
                        ) {
                          return;
                        }
                        return (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild>
                              <Link href={createLinkWithSeason(item.url)}>
                                {item.title}
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
