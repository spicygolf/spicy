import { describe, expect, it } from "bun:test";
import { parseLogicCondition, parseScoreToParCondition } from "../junk-engine";

describe("parseScoreToParCondition", () => {
  it("parses 'exactly -1' (birdie)", () => {
    const result = parseScoreToParCondition("exactly -1");
    expect(result).toEqual({ operator: "exactly", value: -1 });
  });

  it("parses 'exactly -2' (eagle)", () => {
    const result = parseScoreToParCondition("exactly -2");
    expect(result).toEqual({ operator: "exactly", value: -2 });
  });

  it("parses 'at_most -1' (birdie or better)", () => {
    const result = parseScoreToParCondition("at_most -1");
    expect(result).toEqual({ operator: "at_most", value: -1 });
  });

  it("parses 'at_least 1' (bogey or worse)", () => {
    const result = parseScoreToParCondition("at_least 1");
    expect(result).toEqual({ operator: "at_least", value: 1 });
  });

  it("parses 'exactly 0' (par)", () => {
    const result = parseScoreToParCondition("exactly 0");
    expect(result).toEqual({ operator: "exactly", value: 0 });
  });

  it("returns null for invalid operator", () => {
    const result = parseScoreToParCondition("equals -1");
    expect(result).toBeNull();
  });

  it("returns null for invalid format", () => {
    const result = parseScoreToParCondition("-1");
    expect(result).toBeNull();
  });

  it("returns null for non-numeric value", () => {
    const result = parseScoreToParCondition("exactly abc");
    expect(result).toBeNull();
  });
});

describe("parseLogicCondition", () => {
  it("parses rankWithTies for outright winner", () => {
    const logic = "{'rankWithTies': [1, 1]}";
    const result = parseLogicCondition(logic);
    expect(result).toEqual({ type: "rankWithTies", rank: 1, tieCount: 1 });
  });

  it("parses rankWithTies for two-way tie for first", () => {
    const logic = "{'rankWithTies': [1, 2]}";
    const result = parseLogicCondition(logic);
    expect(result).toEqual({ type: "rankWithTies", rank: 1, tieCount: 2 });
  });

  it("parses rankWithTies for three-way tie", () => {
    const logic = "{'rankWithTies': [1, 3]}";
    const result = parseLogicCondition(logic);
    expect(result).toEqual({ type: "rankWithTies", rank: 1, tieCount: 3 });
  });

  it("parses rankWithTies for second place", () => {
    const logic = "{'rankWithTies': [2, 1]}";
    const result = parseLogicCondition(logic);
    expect(result).toEqual({ type: "rankWithTies", rank: 2, tieCount: 1 });
  });

  it("handles double quotes in JSON", () => {
    const logic = '{"rankWithTies": [1, 1]}';
    const result = parseLogicCondition(logic);
    expect(result).toEqual({ type: "rankWithTies", rank: 1, tieCount: 1 });
  });

  it("returns null for invalid JSON", () => {
    const logic = "not valid json";
    const result = parseLogicCondition(logic);
    expect(result).toBeNull();
  });

  it("returns null for unsupported logic type", () => {
    const logic = "{'someOtherLogic': [1, 2]}";
    const result = parseLogicCondition(logic);
    expect(result).toBeNull();
  });
});
