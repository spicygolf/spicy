'use strict';

import { baseUrl } from '../lib/config';
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
// game scores
//
export function fetchGameScores(game) {

  return (dispatch, getState) => {

    const url = baseUrl + '/game/' + game.id + '/scores';

    try {
      fetch(url).then(resp => {
        return resp.json().then(json => {
          return dispatch(setGameScores({gameScores: json}));
        });
      });
    } catch(error) {
      console.error(error);
    }

  };

}

export function setGameScores( { gameScores } ) {
  return {
    type: types.SET_GAME_SCORES,
    gameScores
  };
}
