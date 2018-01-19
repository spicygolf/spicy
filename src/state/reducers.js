import { SET_CURRENT_GAME } from './actions/types';

export function currentGameReducer(state = {}, action) {
  const { type, game } = action;
  switch (type) {
    case SET_CURRENT_GAME:
      return game;
    default:
      return state;
  }
};
