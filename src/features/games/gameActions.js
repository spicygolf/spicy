'use strict';

import { get } from 'common/api';

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

  const url = '/player/' + player + '/games';

  get(url, (games) => {
    games.map((game) => {
      dispatch(createEntity("Game", game));
    });
  });

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

    const url = '/game/' + game._key + '/rounds_players';

    get(url, (rps) => {
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

    // errorFn ?
    // return dispatch(setGameRoundsPlayers({gameRoundsPlayers: []}));

  };

}

//
//  gamepecs
//
export function fetchGameSpecs(player) {

  return (dispatch, getState) => {

    const url = baseUrl + '/gamespecs?player=' + player;

    try {
      fetch(url).then(resp => {
        return resp.json().then(gamespecs => {
          gamespecs.map((gs) => {
            dispatch(upsertEntity("GameSpec", gs._key, gs));
          });
        });
      });
    } catch(error) {
      console.error(error);
    }

  };

}
