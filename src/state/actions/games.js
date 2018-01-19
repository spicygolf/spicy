'use strict';

import { baseUrl } from '../../lib/config';
import * as types from './types';

//
// active games
//
export function fetchActiveGames() {

  return (dispatch, getState) => {

    const url = baseUrl + "/player/anderson/games";

    try {
      fetch(url).then(resp => {
        return resp.json().then(json => {
          return dispatch(setActiveGames({activeGames: json}));
        });
      });
    } catch(error) {
      console.error(error);
    }

  };

}

export function setActiveGames( { activeGames } ) {
  return {
    type: types.SET_ACTIVE_GAMES,
    activeGames
  };
}

//
// current game
//

export function setCurrentGame(game) {
  return {
    type: types.SET_CURRENT_GAME,
    game
  };
}


//
// game rounds
//
export function fetchGameRounds(game) {

  return (dispatch, getState) => {

    const url = baseUrl + '/game/' + game._key + '/rounds';

    try {
      fetch(url).then(resp => {
        if( resp.statusCode == 200 ) {
          return resp.json().then(json => {
            console.log('gameRounds response', json);
            return dispatch(setGameRounds({gameRounds: json}));
          });
        } else {
          console.log('game rounds not found', url);
          // TODO: required?  should we send to visible msg component in app?
          return dispatch(setGameRounds({gameRounds: []}));
        }
      });
    } catch(error) {
      console.log(error);
    }

  };

}

export function setGameRounds( { gameRounds } ) {
  return {
    type: types.SET_GAME_ROUNDS,
    gameRounds
  };
}
