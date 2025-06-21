import { NextImageFallback } from "@/components/layout/NextImageFallback";
import { GlobeIcon } from "lucide-react";
import Link from "next/link";

type OrganizationHeaderProps = {
  logoUrl: string;
  name: string;
  companyCode: string;
  website?: string;
};

export default function OrganizationHeader({
  logoUrl,
  name,
  companyCode,
  website
}: OrganizationHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-center md:items-start gap-6 py-6 border-b border-muted">
      <NextImageFallback
        src={logoUrl}
        alt={`${name} logo`}
        className="w-48 h-48 object-contain rounded bg-muted p-2"
        width={200}
        height={200}
      />
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold">{name}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          <span className="text-primary font-semibold">Company code:</span>{" "}
          {companyCode}
        </p>
        <div className="flex gap-4 mt-2 justify-center md:justify-start text-sm">
          {website && (
            <Link
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:underline"
            >
              <GlobeIcon className="w-4 h-4" />{" "}
              {website.replace(/^https?:\/\//, "")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
