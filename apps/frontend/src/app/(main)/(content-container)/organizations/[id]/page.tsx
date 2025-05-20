import { envConfig } from "@/configs/env";
import type { Organizations } from "@eggosystem/types";
import OrganizationHeader from "./OrganizationHeader";
import { createOrgLogoUrl } from "@/lib/utils";
import OrganizationTrophies from "./OrganizationTrophies";
import OrganizationTeams from "./OrganizationTeams";

interface OrganizationProps {
  params: Promise<{
    id: string;
  }>;
}

// export async function generateMetadata({
//   searchParams
// }: OrganizationProps): Promise<Metadata> {
//   const { q } = await searchParams;

//   if (q) {
//     return createPageMetadata({
//       title: `Search results for "${q}" in Organizations`
//     });
//   }
//   return createPageMetadata({
//     title: "Organizations"
//   });
// }

export default async function Organization({ params }: OrganizationProps) {
  const { id } = await params;
  const url = `${envConfig.API_URL}/api/v1/organizations/${id}`;
  const org = await fetch(url);
  const organization: Organizations = await org.json();

  return (
    <div className="space-y-6">
      <OrganizationHeader
        logoUrl={createOrgLogoUrl(organization.logo)}
        name={organization.name}
        companyCode={organization.organization_code}
        website={organization.website}
      />
      <OrganizationTrophies organizationId={id} />
      <OrganizationTeams organizationId={id} />
    </div>
  );
}
