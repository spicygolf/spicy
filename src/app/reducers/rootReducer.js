import { combineReducers } from 'redux';

import { createReducer } from 'redux-orm';

import orm from 'app/schema';

import { currentGameReducer } from 'features/games/gameReducers';
import { currentRoundReducer } from 'features/rounds/roundReducers';


const rootReducer = combineReducers({
  orm: createReducer(orm),
  currentGame: currentGameReducer,
  currentRound: currentRoundReducer
});

export default rootReducer;
