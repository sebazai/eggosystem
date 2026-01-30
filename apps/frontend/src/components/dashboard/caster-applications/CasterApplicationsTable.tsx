"use client";

import { useMemo, useState } from "react";
import {
  getSortedRowModel,
  type ColumnDef,
  type SortingState
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TanStackTableWrapper } from "@/components/tables/TanStackTableWrapper";
import type { CasterApplicationResponse } from "@eggosystem/types";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

type ApplicationStatus = "pending" | "approved" | "rejected";

function getStatus(app: CasterApplicationResponse): ApplicationStatus {
  if (app.approved_at) return "approved";
  if (app.rejected_at) return "rejected";
  return "pending";
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  switch (status) {
    case "pending":
      return (
        <Badge
          variant="secondary"
          className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
        >
          Pending
        </Badge>
      );
    case "approved":
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-600">
          Approved
        </Badge>
      );
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return null;
  }
}

interface CasterApplicationsTableProps {
  applications: CasterApplicationResponse[];
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number, reason: string) => Promise<void>;
  isApproving: boolean;
  isRejecting: boolean;
}

export function CasterApplicationsTable({
  applications,
  onApprove,
  onReject,
  isApproving,
  isRejecting
}: CasterApplicationsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true }
  ]);
  const [approveTarget, setApproveTarget] =
    useState<CasterApplicationResponse | null>(null);
  const [rejectTarget, setRejectTarget] =
    useState<CasterApplicationResponse | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleApproveConfirm = async () => {
    if (!approveTarget) return;
    await onApprove(approveTarget.id);
    setApproveTarget(null);
  };

  const handleRejectConfirm = async () => {
    if (!rejectTarget || !rejectionReason.trim()) return;
    await onReject(rejectTarget.id, rejectionReason.trim());
    setRejectTarget(null);
    setRejectionReason("");
  };

  const columns = useMemo<ColumnDef<CasterApplicationResponse>[]>(
    () => [
      {
        accessorKey: "organizer_name",
        header: "Organizer",
        cell: ({ getValue }) => getValue<string>() ?? "—",
        meta: { responsive: "table-cell", sortable: true }
      },
      {
        accessorKey: "account_id",
        header: "Account ID",
        cell: ({ getValue }) => getValue<number>() ?? "—",
        meta: { responsive: "table-cell", sortable: true }
      },
      {
        accessorKey: "nickname",
        header: "Nickname",
        cell: ({ getValue }) => getValue<string>() ?? "—",
        meta: { responsive: "table-cell", sortable: true }
      },
      {
        accessorKey: "discord_username",
        header: "Discord",
        cell: ({ getValue }) => getValue<string>() ?? "—",
        meta: { responsive: "hidden md:table-cell", sortable: false }
      },
      {
        accessorKey: "steam_id",
        header: "Steam ID",
        cell: ({ getValue }) => getValue<string>() ?? "—",
        meta: { responsive: "hidden md:table-cell", sortable: false }
      },
      {
        accessorKey: "caster_url",
        header: "Caster URL",
        cell: ({ getValue }) => {
          const url = getValue<string>();
          if (!url) return "—";
          return (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline truncate max-w-[180px] inline-block"
            >
              {url}
            </a>
          );
        },
        meta: { responsive: "hidden lg:table-cell", sortable: false }
      },
      {
        accessorKey: "created_at",
        header: "Submitted",
        cell: ({ getValue }) => {
          const raw = getValue<string>();
          if (!raw) return "—";
          try {
            return new Date(raw).toLocaleDateString(undefined, {
              dateStyle: "short",
              timeStyle: "short"
            });
          } catch {
            return raw;
          }
        },
        meta: { responsive: "table-cell", sortable: true }
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={getStatus(row.original)} />,
        meta: { responsive: "table-cell", sortable: false }
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const app = row.original;
          const status = getStatus(app);
          if (status !== "pending")
            return <span className="text-muted-foreground text-sm">—</span>;
          return (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => setApproveTarget(app)}
                disabled={isApproving || isRejecting}
                aria-label={`Approve application ${app.id}`}
              >
                {isApproving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" aria-hidden />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-1" aria-hidden />
                )}
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRejectTarget(app)}
                disabled={isApproving || isRejecting}
                aria-label={`Reject application ${app.id}`}
              >
                {isRejecting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" aria-hidden />
                ) : (
                  <XCircle className="h-4 w-4 mr-1" aria-hidden />
                )}
                Reject
              </Button>
            </div>
          );
        },
        meta: { responsive: "table-cell", sortable: false }
      }
    ],
    [isApproving, isRejecting]
  );

  return (
    <>
      <TanStackTableWrapper<CasterApplicationResponse>
        data={applications}
        columns={columns}
        getSortedRowModel={getSortedRowModel()}
        sorting={sorting}
        onSortingChange={setSorting}
        showPagination={applications.length > 10}
      />

      <AlertDialog
        open={!!approveTarget}
        onOpenChange={(open) => !open && setApproveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve caster application?</AlertDialogTitle>
            <AlertDialogDescription>
              The user will receive the caster role and an email with casting
              info. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApproveConfirm}
              disabled={isApproving}
            >
              {isApproving ? "Approving..." : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) =>
          !open && (setRejectTarget(null), setRejectionReason(""))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject caster application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejection. The applicant will receive this
              reason by email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="rejection-reason">
              Rejection reason (required)
            </Label>
            <Textarea
              id="rejection-reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Incomplete information provided."
              rows={3}
              required
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(null);
                setRejectionReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={!rejectionReason.trim() || isRejecting}
            >
              {isRejecting ? "Rejecting..." : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
