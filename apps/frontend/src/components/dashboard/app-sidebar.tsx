import * as React from "react";
import { GalleryVerticalEnd } from "lucide-react";

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
import { createDashboardNextUrl } from "@/lib/utils";

const data = {
  navMain: [
    {
      title: "Kanahub",
      url: process.env.NEXT_PUBLIC_BASE_URL,
      items: [
        {
          title: "Organizations",
          url: `${createDashboardNextUrl("/organizations")}`
        },
        {
          title: "Teams",
          url: `${createDashboardNextUrl("/teams")}`
        },
        {
          title: "Players",
          url: `${createDashboardNextUrl("/players")}`
        },
        {
          title: "Seasons",
          url: `${createDashboardNextUrl("/seasons")}`
        }
      ]
    },
    {
      title: "Registration",
      url: "#",
      items: [
        {
          title: "Teams",
          url: "#"
        },
        {
          title: "Add rank",
          url: "#"
        },
        {
          title: "Add manual approval",
          url: createDashboardNextUrl("/registration/approval")
        },
        {
          title: "Player test",
          url: "#"
        },
        {
          title: "League sortter",
          url: "#"
        }
      ]
    },
    {
      title: "Demo parser",
      requiredRoles: ["enzoj"],
      url: "#",
      items: [
        {
          title: "Problems",
          url: "#"
        },
        {
          title: "Flagged matches",
          url: "#"
        }
      ]
    },
    {
      title: "Helpdesk",
      url: "#",
      items: [
        {
          title: "Substitute player",
          url: "#"
        }
      ]
    }
  ]
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  roles: string[];
}

export function AppSidebar({ roles, ...props }: AppSidebarProps) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Kanahub</span>
                  <span className="">v1.0.0</span>
                </div>
              </a>
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
                !roles.some((role) => item.requiredRoles?.includes(role))
              ) {
                return;
              }
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="font-medium">
                      {item.title}
                    </a>
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <SidebarMenuSub>
                      {item.items.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild>
                            <a href={item.url}>{item.title}</a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
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
