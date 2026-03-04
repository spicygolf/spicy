import { describe, expect, it } from "bun:test";
import type { CheckAutoPressConfig } from "../press";
import { checkAutoPress, createPressBet } from "../press";
import type { Scoreboard } from "../types";

// =============================================================================
// Helpers
// =============================================================================

/** Build a minimal scoreboard for match play with per-player net scores. */
function makeScoreboard(
  holesPlayed: string[],
  playerNets: Record<string, Record<string, number>>,
): Scoreboard {
  const holes: Scoreboard["holes"] = {};
  for (const holeNum of holesPlayed) {
    const players: Record<string, any> = {};
    for (const [playerId, nets] of Object.entries(playerNets)) {
      const net = nets[holeNum] ?? 0;
      players[playerId] = {
        gross: net,
        net,
        hasScore: nets[holeNum] !== undefined,
        scoreToPar: 0,
        netToPar: 0,
        pops: 0,
        points: 0,
        junk: [],
        multiplier: 1,
      };
    }
    holes[holeNum] = {
      holeInfo: { par: 4, handicapIndex: 1, yardage: 400 },
      players,
      teams: {},
    };
  }

  return {
    meta: {
      holesPlayed,
      playerCount: Object.keys(playerNets).length,
      holeCount: holesPlayed.length,
    },
    holes,
    cumulative: { players: {}, teams: {} },
  } as Scoreboard;
}

// =============================================================================
// createPressBet
// =============================================================================

describe("createPressBet", () => {
  it("generates correct name and display for first press", () => {
    const result = createPressBet({
      parentBetName: "front_match",
      parentDisp: "Front",
      parentScope: "front9",
      parentAmount: 10,
      currentHoleIndex: 3,
      pressNumber: 0,
      pressScope: "same",
      pressAmountRule: "fixed",
    });

    expect(result.name).toBe("press_1_front_match");
    expect(result.disp).toBe("Press 1 (Front)");
    expect(result.scope).toBe("front9");
    expect(result.scoringType).toBe("match");
    expect(result.splitType).toBe("winner_take_all");
    expect(result.amount).toBe(10);
    expect(result.startHoleIndex).toBe(3);
    expect(result.parentBetName).toBe("front_match");
  });

  it("generates correct name for second press", () => {
    const result = createPressBet({
      parentBetName: "back_match",
      parentDisp: "Back",
      parentScope: "back9",
      parentAmount: 10,
      currentHoleIndex: 12,
      pressNumber: 1,
      pressScope: "same",
      pressAmountRule: "fixed",
    });

    expect(result.name).toBe("press_2_back_match");
    expect(result.disp).toBe("Press 2 (Back)");
  });

  it("uses rest_of_nine scope when configured", () => {
    const result = createPressBet({
      parentBetName: "front_match",
      parentDisp: "Front",
      parentScope: "front9",
      parentAmount: 10,
      currentHoleIndex: 4,
      pressNumber: 0,
      pressScope: "rest_of_nine",
      pressAmountRule: "fixed",
    });

    expect(result.scope).toBe("rest_of_nine");
    expect(result.startHoleIndex).toBe(4);
  });

  it("uses rest_of_round scope when configured", () => {
    const result = createPressBet({
      parentBetName: "overall_match",
      parentDisp: "Overall",
      parentScope: "all18",
      parentAmount: 20,
      currentHoleIndex: 6,
      pressNumber: 0,
      pressScope: "rest_of_round",
      pressAmountRule: "fixed",
    });

    expect(result.scope).toBe("rest_of_round");
  });

  it("uses fixed amount (same as parent)", () => {
    const result = createPressBet({
      parentBetName: "front_match",
      parentDisp: "Front",
      parentScope: "front9",
      parentAmount: 10,
      currentHoleIndex: 3,
      pressNumber: 0,
      pressScope: "same",
      pressAmountRule: "fixed",
    });

    expect(result.amount).toBe(10);
  });

  it("doubles parent amount for first press with double rule", () => {
    const result = createPressBet({
      parentBetName: "front_match",
      parentDisp: "Front",
      parentScope: "front9",
      parentAmount: 10,
      currentHoleIndex: 3,
      pressNumber: 0,
      pressScope: "same",
      pressAmountRule: "double",
    });

    expect(result.amount).toBe(20);
  });

  it("doubles previous press amount for subsequent presses", () => {
    const result = createPressBet({
      parentBetName: "front_match",
      parentDisp: "Front",
      parentScope: "front9",
      parentAmount: 10,
      currentHoleIndex: 5,
      pressNumber: 1,
      pressScope: "same",
      pressAmountRule: "double",
      previousPressAmount: 20,
    });

    expect(result.amount).toBe(40);
  });
});

// =============================================================================
// checkAutoPress
// =============================================================================

describe("checkAutoPress", () => {
  const playerIds = ["alice", "bob"];

  // Alice wins holes 1,2,3 — she's 3 up through hole 3
  const scoreboard3up = makeScoreboard(
    ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
    {
      alice: { "1": 3, "2": 3, "3": 3, "4": 4, "5": 4 },
      bob: { "1": 5, "2": 5, "3": 5, "4": 4, "5": 4 },
    },
  );

  const parentBets = [
    {
      name: "front_match",
      disp: "Front",
      scope: "front9" as const,
      amount: 10,
    },
    { name: "back_match", disp: "Back", scope: "back9" as const, amount: 10 },
    {
      name: "overall_match",
      disp: "Overall",
      scope: "all18" as const,
      amount: 20,
    },
  ];

  function makeConfig(
    overrides: Partial<CheckAutoPressConfig>,
  ): CheckAutoPressConfig {
    return {
      playerIds,
      scoreboard: scoreboard3up,
      parentBets,
      existingPressNames: new Set(),
      currentHoleIndex: 2, // Through hole 3 (index 2)
      trigger: 2,
      maxPresses: 0,
      pressScope: "same",
      pressAmountRule: "fixed",
      existingPressesByParent: new Map(),
      ...overrides,
    };
  }

  it("fires press when player is down by >= trigger", () => {
    const results = checkAutoPress(makeConfig({}));

    // Should fire for front_match and overall_match (both have Alice 3-0)
    // back_match has no holes played yet
    const names = results.map((r) => r.pressBetProps.name);
    expect(names).toContain("press_1_front_match");
    expect(names).toContain("press_1_overall_match");
    expect(names).not.toContain("press_1_back_match");
  });

  it("does not fire when no player is down by trigger", () => {
    // Tied scoreboard — Alice and Bob each win 1 hole
    const tiedScoreboard = makeScoreboard(
      ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
      {
        alice: { "1": 3, "2": 5, "3": 4 },
        bob: { "1": 5, "2": 3, "3": 4 },
      },
    );

    const results = checkAutoPress(makeConfig({ scoreboard: tiedScoreboard }));
    expect(results).toHaveLength(0);
  });

  it("respects max presses cap", () => {
    const results = checkAutoPress(
      makeConfig({
        maxPresses: 1,
        existingPressesByParent: new Map([
          ["front_match", [{ name: "press_1_front_match", amount: 10 }]],
        ]),
      }),
    );

    // front_match already has 1 press and max is 1 — should not fire
    const names = results.map((r) => r.pressBetProps.name);
    expect(names).not.toContain("press_2_front_match");
    // overall_match still has no presses — should fire
    expect(names).toContain("press_1_overall_match");
  });

  it("does not create duplicate press at same hole", () => {
    const results = checkAutoPress(
      makeConfig({
        existingPressNames: new Set(["press_1_front_match"]),
        existingPressesByParent: new Map([
          ["front_match", [{ name: "press_1_front_match", amount: 10 }]],
        ]),
      }),
    );

    // press_2_front_match should fire since player is still down
    const frontPresses = results.filter(
      (r) => r.parentBetName === "front_match",
    );
    // If there's a second press, it should be press_2, not duplicate press_1
    for (const p of frontPresses) {
      expect(p.pressBetProps.name).not.toBe("press_1_front_match");
    }
  });

  it("uses double amount rule for press", () => {
    const results = checkAutoPress(
      makeConfig({
        pressAmountRule: "double",
      }),
    );

    const frontPress = results.find((r) => r.parentBetName === "front_match");
    expect(frontPress).toBeDefined();
    // First press doubles parent amount: 10 * 2 = 20
    expect(frontPress!.pressBetProps.amount).toBe(20);
  });

  it("uses rest_of_nine scope for press", () => {
    const results = checkAutoPress(
      makeConfig({
        pressScope: "rest_of_nine",
      }),
    );

    const frontPress = results.find((r) => r.parentBetName === "front_match");
    expect(frontPress).toBeDefined();
    expect(frontPress!.pressBetProps.scope).toBe("rest_of_nine");
    expect(frontPress!.pressBetProps.startHoleIndex).toBe(2);
  });

  it("only considers holes in parent scope", () => {
    // Use a scoreboard with back nine holes only scored
    const backNineScoreboard = makeScoreboard(
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"],
      {
        alice: { "10": 3, "11": 3, "12": 3 },
        bob: { "10": 5, "11": 5, "12": 5 },
      },
    );

    const results = checkAutoPress(
      makeConfig({
        scoreboard: backNineScoreboard,
        currentHoleIndex: 11, // Through hole 12 (play-order index 11)
      }),
    );

    // front_match: no scores entered on holes 1-9 — no press
    const names = results.map((r) => r.pressBetProps.name);
    expect(names).not.toContain("press_1_front_match");
    // back_match: Alice 3-0, should press
    expect(names).toContain("press_1_back_match");
  });

  it("handles unlimited presses (maxPresses = 0)", () => {
    const results = checkAutoPress(
      makeConfig({
        maxPresses: 0, // unlimited
        existingPressesByParent: new Map([
          [
            "front_match",
            [
              { name: "press_1_front_match", amount: 10 },
              { name: "press_2_front_match", amount: 10 },
              { name: "press_3_front_match", amount: 10 },
            ],
          ],
        ]),
        existingPressNames: new Set([
          "press_1_front_match",
          "press_2_front_match",
          "press_3_front_match",
        ]),
      }),
    );

    // Should still fire press_4_front_match
    const frontPresses = results.filter(
      (r) => r.parentBetName === "front_match",
    );
    expect(frontPresses).toHaveLength(1);
    expect(frontPresses[0]!.pressBetProps.name).toBe("press_4_front_match");
  });
});
