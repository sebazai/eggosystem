import { plantTimeSecondsOrNull } from "./plant-time";

describe("plantTimeSecondsOrNull", () => {
  it("returns null for 0 (parser: no plant)", () => {
    expect(plantTimeSecondsOrNull(0)).toBeNull();
  });

  it("returns null for missing time", () => {
    expect(plantTimeSecondsOrNull(undefined)).toBeNull();
    expect(plantTimeSecondsOrNull(null)).toBeNull();
  });

  it("keeps positive seconds-in-round values", () => {
    expect(plantTimeSecondsOrNull(123.874996224)).toBe(123.874996224);
  });
});
