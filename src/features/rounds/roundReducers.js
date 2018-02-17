import { createReducer } from 'common/utils/reducerUtils';

import {
  SET_GAME_ROUNDS_PLAYERS,
} from 'features/games/gameConstants';

import {
  SET_CURRENT_ROUND,
  ADD_POSTED_SCORE
} from 'features/rounds/roundConstants';


const initialState = {
  currentRound: null
};

export function setCurrentRound(state, payload) {
  const { round } = payload;
  return {
    currentRound: round
  };
};

export default createReducer(initialState, {
  [SET_CURRENT_ROUND] : setCurrentRound
});



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
