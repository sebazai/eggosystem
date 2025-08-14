describe("NODE_ENV Test", () => {
  it("should have NODE_ENV set to test", () => {
    expect(process.env.NODE_ENV).toBe("test");
  });
});
