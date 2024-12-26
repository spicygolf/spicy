import { co, CoList, CoMap } from 'jazz-tools';
import { ListOfScores } from 'schema/scores';

export class Round extends CoMap {
  created_at = co.Date;
  seq = co.number;

  /**
   *  A string representing the handicap index in decimal form.  Plus handicaps
   *  include the "+" sign, ex: "+1.5".  This is the player's index as of the
   *  date of the round, persisted here to maintain history and consistency of
   *  game scoring.  It may be overridden by the `RoundToGame` edge.
   */
  handicap_index = co.string;


  scores = co.ref(ListOfScores);
  // tees = co.ref(ListOfTees);
  // posting = co.ref(Posting);
}

/**
 *  This is graph edge between rounds and games.  It is used to link a round to
 *  a game.  It is a CoMap because it may also have extra handicap fields that
 *  are unique to the round/game pairing.
 */
export class RoundToGame extends CoMap {
  /**
   *  A reference to the `Round`, serving as the "from" vertex in the edge.  The
   *  "to" vertex is the `Game`, and holds the `rounds` field.
   */
  round = co.ref(Round);

  /**
   *  A string representing the handicap index in decimal form.  Plus handicaps
   *  include the "+" sign, ex: "+1.5".  This is the player's index as of the
   *  date of the round, persisted here to maintain history and consistency of
   *  game scoring.  Also, this will override the player's handicap_index field
   *  value.
   */
  handicap_index = co.optional.string;

  /**
   *  A number representing the course handicap in integer form.  Plus handicaps
   *  are negative here.  ex: -2
   */
  course_handicap = co.optional.number;

  /**
   *  A number representing the game handicap in integer form.  This is an
   *  agreed-upon change that overrirdes the course handicap.  Plus handicaps
   *  are negative here.  ex: -2
   */
  game_handicap = co.optional.number;
}

export class ListOfRoundToGames extends CoList.Of(co.ref(RoundToGame)) {}
