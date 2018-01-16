import { combineReducers } from 'redux';
import * as gamesReducer from './games';
import * as roundsReducer from './rounds';

export default combineReducers(Object.assign(
  gamesReducer,
  roundsReducer
));
