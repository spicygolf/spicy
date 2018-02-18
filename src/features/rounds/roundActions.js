'use strict';

import moment from 'moment';
import { baseUrl } from 'common/config';
import { SET_CURRENT_ROUND } from './roundConstants';
import { updateEntity } from 'features/entities/entityActions';
import { getEntitiesSession } from 'features/entities/entitySelectors';

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

export function postScore(payload) {

  const { round_id, hole, values } = payload;

  return (dispatch, getState) => {
    const session = getEntitiesSession(getState());
    const { Round } = session;
    var round = Round.withId(round_id);
    var newItemAttributes = {
      'scores' : Object.assign({}, round.scores)
    };
    newItemAttributes.scores[hole] = {
      ...values,
      'date': moment.utc().format()
    };
    dispatch(updateEntity("Round", round_id, newItemAttributes));
  };
};


export function sendPostedScore( {round_id, hole, values} ) {

  return (dispatch, getState) => {

    const url = baseUrl + '/round/' + round_id + '/scores';

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
