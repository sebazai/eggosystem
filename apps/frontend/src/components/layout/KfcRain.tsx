"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useKonami } from "@/hooks/easter/useKonami";

export const KfcRain = () => {
  const [easterEgg, setEasterEgg] = useState(false);

  useKonami(() => {
    setEasterEgg(true);
    setTimeout(() => setEasterEgg(false), 8000); // 8 seconds of raining chicken 🍗
  });

  if (!easterEgg) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, repeat: Infinity, repeatType: "mirror" }}
      className="z-100 fixed top-0 left-0 w-full h-full pointer-events-none z-50 bg-[url('/kfc.png')] bg-[length:100px] bg-repeat animate-spin-slow"
    />
  );
};
