import { type PostTeamManualPlayerApprovalSchemaType } from "@eggosystem/types";

export const handlePreApprovedRegistration = async (
  formData: PostTeamManualPlayerApprovalSchemaType
) => {
  if (formData.type === "existing") {
    const teamId = formData.teamId;
    console.log("Existing", teamId);
  } else if (formData.type === "new-team") {
    const teamName = formData.newTeamName;
    const organizationId = formData.organizationId;
    console.log("New team", teamName, organizationId);
  } else if (formData.type === "new-team-and-org") {
    const teamName = formData.newTeamName;
    const orgName = formData.newOrganizationName;
    console.log("New team and org", teamName, orgName);
  }
};
