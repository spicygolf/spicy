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

  // gamespecs
  test("should have two gamespecs", () => {
    expect(game.specs.length).toBe(2);
    expect(game.specs[0].name).toBe("Modified Stableford");
    expect(game.specs[1].name).toBe("Skins");
  });

  // gameholes
  test("should have 18 holes", () => {
    expect(game.holes.length).toBe(18);
    const h = game.holes[17];
    expect(h.hole).toBe("18");
  });

  // players/rounds
  test("should have players with rounds", () => {
    expect(game.players_rounds.length).toBe(6);
    expect(game.players_rounds[0].round).not.toBeNull();
    expect(game.players_rounds[0].round.scores.length).toBeGreaterThan(0);
    expect(game.players_rounds[0].round.scores[0].values[0].v).toBe("3");
    expect(game.players_rounds[0].player.name).toBe("Brad Anderson");
  });
});
