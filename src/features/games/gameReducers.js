import { createReducer } from "common/utils/reducerUtils";

import {
  SET_CURRENT_GAME,
  SET_ACTIVE_GAMES,
  SET_GAME_ROUNDS_PLAYERS
} from 'features/games/gameConstants';

import {
  getEntitiesSession,
  getUnsharedEntitiesSession
} from "features/entities/entitySelectors";


const initialState = {
  currentGame: null
};

export function setCurrentGame(state, payload) {
  const { game } = payload;
  return {
    currentGame: game
  };
};


export default createReducer(initialState, {
  [SET_CURRENT_GAME] : setCurrentGame
});





/*

export function setActiveGames(state, payload) {

  const { activeGames } = payload;
  const session = getEntitiesSession(state);
  const { Game } = session;

  activeGames.map(game => {
    if( !game.rounds ) game.rounds = [];
    Game.create(game);
  });

  return session.state;
}


case SET_GAME_ROUNDS_PLAYERS:

action.payload.gameRoundsPlayers.map(rps => {
  Game.withId(action.payload.game_id).rounds.add(rps.round._key);
      });
      break;

*/
