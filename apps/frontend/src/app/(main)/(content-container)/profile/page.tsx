import ProfileForm from "@/components/profile/profile-form";
import { createPageMetadata } from "@/lib/metadata";
import type { Metadata } from "next";

export const metadata: Metadata = createPageMetadata({
  title: "User profile",
  description: "Kanahub profile page"
});

export default async function ProfilePage() {
  return (
    <div>
      <h1 className="pb-4">User profile</h1>
      <ProfileForm />
    </div>
  );
}
