import { describe, expect, test } from "bun:test";
import type { Tee } from "../schema/courses";
import { calculateCourseHandicap, formatCourseHandicap } from "./handicap";

// Helper to create a mock loaded Tee object
function createMockTee(ratings: {
  total?: { rating: number; slope: number; bogey: number };
  front?: { rating: number; slope: number; bogey: number };
  back?: { rating: number; slope: number; bogey: number };
}): Tee {
  return {
    $isLoaded: true,
    ratings: {
      $isLoaded: true,
      total: ratings.total
        ? { $isLoaded: true, ...ratings.total }
        : { $isLoaded: false },
      front: ratings.front
        ? { $isLoaded: true, ...ratings.front }
        : { $isLoaded: false },
      back: ratings.back
        ? { $isLoaded: true, ...ratings.back }
        : { $isLoaded: false },
    },
  } as unknown as Tee;
}

describe("calculateCourseHandicap", () => {
  const mockTee = createMockTee({
    total: { rating: 72.8, slope: 139, bogey: 96.5 },
    front: { rating: 36.4, slope: 138, bogey: 48.2 },
    back: { rating: 36.4, slope: 140, bogey: 48.3 },
  });

  test("calculates course handicap for regular handicap index", () => {
    // 6.5 * (139 / 113) = 7.998... -> rounds to 8
    expect(
      calculateCourseHandicap({
        handicapIndex: "6.5",
        tee: mockTee,
        holesPlayed: "all18",
      }),
    ).toBe(8);
  });

  test("calculates course handicap for plus handicap index", () => {
    // +1.5 stored as -1.5, so -1.5 * (139 / 113) = -1.845... -> rounds to -2
    expect(
      calculateCourseHandicap({
        handicapIndex: "+1.5",
        tee: mockTee,
        holesPlayed: "all18",
      }),
    ).toBe(-2);
  });

  test("calculates course handicap for scratch golfer", () => {
    // 0 * (139 / 113) = 0
    expect(
      calculateCourseHandicap({
        handicapIndex: "0",
        tee: mockTee,
        holesPlayed: "all18",
      }),
    ).toBe(0);
  });

  test("calculates course handicap for high handicapper", () => {
    // 20.5 * (139 / 113) = 25.219... -> rounds to 25
    expect(
      calculateCourseHandicap({
        handicapIndex: "20.5",
        tee: mockTee,
        holesPlayed: "all18",
      }),
    ).toBe(25);
  });

  test("uses front9 ratings when specified", () => {
    // 6.5 * (138 / 113) = 7.938... -> rounds to 8
    expect(
      calculateCourseHandicap({
        handicapIndex: "6.5",
        tee: mockTee,
        holesPlayed: "front9",
      }),
    ).toBe(8);
  });

  test("uses back9 ratings when specified", () => {
    // 6.5 * (140 / 113) = 8.053... -> rounds to 8
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
      total: { rating: 72.8, slope: 139, bogey: 96.5 },
    });

    // Should work for all18
    expect(
      calculateCourseHandicap({
        handicapIndex: "6.5",
        tee: teeWithOnlyTotal,
        holesPlayed: "all18",
      }),
    ).toBe(8);

    // Should return null for front9 (not loaded)
    expect(
      calculateCourseHandicap({
        handicapIndex: "6.5",
        tee: teeWithOnlyTotal,
        holesPlayed: "front9",
      }),
    ).toBe(null);
  });

  test("handles decimal handicap indexes correctly", () => {
    // 10.3 * (139 / 113) = 12.668... -> rounds to 13
    expect(
      calculateCourseHandicap({
        handicapIndex: "10.3",
        tee: mockTee,
      }),
    ).toBe(13);
  });

  test("handles very low plus handicaps", () => {
    // +5.0 -> -5.0 * (139 / 113) = -6.150... -> rounds to -6
    expect(
      calculateCourseHandicap({
        handicapIndex: "+5.0",
        tee: mockTee,
      }),
    ).toBe(-6);
  });

  test("rounds half values correctly", () => {
    // Test rounding: 0.5 should round to 1 (Math.round behavior)
    const testTee = createMockTee({
      total: { rating: 72.0, slope: 113, bogey: 95.0 },
    });

    // 0.5 * (113 / 113) = 0.5 -> rounds to 1
    expect(
      calculateCourseHandicap({
        handicapIndex: "0.5",
        tee: testTee,
      }),
    ).toBe(1);

    // -0.5 * (113 / 113) = -0.5 -> rounds to -0 (Math.round behavior for negatives)
    // Note: JavaScript has -0 and +0, Math.round(-0.5) = -0
    expect(
      calculateCourseHandicap({
        handicapIndex: "+0.5",
        tee: testTee,
      }),
    ).toBe(-0);
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
