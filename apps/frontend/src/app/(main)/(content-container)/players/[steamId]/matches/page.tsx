import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ steamId: string }>;
}

export default async function PlayerMatchesRedirectPage({ params }: PageProps) {
  const { steamId } = await params;
  redirect(`/players/${steamId}`);
}
