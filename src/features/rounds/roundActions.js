'use strict';

import moment from 'moment';
import { cloneDeep, findIndex } from 'lodash';

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
    let round = Round.withId(round_id);
    let newScores = cloneDeep(round.scores);
    let i = findIndex(newScores, {hole: hole});
    if( i >= 0 ) {
      let newValues = cloneDeep(newScores[i].values);
      values.map(value => {
        value.ts = moment.utc().format();
        let j = findIndex(newValues, {k: value.k});
        if( j >= 0 ) {
          newValues[j] = value;
        } else {
          newValues.push(value);
        }
      });
      newScores[i] = {hole: hole, values: newValues};
    } else {
      let tsValues = values.map(value => ({
        k: value.k,
        v: value.v,
        ts: moment.utc().format()
      }));
      newScores.push({hole: hole, values: tsValues});
    }
    var newItemAttributes = {
      'scores' : newScores
    };

    dispatch(updateEntity("Round", round_id, newItemAttributes));
  };
};


export function sendPostedScore(payload) {

  const { round_id, hole, values } = payload;

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
