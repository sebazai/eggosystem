"use client";

import { useState, useEffect, useRef } from "react";
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
  id: number;
  companyName: string;
  imageSrc: string;
  href: string;
}

const OrganizationFlipCard: React.FC<FlipCardProps> = ({
  companyName,
  imageSrc,
  href
}) => {
  const router = useRouter();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null); // Reference for each card

  // Detect if it's a mobile device
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile || !cardRef.current) return;

    const handleTouchStart = () => setIsFlipped(true);
    const handleTouchEnd = () => setIsFlipped(false);

    const card = cardRef.current;
    card.addEventListener("touchstart", handleTouchStart);
    card.addEventListener("touchend", handleTouchEnd);

    return () => {
      card.removeEventListener("touchstart", handleTouchStart);
      card.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMobile]);

  const toggleFlip = (
    e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>
  ) => {
    e.preventDefault();

    if (e.type === "click") {
      router.push(href); // Always navigate on mouse click
    }

    if (e.type === "keydown") {
      const key = (e as React.KeyboardEvent<HTMLDivElement>).key;

      if (key === " " || (key === "Enter" && !isFlipped)) {
        setIsFlipped(true);
      } else if (key === "Enter" && isFlipped) {
        router.push(href);
      } else if (key === "Escape" && isFlipped) {
        setIsFlipped(false);
      }
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
      ref={cardRef}
      className="group relative w-67 h-80 cursor-pointer focus-visible:ring-4 focus-visible:ring-blue-300 outline-none perspective"
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
            </CardHeader>
            <CardContent className="relative flex-1 m-5">
              {!imageSrc.includes("nologo.svg") && (
                <Image src={imageSrc} alt={companyName.concat(" logo")} fill />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Back of Card */}
        <div
          className="absolute inset-0 rotate-y-180 backface-hidden"
          aria-hidden={!isFlipped}
        >
          <Card className="w-full h-full flex flex-col">
            <CardHeader>
              <CardTitle>Well well</CardTitle>
              <CardDescription>Hello</CardDescription>
            </CardHeader>
            <CardContent>
              <>Yalla</>
            </CardContent>
            <CardFooter className="flex justify-center items-center mt-auto">
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

export default OrganizationFlipCard;
