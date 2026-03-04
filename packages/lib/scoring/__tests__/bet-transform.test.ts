import { describe, expect, it } from "bun:test";
import { transformGameSpec } from "../../src/transform/gamespec";
import type { GameSpecV03 } from "../../src/transform/legacy-types";

describe("transformGameSpec with bets", () => {
  const baseSpec: GameSpecV03 = {
    _key: "test_game",
    name: "test_game",
    disp: "Test Game",
    version: 1,
    status: "dev",
    type: "points",
    min_players: 2,
    location_type: "local",
    options: [],
  };

  it("transforms bet options into the options array", () => {
    const spec: GameSpecV03 = {
      ...baseSpec,
      bets: [
        {
          name: "front_quota",
          disp: "Front",
          scope: "front9",
          scoringType: "quota",
          splitType: "places",
          pct: 25,
        },
        {
          name: "skins_all",
          disp: "Skins",
          scope: "all18",
          scoringType: "skins",
          splitType: "per_unit",
          pct: 25,
        },
      ],
    };

    const result = transformGameSpec(spec);
    expect(result.options).toBeDefined();

    const betOptions = result.options?.filter((o) => o.type === "bet");
    expect(betOptions).toHaveLength(2);

    const front = betOptions?.find((o) => o.name === "front_quota");
    expect(front).toMatchObject({
      type: "bet",
      name: "front_quota",
      scope: "front9",
      pct: 25,
    });

    const skins = betOptions?.find((o) => o.name === "skins_all");
    expect(skins).toMatchObject({
      type: "bet",
      name: "skins_all",
      scoringType: "skins",
    });
  });

  it("transforms stakes-style bets with amount", () => {
    const spec: GameSpecV03 = {
      ...baseSpec,
      bets: [
        {
          name: "front_match",
          disp: "Front",
          scope: "front9",
          scoringType: "match",
          splitType: "winner_take_all",
          amount: 10,
        },
      ],
    };

    const result = transformGameSpec(spec);
    const betOptions = result.options?.filter((o) => o.type === "bet");
    expect(betOptions).toHaveLength(1);

    const front = betOptions?.[0];
    expect(front).toMatchObject({
      type: "bet",
      amount: 10,
    });
    expect(front).not.toHaveProperty("pct");
  });

  it("preserves non-bet options alongside bets", () => {
    const spec: GameSpecV03 = {
      ...baseSpec,
      options: [{ name: "buy_in", disp: "Buy-In", type: "num", default: 40 }],
      junk: [{ name: "birdie", disp: "Birdie", type: "dot", value: 1 }],
      bets: [
        {
          name: "front_quota",
          disp: "Front",
          scope: "front9",
          scoringType: "quota",
          splitType: "places",
          pct: 25,
        },
      ],
    };

    const result = transformGameSpec(spec);
    expect(result.options).toBeDefined();

    const gameOpts = result.options?.filter((o) => o.type === "game");
    const junkOpts = result.options?.filter((o) => o.type === "junk");
    const betOpts = result.options?.filter((o) => o.type === "bet");

    expect(gameOpts).toHaveLength(1);
    expect(junkOpts).toHaveLength(1);
    expect(betOpts).toHaveLength(1);
  });

  it("handles spec with no bets", () => {
    const result = transformGameSpec(baseSpec);
    const betOptions = result.options?.filter((o) => o.type === "bet");
    expect(betOptions ?? []).toHaveLength(0);
  });

  it("handles empty bets array", () => {
    const spec: GameSpecV03 = {
      ...baseSpec,
      bets: [],
    };
    const result = transformGameSpec(spec);
    const betOptions = result.options?.filter((o) => o.type === "bet");
    expect(betOptions ?? []).toHaveLength(0);
  });
});
