import { Game, GameHole, GameSpec, ListOfGameHoles, ListOfGameSpecs, ListOfPlayerRounds, PlayerRound } from "@/schema/games";
import { Handicap, Player } from "@/schema/players";
import { Round } from "@/schema/rounds";
import { ListOfScores, ListOfValues, Score, Value } from "@/schema/scores";
import { fromZonedTime } from "date-fns-tz";
import { Account } from "jazz-tools";
export const getUTCTimeISO = (time?: Date): string => {
  if (!time) return "";
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return fromZonedTime(time, timezone).toISOString();
};

export const getUTCNowISO = (): string => {
  return getUTCTimeISO(new Date());
};

// TODO: get all of this shit out of here and into their own functions per class:
//  * createGame()
//  * createGameSpec() ... etc
//  * addPlayerToGame()
//  * addScoreToRound() ... etc
export const loadGame = async (
  gameObjects: any,
  owner: Account
): Promise<Game> => {
  const { game, gamespecs, game_holes, players, scores } =
    gameObjects;

  const jGame = Game.create(game, { owner });

  // gamespecs
  const jGameSpecs = ListOfGameSpecs.create([], { owner });
  gamespecs.map((gamespec: any) => {
    const jGameSpec = GameSpec.create(gamespec, { owner });
    jGameSpecs.push(jGameSpec);
  });
  jGame.specs = jGameSpecs;

  // gameholes
  const jGameHoles = ListOfGameHoles.create([], { owner });
  game_holes.map((gHole: any) => {
    const gamehole = {
      hole: gHole.name,
    };
    const jGameHole = GameHole.create(gamehole, { owner });
    jGameHoles.push(jGameHole);
  });
  jGame.holes = jGameHoles;

  // players, rounds, scores
  const jPlayerRounds = ListOfPlayerRounds.create([], { owner });
  players.map((player: any) => {
    const jHandicap = Handicap.create(player.handicap, { owner });
    const jPlayer = Player.create(player, { owner });
    jPlayer.handicap = jHandicap;

    // build list of scores
    const jScores = ListOfScores.create([], { owner });
    scores[player.short].map((s: any, seq: number) => {
      const jValues = ListOfValues.create([], { owner });
      Object.keys(s).map((k: string) => {
        const value = {
          k,
          v: s[k].toString(),
        };
        const jValue = Value.create(value, { owner });
        jValues.push(jValue);
      });

      const score = {
        seq,
        values: jValues,
      };
      const jScore = Score.create(score, { owner });
      jScores.push(jScore);
    });
    // round
    const jRound = Round.create({
      created_at: new Date(),
      seq: 0,
      handicap_index: player.handicap.index,
      scores: jScores,
    }, { owner });
    const jPlayerRound = PlayerRound.create({
      player: jPlayer,
      round: jRound,
    }, { owner });
    jPlayerRounds.push(jPlayerRound);
  });
  jGame.players_rounds = jPlayerRounds;

  console.log(JSON.stringify(jGame, null, 2));
  return jGame;
};
