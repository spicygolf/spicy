'use strict';

import createReducer from '../lib/createReducer';
import * as types from '../actions/types';

export const addPostedScore = createReducer([], {
  [types.ADD_POSTED_SCORE](state, action) {
    return state.push(action.score);
  }
});
