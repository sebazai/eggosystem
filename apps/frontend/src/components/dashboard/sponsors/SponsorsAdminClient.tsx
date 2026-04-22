"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";
import type {
  MarketingSponsorAdminRow,
  PublicMarketingSponsor
} from "@eggosystem/types";
import { clientApiFetch, ApiError } from "@/lib/apiClient";
import { createTeamLogoUrl } from "@/lib/utils";
import { resizeImageFileToDataUrl } from "@/lib/sponsor-image-resize";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import Image from "next/image";
import { MarketingSponsorLogoGrid } from "@/components/sponsors/MarketingSponsorLogoGrid";
import { SponsorContainer } from "@/components/sponsors/SponsorContainer";

const TIERS = [
  { value: "game_wide", label: "Site-wide (e.g. landing hero)" },
  { value: "main_partner", label: "Main partners" },
  { value: "supporting_organization", label: "Supporting organizations" }
] as const;

type TierValue = (typeof TIERS)[number]["value"];

function parseTierValue(raw: string): TierValue | null {
  if (
    raw === "game_wide" ||
    raw === "main_partner" ||
    raw === "supporting_organization"
  ) {
    return raw;
  }
  return null;
}

async function fetchSponsors(): Promise<MarketingSponsorAdminRow[]> {
  const res = await clientApiFetch<{ sponsors: MarketingSponsorAdminRow[] }>(
    "/api/v1/dashboard/sponsors"
  );
  return res.sponsors;
}

function sortByOrder(rows: MarketingSponsorAdminRow[]) {
  return [...rows].sort((a, b) => {
    if (a.display_order !== b.display_order) {
      return a.display_order - b.display_order;
    }
    return a.id - b.id;
  });
}

function adminRowToPublic(
  row: MarketingSponsorAdminRow
): PublicMarketingSponsor {
  return {
    id: row.id,
    display_name: row.display_name,
    external_url: row.external_url,
    display_order: row.display_order,
    image_phash: row.image_phash,
    footer_image_phash: row.footer_image_phash
  };
}

function tierRowsToPublicPreviewItems(
  rows: MarketingSponsorAdminRow[],
  includeDisabled: boolean
): PublicMarketingSponsor[] {
  return sortByOrder(rows)
    .filter((r) => includeDisabled || r.enabled)
    .map(adminRowToPublic);
}

function SponsorRowEditor({
  row,
  onCancel,
  onSaved
}: {
  row: MarketingSponsorAdminRow;
  onCancel: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(row.display_name);
  const [url, setUrl] = useState(row.external_url ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [footerFile, setFooterFile] = useState<File | null>(null);
  const [maxSide, setMaxSide] = useState(800);
  const [busy, setBusy] = useState(false);
  const showFooterLogoFields = row.tier === "main_partner";

  const saveMeta = async () => {
    setBusy(true);
    try {
      await clientApiFetch(`/api/v1/dashboard/sponsors/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          display_name: name.trim(),
          external_url: url.trim() || null
        })
      });
      toast.success("Updated");
      await onSaved();
    } catch (e) {
      const msg =
        e instanceof ApiError ? (e.detail ?? e.message) : "Update failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const saveImage = async () => {
    if (!file) {
      toast.error("Choose an image file first");
      return;
    }
    setBusy(true);
    try {
      const image_data = await resizeImageFileToDataUrl(file, maxSide);
      await clientApiFetch(`/api/v1/dashboard/sponsors/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ image_data })
      });
      toast.success("Image updated");
      setFile(null);
      await onSaved();
    } catch (e) {
      const msg =
        e instanceof ApiError ? (e.detail ?? e.message) : "Image update failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const clearLogo = async () => {
    setBusy(true);
    try {
      await clientApiFetch(`/api/v1/dashboard/sponsors/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ clear_logo: true })
      });
      toast.success("Logo removed");
      await onSaved();
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? (e.detail ?? e.message)
          : "Could not remove logo";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const saveFooterImage = async () => {
    if (!footerFile) {
      toast.error("Choose a footer image file first");
      return;
    }
    setBusy(true);
    try {
      const footer_image_data = await resizeImageFileToDataUrl(
        footerFile,
        maxSide
      );
      await clientApiFetch(`/api/v1/dashboard/sponsors/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ footer_image_data })
      });
      toast.success("Footer logo updated");
      setFooterFile(null);
      await onSaved();
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? (e.detail ?? e.message)
          : "Footer image update failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const clearFooterLogo = async () => {
    setBusy(true);
    try {
      await clientApiFetch(`/api/v1/dashboard/sponsors/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ clear_footer_logo: true })
      });
      toast.success("Footer logo removed");
      await onSaved();
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? (e.detail ?? e.message)
          : "Could not remove footer logo";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full border-t pt-3 mt-2 grid gap-3 max-w-lg">
      <div className="grid gap-2">
        <Label>Display name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label>External URL</Label>
        <Input value={url} onChange={(e) => setUrl(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          disabled={busy}
          onClick={() => void saveMeta()}
        >
          Save text
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      <div className="grid gap-2">
        <Label>Replace logo</Label>
        <Input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
          onChange={(e) =>
            setFile(e.target.files?.[0] ? e.target.files[0] : null)
          }
        />
        <Label>Max output size (longest side): {maxSide}</Label>
        <input
          type="range"
          min={128}
          max={2048}
          step={32}
          value={maxSide}
          onChange={(e) => setMaxSide(Number(e.target.value))}
        />
        <Button
          type="button"
          size="sm"
          disabled={busy}
          onClick={() => void saveImage()}
        >
          Upload new image
        </Button>
        {row.image_phash ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => void clearLogo()}
          >
            Remove logo
          </Button>
        ) : null}
      </div>
      {showFooterLogoFields ? (
        <div className="grid gap-2 border-t pt-3">
          <Label>Footer logo (optional)</Label>
          <p className="text-xs text-muted-foreground">
            Partners appear in the site footer only when this image is set. Use
            a light-on-dark variant (e.g. white mark) for the footer background.
          </p>
          <Input
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            onChange={(e) =>
              setFooterFile(e.target.files?.[0] ? e.target.files[0] : null)
            }
          />
          <Button
            type="button"
            size="sm"
            disabled={busy}
            onClick={() => void saveFooterImage()}
          >
            Upload footer image
          </Button>
          {row.footer_image_phash ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => void clearFooterLogo()}
            >
              Remove footer logo
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function SponsorsAdminClient() {
  const {
    data: sponsors = [],
    isLoading,
    mutate
  } = useSWR("/api/v1/dashboard/sponsors", fetchSponsors);

  const [newTier, setNewTier] = useState<TierValue>("main_partner");
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newFooterFile, setNewFooterFile] = useState<File | null>(null);
  const [maxSide, setMaxSide] = useState(800);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [includeDisabledInPreview, setIncludeDisabledInPreview] =
    useState(false);

  const byTier = useMemo(() => {
    const map: Record<TierValue, MarketingSponsorAdminRow[]> = {
      game_wide: [],
      main_partner: [],
      supporting_organization: []
    };
    for (const s of sponsors) {
      map[s.tier].push(s);
    }
    for (const t of TIERS) {
      map[t.value] = sortByOrder(map[t.value]);
    }
    return map;
  }, [sponsors]);

  const homepagePreviewByTier = useMemo(
    () => ({
      game_wide: tierRowsToPublicPreviewItems(
        byTier.game_wide,
        includeDisabledInPreview
      ),
      main_partner: tierRowsToPublicPreviewItems(
        byTier.main_partner,
        includeDisabledInPreview
      ),
      supporting_organization: tierRowsToPublicPreviewItems(
        byTier.supporting_organization,
        includeDisabledInPreview
      )
    }),
    [byTier, includeDisabledInPreview]
  );

  const persistReorder = useCallback(
    async (tier: TierValue, ordered: MarketingSponsorAdminRow[]) => {
      try {
        await clientApiFetch("/api/v1/dashboard/sponsors/reorder", {
          method: "PUT",
          body: JSON.stringify({
            tier,
            ordered_ids: ordered.map((r) => r.id)
          })
        });
        await mutate();
      } catch (e) {
        const msg =
          e instanceof ApiError ? (e.detail ?? e.message) : "Reorder failed";
        toast.error(msg);
      }
    },
    [mutate]
  );

  const move = useCallback(
    async (tier: TierValue, index: number, dir: -1 | 1) => {
      const list = [...byTier[tier]];
      const j = index + dir;
      if (j < 0 || j >= list.length) {
        return;
      }
      const a = list[index];
      const b = list[j];
      if (!a || !b) {
        return;
      }
      list[index] = b;
      list[j] = a;
      await persistReorder(tier, list);
    },
    [byTier, persistReorder]
  );

  const onCreate = async () => {
    if (!newName.trim()) {
      toast.error("Display name is required");
      return;
    }
    setSaving(true);
    try {
      let image_data: string | undefined;
      if (newFile) {
        image_data = await resizeImageFileToDataUrl(newFile, maxSide);
      }
      let footer_image_data: string | undefined;
      if (newTier === "main_partner" && newFooterFile) {
        footer_image_data = await resizeImageFileToDataUrl(
          newFooterFile,
          maxSide
        );
      }
      await clientApiFetch("/api/v1/dashboard/sponsors", {
        method: "POST",
        body: JSON.stringify({
          tier: newTier,
          display_name: newName.trim(),
          external_url: newUrl.trim() || null,
          image_data,
          ...(footer_image_data !== undefined ? { footer_image_data } : {})
        })
      });
      toast.success("Sponsor created");
      setNewName("");
      setNewUrl("");
      setNewFile(null);
      setNewFooterFile(null);
      await mutate();
    } catch (e) {
      const msg =
        e instanceof ApiError ? (e.detail ?? e.message) : "Failed to create";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const patchRow = async (
    id: number,
    body: Record<string, string | boolean | number | null | undefined>
  ) => {
    try {
      await clientApiFetch(`/api/v1/dashboard/sponsors/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body)
      });
      await mutate();
      toast.success("Saved");
    } catch (e) {
      const msg =
        e instanceof ApiError ? (e.detail ?? e.message) : "Save failed";
      toast.error(msg);
    }
  };

  const removeRow = async (id: number) => {
    try {
      await clientApiFetch(`/api/v1/dashboard/sponsors/${id}`, {
        method: "DELETE"
      });
      await mutate();
      toast.success("Removed");
    } catch (e) {
      const msg =
        e instanceof ApiError ? (e.detail ?? e.message) : "Delete failed";
      toast.error(msg);
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Front page preview</CardTitle>
          <CardDescription>
            Same sections and styling as the public landing page (featured, main
            partners, supporting). Use this to check logos at the size visitors
            see. Disabled sponsors are not shown on the live site until you
            enable them; use the checkbox below to include them in this preview
            so you can validate images before publishing.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-start gap-2">
            <Checkbox
              id="sponsors-preview-include-disabled"
              checked={includeDisabledInPreview}
              onCheckedChange={(v) => setIncludeDisabledInPreview(v === true)}
            />
            <div className="grid gap-1">
              <Label
                htmlFor="sponsors-preview-include-disabled"
                className="text-sm font-medium leading-none cursor-pointer"
              >
                Include disabled sponsors in preview
              </Label>
              <p className="text-xs text-muted-foreground">
                When off, only sponsors that would appear on the live homepage
                are shown.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-10 rounded-lg border bg-card p-4 sm:p-6">
            {homepagePreviewByTier.game_wide.length > 0 ? (
              <SponsorContainer
                header="Featured sponsors"
                classNames="mt-0 sm:mt-0"
              >
                <MarketingSponsorLogoGrid
                  items={homepagePreviewByTier.game_wide}
                />
              </SponsorContainer>
            ) : null}
            {homepagePreviewByTier.main_partner.length > 0 ? (
              <SponsorContainer
                classNames="mt-0 sm:mt-0"
                header="Main Partners"
              >
                <MarketingSponsorLogoGrid
                  items={homepagePreviewByTier.main_partner}
                />
              </SponsorContainer>
            ) : null}
            {homepagePreviewByTier.supporting_organization.length > 0 ? (
              <SponsorContainer
                classNames="mt-0 sm:mt-0"
                secondary={true}
                header="Supporting our tournaments"
              >
                <MarketingSponsorLogoGrid
                  items={homepagePreviewByTier.supporting_organization}
                />
              </SponsorContainer>
            ) : null}
            {homepagePreviewByTier.game_wide.length === 0 &&
            homepagePreviewByTier.main_partner.length === 0 &&
            homepagePreviewByTier.supporting_organization.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No sponsors to preview yet.
                {!includeDisabledInPreview &&
                sponsors.some((s) => !s.enabled) ? (
                  <>
                    {" "}
                    You have disabled sponsors — turn on the checkbox above to
                    preview their logos here.
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add sponsor</CardTitle>
          <CardDescription>
            New sponsors are hidden from the public site until you enable them
            in the list below. Images are validated like team logos. Use “Max
            output size” to shrink large uploads before they are sent to the
            image service.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 max-w-xl">
          <div className="grid gap-2">
            <Label htmlFor="tier">Tier</Label>
            <select
              id="tier"
              className="border rounded-md h-9 px-2 bg-background"
              value={newTier}
              onChange={(e) => {
                const t = parseTierValue(e.target.value);
                if (t) {
                  setNewTier(t);
                }
              }}
            >
              {TIERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="url">External URL (optional)</Label>
            <Input
              id="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="file">Logo image (optional)</Label>
            <Input
              id="file"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              onChange={(e) =>
                setNewFile(e.target.files?.[0] ? e.target.files[0] : null)
              }
            />
          </div>
          {newTier === "main_partner" ? (
            <div className="grid gap-2">
              <Label htmlFor="footerFile">Footer logo (optional)</Label>
              <p className="text-xs text-muted-foreground">
                Without this, the partner is not listed in the site footer. Use
                a light-on-dark asset for the footer background.
              </p>
              <Input
                id="footerFile"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                onChange={(e) =>
                  setNewFooterFile(
                    e.target.files?.[0] ? e.target.files[0] : null
                  )
                }
              />
            </div>
          ) : null}
          <div className="grid gap-2">
            <Label htmlFor="maxSide">
              Max output size (longest side, pixels): {maxSide}
            </Label>
            <input
              id="maxSide"
              type="range"
              min={128}
              max={2048}
              step={32}
              value={maxSide}
              onChange={(e) => setMaxSide(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <Button disabled={saving} onClick={() => void onCreate()}>
            {saving ? "Saving…" : "Create"}
          </Button>
        </CardContent>
      </Card>

      {TIERS.map((tier) => (
        <Card key={tier.value}>
          <CardHeader>
            <CardTitle>{tier.label}</CardTitle>
            <CardDescription>
              Reorder with arrows. Disable to hide from the public site, or use
              Remove to delete the sponsor row.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {byTier[tier.value].length === 0 ? (
              <p className="text-sm text-muted-foreground">No sponsors yet.</p>
            ) : null}
            {byTier[tier.value].map((row, index) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center gap-3 border rounded-lg p-3"
              >
                <div className="flex flex-col gap-1 min-w-[200px] flex-1">
                  <div className="flex items-center gap-2">
                    {row.image_phash ? (
                      <Image
                        src={createTeamLogoUrl(row.image_phash)}
                        alt=""
                        width={48}
                        height={48}
                        className="object-contain"
                        unoptimized
                      />
                    ) : null}
                    <span className="font-medium">{row.display_name}</span>
                    {!row.enabled ? (
                      <span className="text-xs text-destructive">disabled</span>
                    ) : null}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    #{row.id} · order {row.display_order}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setEditingId((cur) => (cur === row.id ? null : row.id))
                    }
                  >
                    {editingId === row.id ? "Close edit" : "Edit"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void move(tier.value, index, -1)}
                    disabled={index === 0}
                  >
                    Up
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void move(tier.value, index, 1)}
                    disabled={index === byTier[tier.value].length - 1}
                  >
                    Down
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      void patchRow(row.id, { enabled: !row.enabled })
                    }
                  >
                    {row.enabled ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => void removeRow(row.id)}
                  >
                    Remove
                  </Button>
                </div>
                {editingId === row.id ? (
                  <SponsorRowEditor
                    key={row.id}
                    row={row}
                    onCancel={() => setEditingId(null)}
                    onSaved={async () => {
                      setEditingId(null);
                      await mutate();
                    }}
                  />
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
