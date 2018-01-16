'use strict';

import createReducer from '../../lib/createReducer';
import * as types from '../actions/types';

export const postedScores = createReducer([], {
  [types.ADD_POSTED_SCORE](state, action) {
    return [...state, action.score];
  }
});
