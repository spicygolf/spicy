import { Game, GameHole, GameSpec, ListOfGameHoles, ListOfGameSpecs } from "@/schema/games";
import { Handicap, ListOfPlayers, Player } from "@/schema/players";
import { Round,  RoundToGame, ListOfRoundToGames } from "@/schema/rounds";
import { Team, ListOfTeams } from "@/schema/teams";
import { ListOfScores, ListOfScoreUpdate, ListOfValues, Score, Value } from "@/schema/scores";
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
  const jPlayers = ListOfPlayers.create([], { owner });
  const jRoundToGames = ListOfRoundToGames.create([], { owner });
  players.map((player: any) => {
    // player
    const jHandicap = Handicap.create(player.handicap, { owner });
    const jPlayer = Player.create(player, { owner });
    jPlayer.handicap = jHandicap;
    jPlayers.push(jPlayer);

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
    const jRoundToGame = RoundToGame.create({
      round: jRound,
      handicap_index: player.handicap.index,
    }, { owner });
    jRoundToGames.push(jRoundToGame);
  });
  jGame.players = jPlayers;
  jGame.rounds = jRoundToGames;

  console.log(JSON.stringify(jGame, null, 2));
  return jGame;
};
