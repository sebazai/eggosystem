import { envConfig } from "@/configs/env";
import type { Organizations } from "@eggosystem/types";
import OrganizationHeader from "@/components/organizations/organization-header";
import { createOrgLogoUrl } from "@/lib/utils";
import OrganizationTrophies from "@/components/organizations/organization-trophies";
import OrganizationTeams from "@/components/organizations/organization-teams";
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";

interface OrganizationProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params
}: OrganizationProps): Promise<Metadata> {
  const { id } = await params;
  const url = `${envConfig.API_URL}/api/v1/organizations/${id}`;
  const org = await fetch(url);
  const organization: Organizations = await org.json();

  if (org.ok) {
    return createPageMetadata({
      title: organization.name
    });
  }
  return createPageMetadata({
    title: "Organization not found"
  });
}

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
