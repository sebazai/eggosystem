import Image from "next/image";
import Link from "next/link";
import { createTeamLogoUrl } from "@/lib/utils";
import type { PublicMarketingSponsor } from "@eggosystem/types";

export function FooterPartners({
  partners
}: {
  partners: PublicMarketingSponsor[];
}) {
  if (partners.length === 0) {
    return null;
  }

  return (
    <div>
      <h2>Partners</h2>
      <div className="mt-4 space-y-6 sm:space-y-8 flex flex-col items-start dark:invert-0 invert">
        {partners.map((row) => {
          const src = row.image_phash
            ? createTeamLogoUrl(row.image_phash)
            : null;
          const inner = src ? (
            <Image
              src={src}
              alt={row.display_name}
              width={175}
              height={44}
              className="object-contain max-h-11 w-auto"
              unoptimized
            />
          ) : (
            <span className="text-sm font-medium">{row.display_name}</span>
          );
          const body =
            row.external_url != null && row.external_url.length > 0 ? (
              <Link
                href={row.external_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {inner}
              </Link>
            ) : (
              inner
            );
          return (
            <div key={row.id} className="flex items-center">
              {body}
            </div>
          );
        })}
      </div>
    </div>
  );
}
