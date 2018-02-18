import { createReducer } from 'common/utils/reducerUtils';

import {
  SET_CURRENT_ROUND,
  ADD_POSTED_SCORE
} from 'features/rounds/roundConstants';


const initialState = {
  currentRound: null
};

export function setCurrentRound(state, payload) {
  const { round_id } = payload;
  return {
    currentRound: round_id
  };
};

export default createReducer(initialState, {
  [SET_CURRENT_ROUND] : setCurrentRound
});



/*

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
