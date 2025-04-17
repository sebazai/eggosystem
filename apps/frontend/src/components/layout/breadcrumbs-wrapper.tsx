"use client";

import React from "react";
import { PageBreadcrumbs, useMatchBreadcrumbs } from "./page-breadcrumbs";

export function MatchBreadcrumbsWrapper() {
  const breadcrumbItems = useMatchBreadcrumbs();
  return <PageBreadcrumbs items={breadcrumbItems} />;
}
