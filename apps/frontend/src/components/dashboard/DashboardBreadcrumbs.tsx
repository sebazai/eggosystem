"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

export const DashboardBreadcrumbs = () => {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<
    { href: string; label: string }[]
  >([]);

  useEffect(() => {
    const segments = pathname.split("/").filter(Boolean);

    const buildBreadcrumbs = async () => {
      const crumbs: { href: string; label: string }[] = [];
      let hrefAccumulator = "";

      for (const [_i, segment] of segments.entries()) {
        hrefAccumulator += `/${segment}`;

        if (segment !== "dashboard")
          crumbs.push({
            href: hrefAccumulator,
            label: segment.charAt(0).toUpperCase() + segment.slice(1)
          });
      }

      setBreadcrumbs(crumbs);
    };

    buildBreadcrumbs();
  }, [pathname]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink className="hidden md:block" asChild>
            <Link href="/dashboard">Kanahub dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbs.length > 0 && (
          <BreadcrumbSeparator className="hidden md:block" />
        )}
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={crumb.href}>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={crumb.href}>{crumb.label}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {i !== breadcrumbs.length - 1 && <BreadcrumbSeparator />}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
