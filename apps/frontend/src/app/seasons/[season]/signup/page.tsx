import { envConfig } from "@/configs/env";
import type { Metadata } from "next";
import { SignupWelcome } from "@/components/signup/signup-welcome";
import { CardContainer } from "@/components/layout/card-container";

type Props = {
  params: Promise<{ season: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { season } = await params;

  const result = await fetch(`${envConfig.API_URL}/api/v1/seasons/${season}`);

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
    <CardContainer classNames="p-2 md:p-4">
      <SignupWelcome seasonId={season} />
    </CardContainer>
  );
}
