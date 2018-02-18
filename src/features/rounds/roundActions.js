'use strict';

import { baseUrl } from 'common/config';
import { SET_CURRENT_ROUND } from './roundConstants';

//
// current round
//

export function setCurrentRound(round) {
  return {
    type: SET_CURRENT_ROUND,
    payload: round
  };
}


//
// post score
//

export function postScore( score ) {
  return {
    type: ADD_POSTED_SCORE,
    score
  };
}

export function sendPostedScore( {round, hole, values} ) {

  return (dispatch, getState) => {

    const url = baseUrl + '/round/' + round + '/scores';

    // TODO: make src/lib/api.js do all of this, and provide convenience methods
    try {
      fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hole: hole,
          values: values
        })
      }).then(resp => {
        return resp.json().then(json => {
          // TODO: implement below function
          return dispatch(removeScoreFromQueue({scores: json}));
        });
      });
    } catch(error) {
      console.error(error);
    }

  };

}
