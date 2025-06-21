import { NextImageFallback } from "@/components/layout/NextImageFallback";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

type TeamCardProps = {
  id: number;
  name: string;
  logoUrl: string;
};

export default function TeamCard({ id, name, logoUrl }: TeamCardProps) {
  return (
    <Link href={`/teams/${id}`} className="w-full sm:w-80">
      <Card className="hover:shadow-xl dark:hover:shadow-white/10 transition-shadow duration-300 h-full">
        <CardContent className="p-4 flex flex-col items-center text-center gap-3">
          <NextImageFallback
            src={logoUrl}
            alt={`${name} logo`}
            width={78}
            height={78}
            className="rounded bg-muted p-1 object-contain"
          />
          <h3 className="text-lg font-semibold">{name}</h3>
        </CardContent>
      </Card>
    </Link>
  );
}
