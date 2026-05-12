import {
  casterApplicationSubmitBodySchema,
  casterApplicationRejectBodySchema
} from "./caster-applications.schemas";

describe("caster-applications schemas", () => {
  describe("casterApplicationSubmitBodySchema", () => {
    it("should accept valid submit body", () => {
      const result = casterApplicationSubmitBodySchema.safeParse({
        caster_url: "https://twitch.tv/mychannel",
        approved_terms_and_conditions: true
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.caster_url).toBe("https://twitch.tv/mychannel");
        expect(result.data.approved_terms_and_conditions).toBe(true);
      }
    });

    it("should reject invalid URL", () => {
      const result = casterApplicationSubmitBodySchema.safeParse({
        caster_url: "not-a-url",
        approved_terms_and_conditions: true
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty URL", () => {
      const result = casterApplicationSubmitBodySchema.safeParse({
        caster_url: "",
        approved_terms_and_conditions: true
      });
      expect(result.success).toBe(false);
    });

    it("should reject terms not accepted", () => {
      const result = casterApplicationSubmitBodySchema.safeParse({
        caster_url: "https://twitch.tv/mychannel",
        approved_terms_and_conditions: false
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing terms field", () => {
      const result = casterApplicationSubmitBodySchema.safeParse({
        caster_url: "https://twitch.tv/mychannel"
      });
      expect(result.success).toBe(false);
    });
  });

  describe("casterApplicationRejectBodySchema", () => {
    it("should accept valid reject body", () => {
      const result = casterApplicationRejectBodySchema.safeParse({
        rejection_reason: "Incomplete information provided."
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.rejection_reason).toBe(
          "Incomplete information provided."
        );
      }
    });

    it("should reject empty rejection_reason", () => {
      const result = casterApplicationRejectBodySchema.safeParse({
        rejection_reason: ""
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing rejection_reason", () => {
      const result = casterApplicationRejectBodySchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});
