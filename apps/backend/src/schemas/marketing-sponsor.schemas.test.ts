import {
  createMarketingSponsorBodySchema,
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

  it("accepts valid reorder body", () => {
    const r = reorderMarketingSponsorsBodySchema.safeParse({
      tier: "main_partner",
      ordered_ids: [1, 2, 3]
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
});
