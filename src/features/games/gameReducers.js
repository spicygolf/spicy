import { createReducer } from "common/utils/reducerUtils";

import {
  SET_CURRENT_GAME,
} from 'features/games/gameConstants';


const initialState = {
  currentGame: null
};

export function setCurrentGame(state, payload) {
  const game = payload.ref;
  return {
    currentGame: game
  };
};


export default createReducer(initialState, {
  [SET_CURRENT_GAME] : setCurrentGame
});





/*

case SET_GAME_ROUNDS_PLAYERS:

action.payload.gameRoundsPlayers.map(rps => {
  Game.withId(action.payload.game_id).rounds.add(rps.round._key);
      });
      break;

*/
