import * as types from './actions/types';


export function currentGameReducer(state = {}, action) {
  const { type, game } = action;
  switch (type) {
    case types.SET_CURRENT_GAME:
      return game;
    default:
      return state;
  }
};

export function currentRoundReducer(state = '', action) {
  const { type, round } = action;
  switch (type) {
    case types.SET_CURRENT_ROUND:
      return round;
    default:
      return state;
  }
};
