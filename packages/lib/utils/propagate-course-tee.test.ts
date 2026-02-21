import { describe, expect, it } from "bun:test";
import type {
  Course,
  Game,
  Player,
  Round,
  RoundToGame,
  Tee,
} from "spicylib/schema";
import {
  applyExistingCourseTeeToRound,
  findExistingCourseTeeInGame,
  isTeeCompatibleWithGender,
  propagateCourseTeeToPlayers,
} from "./propagate-course-tee";

// =============================================================================
// Mock Helpers
// =============================================================================

interface MockRoundOptions {
  playerId: string;
  hasCourse?: boolean;
  hasTee?: boolean;
  course?: Partial<Course>;
  tee?: Partial<Tee>;
}

interface MockPlayerOptions {
  id: string;
  gender: "M" | "F";
}

function createMockTee(gender: "M" | "F" | "Mixed"): Partial<Tee> {
  return {
    $isLoaded: true,
    gender,
  };
}

function createMockCourse(): Partial<Course> {
  return {
    $isLoaded: true,
    name: "Test Course",
  };
}

function createMockRound(options: MockRoundOptions): Partial<Round> {
  const setCalls: Array<{ field: string; value: unknown }> = [];

  return {
    $isLoaded: true,
    playerId: options.playerId,
    course: options.course as Course | undefined,
    tee: options.tee as Tee | undefined,
    $jazz: {
      has: (field: string) => {
        if (field === "course") return options.hasCourse ?? false;
        if (field === "tee") return options.hasTee ?? false;
        return false;
      },
      set: (field: string, value: unknown) => {
        setCalls.push({ field, value });
      },
    },
    // Expose for test assertions
    _setCalls: setCalls,
  } as unknown as Partial<Round>;
}

function createMockRoundToGame(round: Partial<Round>): Partial<RoundToGame> {
  return {
    $isLoaded: true,
    round: round as Round,
  };
}

function createMockPlayer(options: MockPlayerOptions): Partial<Player> {
  return {
    $isLoaded: true,
    gender: options.gender,
    $jazz: {
      id: options.id,
    },
  } as unknown as Partial<Player>;
}

function createMockGame(options: {
  rounds?: Array<Partial<RoundToGame>>;
  players?: Array<Partial<Player>>;
}): Partial<Game> {
  return {
    $isLoaded: true,
    rounds: {
      $isLoaded: true,
      [Symbol.iterator]: function* () {
        for (const rtg of options.rounds ?? []) {
          yield rtg;
        }
      },
    },
    players: {
      $isLoaded: true,
      [Symbol.iterator]: function* () {
        for (const p of options.players ?? []) {
          yield p;
        }
      },
    },
  } as unknown as Partial<Game>;
}

// =============================================================================
// Tests: isTeeCompatibleWithGender
// =============================================================================

describe("isTeeCompatibleWithGender", () => {
  describe("Mixed tees", () => {
    it("allows male players", () => {
      expect(isTeeCompatibleWithGender("Mixed", "M")).toBe(true);
    });

    it("allows female players", () => {
      expect(isTeeCompatibleWithGender("Mixed", "F")).toBe(true);
    });
  });

  describe("Male tees", () => {
    it("allows male players", () => {
      expect(isTeeCompatibleWithGender("M", "M")).toBe(true);
    });

    it("rejects female players", () => {
      expect(isTeeCompatibleWithGender("M", "F")).toBe(false);
    });
  });

  describe("Female tees", () => {
    it("allows female players", () => {
      expect(isTeeCompatibleWithGender("F", "F")).toBe(true);
    });

    it("rejects male players", () => {
      expect(isTeeCompatibleWithGender("F", "M")).toBe(false);
    });
  });
});

// =============================================================================
// Tests: findExistingCourseTeeInGame
// =============================================================================

describe("findExistingCourseTeeInGame", () => {
  it("returns null for unloaded game", () => {
    const game = { $isLoaded: false } as unknown as Game;
    expect(findExistingCourseTeeInGame(game)).toBeNull();
  });

  it("returns null for game with no rounds", () => {
    const game = createMockGame({ rounds: [] });
    expect(findExistingCourseTeeInGame(game as Game)).toBeNull();
  });

  it("returns null when no rounds have course/tee set", () => {
    const round = createMockRound({
      playerId: "player1",
      hasCourse: false,
      hasTee: false,
    });
    const game = createMockGame({
      rounds: [createMockRoundToGame(round)],
    });

    expect(findExistingCourseTeeInGame(game as Game)).toBeNull();
  });

  it("returns null when round has course but not tee", () => {
    const round = createMockRound({
      playerId: "player1",
      hasCourse: true,
      hasTee: false,
      course: createMockCourse(),
    });
    const game = createMockGame({
      rounds: [createMockRoundToGame(round)],
    });

    expect(findExistingCourseTeeInGame(game as Game)).toBeNull();
  });

  it("returns course/tee when both are set and loaded", () => {
    const course = createMockCourse();
    const tee = createMockTee("Mixed");
    const round = createMockRound({
      playerId: "player1",
      hasCourse: true,
      hasTee: true,
      course,
      tee,
    });
    const game = createMockGame({
      rounds: [createMockRoundToGame(round)],
    });

    const result = findExistingCourseTeeInGame(game as Game);
    expect(result).not.toBeNull();
    expect(result?.course).toBe(course);
    expect(result?.tee).toBe(tee);
  });

  it("returns first round with course/tee when multiple exist", () => {
    const course1 = { ...createMockCourse(), name: "Course 1" };
    const tee1 = createMockTee("M");
    const round1 = createMockRound({
      playerId: "player1",
      hasCourse: true,
      hasTee: true,
      course: course1,
      tee: tee1,
    });

    const course2 = { ...createMockCourse(), name: "Course 2" };
    const tee2 = createMockTee("F");
    const round2 = createMockRound({
      playerId: "player2",
      hasCourse: true,
      hasTee: true,
      course: course2,
      tee: tee2,
    });

    const game = createMockGame({
      rounds: [createMockRoundToGame(round1), createMockRoundToGame(round2)],
    });

    const result = findExistingCourseTeeInGame(game as Game);
    expect(result?.course).toBe(course1);
    expect(result?.tee).toBe(tee1);
  });
});

// =============================================================================
// Tests: propagateCourseTeeToPlayers
// =============================================================================

describe("propagateCourseTeeToPlayers", () => {
  it("returns 0 for unloaded game", () => {
    const game = { $isLoaded: false } as unknown as Game;
    const course = createMockCourse() as Course;
    const tee = createMockTee("Mixed") as Tee;

    expect(propagateCourseTeeToPlayers(game, course, tee)).toBe(0);
  });

  it("returns 0 for unloaded course", () => {
    const game = createMockGame({ rounds: [], players: [] }) as Game;
    const course = { $isLoaded: false } as unknown as Course;
    const tee = createMockTee("Mixed") as Tee;

    expect(propagateCourseTeeToPlayers(game, course, tee)).toBe(0);
  });

  it("skips rounds that already have course/tee", () => {
    const existingCourse = createMockCourse();
    const existingTee = createMockTee("M");
    const round = createMockRound({
      playerId: "player1",
      hasCourse: true,
      hasTee: true,
      course: existingCourse,
      tee: existingTee,
    });
    const player = createMockPlayer({ id: "player1", gender: "M" });
    const game = createMockGame({
      rounds: [createMockRoundToGame(round)],
      players: [player],
    });

    const newCourse = createMockCourse() as Course;
    const newTee = createMockTee("Mixed") as Tee;

    const count = propagateCourseTeeToPlayers(game as Game, newCourse, newTee);
    expect(count).toBe(0);
    expect((round as { _setCalls: unknown[] })._setCalls).toHaveLength(0);
  });

  it("skips excluded player", () => {
    const round = createMockRound({
      playerId: "player1",
      hasCourse: false,
      hasTee: false,
    });
    const player = createMockPlayer({ id: "player1", gender: "M" });
    const game = createMockGame({
      rounds: [createMockRoundToGame(round)],
      players: [player],
    });

    const course = createMockCourse() as Course;
    const tee = createMockTee("Mixed") as Tee;

    const count = propagateCourseTeeToPlayers(
      game as Game,
      course,
      tee,
      "player1",
    );
    expect(count).toBe(0);
  });

  it("skips rounds with incompatible gender", () => {
    const round = createMockRound({
      playerId: "player1",
      hasCourse: false,
      hasTee: false,
    });
    const player = createMockPlayer({ id: "player1", gender: "F" });
    const game = createMockGame({
      rounds: [createMockRoundToGame(round)],
      players: [player],
    });

    const course = createMockCourse() as Course;
    const tee = createMockTee("M") as Tee; // Male tee, female player

    const count = propagateCourseTeeToPlayers(game as Game, course, tee);
    expect(count).toBe(0);
  });

  it("applies course/tee to compatible rounds", () => {
    const round = createMockRound({
      playerId: "player1",
      hasCourse: false,
      hasTee: false,
    });
    const player = createMockPlayer({ id: "player1", gender: "M" });
    const game = createMockGame({
      rounds: [createMockRoundToGame(round)],
      players: [player],
    });

    const course = createMockCourse() as Course;
    const tee = createMockTee("Mixed") as Tee;

    const count = propagateCourseTeeToPlayers(game as Game, course, tee);
    expect(count).toBe(1);

    const setCalls = (
      round as { _setCalls: Array<{ field: string; value: unknown }> }
    )._setCalls;
    expect(setCalls).toHaveLength(2);
    expect(setCalls[0]).toEqual({ field: "course", value: course });
    expect(setCalls[1]).toEqual({ field: "tee", value: tee });
  });

  it("applies to multiple compatible rounds", () => {
    const round1 = createMockRound({
      playerId: "player1",
      hasCourse: false,
      hasTee: false,
    });
    const round2 = createMockRound({
      playerId: "player2",
      hasCourse: false,
      hasTee: false,
    });
    const player1 = createMockPlayer({ id: "player1", gender: "M" });
    const player2 = createMockPlayer({ id: "player2", gender: "F" });
    const game = createMockGame({
      rounds: [createMockRoundToGame(round1), createMockRoundToGame(round2)],
      players: [player1, player2],
    });

    const course = createMockCourse() as Course;
    const tee = createMockTee("Mixed") as Tee; // Compatible with both

    const count = propagateCourseTeeToPlayers(game as Game, course, tee);
    expect(count).toBe(2);
  });

  it("only applies to gender-compatible rounds with gendered tee", () => {
    const round1 = createMockRound({
      playerId: "player1",
      hasCourse: false,
      hasTee: false,
    });
    const round2 = createMockRound({
      playerId: "player2",
      hasCourse: false,
      hasTee: false,
    });
    const player1 = createMockPlayer({ id: "player1", gender: "M" });
    const player2 = createMockPlayer({ id: "player2", gender: "F" });
    const game = createMockGame({
      rounds: [createMockRoundToGame(round1), createMockRoundToGame(round2)],
      players: [player1, player2],
    });

    const course = createMockCourse() as Course;
    const tee = createMockTee("M") as Tee; // Only compatible with male

    const count = propagateCourseTeeToPlayers(game as Game, course, tee);
    expect(count).toBe(1);

    // Only round1 should have set calls
    expect((round1 as { _setCalls: unknown[] })._setCalls).toHaveLength(2);
    expect((round2 as { _setCalls: unknown[] })._setCalls).toHaveLength(0);
  });
});

// =============================================================================
// Tests: applyExistingCourseTeeToRound
// =============================================================================

describe("applyExistingCourseTeeToRound", () => {
  it("returns false for unloaded game", () => {
    const game = { $isLoaded: false } as unknown as Game;
    const round = createMockRound({ playerId: "player1" }) as Round;
    const player = createMockPlayer({ id: "player1", gender: "M" }) as Player;

    expect(applyExistingCourseTeeToRound(game, round, player)).toBe(false);
  });

  it("returns false for unloaded round", () => {
    const game = createMockGame({ rounds: [], players: [] }) as Game;
    const round = { $isLoaded: false } as unknown as Round;
    const player = createMockPlayer({ id: "player1", gender: "M" }) as Player;

    expect(applyExistingCourseTeeToRound(game, round, player)).toBe(false);
  });

  it("returns false when no existing course/tee in game", () => {
    const emptyRound = createMockRound({
      playerId: "other",
      hasCourse: false,
      hasTee: false,
    });
    const game = createMockGame({
      rounds: [createMockRoundToGame(emptyRound)],
      players: [],
    }) as Game;

    const round = createMockRound({ playerId: "player1" }) as Round;
    const player = createMockPlayer({ id: "player1", gender: "M" }) as Player;

    expect(applyExistingCourseTeeToRound(game, round, player)).toBe(false);
  });

  it("returns false when tee gender is incompatible", () => {
    const existingCourse = createMockCourse();
    const existingTee = createMockTee("M"); // Male tee
    const existingRound = createMockRound({
      playerId: "other",
      hasCourse: true,
      hasTee: true,
      course: existingCourse,
      tee: existingTee,
    });
    const game = createMockGame({
      rounds: [createMockRoundToGame(existingRound)],
      players: [],
    }) as Game;

    const round = createMockRound({ playerId: "player1" }) as Round;
    const player = createMockPlayer({ id: "player1", gender: "F" }) as Player; // Female player

    expect(applyExistingCourseTeeToRound(game, round, player)).toBe(false);
  });

  it("applies existing course/tee when compatible", () => {
    const existingCourse = createMockCourse();
    const existingTee = createMockTee("Mixed");
    const existingRound = createMockRound({
      playerId: "other",
      hasCourse: true,
      hasTee: true,
      course: existingCourse,
      tee: existingTee,
    });
    const game = createMockGame({
      rounds: [createMockRoundToGame(existingRound)],
      players: [],
    }) as Game;

    const round = createMockRound({ playerId: "player1" });
    const player = createMockPlayer({ id: "player1", gender: "M" }) as Player;

    const result = applyExistingCourseTeeToRound(game, round as Round, player);
    expect(result).toBe(true);

    const setCalls = (
      round as { _setCalls: Array<{ field: string; value: unknown }> }
    )._setCalls;
    expect(setCalls).toHaveLength(2);
    expect(setCalls[0]).toEqual({ field: "course", value: existingCourse });
    expect(setCalls[1]).toEqual({ field: "tee", value: existingTee });
  });

  it("applies gendered tee to matching gender player", () => {
    const existingCourse = createMockCourse();
    const existingTee = createMockTee("F"); // Female tee
    const existingRound = createMockRound({
      playerId: "other",
      hasCourse: true,
      hasTee: true,
      course: existingCourse,
      tee: existingTee,
    });
    const game = createMockGame({
      rounds: [createMockRoundToGame(existingRound)],
      players: [],
    }) as Game;

    const round = createMockRound({ playerId: "player1" });
    const player = createMockPlayer({ id: "player1", gender: "F" }) as Player; // Female player

    const result = applyExistingCourseTeeToRound(game, round as Round, player);
    expect(result).toBe(true);
  });
});
