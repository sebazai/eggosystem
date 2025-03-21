import { envConfig } from "@/configs/env";
import type { Metadata } from "next";
import { SignupWelcome } from "./signup-welcome";

type Props = {
  params: Promise<{ season: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { season } = await params;

  const result = await fetch(`${envConfig.BASE_URL}/api/seasons/${season}`);

  if (!result.ok) {
    return {
      title: "Failed to fetch season"
    };
  }
  const data = await result.json();
  return {
    title: `Sign up for ${data.full_name}`
  };
}

export default async function SignupPage({ params }: Props) {
  const { season } = await params;
  return (
    <div>
      <h1 className="pb-4">Season registration</h1>
      <SignupWelcome seasonId={season} />
    </div>
  );
}
