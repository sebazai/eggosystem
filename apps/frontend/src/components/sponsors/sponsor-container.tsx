"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SponsorContainerProps {
  header: string;
  secondary?: boolean;
  classNames?: string;
  children: React.ReactNode;
}

export const SponsorContainer = ({
  children,
  header,
  secondary,
  classNames
}: SponsorContainerProps) => {
  return (
    <div
      className={cn("flex flex-col items-center justify-center", classNames)}
    >
      <span
        className={cn(
          "text-xl sm:text-3xl font-bold uppercase text-kanaliiga-orange mb-4 sm:mb-6",
          secondary && "text-kanaliiga-light-brown",
          secondary && "text-lg sm:text-2xl font-semibold"
        )}
      >
        {header}
      </span>
      <div
        className={cn(
          "flex gap-10 sm:gap-20 items-center justify-center flex-wrap p-5 sm:p-15 bg-[#D3D3D3] rounded-lg",
          secondary && "sm:p-5"
        )}
      >
        {children}
      </div>
    </div>
  );
};

interface MotionSponsorContinerProps {
  classNames?: string;
  children: React.ReactNode;
}
export const MotionSponsorContainer = ({
  children,
  classNames
}: MotionSponsorContinerProps) => {
  return (
    <motion.div
      className={cn(
        "flex gap-4 sm:gap-8 items-center justify-center flex-wrap p-5 sm:p-10 bg-[#D3D3D3] rounded-lg",
        classNames
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.8 }}
    >
      {children}
    </motion.div>
  );
};
