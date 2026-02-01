import { envConfig } from "@/configs/env";
import { createPageMetadata } from "@/lib/metadata";
import { CasterApplicationPageContent } from "@/components/profile/CasterApplicationPageContent";
import { notFound } from "next/navigation";
import type { Metadata, ResolvedMetadata } from "next";

interface OrganizerPublic {
  id: number;
  name: string;
  accepts_caster_applications: boolean;
}

interface CasterApplicationPageProps {
  params: Promise<{ id: string }>;
}

async function fetchOrganizer(id: string): Promise<OrganizerPublic | null> {
  const url = `${envConfig.API_URL}/api/v1/organizers/${id}`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) return null;
  const data = await res.json();
  return data satisfies OrganizerPublic;
}

export async function generateMetadata(
  { params }: CasterApplicationPageProps,
  _parent: Promise<ResolvedMetadata>
): Promise<Metadata> {
  const { id } = await params;
  const organizer = await fetchOrganizer(id);
  const title = organizer?.accepts_caster_applications
    ? `Apply for caster for ${organizer.name}`
    : "Caster application";
  return createPageMetadata({
    title,
    description: organizer?.accepts_caster_applications
      ? `Apply to become a caster for ${organizer.name}`
      : "Caster application"
  });
}

export default async function CasterApplicationPage({
  params
}: CasterApplicationPageProps) {
  const { id } = await params;
  const organizer = await fetchOrganizer(id);
  if (!organizer || !organizer.accepts_caster_applications) {
    notFound();
  }
  return (
    <CasterApplicationPageContent
      organizer={{ id: organizer.id, name: organizer.name }}
    />
  );
}
