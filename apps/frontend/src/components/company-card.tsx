"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import Image from "next/image";

// Define props interface
interface FlipCardProps {
  frontTitle: string;
  frontDesc: string;
  backTitle: string;
  backDesc: string;
  imageSrc: string;
  href: string;
}

const FlipCard: React.FC<FlipCardProps> = ({
  frontTitle,
  frontDesc,
  backTitle,
  backDesc,
  imageSrc,
  href
}) => {
  const router = useRouter(); // Use Next.js navigation
  const [isFlipped, setIsFlipped] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect if it's a mobile device
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleFlip = (
    e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>
  ) => {
    e.preventDefault();

    if (isFlipped) {
      // Navigate only if it's a mobile device or a click event (not keyboard)
      if (isMobile || e.type === "click") {
        router.push(href);
      }
    } else {
      setIsFlipped(true); // Flip the card
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === " ") {
      e.preventDefault();
      toggleFlip(e); // Flip on Space key
    }
    if (e.key === "Enter" && isFlipped) {
      router.push(href); // Navigate on Enter if flipped
    }
  };

  const handleBlur = () => {
    setIsFlipped(false); // Unflip when the card loses focus
  };

  return (
    <div
      className="group relative w-70 h-80 cursor-pointer focus-visible:ring-4 focus-visible:ring-blue-300 outline-none perspective"
      onClick={toggleFlip}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      role="button"
      tabIndex={0}
      aria-label={`${frontTitle}, ${isFlipped ? "Back side visible, press Enter to navigate." : "Front side visible, press Space to flip."}`}
      aria-expanded={isFlipped}
      aria-live="polite"
    >
      {/* Card Container with Flip Effect */}
      <div
        className={`relative w-full h-full transition-transform duration-700 ease-in-out transform-style-preserve-3d ${
          isFlipped ? "rotate-y-180" : "group-hover:rotate-y-180"
        }`}
      >
        {/* Front of Card */}
        <div className="absolute inset-0 backface-hidden">
          <Card className="w-full h-full flex flex-col">
            <CardHeader>
              <CardTitle>{frontTitle}</CardTitle>
              <CardDescription>{frontDesc}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow p-0">
              <Image src={imageSrc} alt={frontTitle} />
            </CardContent>
          </Card>
        </div>

        {/* Back of Card */}
        <div className="absolute inset-0 rotate-y-180 backface-hidden">
          <Card className="w-full h-full flex flex-col bg-secondary">
            <CardHeader>
              <CardTitle>{backTitle}</CardTitle>
              <CardDescription>{backDesc}</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center">
              <span className="text-lg font-semibold">Tap to Navigate</span>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FlipCard;
