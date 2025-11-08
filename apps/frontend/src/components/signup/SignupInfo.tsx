import { CardContent, Card } from "@/components/ui/card";
import Link from "next/link";

export const SignupInfo = () => {
  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <h2 className="pb-3 text-xl font-semibold">Read carefully</h2>
        <p>
          Heads up! We&apos;ve migrated from our old data structure to the new{" "}
          <strong>hub.kanaliiga.fi</strong> system.
        </p>
        <p>
          As a result, some organizations might be missing teams or teams have
          been linked to wrong organization.
        </p>
        <p>
          If your team has played in any season of Kanaliiga, your team should
          exist in our system. However, the team might not be linked to any
          existing organization. In the teams selection you can choose to
          display the teams without organization. Feel free to link your team to
          the correct organization.
        </p>
        <hr className="border-t border-kanaliiga-orange" />
        <div className="space-y-4">
          <p>
            Before you can submit your team registration, make sure every
            player:
          </p>
          <ul className="list-disc list-inside space-y-1 px-4 pb-4">
            <li>Has a valid work email within the organization.</li>
            <li>
              Has logged in to <strong>Kanahub</strong>, filled out their
              personal information, and verified their work email.
            </li>
            <li>
              Has their{" "}
              <strong>
                Steam profile{" "}
                <Link
                  href={
                    "https://help.steampowered.com/en/faqs/view/588C-C67D-0251-C276"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  set to public
                </Link>
              </strong>
              .
            </li>
            <li>
              Captain and co-captain are required to link their Discord account
              in their profiles.
            </li>
          </ul>

          <p>
            Please open a ticket on Discord if any of these requirements are not
            met.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
