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
export function fetchActiveGames(client, store) {

  // TODO: get this from state.player.currentUser (when it's populated)
  const state = store.getState();
  console.log('state', state);
  const pkey = "9552287";

  const q = `query ActiveGamesForPlayer($pkey: String!) {
    activeGamesForPlayer(pkey: $pkey) { _key name start end gametype }
   }`;

  return get(client, q, {pkey: pkey})
    .then((res) => {
      const games = res.data.activeGamesForPlayer;
      games.map((game) => {
        // TODO: upserts?  or clear out and replace?
        store.dispatch(createEntity("Game", game));
      });
    })
    .catch((e) => {
      console.error(e);
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

    get(url)
      .then((rps) => {
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
      })
      .catch((error) => {
        console.error(error);
      });
  };

}

//
//  gamepecs
//
export function fetchGameSpecs(player) {

  return (dispatch, getState) => {

    const url = '/gamespecs?player=' + player;

    get(url)
      .then((gamespecs) => {
        gamespecs.map((gs) => {
          dispatch(upsertEntity("GameSpec", gs._key, gs));
        });
      });

  };

}
