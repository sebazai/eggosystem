"use client";

import type { ReactNode } from "react";

interface HomePageWrapperProps {
  children: ReactNode;
}

export const HomePageWrapper = ({ children }: HomePageWrapperProps) => {
  return <>{children}</>;
};

export default HomePageWrapper;
