'use strict';

import createReducer from '../lib/createReducer';
import * as types from '../actions/types';

export const activeGames = createReducer([], {
  [types.SET_ACTIVE_GAMES](state, action) {
    return action.activeGames;
  }
});

export const gameScores = createReducer([], {
  [types.SET_GAME_SCORES](state, action) {
    return action.gameScores;
  }
});
