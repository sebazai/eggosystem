"use client";
import * as React from "react";
import { GalleryVerticalEnd } from "lucide-react";
import Link from "next/link";

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
import { createBaseUrl, createDashboardNextUrl } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "../ui/icons";
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
          title: "Substitute",
          url: createDashboardNextUrl("players/substitute"),
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
      items: [] satisfies Array<SubMenuItem>
    },
    {
      title: "Demo parser",
      url: "#",
      requiredRoles: ["admin"],
      items: [
        {
          title: "Parse failed",
          url: createDashboardNextUrl("failed-parse"),
          requiredRoles: ["admin", "helpdesk"]
        },
        {
          title: "Flagged matches",
          url: createDashboardNextUrl("matches/flagged")
        }
      ] satisfies Array<SubMenuItem>
    },
    {
      title: "Redis Management",
      url: createDashboardNextUrl("redis"),
      requiredRoles: ["admin"],
      items: [] satisfies Array<SubMenuItem>
    }
  ]
};

export function DashboardAppSidebar(
  props: React.ComponentProps<typeof Sidebar>
) {
  const auth = useAuth();

  if (!auth.user) {
    return <Spinner />;
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Kanahub</span>
                  <span className="">v1.0.0</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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
                    <Link href={item.url} className="font-medium">
                      {item.title}
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
                              <Link href={item.url}>{item.title}</Link>
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
