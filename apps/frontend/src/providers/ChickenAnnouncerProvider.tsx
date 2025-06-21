"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import ChickenAnnouncer from "@/components/ui/ChickenAnnouncer";

interface ChickenAnnouncerContextType {
  showChicken: (options?: {
    message?: string;
    targetUrl?: string;
    autoHideAfter?: number;
    onChickenClick?: () => void;
  }) => void;
  hideChicken: () => void;
}

const ChickenAnnouncerContext = createContext<
  ChickenAnnouncerContextType | undefined
>(undefined);

export const useChickenAnnouncer = () => {
  const context = useContext(ChickenAnnouncerContext);
  if (!context) {
    throw new Error(
      "useChickenAnnouncer must be used within a ChickenAnnouncerProvider"
    );
  }
  return context;
};

interface ChickenAnnouncerProviderProps {
  children: ReactNode;
}

export const ChickenAnnouncerProvider = ({
  children
}: ChickenAnnouncerProviderProps) => {
  const [showAnnouncer, setShowAnnouncer] = useState(false);
  const [config, setConfig] = useState({
    message: "NEW FEATURES NEW FEATURES",
    targetUrl: "/new-features",
    autoHideAfter: undefined as number | undefined,
    onChickenClick: undefined as (() => void) | undefined
  });

  const showChicken = (options = {}) => {
    setConfig((prev) => ({ ...prev, ...options }));
    setShowAnnouncer(true);
  };

  const hideChicken = () => {
    setShowAnnouncer(false);
  };

  const handleChickenClick = () => {
    if (config.onChickenClick) {
      config.onChickenClick();
    }
    hideChicken();
  };

  return (
    <ChickenAnnouncerContext.Provider value={{ showChicken, hideChicken }}>
      {children}
      {showAnnouncer && (
        <ChickenAnnouncer
          message={config.message}
          targetUrl={config.targetUrl}
          autoHideAfter={config.autoHideAfter}
          onChickenClick={handleChickenClick}
        />
      )}
    </ChickenAnnouncerContext.Provider>
  );
};

export default ChickenAnnouncerProvider;
