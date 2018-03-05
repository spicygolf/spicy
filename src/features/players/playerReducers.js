import { createReducer } from 'common/utils/reducerUtils';

import {
  SET_CURRENT_USER
} from 'features/players/playerConstants';


const initialState = {
  currentUser: null
};


export function setCurrentUser(state, payload) {
  const player = payload;
  return {
    currentUser: player
  };
};


export default createReducer(initialState, {
  [SET_CURRENT_USER] : setCurrentUser
});
