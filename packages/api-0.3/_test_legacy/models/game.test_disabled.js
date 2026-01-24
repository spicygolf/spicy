import { Game } from "../../src/models/game";

describe("Game model tests", () => {
  let g;
  beforeAll(() => {
    g = new Game();
  });

  // _getPops
  test("calculates pops/strokes given a hole handicap and a player handicap", () => {
    // strings
    expect(g._getPops("0", "1")).toBe(0);
    expect(g._getPops("1", "1")).toBe(1);
    expect(g._getPops("1", "0")).toBe(0);

    // nums
    expect(g._getPops(0, 1)).toBe(0);
    expect(g._getPops(1, 1)).toBe(1);
    expect(g._getPops(1, 0)).toBe(0);

    // weird hole handicaps
    expect(g._getPops(-1, 1)).toBe(0);
    expect(g._getPops("-1", "1")).toBe(0);
    expect(g._getPops(19, 1)).toBe(0);

    // real good golfers (below 0 hdcp)
    expect(g._getPops(1, -2)).toBe(0);
    expect(g._getPops(18, -2)).toBe(-1);
    expect(g._getPops(17, -2)).toBe(-1);
    expect(g._getPops(16, -2)).toBe(0);
    expect(g._getPops(18, -19)).toBe(-2);

    // high-handicapper golfers
    expect(g._getPops(1, 19)).toBe(2);
    expect(g._getPops(2, 19)).toBe(1);

    // half pops
    // TODO: implement me
  });
});
