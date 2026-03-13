import { describe, expect, test } from "bun:test";
import type { Tee } from "../schema/courses";
import { calculateCourseHandicap, formatCourseHandicap } from "./handicap";

// Helper to create a mock loaded Tee object with holes
function createMockTee(config: {
  ratings: {
    total?: { rating: number; slope: number; bogey: number };
    front?: { rating: number; slope: number; bogey: number };
    back?: { rating: number; slope: number; bogey: number };
  };
  holes?: { par: number }[];
}): Tee {
  // Default: 18 holes, all par 4 (total par 72)
  const holes = (
    config.holes ?? Array.from({ length: 18 }, () => ({ par: 4 }))
  ).map((h, i) => ({
    $isLoaded: true,
    par: h.par,
    handicap: i + 1,
    yards: 400,
    number: i + 1,
    id: `hole-${i + 1}`,
    meters: 365,
  }));
  // Mark the holes array itself as loaded (Jazz CoList pattern)
  Object.assign(holes, { $isLoaded: true });

  return {
    $isLoaded: true,
    holes,
    ratings: {
      $isLoaded: true,
      total: config.ratings.total
        ? { $isLoaded: true, ...config.ratings.total }
        : { $isLoaded: false },
      front: config.ratings.front
        ? { $isLoaded: true, ...config.ratings.front }
        : { $isLoaded: false },
      back: config.ratings.back
        ? { $isLoaded: true, ...config.ratings.back }
        : { $isLoaded: false },
    },
  } as unknown as Tee;
}

describe("calculateCourseHandicap", () => {
  // Course rating 72.8, par 72 → CR-Par = 0.8
  // Front rating 36.4, par 36 → CR-Par = 0.4
  // Back rating 36.4, par 36 → CR-Par = 0.4
  const mockTee = createMockTee({
    ratings: {
      total: { rating: 72.8, slope: 139, bogey: 96.5 },
      front: { rating: 36.4, slope: 138, bogey: 48.2 },
      back: { rating: 36.4, slope: 140, bogey: 48.3 },
    },
  });

  test("calculates course handicap for regular handicap index", () => {
    // 6.5 * (139 / 113) + (72.8 - 72) = 7.996 + 0.8 = 8.796 → 9
    expect(
      calculateCourseHandicap({
        handicapIndex: "6.5",
        tee: mockTee,
        holesPlayed: "all18",
      }),
    ).toBe(9);
  });

  test("calculates course handicap for plus handicap index", () => {
    // +1.5 → -1.5 * (139 / 113) + 0.8 = -1.845 + 0.8 = -1.045 → -1
    expect(
      calculateCourseHandicap({
        handicapIndex: "+1.5",
        tee: mockTee,
        holesPlayed: "all18",
      }),
    ).toBe(-1);
  });

  test("calculates course handicap for scratch golfer", () => {
    // 0 * (139 / 113) + 0.8 = 0.8 → 1
    expect(
      calculateCourseHandicap({
        handicapIndex: "0",
        tee: mockTee,
        holesPlayed: "all18",
      }),
    ).toBe(1);
  });

  test("calculates course handicap for high handicapper", () => {
    // 20.5 * (139 / 113) + 0.8 = 25.221 + 0.8 = 26.021 → 26
    expect(
      calculateCourseHandicap({
        handicapIndex: "20.5",
        tee: mockTee,
        holesPlayed: "all18",
      }),
    ).toBe(26);
  });

  test("uses front9 ratings when specified", () => {
    // 6.5 * (138 / 113) + (36.4 - 36) = 7.938 + 0.4 = 8.338 → 8
    expect(
      calculateCourseHandicap({
        handicapIndex: "6.5",
        tee: mockTee,
        holesPlayed: "front9",
      }),
    ).toBe(8);
  });

  test("uses back9 ratings when specified", () => {
    // 6.5 * (140 / 113) + (36.4 - 36) = 8.053 + 0.4 = 8.453 → 8
    expect(
      calculateCourseHandicap({
        handicapIndex: "6.5",
        tee: mockTee,
        holesPlayed: "back9",
      }),
    ).toBe(8);
  });

  test("returns null for invalid handicap index", () => {
    expect(
      calculateCourseHandicap({
        handicapIndex: "invalid",
        tee: mockTee,
      }),
    ).toBe(null);

    expect(
      calculateCourseHandicap({
        handicapIndex: "",
        tee: mockTee,
      }),
    ).toBe(null);
  });

  test("returns null when tee is not loaded", () => {
    const unloadedTee = { $isLoaded: false } as unknown as Tee;
    expect(
      calculateCourseHandicap({
        handicapIndex: "6.5",
        tee: unloadedTee,
      }),
    ).toBe(null);
  });

  test("returns null when ratings are not loaded", () => {
    const teeWithoutRatings = {
      $isLoaded: true,
      ratings: { $isLoaded: false },
    } as unknown as Tee;
    expect(
      calculateCourseHandicap({
        handicapIndex: "6.5",
        tee: teeWithoutRatings,
      }),
    ).toBe(null);
  });

  test("returns null when specific rating set is not loaded", () => {
    const teeWithOnlyTotal = createMockTee({
      ratings: {
        total: { rating: 72.8, slope: 139, bogey: 96.5 },
      },
    });

    // Should work for all18: 6.5 * (139/113) + 0.8 = 8.796 → 9
    expect(
      calculateCourseHandicap({
        handicapIndex: "6.5",
        tee: teeWithOnlyTotal,
        holesPlayed: "all18",
      }),
    ).toBe(9);

    // Should return null for front9 (ratings not loaded)
    expect(
      calculateCourseHandicap({
        handicapIndex: "6.5",
        tee: teeWithOnlyTotal,
        holesPlayed: "front9",
      }),
    ).toBe(null);
  });

  test("handles decimal handicap indexes correctly", () => {
    // 10.3 * (139 / 113) + 0.8 = 12.668 + 0.8 = 13.468 → 13
    expect(
      calculateCourseHandicap({
        handicapIndex: "10.3",
        tee: mockTee,
      }),
    ).toBe(13);
  });

  test("handles very low plus handicaps", () => {
    // +5.0 → -5.0 * (139 / 113) + 0.8 = -6.150 + 0.8 = -5.350 → -5
    expect(
      calculateCourseHandicap({
        handicapIndex: "+5.0",
        tee: mockTee,
      }),
    ).toBe(-5);
  });

  test("rounds half values correctly", () => {
    // rating = par → CR-Par = 0, so formula simplifies to HI * (slope/113)
    const testTee = createMockTee({
      ratings: {
        total: { rating: 72.0, slope: 113, bogey: 95.0 },
      },
    });

    // 0.5 * (113 / 113) + 0 = 0.5 → rounds to 1
    expect(
      calculateCourseHandicap({
        handicapIndex: "0.5",
        tee: testTee,
      }),
    ).toBe(1);

    // -0.5 * (113 / 113) + 0 = -0.5 → rounds to -0 (Math.round behavior for negatives)
    expect(
      calculateCourseHandicap({
        handicapIndex: "+0.5",
        tee: testTee,
      }),
    ).toBe(-0);
  });

  test("CR-Par adjustment shifts rounding boundary", () => {
    // Demonstrates the fix: without CR-Par, a 10.0 HI on slope 135 would be:
    //   10 * 135/113 = 11.947 → 12
    // With CR-Par of 1.5 (rating 73.5, par 72):
    //   10 * 135/113 + 1.5 = 13.447 → 13
    const tee = createMockTee({
      ratings: {
        total: { rating: 73.5, slope: 135, bogey: 97.0 },
      },
    });
    expect(
      calculateCourseHandicap({
        handicapIndex: "10.0",
        tee,
      }),
    ).toBe(13);
  });
});

describe("formatCourseHandicap", () => {
  test("formats positive handicaps as-is", () => {
    expect(formatCourseHandicap(8)).toBe("8");
    expect(formatCourseHandicap(15)).toBe("15");
    expect(formatCourseHandicap(0)).toBe("0");
  });

  test("formats negative handicaps with plus sign", () => {
    expect(formatCourseHandicap(-2)).toBe("+2");
    expect(formatCourseHandicap(-5)).toBe("+5");
    expect(formatCourseHandicap(-1)).toBe("+1");
  });

  test("returns empty string for null or undefined", () => {
    expect(formatCourseHandicap(null)).toBe("");
    expect(formatCourseHandicap(undefined)).toBe("");
  });

  test("handles zero correctly", () => {
    expect(formatCourseHandicap(0)).toBe("0");
  });

  test("handles large values", () => {
    expect(formatCourseHandicap(25)).toBe("25");
    expect(formatCourseHandicap(-10)).toBe("+10");
  });
});
