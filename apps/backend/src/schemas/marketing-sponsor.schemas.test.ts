import {
  createMarketingSponsorBodySchema,
  marketingSponsorImageDataMaxChars,
  patchMarketingSponsorBodySchema,
  reorderMarketingSponsorsBodySchema
} from "./marketing-sponsor.schemas";

describe("marketing-sponsor.schemas", () => {
  it("rejects invalid tier on create", () => {
    const r = createMarketingSponsorBodySchema.safeParse({
      tier: "invalid",
      display_name: "X"
    });
    expect(r.success).toBe(false);
  });

  it("rejects game_wide create without game_id", () => {
    const r = createMarketingSponsorBodySchema.safeParse({
      tier: "game_wide",
      display_name: "X"
    });
    expect(r.success).toBe(false);
  });

  it("accepts game_wide create with game_id", () => {
    const r = createMarketingSponsorBodySchema.safeParse({
      tier: "game_wide",
      game_id: 1,
      display_name: "X"
    });
    expect(r.success).toBe(true);
  });

  it("rejects game_id on non-game_wide create", () => {
    const r = createMarketingSponsorBodySchema.safeParse({
      tier: "main_partner",
      game_id: 1,
      display_name: "X"
    });
    expect(r.success).toBe(false);
  });

  it("accepts valid reorder body", () => {
    const r = reorderMarketingSponsorsBodySchema.safeParse({
      tier: "main_partner",
      ordered_ids: [1, 2, 3]
    });
    expect(r.success).toBe(true);
  });

  it("rejects game_wide reorder without game_id", () => {
    const r = reorderMarketingSponsorsBodySchema.safeParse({
      tier: "game_wide",
      ordered_ids: [1, 2]
    });
    expect(r.success).toBe(false);
  });

  it("accepts game_wide reorder with game_id", () => {
    const r = reorderMarketingSponsorsBodySchema.safeParse({
      tier: "game_wide",
      game_id: 1,
      ordered_ids: [1, 2]
    });
    expect(r.success).toBe(true);
  });

  it("rejects duplicate ordered_ids", () => {
    const r = reorderMarketingSponsorsBodySchema.safeParse({
      tier: "main_partner",
      ordered_ids: [1, 1, 2]
    });
    expect(r.success).toBe(false);
  });

  it("rejects image_data longer than marketingSponsorImageDataMaxChars", () => {
    const r = createMarketingSponsorBodySchema.safeParse({
      tier: "main_partner",
      display_name: "X",
      image_data: "a".repeat(marketingSponsorImageDataMaxChars + 1)
    });
    expect(r.success).toBe(false);
  });

  it("accepts patch with clear_logo only", () => {
    const r = patchMarketingSponsorBodySchema.safeParse({ clear_logo: true });
    expect(r.success).toBe(true);
  });

  it("rejects patch when clear_logo is combined with image_data", () => {
    const r = patchMarketingSponsorBodySchema.safeParse({
      clear_logo: true,
      image_data: "data:image/png;base64,abcd"
    });
    expect(r.success).toBe(false);
  });

  it("rejects patch when clear_footer_logo is combined with footer_image_data", () => {
    const r = patchMarketingSponsorBodySchema.safeParse({
      clear_footer_logo: true,
      footer_image_data: "data:image/png;base64,abcd"
    });
    expect(r.success).toBe(false);
  });
});
