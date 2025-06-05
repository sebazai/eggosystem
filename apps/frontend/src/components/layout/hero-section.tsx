"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { cn, createNextUrl } from "@/lib/utils";
import Link from "next/link";
import { KanaMainPartners } from "../sponsors/kana-main-partners";
import { useIsMobile } from "@/hooks/use-mobile";
import { useScrolled } from "@/hooks/useScrolled";
import { MotionSponsorContainer } from "../sponsors/sponsor-container";

const overlays = [
  {
    id: 1,
    title: "CS 2 Season 4",
    subtitle: "CS2 Corporate esports Season 4 Starts September 1st."
  },
  {
    id: 2,
    title: "Last Season’s Stats",
    subtitle: "850+ players · 120+ teams · 800+ matches"
  },
  {
    id: 3,
    title: "Think Your Team Has What It Takes?",
    subtitle: "Rally your colleagues. Train hard. Rise to the top."
  }
];

type HeroSectionProps = {
  device?: string;
};

export default function HeroSection({ device }: HeroSectionProps) {
  const [step, setStep] = useState(0);
  const [splashComplete, setSplashComplete] = useState(false);
  const { isScrolled } = useScrolled();

  const [videoSrc, setVideoSrc] = useState<string>(
    device === "mobile"
      ? createNextUrl(
          "/videos/20250424_EagerRichTofuHeyGirl-WmhqlBM0CyWc-FKM_portrait.mp4"
        )
      : createNextUrl(
          "/videos/20250424_EagerRichTofuHeyGirl-WmhqlBM0CyWc-FKM_source.mp4"
        )
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const { isMobile, isLandscape } = useIsMobile(device === "mobile");

  useEffect(() => {
    if (isMobile && !isLandscape) {
      setVideoSrc(
        createNextUrl(
          "/videos/20250424_EagerRichTofuHeyGirl-WmhqlBM0CyWc-FKM_portrait.mp4"
        )
      );
      return;
    }
    setVideoSrc(
      createNextUrl(
        "/videos/20250424_EagerRichTofuHeyGirl-WmhqlBM0CyWc-FKM_source.mp4"
      )
    );
  }, [isMobile, isLandscape]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (splashComplete) {
      video.currentTime = 0;
      video.play().catch(console.error);
      const interval = setInterval(() => {
        setStep((prev) => (prev < overlays.length ? prev + 1 : prev));
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [splashComplete]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoadedData = () => {
      setTimeout(() => {
        setSplashComplete(true);
      }, 4000);
    };

    video.addEventListener("canplay", onLoadedData);
    return () => video.removeEventListener("canplay", onLoadedData);
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [videoSrc]);

  return (
    <>
      <motion.div
        className={cn(
          "absolute inset-0 z-20 flex mt-20 sm:mt-5 flex-col items-center justify-center transition-opacity duration-500 mx-4 sm:mx-2",
          splashComplete ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        <motion.h1 className="text-xl xxs:text-3xl lg:text-6xl text-center font-bold mt-6 mb-4">
          The Battle Begins.
        </motion.h1>
        <motion.p
          className="text-sm xxs:text-lg lg:text-2xl text-center mobile-landscape:mb-5 mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0, duration: 4 }}
        >
          Presented by our proud CS sponsors & partners
        </motion.p>

        {/* Sponsor Logos Row */}
        {/*         <MotionSponsorContainer classNames="mb-10 mobile-landscape:mb-5">
          <CsMainSponsors />
        </MotionSponsorContainer> */}
        <MotionSponsorContainer>
          <KanaMainPartners />
        </MotionSponsorContainer>

        <motion.div
          className="mt-10 mobile-landscape:mt-5 w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"
          aria-hidden
        />
      </motion.div>

      <motion.section
        className="relative w-full h-screen overflow-hidden max-w-screen-3xl mx-auto"
        style={{
          marginTop: isScrolled ? `calc(-1 * var(--nav-height))` : undefined
        }}
        id="cta"
        initial={{ opacity: 0 }}
        animate={{ opacity: splashComplete ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      >
        <video
          ref={videoRef}
          className={cn("absolute top-0 left-0 w-full h-full z-0 object-fill")}
          preload="auto"
          muted
          loop
          playsInline
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50 z-10" />

        {/* Overlay Text */}
        <div className="relative z-20 flex justify-center h-full pt-[25vh]">
          <AnimatePresence mode="wait">
            {(step === 0 || step > 0) && (
              <motion.div
                key={overlays[step]?.id}
                initial={{ opacity: 0, y: step === overlays.length ? 50 : 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: step === overlays.length ? -50 : -20 }}
                transition={{ duration: 0.8 }}
                className={cn(
                  "text-center px-4",
                  step === overlays.length &&
                    "flex flex-col items-center justify-center"
                )}
              >
                <motion.h1 className="text-xl xxs:text-3xl lg:text-6xl text-center font-bold mb-4">
                  {step === overlays.length
                    ? "Season Starts September 1st"
                    : overlays[step]?.title}
                </motion.h1>

                {step === overlays.length ? (
                  <Button
                    onClick={() => {
                      router.push("/seasons/16/signup");
                    }}
                    variant="outline"
                    className="text-lg py-2 px-6 sm:px-10 sm:py-8"
                  >
                    Sign Up Now
                  </Button>
                ) : (
                  <p className="text-sm xxs:text-lg lg:text-2xl text-white/70 mb-10 text-center">
                    {overlays[step]?.subtitle}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="absolute bottom-4 right-4 z-30 text-white text-xs">
          <Link
            href="https://www.twitch.tv/slougani"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs sm:text-base hover:text-white/80 hover:underline transition-colors duration-300"
          >
            Video by Slougani
          </Link>
        </div>
      </motion.section>
    </>
  );
}
