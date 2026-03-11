import { describe, expect, it } from "bun:test";
import type { CheckAutoPressConfig, PressBetInfo } from "../press";
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

/** Standard parent bets as PressBetInfo. */
const parentBets: PressBetInfo[] = [
  {
    name: "front_match",
    disp: "Front",
    scope: "front9",
    scoringType: "match",
    amount: 10,
  },
  {
    name: "back_match",
    disp: "Back",
    scope: "back9",
    scoringType: "match",
    amount: 10,
  },
  {
    name: "overall_match",
    disp: "Overall",
    scope: "all18",
    scoringType: "match",
    amount: 20,
  },
];

function makeConfig(
  overrides: Partial<CheckAutoPressConfig> & { allBets?: PressBetInfo[] },
): CheckAutoPressConfig {
  return {
    playerIds: ["alice", "bob"],
    scoreboard: makeScoreboard(["1", "2", "3", "4", "5", "6", "7", "8", "9"], {
      alice: { "1": 3, "2": 3, "3": 3, "4": 4, "5": 4 },
      bob: { "1": 5, "2": 5, "3": 5, "4": 4, "5": 4 },
    }),
    allBets: [...parentBets],
    currentHoleIndex: 2, // Through hole 3 (index 2)
    trigger: 2,
    maxPresses: 0,
    pressScope: "same",
    pressAmountRule: "fixed",
    ...overrides,
  };
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
  // Alice wins holes 1,2,3 — she's 3 up through hole 3
  const scoreboard3up = makeScoreboard(
    ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
    {
      alice: { "1": 3, "2": 3, "3": 3, "4": 4, "5": 4 },
      bob: { "1": 5, "2": 5, "3": 5, "4": 4, "5": 4 },
    },
  );

  it("fires press when player is down by >= trigger", () => {
    const results = checkAutoPress(makeConfig({}));

    // Should fire for front_match and overall_match (both have Alice 3-0)
    // back_match has no holes played yet (currentHoleIndex 2 < 9, back9 skipped)
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
    const allBets: PressBetInfo[] = [
      ...parentBets,
      {
        name: "press_1_front_match",
        disp: "Press 1 (Front)",
        scope: "front9",
        scoringType: "match",
        amount: 10,
        startHoleIndex: 1,
        parentBetName: "front_match",
      },
    ];

    const results = checkAutoPress(makeConfig({ maxPresses: 1, allBets }));

    // front_match already has 1 press and max is 1 — should not fire
    const names = results.map((r) => r.pressBetProps.name);
    expect(names).not.toContain("press_2_front_match");
    // overall_match still has no presses — should fire
    expect(names).toContain("press_1_overall_match");
  });

  it("is idempotent — does not create duplicate when press already exists", () => {
    // Parent already has press_1 — since parent is done, and press_1 needs
    // to be evaluated within its own scope. With Alice still 3-0 overall
    // and press_1 starting at hole 1, within press_1's scope Alice is also
    // ahead, so press_2 should fire.
    const allBets: PressBetInfo[] = [
      ...parentBets,
      {
        name: "press_1_front_match",
        disp: "Press 1 (Front)",
        scope: "front9",
        scoringType: "match",
        amount: 10,
        startHoleIndex: 1,
        parentBetName: "front_match",
      },
    ];

    const results = checkAutoPress(makeConfig({ allBets }));

    // Should fire press_2 (tail is press_1, and Alice is 2-up within it)
    const frontPresses = results.filter(
      (r) => r.parentBetName === "front_match",
    );
    expect(frontPresses).toHaveLength(1);
    expect(frontPresses[0]!.pressBetProps.name).toBe("press_2_front_match");
  });

  it("does not fire when tail press match state is not down by trigger", () => {
    // Press 1 starts at hole 3 — within its scope (holes 3+), Alice and Bob
    // are tied (both score 4 on holes 4,5)
    const allBets: PressBetInfo[] = [
      ...parentBets,
      {
        name: "press_1_front_match",
        disp: "Press 1 (Front)",
        scope: "front9",
        scoringType: "match",
        amount: 10,
        startHoleIndex: 3, // starts at hole 4 (index 3)
        parentBetName: "front_match",
      },
    ];

    const results = checkAutoPress(
      makeConfig({ allBets, currentHoleIndex: 4 }),
    );

    // Within press_1's scope (holes 4,5), they're tied — no press_2
    const frontPresses = results.filter(
      (r) => r.parentBetName === "front_match",
    );
    expect(frontPresses).toHaveLength(0);
  });

  it("uses double amount rule for press", () => {
    const results = checkAutoPress(makeConfig({ pressAmountRule: "double" }));

    const frontPress = results.find((r) => r.parentBetName === "front_match");
    expect(frontPress).toBeDefined();
    // First press doubles parent amount: 10 * 2 = 20
    expect(frontPress!.pressBetProps.amount).toBe(20);
  });

  it("uses rest_of_nine scope for press", () => {
    const results = checkAutoPress(makeConfig({ pressScope: "rest_of_nine" }));

    const frontPress = results.find((r) => r.parentBetName === "front_match");
    expect(frontPress).toBeDefined();
    expect(frontPress!.pressBetProps.scope).toBe("rest_of_nine");
    expect(frontPress!.pressBetProps.startHoleIndex).toBe(2);
  });

  it("only considers holes in parent scope", () => {
    // Back nine scores only — Alice 3-0 on holes 10-12
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

    const names = results.map((r) => r.pressBetProps.name);
    // front_match: currentHoleIndex >= 9, scope completed — skipped
    expect(names).not.toContain("press_1_front_match");
    // back_match: Alice 3-0 in back nine, should press
    expect(names).toContain("press_1_back_match");
  });

  it("skips front9 bets when on back nine", () => {
    const results = checkAutoPress(
      makeConfig({
        scoreboard: scoreboard3up,
        currentHoleIndex: 10, // On back nine
      }),
    );

    const names = results.map((r) => r.pressBetProps.name);
    // front_match scope is completed — no press
    expect(names).not.toContain("press_1_front_match");
  });

  it("chain: press 2 fires when 2-down within press 1 scope", () => {
    // Alice wins holes 1-4 (4-0 up). Press 1 started at hole 2 (index 1).
    // Within press 1 scope (holes 2-9), Alice won holes 2,3,4 = 3-0 → 2-down for Bob
    const scoreboard4up = makeScoreboard(
      ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
      {
        alice: { "1": 3, "2": 3, "3": 3, "4": 3, "5": 4 },
        bob: { "1": 5, "2": 5, "3": 5, "4": 5, "5": 4 },
      },
    );

    const allBets: PressBetInfo[] = [
      ...parentBets,
      {
        name: "press_1_front_match",
        disp: "Press 1 (Front)",
        scope: "front9",
        scoringType: "match",
        amount: 10,
        startHoleIndex: 2, // started at hole 3
        parentBetName: "front_match",
      },
    ];

    const results = checkAutoPress(
      makeConfig({
        scoreboard: scoreboard4up,
        allBets,
        currentHoleIndex: 3, // through hole 4
      }),
    );

    const frontPresses = results.filter(
      (r) => r.parentBetName === "front_match",
    );
    expect(frontPresses).toHaveLength(1);
    expect(frontPresses[0]!.pressBetProps.name).toBe("press_2_front_match");
  });

  it("idempotent: calling twice returns no new presses", () => {
    const config = makeConfig({});
    const results1 = checkAutoPress(config);
    expect(results1.length).toBeGreaterThan(0);

    // Simulate adding the created presses to allBets
    const updatedBets: PressBetInfo[] = [
      ...config.allBets,
      ...results1.map((r) => ({
        name: r.pressBetProps.name,
        disp: r.pressBetProps.disp,
        scope: r.pressBetProps.scope,
        scoringType: "match" as const,
        amount: r.pressBetProps.amount,
        startHoleIndex: r.pressBetProps.startHoleIndex,
        parentBetName: r.pressBetProps.parentBetName,
      })),
    ];

    // Call again — tails are now press_1 bets, and within their scope
    // Alice is still ahead. They may fire press_2 if she's 2-down within
    // the press scope. But we need to check the specific match state.
    // With press_1_front starting at index 2, within its scope (holes 3+)
    // only holes 3 are scored through currentHoleIndex=2, and Alice won hole 3.
    // That's only 1-0, not >= trigger(2), so no new press.
    const results2 = checkAutoPress({ ...config, allBets: updatedBets });

    // Press 1 started at currentHoleIndex=2. Within front9 scope from index 2,
    // only hole 3 (index 2) is relevant. Alice won it 1-0 — not >= 2 trigger.
    const frontPresses2 = results2.filter(
      (r) => r.parentBetName === "front_match",
    );
    expect(frontPresses2).toHaveLength(0);
  });
});
