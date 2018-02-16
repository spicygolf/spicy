import {
  SET_GAME_ROUNDS_PLAYERS,
} from 'features/games/gameConstants';

import {
  SET_CURRENT_ROUND,
  ADD_POSTED_SCORE
} from 'features/rounds/roundConstants';


export function currentRoundReducer(state = '', action) {
  const { type, round } = action;
  switch (type) {
    case SET_CURRENT_ROUND:
      return round;
    default:
      return state;
  }
};

/*
    case SET_GAME_ROUNDS_PLAYERS:
      action.payload.gameRoundsPlayers.map(rps => {
        rps.round.player = rps.player._key; // fk player field
        Round.create(rps.round);
      });
      break;
    case ADD_POSTED_SCORE:
      const score = action.score;

      var r = Round.withId(score.round);
      var mergeObj = {
        'scores': Object.assign({}, r.scores)
      };
      mergeObj.scores[score.hole] = {
        ...score.values,
        'date': 'UTC date from moment'
      };
      r.update(mergeObj);

      break;
  }

*/
