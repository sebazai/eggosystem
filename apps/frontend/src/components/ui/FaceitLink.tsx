import Image from "next/image";
import Link from "next/link";
import { createNextUrl } from "@/lib/utils";

interface FaceitLinkProps {
  href: string;
  className?: string;
  iconSize?: "sm" | "md" | "lg";
}

const iconSizes = {
  sm: { width: 16, height: 16, className: "w-4 h-4" },
  md: { width: 20, height: 16, className: "w-[20px] h-[16px]" },
  lg: { width: 25, height: 20, className: "w-[25px] h-[20px]" }
};

export const FaceitLink = ({
  href,
  className = "hover:opacity-80 transition-opacity",
  iconSize = "md"
}: FaceitLinkProps) => {
  const size = iconSizes[iconSize];

  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      <Image
        src={createNextUrl("/images/faceit/icon-pheasant.png")}
        alt="Faceit"
        width={size.width}
        height={size.height}
        className={size.className}
      />
    </Link>
  );
};
