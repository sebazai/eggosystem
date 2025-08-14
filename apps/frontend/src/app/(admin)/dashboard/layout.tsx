import { DashboardAppSidebar } from "@/components/dashboard/DashboardAppSidebar";
import { DashboardBreadcrumbs } from "@/components/dashboard/DashboardBreadcrumbs";

import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger
} from "@/components/ui/sidebar";

export default async function Layout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <DashboardAppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b">
          <div className="flex items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <DashboardBreadcrumbs />
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 max-w-full">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
