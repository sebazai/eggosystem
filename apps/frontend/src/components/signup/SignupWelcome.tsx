"use client";

import { ContentContainer } from "@/components/layout/ContentContainer";
import { SteamLoginButton } from "@/components/profile/SteamLoginButton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useSeasonDetails } from "@/hooks/data/useSeasonDetails";
import { convertTimeToLocalTimeWithoutSeconds } from "@/lib/date-utils";
import Link from "next/link";

interface SignupWelcomeProps {
  seasonId: string;
}

export const SignupWelcome = ({ seasonId }: SignupWelcomeProps) => {
  const { seasonDetails, isLoading, isError, isValidating } =
    useSeasonDetails(seasonId);
  const { user, loading } = useAuth();

  if (isLoading || isValidating || loading) {
    return <ContentContainer>Loading...</ContentContainer>;
  }
  if (isError || !seasonDetails) {
    return (
      <ContentContainer>
        {isError?.message ?? "Season does not exist"}
      </ContentContainer>
    );
  }

  return (
    <div>
      <div className="text-lg pb-4 font-semibold">
        👋 Welcome to Kanaliiga {seasonDetails.full_name} Sign Up!
        <br />
        {seasonDetails.signup_end_date && (
          <span>
            Signup ends at{" "}
            {convertTimeToLocalTimeWithoutSeconds(
              seasonDetails.signup_end_date
            )}
            . <br />
          </span>
        )}
        Season starts on{" "}
        {new Date(seasonDetails.start_date).toLocaleDateString()}{" "}
        {seasonDetails.end_date && (
          <span>
            and ends approximately on{" "}
            {new Date(seasonDetails.end_date).toLocaleDateString()}
          </span>
        )}
        {seasonDetails.platform && (
          <span>
            {" "}
            on the {seasonDetails.platform.toLocaleUpperCase()} esports
            platform.
          </span>
        )}
      </div>
      <div className="pb-4">
        <p>
          Hi and Welcome to Kanaliiga, the biggest and the coolest CS2
          tournament in Finland! Please, read instructions carefully and reserve
          yourself some time for filling the registration as accurately as
          possible. As a captain, You will be responsible of your team. Together
          we will make this tournament an awesome experience for everyone!
        </p>
        <p>
          At this point, we would like to kindly remind you, that We, Kanaliiga
          Organizers, do this purely voluntarily, without monthly paychecks
          running and out of ❤ for the Esports. Please, be active, help others,
          enjoy the event and bear with us! Sincerely, Kanaliiga.
        </p>
      </div>
      <div>
        <div className="text-center text-xl pb-6">💰 Participation Fee</div>
        <p>
          We cover organizing costs in CS2 tournaments by collecting
          participation fees from teams. The fee is per a participating team.
          Please pay your team&apos;s participation fee by purchasing it from{" "}
          <Link target="_blank" href={"https://www.kanaliiga.fi/kauppa"}>
            www.kanaliiga.fi/kauppa
          </Link>
          . Unpaid fee will automatically disqualify your team. You may request
          for a return if your team cannot participate for any reason. In case
          you are unable to pay the fee before the deadline, please open a
          service request in the Discord as soon as possible!
        </p>
        <ul className="list-disc list-inside p-4">
          <li className="text-lg font-semibold">
            Normal Fee <span>150€</span>{" "}
            <span className="text-sm text-gray-600 dark:text-muted-foreground">
              (tax included)
            </span>
          </li>
        </ul>
      </div>
      <div className="pb-8">
        <div className="text-center text-xl pb-6">📏 Rules</div>
        <p>
          Please familiarize yourself with our rules and instructions in the{" "}
          <Link target="_blank" href={"https://wiki.kanaliiga.fi"}>
            Wiki
          </Link>{" "}
          and in the{" "}
          <Link target="_blank" href={"https://discord.gg/UFetjhv"}>
            Discord
          </Link>{" "}
          to make the tournament an awesome experience for everyone! If you need
          assistance with translations, usually Google Translator will translate
          from Finnish to English surprisingly well. Organizers in the Discord
          will gladly help you as well!
        </p>
      </div>
      <div>
        <p>
          In case of questions or issues, please open a service request in the
          Discord. For a secondary contact option, you may email us at{" "}
          <Link href={"mailto:info@kanaliiga.fi"}>info@kanaliiga.fi</Link>.
        </p>
      </div>
      <div className="text-center text-xl pb-6">
        <div className="pb-10">GL & HF and See You on the Server! 💥</div>

        {!user ? (
          <div className="flex justify-center">
            <SteamLoginButton
              returnUrl={`/seasons/${seasonId}/signup/registration`}
            >
              Login and register team!
            </SteamLoginButton>
          </div>
        ) : (
          <Link href={`/seasons/${seasonId}/signup/registration`}>
            <Button
              variant="outline"
              className="h-22 w-52 text-lg focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
            >
              Register team!
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};
