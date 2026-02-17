import { describe, expect, test } from "bun:test";
import { getDefaultTeeTime, isEveningCreation, isSameDay } from "./datetime";

describe("isSameDay", () => {
  test("same day same timezone returns true", () => {
    const a = new Date("2026-02-14T10:00:00Z");
    const b = new Date("2026-02-14T22:00:00Z");
    expect(isSameDay(a, b, "UTC")).toBe(true);
  });

  test("different days returns false", () => {
    const a = new Date("2026-02-14T10:00:00Z");
    const b = new Date("2026-02-15T10:00:00Z");
    expect(isSameDay(a, b, "UTC")).toBe(false);
  });

  test("late UTC time is same day in US Eastern timezone", () => {
    // 11 PM UTC on Feb 14 = 6 PM EST on Feb 14
    const a = new Date("2026-02-14T23:00:00Z");
    // 2 PM UTC on Feb 14 = 9 AM EST on Feb 14
    const b = new Date("2026-02-14T14:00:00Z");
    expect(isSameDay(a, b, "America/New_York")).toBe(true);
  });

  test("issue #100: late evening UTC crosses day boundary in local timezone", () => {
    // This is the key edge case from issue #100:
    // A round created late in the day (e.g., 11 PM EST = 4 AM UTC next day)
    // should still match the game date in local timezone.

    // 4 AM UTC on Feb 15 = 11 PM EST on Feb 14
    const lateRound = new Date("2026-02-15T04:00:00Z");
    // Game started at 1 PM EST on Feb 14 = 6 PM UTC on Feb 14
    const gameStart = new Date("2026-02-14T18:00:00Z");

    // In UTC these are different days (Feb 15 vs Feb 14)
    expect(isSameDay(lateRound, gameStart, "UTC")).toBe(false);

    // But in Eastern time they're both Feb 14
    expect(isSameDay(lateRound, gameStart, "America/New_York")).toBe(true);
  });

  test("early morning UTC is previous day in US Pacific timezone", () => {
    // 3 AM UTC on Feb 15 = 7 PM PST on Feb 14
    const a = new Date("2026-02-15T03:00:00Z");
    // 8 PM UTC on Feb 14 = 12 PM PST on Feb 14
    const b = new Date("2026-02-14T20:00:00Z");

    // Same day in Pacific time (both Feb 14)
    expect(isSameDay(a, b, "America/Los_Angeles")).toBe(true);

    // Different days in UTC (Feb 15 vs Feb 14)
    expect(isSameDay(a, b, "UTC")).toBe(false);
  });

  test("midnight boundary: just before and after midnight", () => {
    // 4:59 AM UTC = 11:59 PM EST (Feb 14)
    const beforeMidnight = new Date("2026-02-15T04:59:00Z");
    // 5:00 AM UTC = 12:00 AM EST (Feb 15)
    const afterMidnight = new Date("2026-02-15T05:00:00Z");
    // Game at 1 PM EST on Feb 14
    const gameStart = new Date("2026-02-14T18:00:00Z");

    expect(isSameDay(beforeMidnight, gameStart, "America/New_York")).toBe(true);
    expect(isSameDay(afterMidnight, gameStart, "America/New_York")).toBe(false);
  });
});

describe("isEveningCreation", () => {
  test("returns true for 6 PM and later", () => {
    const evening = new Date("2026-02-14T18:00:00"); // Local 6 PM
    expect(isEveningCreation(evening)).toBe(true);
  });

  test("returns false before 6 PM", () => {
    const afternoon = new Date("2026-02-14T17:59:00"); // Local 5:59 PM
    expect(isEveningCreation(afternoon)).toBe(false);
  });
});

describe("getDefaultTeeTime", () => {
  test("returns current time during the day", () => {
    const morning = new Date("2026-02-14T10:00:00");
    expect(getDefaultTeeTime(morning)).toEqual(morning);
  });

  test("returns next morning 8 AM when created in evening", () => {
    const evening = new Date("2026-02-14T20:00:00");
    const result = getDefaultTeeTime(evening);
    expect(result.getDate()).toBe(15);
    expect(result.getHours()).toBe(8);
    expect(result.getMinutes()).toBe(0);
  });
});
