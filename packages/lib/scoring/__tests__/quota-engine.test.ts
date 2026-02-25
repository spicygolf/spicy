import { describe, expect, it } from "bun:test";
import {
  calculateNineHoleQuotas,
  calculateQuota,
  calculateQuotaPerformance,
} from "../quota-engine";

describe("calculateQuota", () => {
  it("returns 36 for scratch golfer", () => {
    expect(calculateQuota(0)).toBe(36);
  });

  it("returns 26 for 10-handicap", () => {
    expect(calculateQuota(10)).toBe(26);
  });

  it("returns 29 for 7-handicap", () => {
    expect(calculateQuota(7)).toBe(29);
  });

  it("returns 40 for plus-4 handicap", () => {
    expect(calculateQuota(-4)).toBe(40);
  });

  it("returns 18 for 18-handicap", () => {
    expect(calculateQuota(18)).toBe(18);
  });
});

describe("calculateNineHoleQuotas", () => {
  it("splits even quota evenly", () => {
    const result = calculateNineHoleQuotas({ totalQuota: 28 });
    expect(result).toEqual({ front: 14, back: 14 });
  });

  it("splits quota 36 (scratch) evenly", () => {
    const result = calculateNineHoleQuotas({ totalQuota: 36 });
    expect(result).toEqual({ front: 18, back: 18 });
  });

  it("gives extra point to easier nine when front is harder (higher slope)", () => {
    // Front slope 140 > back slope 130 → front is harder → front gets 14, back gets 15
    const result = calculateNineHoleQuotas({
      totalQuota: 29,
      frontSlope: 140,
      backSlope: 130,
    });
    expect(result).toEqual({ front: 14, back: 15 });
  });

  it("gives extra point to easier nine when back is harder (higher slope)", () => {
    // Back slope 140 > front slope 130 → back is harder → back gets 14, front gets 15
    const result = calculateNineHoleQuotas({
      totalQuota: 29,
      frontSlope: 130,
      backSlope: 140,
    });
    expect(result).toEqual({ front: 15, back: 14 });
  });

  it("gives remainder to back when slopes are equal", () => {
    const result = calculateNineHoleQuotas({
      totalQuota: 29,
      frontSlope: 135,
      backSlope: 135,
    });
    expect(result).toEqual({ front: 14, back: 15 });
  });

  it("gives remainder to back when slopes are not provided", () => {
    const result = calculateNineHoleQuotas({ totalQuota: 29 });
    expect(result).toEqual({ front: 14, back: 15 });
  });

  it("handles plus handicap quota (above 36)", () => {
    // Plus-4 handicap: quota = 40, even split
    const result = calculateNineHoleQuotas({ totalQuota: 40 });
    expect(result).toEqual({ front: 20, back: 20 });
  });

  it("handles plus handicap odd quota", () => {
    // quota = 41, front harder
    const result = calculateNineHoleQuotas({
      totalQuota: 41,
      frontSlope: 140,
      backSlope: 130,
    });
    expect(result).toEqual({ front: 20, back: 21 });
  });

  it("front + back always equals total", () => {
    for (let q = 0; q <= 50; q++) {
      const result = calculateNineHoleQuotas({
        totalQuota: q,
        frontSlope: 130,
        backSlope: 140,
      });
      expect(result.front + result.back).toBe(q);
    }
  });
});

describe("calculateQuotaPerformance", () => {
  it("returns positive when over quota", () => {
    expect(calculateQuotaPerformance(18, 14)).toBe(4);
  });

  it("returns negative when under quota", () => {
    expect(calculateQuotaPerformance(12, 14)).toBe(-2);
  });

  it("returns zero when exactly at quota", () => {
    expect(calculateQuotaPerformance(14, 14)).toBe(0);
  });

  it("works with large quota (plus handicap)", () => {
    expect(calculateQuotaPerformance(22, 20)).toBe(2);
  });
});
