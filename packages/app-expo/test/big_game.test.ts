import { expect, test, describe } from "bun:test";
import BigGame from "./data/big_game";
import { loadGame } from "./data/utils";
import { Account, WasmCrypto } from "jazz-tools";

const getAccount = async () => {
  const Crypto = await WasmCrypto.create();
  return await Account.create({
    creationProps: { name: "test" },
    crypto: Crypto,
  });
};

describe("Big Game", async () => {
  const me = await getAccount();
  const game = await loadGame(BigGame, me);

  // game
  test("should have a name", () => {
    expect(game.name).toBe("The Big Game");
  });
  test("should have a start date", () => {
    expect(game.start).toBeInstanceOf(Date);
  });

  // game specs
  test("should have two gamespecs", () => {
    if (!game.specs) throw new Error("game.specs is null");
    expect(game.specs!.length).toBe(2);
    expect(game.specs[0]!.name).toBe("Modified Stableford");
    expect(game.specs[1]!.name).toBe("Skins");
  });

  // game holes
  test("should have 18 holes", () => {
    if (!game.holes) throw new Error("game.holes is null");
    expect(game.holes.length).toBe(18);
    const h = game.holes[17];
    expect(h!.hole).toBe("18");
  });

  // players
  test("should have players", () => {
    expect(game.players!.length).toBe(6);
    expect(game.players![0]!.name).toBe("Brad Anderson");
  });

  // rounds
  test("should have rounds", () => {
    expect(game.rounds!.length).toBe(6);
    expect(game.rounds![0]!.round).not.toBeNull();
    expect(game.rounds![0]!.round!.scores!.length).toBeGreaterThan(0);
    expect(game.rounds![0]!.round!.scores![0]!.values![0]!.v).toBe("3");
    // TODO: add tests for handicap_index, course_handicap, game_handicap etc.

  });
});
