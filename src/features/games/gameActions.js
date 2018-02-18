'use strict';

import { baseUrl } from 'common/config';

import {
  createEntity,
  updateEntity,
  upsertEntity
} from 'features/entities/entityActions';

import {
  SET_CURRENT_GAME
} from 'features/games/gameConstants';

//
// active games
//
export function fetchActiveGames(player) {

  return (dispatch, getState) => {

    const url = baseUrl + '/player/' + player + '/games';

    try {
      fetch(url).then(resp => {
        return resp.json().then(games => {
          games.map((game) => {
            dispatch(createEntity("Game", game));
          });
        });
      });
    } catch(error) {
      console.error(error);
    }

  };

}


//
// current game
//

export function setCurrentGame(game) {
  return {
    type: SET_CURRENT_GAME,
    payload: game
  };
}


//
// game rounds & players
//
export function fetchGameRoundsPlayers(game) {

  return (dispatch, getState) => {

    const url = baseUrl + '/game/' + game._key + '/rounds_players';

    try {
      fetch(url).then(resp => {
        if( resp.status === 200 ) {
          return resp.json().then(rps => {
            var round_ids = [];
            rps.map((rp) => {
              // keep track of round ids for game update below
              round_ids.push(rp.round._key);
              // fk round -> player field
              rp.round.player = rp.player._key;
              // add round & player objects
              dispatch(upsertEntity("Round", rp.round._key, rp.round));
              dispatch(upsertEntity("Player", rp.player._key, rp.player));
            });
            // update game with round ids
            dispatch(updateEntity("Game", game._key, { rounds: round_ids }));
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
