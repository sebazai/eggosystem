import { CardContent, Card } from "@/components/ui/card";
import { SeasonPlatform } from "@eggosystem/types";

const RankText = (appId: number) => {
  switch (appId) {
    case 730:
      return "Premier CS Rank";
    default:
      return "";
  }
};

const PlatformRankText = (platform: SeasonPlatform) => {
  switch (platform) {
    case SeasonPlatform.FACEIT:
      return "FaceIT Rank";
    default:
      return "";
  }
};

export const SignupInfo = ({
  appId,
  platform
}: {
  appId: number;
  platform?: SeasonPlatform;
}) => {
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
            <li>
              Has logged in to <strong>Kanahub</strong> and filled out their
              personal information and verified work email.
            </li>
            {appId && platform && (
              <li>
                Has either a <strong>{RankText(appId)}</strong> or a{" "}
                <strong>{PlatformRankText(platform)}</strong>.
              </li>
            )}
            {appId && !platform && (
              <li>
                Has a <strong>{RankText(appId)}</strong>.
              </li>
            )}
            <li>
              Has their <strong>Steam profile set to public</strong>.
            </li>
            <li>Has a valid work e-mail within the organization.</li>
          </ul>
          <p>
            Captain and co-captain are required to have their Discord nick in
            their profile.
          </p>
          <p>
            Please open a ticket in Discord if some of these requirements do not
            fulfill.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
