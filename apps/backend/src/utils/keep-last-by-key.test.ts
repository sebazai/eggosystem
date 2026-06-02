import { keepLastByKey } from "./keep-last-by-key";

describe("keepLastByKey", () => {
  it("keeps the last item for duplicate keys", () => {
    const items = [
      { id: "a", value: 1 },
      { id: "b", value: 2 },
      { id: "a", value: 3 }
    ];

    expect(keepLastByKey(items, (item) => item.id)).toEqual([
      { id: "a", value: 3 },
      { id: "b", value: 2 }
    ]);
  });
});
