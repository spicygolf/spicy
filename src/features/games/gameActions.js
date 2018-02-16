'use strict';

import { baseUrl } from 'common/config';
import {
  SET_ACTIVE_GAMES,
  SET_CURRENT_GAME,
  SET_GAME_ROUNDS_PLAYERS
} from 'features/games/gameConstants';

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
    type: SET_ACTIVE_GAMES,
    activeGames
  };
}

//
// current game
//

export function setCurrentGame(game) {
  return {
    type: SET_CURRENT_GAME,
    game
  };
}


//
// game rounds & players
//
export function fetchGameRoundsPlayers( game ) {

  return (dispatch, getState) => {

    const url = baseUrl + '/game/' + game._key + '/rounds_players';

    try {
      fetch(url).then(resp => {
        if( resp.status === 200 ) {
          return resp.json().then(json => {
            return dispatch(setGameRoundsPlayers({
              game_id: game._key, gameRoundsPlayers: json
            }));
          });
        } else {
          console.log('game rounds not found');
          // TODO: required?  should we send to visible msg component in app?
          return dispatch(setGameRoundsPlayers({gameRoundsPlayers: []}));
        }
      });
    } catch(error) {
      console.log(error);
    }

  };

}

export function setGameRoundsPlayers( payload ) {
  return {
    type: SET_GAME_ROUNDS_PLAYERS,
    payload
  };
}
