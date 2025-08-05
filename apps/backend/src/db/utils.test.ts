import { buildInsertQueryParts } from "./utils";

describe("buildInsertQueryParts", () => {
  it("should generate correct columns, placeholders, and values for a full object", () => {
    const data = {
      steam_id: "123456",
      name: "John Doe",
      discord: "johndoe#1234",
      work_email: "john@example.com",
      full_name: "JD"
    };

    const { columns, placeholders, values } = buildInsertQueryParts(data);

    expect(columns).toEqual([
      "steam_id",
      "name",
      "discord",
      "work_email",
      "full_name"
    ]);
    expect(placeholders).toBe("?, ?, ?, ?, ?");
    expect(values).toEqual([
      "123456",
      "John Doe",
      "johndoe#1234",
      "john@example.com",
      "JD"
    ]);
  });

  it("should exclude null and undefined values", () => {
    const data = {
      steam_id: "123456",
      name: null,
      discord: "johndoe#1234",
      work_email: undefined,
      full_name: "JD"
    };

    const { columns, placeholders, values } = buildInsertQueryParts(data);

    expect(columns).toEqual(["steam_id", "discord", "full_name"]); // `name` & `work_email` removed
    expect(placeholders).toBe("?, ?, ?");
    expect(values).toEqual(["123456", "johndoe#1234", "JD"]);
  });

  it("should handle an empty object", () => {
    const data = {};

    const { columns, placeholders, values } = buildInsertQueryParts(data);

    expect(columns).toEqual([]);
    expect(placeholders).toBe("");
    expect(values).toEqual([]);
  });

  it("should handle an object with only null/undefined values", () => {
    const data = {
      name: null,
      discord: undefined
    };

    const { columns, placeholders, values } = buildInsertQueryParts(data);

    expect(columns).toEqual([]); // All keys removed
    expect(placeholders).toBe("");
    expect(values).toEqual([]);
  });

  it("should correctly handle different data types", () => {
    const data = {
      id: 1,
      isActive: true,
      createdAt: new Date("2023-01-01"),
      description: "Sample"
    };

    const { columns, placeholders, values } = buildInsertQueryParts(data);

    expect(columns).toEqual(["id", "isActive", "createdAt", "description"]);
    expect(placeholders).toBe("?, ?, ?, ?");
    expect(values).toEqual([1, true, new Date("2023-01-01"), "Sample"]);
  });
});
