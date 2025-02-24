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

interface FlipCardProps {
  companyName: string;
  frontDesc: string;
  backTitle: string;
  backDesc: string;
  imageSrc: string;
  href: string;
}

const FlipCard: React.FC<FlipCardProps> = ({
  companyName,
  frontDesc,
  backTitle,
  backDesc,
  imageSrc,
  href
}) => {
  const router = useRouter();
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
      if (isMobile || e.type === "click") {
        router.push(href);
      } else {
        setIsFlipped(false);
      }
    } else {
      setIsFlipped(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === " " || (e.key === "Enter" && !isFlipped)) {
      e.preventDefault();
      toggleFlip(e);
    } else if (e.key === "Enter" && isFlipped) {
      router.push(href);
    } else if (e.key === "Escape" && isFlipped) {
      setIsFlipped(false); // Allow Escape key to unflip the card
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
      aria-expanded={isFlipped}
      tabIndex={0}
    >
      {/* Card Container with Flip Effect */}
      <div
        className={`relative w-full h-full transition-transform duration-700 ease-in-out transform-style-preserve-3d ${
          isFlipped ? "rotate-y-180" : "group-hover:rotate-y-180"
        }`}
      >
        {/* Front of Card */}
        <div
          className="absolute inset-0 backface-hidden"
          aria-hidden={isFlipped}
        >
          <Card className="w-full h-full flex flex-col">
            <CardHeader>
              <CardTitle>{companyName}</CardTitle>
              <CardDescription>{frontDesc}</CardDescription>
            </CardHeader>
            <CardContent className="relative flex-1 m-5">
              <Image src={imageSrc} alt={companyName} fill />
            </CardContent>
          </Card>
        </div>

        {/* Back of Card */}
        <div
          className="absolute inset-0 rotate-y-180 backface-hidden"
          aria-hidden={!isFlipped}
        >
          <Card className="w-full h-full flex flex-col bg-secondary">
            <CardHeader>
              <CardTitle>{backTitle}</CardTitle>
              <CardDescription>{backDesc}</CardDescription>
            </CardHeader>
            <CardFooter className="flex justify-center items-center">
              <p>Footer</p>
            </CardFooter>
          </Card>
        </div>
      </div>
      {/* Invisible description for screen readers */}
      <p
        id="flipped-card-description"
        className="sr-only"
        aria-hidden={!isFlipped}
      >
        Press Enter to navigate to the link.
      </p>
      <p
        id="unflipped-card-description"
        className="sr-only"
        aria-hidden={isFlipped}
      >
        Press Space to flip the card.
      </p>
    </div>
  );
};

export default FlipCard;
