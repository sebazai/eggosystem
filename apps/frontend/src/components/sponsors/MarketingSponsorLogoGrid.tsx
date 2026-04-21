import Image from "next/image";
import Link from "next/link";
import { createTeamLogoUrl } from "@/lib/utils";
import type { PublicMarketingSponsor } from "@eggosystem/types";

export function MarketingSponsorLogoGrid({
  items
}: {
  items: PublicMarketingSponsor[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <>
      {items.map((row) => {
        const href = row.external_url;
        const src = row.image_phash ? createTeamLogoUrl(row.image_phash) : null;
        const inner = src ? (
          <Image
            src={src}
            alt={row.display_name}
            width={220}
            height={80}
            className="object-contain max-h-20 w-auto"
            unoptimized
          />
        ) : (
          <span className="text-lg font-medium text-slate-900">
            {row.display_name}
          </span>
        );
        return (
          <div key={row.id} className="flex items-center justify-center">
            {href ? (
              <Link href={href} target="_blank" rel="noopener noreferrer">
                {inner}
              </Link>
            ) : (
              inner
            )}
          </div>
        );
      })}
    </>
  );
}
