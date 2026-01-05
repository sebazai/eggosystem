import { envConfig } from "@/configs/env";
import type { Organizations } from "@eggosystem/types";
import OrganizationHeader from "@/components/organizations/OrganizationHeader";
import { createOrgLogoUrl } from "@/lib/utils";
import OrganizationTrophies from "@/components/organizations/OrganizationTrophies";
import OrganizationTeams from "@/components/organizations/OrganizationTeams";
import type { Metadata, ResolvedMetadata } from "next";
import { createPageMetadata } from "@/lib/metadata";
import { OrganizationDiscordInviteLink } from "@/components/organizations/OrganizationDiscordInviteLink";

interface OrganizationProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata(
  { params }: OrganizationProps,
  parent: Promise<ResolvedMetadata>
): Promise<Metadata> {
  const { id } = await params;
  const url = `${envConfig.API_URL}/api/v1/organizations/${id}`;
  const org = await fetch(url);
  const organization: Organizations = await org.json();

  const previousImages = (await parent).openGraph?.images || [];
  const orgLogoUrl = createOrgLogoUrl(organization.logo);
  const logoResponse = await fetch(orgLogoUrl, {
    method: "HEAD"
  });
  const logoExists = logoResponse.ok;

  if (org.ok) {
    return createPageMetadata({
      title: organization.name,
      openGraph: {
        images: logoExists ? [orgLogoUrl] : previousImages
      }
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
      <OrganizationDiscordInviteLink
        organizationId={organization.id}
        organizationName={organization.name}
      />
      <OrganizationTeams organizationId={id} />
    </div>
  );
}
