import { SeasonPlayerRankForm } from "@/components/dashboard/registration/manual-rank-form";
import { WithRoleProtection } from "@/components/dashboard/with-role-protection";
import { Separator } from "@/components/ui/separator";

export default async function Page() {
  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <h1>Manual rank insert</h1>
      <p>
        Fields are optional, except you need either CS2 Premier rank or external
        ELO rating
      </p>
      <p>
        Once the rank has been added, please inform the captain to remove the
        player&apos;s Steam ID from the form and reinsert it. This will update
        the rank. Removing the last number and adding it back should bring the
        newly added ranks to the form.
      </p>
      <p>
        This form does not allow to remove ranks. The values are only updated if
        the input is not empty and is larger then 0.
      </p>

      <Separator className="my-5 bg-kanaliiga-orange" />
      <SeasonPlayerRankForm />
    </WithRoleProtection>
  );
}
