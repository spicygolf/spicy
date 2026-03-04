import { describe, expect, it } from "bun:test";
import { BetOptionSchema, OptionSchema } from "../../schema/options";

describe("BetOptionSchema", () => {
  it("validates a pool-style bet option", () => {
    const result = BetOptionSchema.safeParse({
      name: "front_quota",
      disp: "Front",
      type: "bet",
      version: "1",
      scope: "front9",
      scoringType: "quota",
      splitType: "places",
      pct: 25,
    });
    expect(result.success).toBe(true);
  });

  it("validates a stakes-style bet option", () => {
    const result = BetOptionSchema.safeParse({
      name: "front_match",
      disp: "Front",
      type: "bet",
      version: "1",
      scope: "front9",
      scoringType: "match",
      splitType: "winner_take_all",
      amount: 10,
    });
    expect(result.success).toBe(true);
  });

  it("allows both pct and amount to be optional", () => {
    const result = BetOptionSchema.safeParse({
      name: "test",
      disp: "Test",
      type: "bet",
      version: "1",
      scope: "all18",
      scoringType: "quota",
      splitType: "places",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid scope", () => {
    const result = BetOptionSchema.safeParse({
      name: "test",
      disp: "Test",
      type: "bet",
      version: "1",
      scope: "invalid_scope",
      scoringType: "quota",
      splitType: "places",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid scoringType", () => {
    const result = BetOptionSchema.safeParse({
      name: "test",
      disp: "Test",
      type: "bet",
      version: "1",
      scope: "front9",
      scoringType: "invalid",
      splitType: "places",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid splitType", () => {
    const result = BetOptionSchema.safeParse({
      name: "test",
      disp: "Test",
      type: "bet",
      version: "1",
      scope: "front9",
      scoringType: "quota",
      splitType: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("parses as part of OptionSchema discriminated union", () => {
    const result = OptionSchema.safeParse({
      name: "skins_all",
      disp: "Skins",
      type: "bet",
      version: "1",
      scope: "all18",
      scoringType: "skins",
      splitType: "per_unit",
      pct: 25,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("bet");
    }
  });

  it("allows all valid scope values", () => {
    for (const scope of ["front9", "back9", "all18"] as const) {
      const result = BetOptionSchema.safeParse({
        name: "test",
        disp: "Test",
        type: "bet",
        version: "1",
        scope,
        scoringType: "quota",
        splitType: "places",
      });
      expect(result.success).toBe(true);
    }
  });

  it("allows all valid scoringType values", () => {
    for (const scoringType of ["quota", "skins", "points", "match"] as const) {
      const result = BetOptionSchema.safeParse({
        name: "test",
        disp: "Test",
        type: "bet",
        version: "1",
        scope: "all18",
        scoringType,
        splitType: "places",
      });
      expect(result.success).toBe(true);
    }
  });

  it("allows all valid splitType values", () => {
    for (const splitType of [
      "places",
      "per_unit",
      "winner_take_all",
    ] as const) {
      const result = BetOptionSchema.safeParse({
        name: "test",
        disp: "Test",
        type: "bet",
        version: "1",
        scope: "all18",
        scoringType: "quota",
        splitType,
      });
      expect(result.success).toBe(true);
    }
  });
});
