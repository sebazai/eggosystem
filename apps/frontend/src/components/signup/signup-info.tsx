import { CardContent, Card } from "@/components/ui/card";

export const SignupInfo = () => {
  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <h2 className="pb-3">Read carefully</h2>
        <p>
          Heads up! We&apos;ve migrated from our old data structure to the new{" "}
          <strong>hub.kanaliiga.fi</strong> system.
        </p>
        <p>
          As a result, some organizations, teams, or other data might be missing
          or mismatched.
        </p>
        <p>
          If your org is missing teams, or if you spot rogue teams lurking where
          they shouldn’t be, hit up our helpdesk on <strong>Discord</strong>.
          We’ll get it sorted. GG!
        </p>
      </CardContent>
    </Card>
  );
};
