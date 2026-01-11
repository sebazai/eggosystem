"use client";

import { useState } from "react";
import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
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
import { Copy, Search, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  useLookupAccount,
  useRegenerateToken
} from "@/hooks/data/dashboard/useEmailVerification";

export default function EmailVerificationPage() {
  return (
    <WithRoleProtection allowedRoles={["admin", "helpdesk"]}>
      <EmailVerificationContent />
    </WithRoleProtection>
  );
}

function EmailVerificationContent() {
  const [lookupType, setLookupType] = useState<string>("steam_id");
  const [lookupValue, setLookupValue] = useState("");
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);

  const {
    accountData,
    isLoading: isLookingUp,
    error: lookupError,
    lookupAccount
  } = useLookupAccount();

  const {
    regeneratedData,
    isRegenerating,
    error: regenerateError,
    regenerateToken,
    clearRegeneratedData
  } = useRegenerateToken();

  const handleSearch = async () => {
    if (!lookupValue.trim()) {
      toast.error("Please enter a lookup value");
      return;
    }
    clearRegeneratedData();
    await lookupAccount(
      lookupValue.trim(),
      lookupType as "steam_id" | "account_id" | "nickname" | "email"
    );
  };

  const handleRegenerateToken = async () => {
    if (!accountData) return;

    try {
      await regenerateToken(accountData.accountId);
      setShowRegenerateDialog(false);
      toast.success("Token regenerated successfully!");

      // Refresh the account data to show the new token
      await lookupAccount(
        lookupValue.trim(),
        lookupType as "steam_id" | "account_id" | "nickname" | "email"
      );
    } catch (_err) {
      toast.error(
        regenerateError || "Failed to regenerate token. Please try again."
      );
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getLookupTypeLabel = (type: string) => {
    switch (type) {
      case "steam_id":
        return "Steam ID";
      case "account_id":
        return "Account ID";
      case "nickname":
        return "Nickname";
      case "email":
        return "Email";
      default:
        return type;
    }
  };

  // Use regenerated data if available, otherwise use account data
  const displayData = regeneratedData
    ? {
        ...accountData!,
        workEmailToken: regeneratedData.token,
        workEmailTokenExpiresAt: regeneratedData.expiresAt,
        isTokenValid: true,
        verificationUrl: regeneratedData.verificationUrl
      }
    : accountData;

  return (
    <div className="mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Email Verification</h1>
        <p className="text-muted-foreground">
          Look up accounts and manage email verification tokens. Use this when
          users are not receiving verification emails.
        </p>
      </div>

      {/* Lookup Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Look Up Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={lookupType} onValueChange={setLookupType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select lookup type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="steam_id">Steam ID</SelectItem>
                  <SelectItem value="account_id">Account ID</SelectItem>
                  <SelectItem value="nickname">Nickname</SelectItem>
                  <SelectItem value="email">Email Address</SelectItem>
                </SelectContent>
              </Select>

              <div className="md:col-span-2">
                <Input
                  placeholder={`Enter ${getLookupTypeLabel(lookupType).toLowerCase()}`}
                  value={lookupValue}
                  onChange={(e) => setLookupValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                />
              </div>
            </div>

            <Button
              onClick={handleSearch}
              disabled={isLookingUp || !lookupValue.trim()}
              className="w-full md:w-auto"
            >
              {isLookingUp ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </>
              )}
            </Button>

            {lookupError && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{lookupError}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {displayData && (
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Account Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Account ID</p>
                  <p className="font-medium">{displayData.accountId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Steam ID</p>
                  <p className="font-medium">{displayData.steamId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nickname</p>
                  <p className="font-medium">{displayData.nickname}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Work Email</p>
                  <p className="font-medium">
                    {displayData.workEmail || "Not set"}
                  </p>
                </div>
              </div>

              {/* Verification Status */}
              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm text-muted-foreground">
                    Verification Status
                  </p>
                  {displayData.workEmailVerified ? (
                    <Badge variant="default" className="bg-green-600">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="mr-1 h-3 w-3" />
                      Not Verified
                    </Badge>
                  )}
                </div>

                {!displayData.workEmailVerified && (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm text-muted-foreground">
                        Token Status
                      </p>
                      {displayData.isTokenValid ? (
                        <Badge variant="default" className="bg-blue-600">
                          Valid
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {displayData.workEmailToken ? "Expired" : "No Token"}
                        </Badge>
                      )}
                    </div>

                    {displayData.workEmailTokenExpiresAt && (
                      <div className="mb-2">
                        <p className="text-sm text-muted-foreground">
                          Token Expires At
                        </p>
                        <p className="font-medium">
                          {new Date(
                            displayData.workEmailTokenExpiresAt
                          ).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Verification URL */}
              {displayData.verificationUrl &&
                !displayData.workEmailVerified && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Verification URL
                    </p>
                    <div className="flex gap-2">
                      <Input
                        value={displayData.verificationUrl}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        onClick={() =>
                          copyToClipboard(displayData.verificationUrl!)
                        }
                        variant="outline"
                        size="icon"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

              {/* Actions */}
              {!displayData.workEmailVerified && displayData.workEmail && (
                <div className="border-t pt-4">
                  <Button
                    onClick={() => setShowRegenerateDialog(true)}
                    disabled={isRegenerating}
                    variant="default"
                  >
                    {isRegenerating ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Regenerate Token
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Alerts */}
              {displayData.workEmailVerified && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    This account&apos;s email is already verified. No action
                    needed.
                  </AlertDescription>
                </Alert>
              )}

              {!displayData.workEmail && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    This account does not have a work email set. The user needs
                    to add an email to their profile first.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regenerate Confirmation Dialog */}
      <AlertDialog
        open={showRegenerateDialog}
        onOpenChange={setShowRegenerateDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate Verification Token?</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate a new verification token and invalidate the old
              one. The new verification URL will be displayed for you to copy
              and send to the user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerateToken}>
              Regenerate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
