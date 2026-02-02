"use client";

import { useState } from "react";
import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CasterApplicationsTable } from "@/components/dashboard/caster-applications/CasterApplicationsTable";
import {
  useOrganizersWithCasterApplications,
  useCasterApplications,
  useApproveCasterApplication,
  useRejectCasterApplication
} from "@/hooks/data/useCasterApplication";
import { TableSkeleton } from "@/components/loading";
import { AlertCircle } from "lucide-react";

export default function CasterApplicationsPage() {
  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <CasterApplicationsPageContent />
    </WithRoleProtection>
  );
}

function CasterApplicationsPageContent() {
  const [organizerFilter, setOrganizerFilter] = useState<number | null>(null);

  const { organizers, isError: isErrorOrgs } =
    useOrganizersWithCasterApplications();
  const {
    applications,
    isLoading: isLoadingApps,
    isError: isErrorApps,
    mutate: mutateApplications
  } = useCasterApplications(organizerFilter);
  const { approve, isApproving } = useApproveCasterApplication();
  const { reject, isRejecting } = useRejectCasterApplication();

  const handleApprove = async (id: number) => {
    await approve(id);
    await mutateApplications();
  };

  const handleReject = async (id: number, reason: string) => {
    await reject(id, reason);
    await mutateApplications();
  };

  if (isErrorOrgs) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load organizers. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  if (isErrorApps) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load caster applications. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Caster applications</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Review and approve or reject caster applications per organizer.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>
            Filter by organizer or view all. Approve to grant the caster role
            and send an email; reject with a reason so the applicant can
            re-apply.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {organizers && organizers.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="organizer-filter" className="text-sm font-medium">
                Organizer
              </label>
              <Select
                value={organizerFilter?.toString() ?? "all"}
                onValueChange={(v) =>
                  setOrganizerFilter(v === "all" ? null : parseInt(v, 10))
                }
              >
                <SelectTrigger id="organizer-filter" className="w-[200px]">
                  <SelectValue placeholder="All organizers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All organizers</SelectItem>
                  {organizers.map((org) => (
                    <SelectItem key={org.id} value={org.id.toString()}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isLoadingApps ? (
            <TableSkeleton />
          ) : !applications?.length ? (
            <p className="text-muted-foreground text-sm py-8 text-center">
              {organizerFilter != null
                ? "No applications for this organizer."
                : "No caster applications."}
            </p>
          ) : (
            <CasterApplicationsTable
              applications={applications}
              onApprove={handleApprove}
              onReject={handleReject}
              isApproving={isApproving}
              isRejecting={isRejecting}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
