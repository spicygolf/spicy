import { describe, expect, test } from "bun:test";
import {
  acronym,
  courseAcronym,
  first,
  last,
  normalizeGender,
  stateCode,
} from "./text";

describe("acronym", () => {
  test("creates acronym from long strings", () => {
    expect(acronym("Pebble Beach Golf Links")).toBe("PBGL");
    expect(acronym("Druid Hills Golf Club")).toBe("DHGC");
    expect(acronym("Congressional Country Club")).toBe("CCC");
  });

  test("returns original string if shorter than 10 characters", () => {
    expect(acronym("Augusta")).toBe("Augusta");
    expect(acronym("Pine")).toBe("Pine");
    expect(acronym("Short")).toBe("Short");
  });

  test("handles edge cases", () => {
    expect(acronym(null)).toBe("");
    expect(acronym(undefined)).toBe("");
    expect(acronym("")).toBe("");
  });

  test("handles single word", () => {
    expect(acronym("Pinehurst")).toBe("Pinehurst");
    expect(acronym("VeryLongSingleWord")).toBe("V");
  });
});

describe("courseAcronym", () => {
  test("shows facility acronym with course name when different", () => {
    expect(courseAcronym("Blue Course", "Congressional Country Club")).toBe(
      "CCC - Blue Course",
    );
    expect(courseAcronym("Gold Course", "Congressional Country Club")).toBe(
      "CCC - Gold Course",
    );
  });

  test("shows course acronym when facility is same as course", () => {
    expect(
      courseAcronym("Druid Hills Golf Club", "Druid Hills Golf Club"),
    ).toBe("DHGC");
    expect(
      courseAcronym("Augusta National Golf Club", "Augusta National Golf Club"),
    ).toBe("ANGC");
  });

  test("shows course acronym when no facility provided", () => {
    expect(courseAcronym("Pebble Beach Golf Links")).toBe("PBGL");
    expect(courseAcronym("Pebble Beach Golf Links", null)).toBe("PBGL");
    expect(courseAcronym("Pebble Beach Golf Links", undefined)).toBe("PBGL");
  });

  test("handles short course names", () => {
    expect(courseAcronym("Augusta", "Augusta")).toBe("Augusta");
    expect(courseAcronym("Short", "Long Facility Name")).toBe("LFN - Short");
  });

  test("handles edge cases", () => {
    expect(courseAcronym(null)).toBe("");
    expect(courseAcronym(undefined)).toBe("");
    expect(courseAcronym("", "Facility")).toBe("");
  });
});

describe("first", () => {
  test("extracts first name", () => {
    expect(first("John Doe")).toBe("John");
    expect(first("Mary Jane Smith")).toBe("Mary");
    expect(first("Tiger Woods")).toBe("Tiger");
  });

  test("handles single name", () => {
    expect(first("Madonna")).toBe("Madonna");
  });

  test("handles empty string", () => {
    expect(first("")).toBe("");
  });
});

describe("last", () => {
  test("extracts last name", () => {
    expect(last("John Doe")).toBe("Doe");
    expect(last("Mary Jane Smith")).toBe("Smith");
    expect(last("Tiger Woods")).toBe("Woods");
  });

  test("handles single name", () => {
    expect(last("Madonna")).toBe("Madonna");
  });

  test("handles empty string", () => {
    expect(last("")).toBe("");
  });

  test("handles suffixes correctly", () => {
    expect(last("John Doe Jr.")).toBe("Doe");
    expect(last("John Doe Sr.")).toBe("Doe");
    expect(last("John Doe III")).toBe("Doe");
    expect(last("John Doe Jr")).toBe("Doe");
    expect(last("John Smith II")).toBe("Smith");
    expect(last("John Smith IV")).toBe("Smith");
    expect(last("Robert Brown Sr")).toBe("Brown");
  });
});

describe("normalizeGender", () => {
  test("converts GHIN gender formats to schema format", () => {
    expect(normalizeGender("Male")).toBe("M");
    expect(normalizeGender("Female")).toBe("F");
  });

  test("defaults to M for Mixed", () => {
    expect(normalizeGender("Mixed")).toBe("M");
  });

  test("defaults to M for null/undefined", () => {
    expect(normalizeGender(null)).toBe("M");
    expect(normalizeGender(undefined)).toBe("M");
  });

  test("defaults to M for unknown values", () => {
    expect(normalizeGender("Unknown")).toBe("M");
    expect(normalizeGender("")).toBe("M");
  });
});

describe("stateCode", () => {
  test("extracts state code from GHIN format", () => {
    expect(stateCode("US-TN")).toBe("TN");
    expect(stateCode("US-GA")).toBe("GA");
    expect(stateCode("US-CA")).toBe("CA");
  });

  test("returns original if no hyphen", () => {
    expect(stateCode("TN")).toBe("TN");
    expect(stateCode("GA")).toBe("GA");
  });

  test("handles null/undefined", () => {
    expect(stateCode(null)).toBe(null);
    expect(stateCode(undefined)).toBe(undefined);
  });

  test("handles empty string", () => {
    expect(stateCode("")).toBe("");
  });
});
