import { describe, expect, it } from "bun:test";
import {
  calculatePoints,
  calculatePositionPoints,
  pointsFromTable,
  splitPoints,
} from "../points-engine";
import type { PointsTable } from "../types";

describe("pointsFromTable", () => {
  const table: PointsTable = [
    { rank: 1, tieCount: 1, points: 5 },
    { rank: 1, tieCount: 2, points: 4 },
    { rank: 1, tieCount: 3, points: 3.33 },
    { rank: 2, tieCount: 1, points: 3 },
    { rank: 2, tieCount: 2, points: 2 },
    { rank: 3, tieCount: 1, points: 2 },
  ];

  it("returns points for outright first place", () => {
    expect(pointsFromTable(1, 1, table)).toBe(5);
  });

  it("returns points for two-way tie for first", () => {
    expect(pointsFromTable(1, 2, table)).toBe(4);
  });

  it("returns points for three-way tie for first", () => {
    expect(pointsFromTable(1, 3, table)).toBe(3.33);
  });

  it("returns points for second place", () => {
    expect(pointsFromTable(2, 1, table)).toBe(3);
  });

  it("returns 0 for missing entry", () => {
    expect(pointsFromTable(4, 1, table)).toBe(0);
  });
});

describe("calculatePoints", () => {
  it("calculates points with no junk or multipliers", () => {
    const result = calculatePoints(3, [], []);
    expect(result).toBe(3);
  });

  it("adds junk points", () => {
    const junk = [
      { name: "birdie", value: 1 },
      { name: "sandie", value: 1 },
    ];
    const result = calculatePoints(3, junk, []);
    expect(result).toBe(5); // 3 + 1 + 1
  });

  it("applies multipliers", () => {
    const multipliers = [{ name: "double", value: 2 }];
    const result = calculatePoints(3, [], multipliers);
    expect(result).toBe(6); // 3 * 2
  });

  it("adds junk then applies multipliers", () => {
    const junk = [{ name: "birdie", value: 1 }];
    const multipliers = [{ name: "birdie_bbq", value: 2 }];
    const result = calculatePoints(3, junk, multipliers);
    expect(result).toBe(8); // (3 + 1) * 2
  });

  it("stacks multiple multipliers", () => {
    const multipliers = [
      { name: "double", value: 2 },
      { name: "birdie_bbq", value: 2 },
    ];
    const result = calculatePoints(3, [], multipliers);
    expect(result).toBe(12); // 3 * 2 * 2
  });
});

describe("splitPoints", () => {
  it("returns 0 for empty array", () => {
    expect(splitPoints([])).toBe(0);
  });

  it("returns single value unchanged", () => {
    expect(splitPoints([5])).toBe(5);
  });

  it("splits two values evenly", () => {
    expect(splitPoints([3, 2])).toBe(2.5); // (3 + 2) / 2
  });

  it("splits three values evenly", () => {
    expect(splitPoints([5, 3, 2])).toBe(10 / 3); // (5 + 3 + 2) / 3
  });
});

describe("calculatePositionPoints", () => {
  // Points function: 1st=5, 2nd=3, 3rd=2, 4th+=1
  const pointsFn = (rank: number): number => {
    if (rank === 1) return 5;
    if (rank === 2) return 3;
    if (rank === 3) return 2;
    return 1;
  };

  it("returns full points for outright winner", () => {
    expect(calculatePositionPoints(1, 1, pointsFn)).toBe(5);
  });

  it("splits 1st and 2nd for two-way tie at first", () => {
    // Two players tied for first split 1st (5) and 2nd (3) = 8/2 = 4
    expect(calculatePositionPoints(1, 2, pointsFn)).toBe(4);
  });

  it("splits 1st, 2nd, 3rd for three-way tie at first", () => {
    // Three players tied split 5 + 3 + 2 = 10/3
    expect(calculatePositionPoints(1, 3, pointsFn)).toBeCloseTo(10 / 3);
  });

  it("returns points for non-tied positions", () => {
    expect(calculatePositionPoints(2, 1, pointsFn)).toBe(3);
    expect(calculatePositionPoints(3, 1, pointsFn)).toBe(2);
    expect(calculatePositionPoints(4, 1, pointsFn)).toBe(1);
  });
});
