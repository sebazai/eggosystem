import { RemoveReservationClient } from "./RemoveReservationClient";

interface RemoveReservationPageProps {
  params: Promise<{ hash: string }>;
}

export default async function RemoveReservationPage({
  params
}: RemoveReservationPageProps) {
  const { hash } = await params;

  return (
    <div className="flex justify-center p-4">
      <RemoveReservationClient hash={hash} />
    </div>
  );
}
