import ProfileForm from "@/components/profle/profile-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User profile",
  description: "User profile page"
};

export default async function ProfilePage() {
  return (
    <div>
      <h1 className="pb-4">User profile</h1>
      <ProfileForm />
    </div>
  );
}
