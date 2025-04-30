import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ match_id: string }>;
}

export default async function GamePage({ params }: PageProps) {
  const { match_id } = await params;
  redirect(`/matches/${match_id}`);
}
