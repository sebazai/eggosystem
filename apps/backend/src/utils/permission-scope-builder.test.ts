import {
  buildPermissionScope,
  buildPermissionString
} from "./permission-scope-builder";

describe("buildPermissionScope", () => {
  it("should build scope in canonical order (season first, team second)", () => {
    const params = { season_id: "1", team_id: "2" };
    const result = buildPermissionScope(params, ["season_id", "team_id"]);
    expect(result).toBe("season-1:team-2");
  });

  it("should auto-sort to canonical order even when params are reversed", () => {
    const params = { season_id: "1", team_id: "2" };
    const result = buildPermissionScope(params, ["team_id", "season_id"]);
    // Should auto-sort to season first, team second
    expect(result).toBe("season-1:team-2");
  });

  it("should handle single parameter", () => {
    const params = { season_id: "1" };
    const result = buildPermissionScope(params, ["season_id"]);
    expect(result).toBe("season-1");
  });

  it("should throw error for missing parameter", () => {
    const params = { season_id: "1" };
    expect(() => {
      buildPermissionScope(params, ["season_id", "team_id"]);
    }).toThrow("Missing route param: team_id");
  });

  it("should handle unknown parameters by sorting alphabetically", () => {
    const params = { zebra_id: "1", apple_id: "2" };
    const result = buildPermissionScope(params, ["zebra_id", "apple_id"]);
    // Unknown keys should be sorted alphabetically: apple_id comes before zebra_id
    // So apple_id's value (2) comes first, then zebra_id's value (1)
    expect(result).toBe("apple-2:zebra-1");
  });

  it("should prioritize known keys over unknown keys", () => {
    const params = { season_id: "1", team_id: "2", unknown_id: "3" };
    const result = buildPermissionScope(params, [
      "unknown_id",
      "team_id",
      "season_id"
    ]);
    // season_id (priority 1), team_id (priority 2), unknown_id (priority 1000)
    expect(result).toBe("season-1:team-2:unknown-3");
  });
});

describe("buildPermissionString", () => {
  it("should build role-based permission string", () => {
    const params = { season_id: "1", team_id: "2" };
    const result = buildPermissionString(
      "edit-registration",
      params,
      ["season_id", "team_id"],
      "captain"
    );
    expect(result).toBe("captain:edit-registration:season-1:team-2");
  });

  it("should build direct permission string without role", () => {
    const params = { season_id: "1", team_id: "2" };
    const result = buildPermissionString("edit-registration", params, [
      "season_id",
      "team_id"
    ]);
    expect(result).toBe("edit-registration:season-1:team-2");
  });

  it("should auto-sort parameters even in permission string", () => {
    const params = { season_id: "1", team_id: "2" };
    const result = buildPermissionString(
      "edit-registration",
      params,
      ["team_id", "season_id"], // Wrong order
      "captain"
    );
    // Should auto-correct to canonical order
    expect(result).toBe("captain:edit-registration:season-1:team-2");
  });

  it("should throw error for missing parameter in permission string", () => {
    const params = { season_id: "1" };
    expect(() => {
      buildPermissionString(
        "edit-registration",
        params,
        ["season_id", "team_id"],
        "captain"
      );
    }).toThrow("Missing route param: team_id");
  });
});
