import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardBreadcrumbs } from "@/components/dashboard/dashboard-breadcrumbs";

import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { requireRole } from "@/lib/dashboard/requireRole";

export default async function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const unverifiedUser = await requireRole();

  return (
    <SidebarProvider>
      <AppSidebar roles={unverifiedUser.roles} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <DashboardBreadcrumbs />
          </div>
        </header>
        <div className="container m-4 sm:m-10 ">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
