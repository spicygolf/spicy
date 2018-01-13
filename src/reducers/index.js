import { combineReducers } from 'redux';
import * as gamesReducer from './games';

export default combineReducers(Object.assign(
  gamesReducer
));
