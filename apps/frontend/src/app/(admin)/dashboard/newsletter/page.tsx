"use client";

import { useState, useDeferredValue } from "react";
import { WithRoleProtection } from "@/components/dashboard/WithRoleProtection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Send, Users, Loader2, AlertCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { useAllSeasons } from "@/hooks/data/dashboard/useAllSeasons";
import { useDashboardSeason } from "@/hooks/data/dashboard/useDashboardSeason";
import {
  useNewsletterRecipients,
  useSendNewsletter,
  type NewsletterConsentType
} from "@/hooks/data/useNewsletter";

export default function NewsletterPage() {
  return (
    <WithRoleProtection allowedRoles={["admin"]}>
      <NewsletterContent />
    </WithRoleProtection>
  );
}

function NewsletterContent() {
  const { selectedSeasonId } = useDashboardSeason();
  const { seasons } = useAllSeasons();

  const [consentType, setConsentType] =
    useState<NewsletterConsentType>("newsletter");
  const [subject, setSubject] = useState("");
  const [textContent, setTextContent] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [mode, setMode] = useState<"text" | "html">("html");
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const deferredConsentType = useDeferredValue(consentType);

  const selectedSeason = seasons?.find(
    (s) => String(s.id) === selectedSeasonId
  );

  const { recipientsResult, isLoading: isLoadingRecipients } =
    useNewsletterRecipients(selectedSeasonId, deferredConsentType);
  const { sendNewsletter } = useSendNewsletter();

  const activeContent = mode === "html" ? htmlContent : textContent;
  const canSend =
    !!selectedSeasonId && !!subject.trim() && !!activeContent.trim();

  const handleSend = async () => {
    if (!canSend || !selectedSeasonId) return;
    setIsSending(true);
    setShowConfirm(false);
    try {
      const result = await sendNewsletter({
        season_id: parseInt(selectedSeasonId, 10),
        subject: subject.trim(),
        text_content: mode === "text" ? textContent.trim() : undefined,
        html_content: mode === "html" ? htmlContent.trim() : undefined,
        consent_type: consentType
      });
      if (result.enqueued === 0) {
        toast.info("No eligible recipients found for this selection.");
      } else {
        toast.success(
          `Newsletter queued for ${result.enqueued} recipient${result.enqueued === 1 ? "" : "s"}.`
        );
      }
    } catch (_err) {
      toast.error("Failed to send newsletter. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const unsubscribeFooterPreview =
    mode === "html"
      ? `<p style="font-size:12px;color:#999;margin-top:30px;text-align:center;">
  Don't want to receive these emails?
  <a href="#" style="color:#999;text-decoration:underline;">Unsubscribe</a>
</p>`
      : "\n\n---\nDon't want to receive these emails? Unsubscribe: [link]";

  const htmlPreviewDoc = htmlContent
    ? `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;color:#333;font-size:16px;line-height:1.5;max-width:600px;margin:0 auto;padding:16px}</style></head><body>${htmlContent}${unsubscribeFooterPreview}</body></html>`
    : "";

  return (
    <div className="mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Send Newsletter</h1>
        <p className="text-muted-foreground">
          Compose and send a newsletter to season players who have consented to
          receive emails. A GDPR-compliant unsubscribe link is added to every
          message automatically.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Compose */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recipients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Season from sidebar */}
              <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                {selectedSeason ? (
                  <span>
                    Sending to players in{" "}
                    <span className="font-medium">
                      {selectedSeason.full_name ?? selectedSeason.name}
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    No season selected — pick one from the sidebar
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Consent Type</label>
                <Select
                  value={consentType}
                  onValueChange={(v) =>
                    setConsentType(v as NewsletterConsentType)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newsletter">
                      Tournament Newsletter
                    </SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="both">
                      Newsletter or Marketing
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedSeasonId && (
                <div className="flex items-center gap-2">
                  {isLoadingRecipients ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <Users className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm">
                    {isLoadingRecipients
                      ? "Counting recipients…"
                      : recipientsResult
                        ? `${recipientsResult.count} eligible recipient${recipientsResult.count === 1 ? "" : "s"}`
                        : "No data"}
                  </span>
                  {recipientsResult && recipientsResult.count > 0 && (
                    <Badge variant="secondary">{recipientsResult.count}</Badge>
                  )}
                </div>
              )}

              {recipientsResult && recipientsResult.players.length > 0 && (
                <div className="rounded-md border p-3 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium mb-2">
                    Preview (first {recipientsResult.players.length})
                  </p>
                  {recipientsResult.players.map((p) => (
                    <p key={p.email} className="text-xs font-mono">
                      {p.nickname} — {p.email}
                    </p>
                  ))}
                  {recipientsResult.count > recipientsResult.players.length && (
                    <p className="text-xs text-muted-foreground">
                      +
                      {recipientsResult.count - recipientsResult.players.length}{" "}
                      more
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compose</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input
                  placeholder="Email subject…"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <Tabs
                value={mode}
                onValueChange={(v) => setMode(v as "text" | "html")}
              >
                <TabsList className="w-full">
                  <TabsTrigger value="html" className="flex-1">
                    HTML
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex-1">
                    Plain Text
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="html" className="mt-3">
                  <Textarea
                    placeholder="Paste or write HTML content here…"
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    className="min-h-64 font-mono text-sm"
                  />
                </TabsContent>

                <TabsContent value="text" className="mt-3">
                  <Textarea
                    placeholder="Write plain text content here…"
                    value={textContent}
                    onChange={(e) => setTextContent(e.target.value)}
                    className="min-h-64"
                  />
                </TabsContent>
              </Tabs>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  A GDPR-compliant unsubscribe link is appended to every email
                  automatically.
                </AlertDescription>
              </Alert>

              <Button
                className="w-full"
                disabled={!canSend || isSending}
                onClick={() => setShowConfirm(true)}
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Newsletter
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Email Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {subject && (
                <p className="text-sm text-muted-foreground mb-3">
                  <span className="font-medium text-foreground">Subject:</span>{" "}
                  {subject}
                </p>
              )}

              {mode === "html" ? (
                htmlContent ? (
                  <iframe
                    srcDoc={htmlPreviewDoc}
                    className="w-full border rounded-md"
                    style={{ height: "600px" }}
                    sandbox="allow-same-origin"
                    title="Email preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-64 border rounded-md text-muted-foreground text-sm">
                    HTML preview will appear here
                  </div>
                )
              ) : textContent ? (
                <pre className="whitespace-pre-wrap text-sm font-mono border rounded-md p-4 bg-muted min-h-64 overflow-auto">
                  {textContent}
                  {unsubscribeFooterPreview}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-64 border rounded-md text-muted-foreground text-sm">
                  Plain text preview will appear here
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Newsletter?</AlertDialogTitle>
            <AlertDialogDescription>
              This will queue the newsletter for{" "}
              <strong>{recipientsResult?.count ?? "…"}</strong> recipient
              {(recipientsResult?.count ?? 0) === 1 ? "" : "s"} in{" "}
              <strong>
                {selectedSeason?.full_name ??
                  selectedSeason?.name ??
                  "the selected season"}
              </strong>
              . Emails will be sent via the BullMQ mail queue with rate
              limiting. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSend}>
              Send Newsletter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
