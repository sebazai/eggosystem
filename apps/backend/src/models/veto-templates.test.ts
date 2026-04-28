import {
  getVetoTemplate,
  getAllVetoTemplates,
  resolveVetoAction
} from "@eggosystem/types";

describe("getVetoTemplate", () => {
  it("returns BO1 template with 7 steps", () => {
    const tpl = getVetoTemplate(1);
    expect(tpl).toBeDefined();
    expect(tpl!.bestOf).toBe(1);
    expect(tpl!.mapPoolSize).toBe(7);
    expect(tpl!.steps).toHaveLength(7);
  });

  it("returns BO2 template with 7 steps", () => {
    const tpl = getVetoTemplate(2);
    expect(tpl).toBeDefined();
    expect(tpl!.bestOf).toBe(2);
    expect(tpl!.mapPoolSize).toBe(7);
    expect(tpl!.steps).toHaveLength(7);
  });

  it("returns BO3 template with 7 steps", () => {
    const tpl = getVetoTemplate(3);
    expect(tpl).toBeDefined();
    expect(tpl!.bestOf).toBe(3);
    expect(tpl!.steps).toHaveLength(7);
  });

  it("returns BO5 template with 7 steps", () => {
    const tpl = getVetoTemplate(5);
    expect(tpl).toBeDefined();
    expect(tpl!.bestOf).toBe(5);
    expect(tpl!.steps).toHaveLength(7);
  });

  it("returns undefined for unknown best-of value", () => {
    expect(getVetoTemplate(7)).toBeUndefined();
  });

  it("BO1 template has 6 drops and 1 decider", () => {
    const tpl = getVetoTemplate(1)!;
    const actions = tpl.steps.map((s) => s.action);
    expect(actions.filter((a) => a === "drop")).toHaveLength(6);
    expect(actions.filter((a) => a === "decider")).toHaveLength(1);
    expect(actions.filter((a) => a === "pick")).toHaveLength(0);
    expect(actions[6]).toBe("decider");
  });

  it("BO2 template has 5 drops and 2 picks", () => {
    const tpl = getVetoTemplate(2)!;
    const actions = tpl.steps.map((s) => s.action);
    expect(actions.filter((a) => a === "drop")).toHaveLength(5);
    expect(actions.filter((a) => a === "pick")).toHaveLength(2);
    expect(actions.filter((a) => a === "decider")).toHaveLength(0);
    expect(actions[6]).toBe("drop");
  });

  it("BO3 template has 4 drops, 2 picks and 1 decider", () => {
    const tpl = getVetoTemplate(3)!;
    const actions = tpl.steps.map((s) => s.action);
    expect(actions.filter((a) => a === "drop")).toHaveLength(4);
    expect(actions.filter((a) => a === "pick")).toHaveLength(2);
    expect(actions.filter((a) => a === "decider")).toHaveLength(1);
    expect(actions[6]).toBe("decider");
  });

  it("BO5 template has 2 drops, 4 picks and 1 decider", () => {
    const tpl = getVetoTemplate(5)!;
    const actions = tpl.steps.map((s) => s.action);
    expect(actions.filter((a) => a === "drop")).toHaveLength(2);
    expect(actions.filter((a) => a === "pick")).toHaveLength(4);
    expect(actions.filter((a) => a === "decider")).toHaveLength(1);
    expect(actions[6]).toBe("decider");
  });

  it("all steps have correct 1-indexed order", () => {
    for (const [, tpl] of getAllVetoTemplates()) {
      tpl.steps.forEach((step, i) => {
        expect(step.order).toBe(i + 1);
      });
    }
  });
});

describe("getAllVetoTemplates", () => {
  it("returns a map with 4 templates", () => {
    const all = getAllVetoTemplates();
    expect(all.size).toBe(4);
    expect(all.has(1)).toBe(true);
    expect(all.has(2)).toBe(true);
    expect(all.has(3)).toBe(true);
    expect(all.has(5)).toBe(true);
  });
});

describe("resolveVetoAction", () => {
  describe("with BO1 template", () => {
    it("resolves all steps as drops except the last as decider", () => {
      expect(resolveVetoAction(1, 1, 7, "drop")).toBe("drop");
      expect(resolveVetoAction(1, 6, 7, "drop")).toBe("drop");
      expect(resolveVetoAction(1, 7, 7, "pick")).toBe("decider");
    });
  });

  describe("with BO2 template", () => {
    it("resolves bans at positions 1-4 and 7", () => {
      expect(resolveVetoAction(2, 1, 7, "drop")).toBe("drop");
      expect(resolveVetoAction(2, 4, 7, "drop")).toBe("drop");
      expect(resolveVetoAction(2, 7, 7, "drop")).toBe("drop");
    });

    it("resolves picks at positions 5-6", () => {
      expect(resolveVetoAction(2, 5, 7, "pick")).toBe("pick");
      expect(resolveVetoAction(2, 6, 7, "pick")).toBe("pick");
    });
  });

  describe("with BO3 template", () => {
    it("resolves bans at positions 1-2 and 5-6", () => {
      expect(resolveVetoAction(3, 1, 7, "drop")).toBe("drop");
      expect(resolveVetoAction(3, 2, 7, "drop")).toBe("drop");
      expect(resolveVetoAction(3, 5, 7, "drop")).toBe("drop");
      expect(resolveVetoAction(3, 6, 7, "drop")).toBe("drop");
    });

    it("resolves picks at positions 3-4", () => {
      expect(resolveVetoAction(3, 3, 7, "pick")).toBe("pick");
      expect(resolveVetoAction(3, 4, 7, "pick")).toBe("pick");
    });

    it("resolves decider at position 7", () => {
      expect(resolveVetoAction(3, 7, 7, "pick")).toBe("decider");
    });
  });

  describe("with BO5 template", () => {
    it("resolves bans at positions 1-2", () => {
      expect(resolveVetoAction(5, 1, 7, "drop")).toBe("drop");
      expect(resolveVetoAction(5, 2, 7, "drop")).toBe("drop");
    });

    it("resolves picks at positions 3-6", () => {
      expect(resolveVetoAction(5, 3, 7, "pick")).toBe("pick");
      expect(resolveVetoAction(5, 4, 7, "pick")).toBe("pick");
      expect(resolveVetoAction(5, 5, 7, "pick")).toBe("pick");
      expect(resolveVetoAction(5, 6, 7, "pick")).toBe("pick");
    });

    it("resolves decider at position 7", () => {
      expect(resolveVetoAction(5, 7, 7, "pick")).toBe("decider");
    });
  });

  describe("fallback when totalSteps mismatches template length", () => {
    it("does not promote final pick → decider for BO1 with partial veto history", () => {
      expect(resolveVetoAction(1, 1, 2, "pick")).toBe("pick");
      expect(resolveVetoAction(1, 2, 2, "pick")).toBe("pick");
    });

    it("uses faceitAction when BO3 has only 2 steps", () => {
      expect(resolveVetoAction(3, 1, 2, "pick")).toBe("pick");
      expect(resolveVetoAction(3, 2, 2, "pick")).toBe("decider");
    });
  });

  describe("fallback for unknown best-of", () => {
    it("classifies last pick as decider", () => {
      expect(resolveVetoAction(7, 5, 5, "pick")).toBe("decider");
    });

    it("passes through drop for non-last position", () => {
      expect(resolveVetoAction(7, 3, 5, "drop")).toBe("drop");
    });

    it("passes through pick for non-last position", () => {
      expect(resolveVetoAction(7, 3, 5, "pick")).toBe("pick");
    });

    it("does not reclassify last drop as decider", () => {
      expect(resolveVetoAction(7, 5, 5, "drop")).toBe("drop");
    });
  });
});
