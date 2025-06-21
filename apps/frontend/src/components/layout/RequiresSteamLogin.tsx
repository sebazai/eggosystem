"use client";
import { ContentContainer } from "@/components/layout/ContentContainer";
import { SteamLoginButton } from "@/components/profile/SteamLoginButton";
import { motion } from "framer-motion";
import { Pointer } from "lucide-react";
import type React from "react";

export const RequiresSteamLogin = ({ returnUrl }: { returnUrl?: string }) => {
  return (
    <ContentContainer classNames="flex-col space-y-4">
      <div>You need to login with Steam before proceeding to this page...</div>
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        className="flex justify-center items-center"
      >
        <Pointer className="w-16 h-16 rotate-180" />
      </motion.div>
      <SteamLoginButton returnUrl={returnUrl} />
    </ContentContainer>
  );
};
